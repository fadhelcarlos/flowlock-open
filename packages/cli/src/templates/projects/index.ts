import * as fs from "fs";
import * as path from "path";
import { run, which } from "../../utils/exec";
import { writeClaudeCommands } from "../claude";

export type InitChoices = {
  mode: "current" | "scaffold";
  template?: "blank" | "next-tailwind";
  appName?: string;
  addWorkflow: boolean;
  addScript: boolean;
  addClaudeCmds: boolean;
};

export async function scaffoldProject(cwd: string, c: InitChoices) {
  if (c.mode === "current") {
    await applyFlowLockBasics(cwd, c);
    return;
  }
  if (c.template === "blank") {
    const target = path.join(cwd, c.appName || "flowlock-app");
    fs.mkdirSync(target, { recursive: true });
    await writeBlankTemplate(target);
    await applyFlowLockBasics(target, c);
    return;
  }
  if (c.template === "next-tailwind") {
    const target = path.join(cwd, c.appName || "flowlock-next");
    fs.mkdirSync(target, { recursive: true });
    await createNextApp(target, c.appName || "flowlock-next");
    await addTailwind(target);
    await applyFlowLockBasics(target, c);
    return;
  }
  throw new Error("Unknown scaffold choice");
}

async function applyFlowLockBasics(target: string, c: InitChoices) {
  seedUxspec(target);
  if (c.addClaudeCmds) {
    writeClaudeCommands(target);
  }
  if (c.addScript) {
    ensureNpmScript(target, "flowlock:audit", "uxcg audit");
  }
  if (c.addWorkflow) {
    maybeWriteWorkflow(target);
  }
  console.log(`\n✅ FlowLock ready in: ${path.relative(process.cwd(), target) || "."}`);
  console.log(`   - uxspec.json`);
  if (c.addClaudeCmds) console.log(`   - .claude/commands/*`);
  if (c.addWorkflow) console.log(`   - .github/workflows/flowlock.yml`);
  if (c.addScript) console.log(`   - package.json scripts.flowlock:audit`);
}

function seedUxspec(target: string) {
  const p = path.join(target, "uxspec.json");
  if (fs.existsSync(p)) return;
  const spec = {
    version: "1.0.0",
    name: "FlowLock Project",
    roles: ["admin", "viewer"],
    entities: [
      {
        id: "user",
        name: "User",
        fields: [
          { id: "id", name: "ID", type: "string", required: true, derived: true, provenance: "system.uuid" },
          { id: "email", name: "Email", type: "email", required: true },
          { id: "name", name: "Name", type: "string", required: true },
          { id: "role", name: "Role", type: "string" },
          { id: "createdAt", name: "Created At", type: "date", derived: true, provenance: "system.timestamp" },
        ],
      },
    ],
    screens: [
      {
        id: "user_list",
        name: "User List",
        type: "list",
        entityId: "user",
        reads: ["user.id", "user.name", "user.email", "user.role"],
        roles: ["admin", "viewer"],
        uiStates: ["empty", "loading", "error"],
      },
      {
        id: "user_detail",
        name: "User Detail",
        type: "detail",
        entityId: "user",
        reads: ["user.id", "user.name", "user.email", "user.role", "user.createdAt"],
        roles: ["admin", "viewer"],
        uiStates: ["empty", "loading", "error"],
      },
    ],
    flows: [
      {
        id: "user_browse",
        name: "Browse Users",
        entryStepId: "s1",
        roles: ["admin", "viewer"],
        steps: [
          { id: "s1", screenId: "user_list", next: [{ targetStepId: "s2" }] },
          { id: "s2", screenId: "user_detail" },
        ],
      },
    ],
    jtbd: { admin: ["Manage users"], viewer: ["See users"] },
  };
  fs.writeFileSync(p, JSON.stringify(spec, null, 2));
}

function ensureNpmScript(target: string, name: string, cmd: string) {
  const pkgPath = path.join(target, "package.json");
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts[name]) {
    pkg.scripts[name] = cmd;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
}

function maybeWriteWorkflow(target: string) {
  const wfDir = path.join(target, ".github", "workflows");
  const wfPath = path.join(wfDir, "flowlock.yml");
  if (fs.existsSync(wfPath)) return;
  fs.mkdirSync(wfDir, { recursive: true });
  const yml = `name: FlowLock UX Audit
on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm i -g pnpm
      - name: Run FlowLock audit
        run: npx -y flowlock-uxcg audit
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: flowlock-artifacts
          path: |
            artifacts/er.svg
            artifacts/flow.svg
            artifacts/screens.csv
            artifacts/results.junit.xml
            artifacts/gap_report.md
            artifacts/acceptance_criteria.feature
            artifacts/er.mmd
            artifacts/flow.mmd
`;
  fs.writeFileSync(wfPath, yml);
}

async function createNextApp(target: string, appName: string) {
  const npx = (await which("npx")) || "npx";
  console.log("• Scaffolding Next.js app via create-next-app …");
  await run(npx, ["-y", "create-next-app@latest", appName, "--ts"], { cwd: path.dirname(target) });
}

async function addTailwind(target: string) {
  const npx = (await which("npx")) || "npx";
  console.log("• Adding Tailwind CSS …");
  await run(npx, ["-y", "tailwindcss@latest", "init", "-p"], { cwd: target });
  // Minimal config touch-ups
  const cfg = path.join(target, "tailwind.config.js");
  if (fs.existsSync(cfg)) {
    let s = fs.readFileSync(cfg, "utf8");
    if (!/content:\s*\[/.test(s)) {
      s = s.replace(
        /module\.exports\s*=\s*\{/,
        `module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],`
      );
    }
    fs.writeFileSync(cfg, s);
  }
  const globals = path.join(target, "app", "globals.css");
  if (fs.existsSync(globals)) {
    const pre = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n`;
    const s = fs.readFileSync(globals, "utf8");
    if (!s.includes("@tailwind base")) {
      fs.writeFileSync(globals, pre + s);
    }
  }
}

async function writeBlankTemplate(target: string) {
  const pkgPath = path.join(target, "package.json");
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: path.basename(target),
      private: true,
      version: "0.0.0",
      scripts: {
        dev: "node index.js",
        "flowlock:audit": "uxcg audit"
      }
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  const indexJs = path.join(target, "index.js");
  if (!fs.existsSync(indexJs)) {
    fs.writeFileSync(
      indexJs,
      `console.log("Hello from ${path.basename(target)}");\n`
    );
  }
}
