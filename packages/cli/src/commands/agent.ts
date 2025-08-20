import { Command } from "commander";
import * as http from "http";
import * as https from "https";
import * as url from "url";
import { spawn } from "child_process";

type AgentOpts = {
  cloud?: string;
  project?: string;
  token?: string;
};

function fetchJson(u: string, opts: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(u);
    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        method: opts.method || "GET",
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.path,
        headers: { "content-type": "application/json", ...(opts.headers || {}) },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (e) {
            resolve({ ok: false, error: "invalid_json", raw: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (opts.body) req.write(typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body));
    req.end();
  });
}

function runCli(cmd: string, args: string[] = []): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [require.resolve("../../dist/index.js"), cmd, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      cwd: process.cwd(),
    });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.stderr.on("data", (c) => (out += c.toString()));
    child.on("exit", (code) => resolve({ code: code ?? 1, out }));
  });
}

async function handleCommand(base: string, token: string | undefined, cmdRow: any) {
  const { id, command, args } = cmdRow;
  let result = { ok: false, code: 1, out: "" };

  if (command === "audit") {
    const r = await runCli("audit");
    result = { ok: r.code === 0, ...r };
  }
  else if (command === "audit_fix") {
    const r = await runCli("audit", ["--fix"]);
    result = { ok: r.code === 0, ...r };
  }
  else if (command === "audit_inventory") {
    const r = await runCli("audit", ["--inventory"]);
    result = { ok: r.code === 0, ...r };
  }
  else if (command === "inventory") {
    const r = await runCli("inventory");
    result = { ok: r.code === 0, ...r };
  }
  else if (command === "init_existing") {
    const r = await runCli("init-existing");
    result = { ok: r.code === 0, ...r };
  }
  else if (command === "diagrams") {
    const r = await runCli("diagrams");
    result = { ok: r.code === 0, ...r };
  }
  else if (command === "export" && args?.format) {
    const r = await runCli("export", [args.format]);
    result = { ok: r.code === 0, ...r };
  }
  else if (command === "watch") {
    // Watch command not supported in agent mode (requires interactive session)
    result = { ok: false, code: 1, out: "Watch command not available in agent mode" };
  }
  else {
    result = { ok: false, code: 1, out: `Unknown command: ${command}` };
  }

  await fetchJson(base + `/command/${encodeURIComponent(id)}/done`, {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: { ok: result.code === 0, output: result.out.slice(0, 20000) },
  }).catch(() => {});
}

function connectSSE(base: string, project: string, token: string | undefined, onLine: (type: string, data: any) => void) {
  const sseUrl = `${base.replace(/\/$/, "")}/events?project=${encodeURIComponent(project)}`;
  const parsed = url.parse(sseUrl);
  const mod = parsed.protocol === "https:" ? https : http;
  const req = mod.request(
    {
      method: "GET",
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      headers: { Accept: "text/event-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    },
    (res) => {
      res.setEncoding("utf8");
      let buf = "";
      res.on("data", (chunk) => {
        buf += chunk;
        let idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const lines = raw.split(/\r?\n/);
          let ev = "message";
          let data = "";
          for (const ln of lines) {
            if (ln.startsWith("event:")) ev = ln.slice(6).trim();
            else if (ln.startsWith("data:")) data += ln.slice(5).trim();
          }
          try {
            onLine(ev, data ? JSON.parse(data) : null);
          } catch {}
        }
      });
    }
  );
  req.on("error", () => {});
  req.end();
}

export const agentCommand = new Command("agent")
  .description("Connect to FlowLock Cloud and execute remote commands")
  .option("--cloud <url>", "Cloud base URL (e.g. https://flowlock-cloud.onrender.com)")
  .option("--project <id>", "Project id (e.g. demo)")
  .option("--token <token>", "Bearer token (optional)")
  .action(async (opts: AgentOpts) => {
    const base = (opts.cloud || "").replace(/\/$/, "");
    let project = opts.project || "demo";
    const token = opts.token;

    if (!base) {
      console.error("Missing --cloud <url>");
      process.exit(1);
    }

    // For authenticated connections, get the proper connection details
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;
    
    if (token) {
      try {
        // Use the /agent/connect endpoint to get proper URLs
        const connectInfo = await fetchJson(base + "/agent/connect", { headers });
        if (connectInfo.ok) {
          project = connectInfo.project; // Use authenticated project
          console.log(`FlowLock agent authenticated as ${connectInfo.user}`);
          console.log(`Connected to project: ${connectInfo.projectName} (${project})`);
          console.log(`Dashboard: ${connectInfo.endpoints.dashboard}`);
        } else {
          console.error("Authentication failed:", connectInfo.error || "Invalid token");
          process.exit(1);
        }
      } catch (e) {
        console.error("Failed to connect:", e);
        process.exit(1);
      }
    } else {
      console.log(`FlowLock agent connected (unauthenticated) → ${base}/dashboard?project=${project}`);
    }

    // 1) Poll for backlog (if any)
    try {
      const backlog = await fetchJson(base + `/commands?project=${encodeURIComponent(project)}`, { headers });
      if (Array.isArray(backlog)) {
        for (const row of backlog) await handleCommand(base, token, row);
      }
    } catch {}

    // 2) Live commands via SSE
    connectSSE(base, project, token, async (type, data) => {
      if (type === "command" && data && data.project === project) {
        await handleCommand(base, token, data.row || data);
      }
    });

    // keep process alive
    setInterval(() => {}, 1 << 30);
  });