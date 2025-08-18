import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from "@modelcontextprotocol/sdk/types.js";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function runUx(cmd: string, args: string[], cwd?: string) {
  const node = process.execPath;
  // Call the local CLI build; fallback to npx if not present
  const cliDist = path.resolve(process.cwd(), "packages/cli/dist/index.js");
  const isLocal = fs.existsSync(cliDist);
  const proc = isLocal
    ? spawnSync(node, [cliDist, cmd, ...args], { cwd: cwd || process.cwd(), encoding: "utf8", shell: process.platform === "win32" })
    : spawnSync("npx", ["-y", "flowlock-uxcg", cmd, ...args], { cwd: cwd || process.cwd(), encoding: "utf8", shell: process.platform === "win32" });
  return { code: proc.status ?? 1, out: (proc.stdout || "") + (proc.stderr || "") };
}

// Create server instance
const server = new Server({
  name: "flowlock-mcp",
  version: "0.1.0"
});

// Define tools
const tools: Tool[] = [
  {
    name: "ping",
    description: "Health check",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string" }
      }
    }
  },
  {
    name: "audit",
    description: "Run FlowLock audit (optionally with --fix)",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" },
        fix: { type: "boolean" }
      }
    }
  },
  {
    name: "diagrams",
    description: "Generate only diagram artifacts",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" }
      }
    }
  },
  {
    name: "init",
    description: "Initialize FlowLock in current project (interactive in client side recommended)",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" }
      }
    }
  },
  {
    name: "write_claude_commands",
    description: "Ensure .claude/commands exist for FlowLock agent workflows",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" }
      }
    }
  }
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "ping":
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ ok: true, echo: args?.message || "pong" }) 
        }] 
      };
    
    case "audit": {
      const cwd = (args?.cwd as string) || process.cwd();
      const res = runUx("audit", args?.fix ? ["--fix"] : [], cwd);
      const artifacts = ["er.svg","flow.svg","screens.csv","results.junit.xml","gap_report.md","acceptance_criteria.feature","er.mmd","flow.mmd"]
        .map((f) => path.join("artifacts", f))
        .filter((p) => fs.existsSync(path.join(cwd, p)));
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ ok: res.code === 0, code: res.code, output: res.out, artifacts }) 
        }] 
      };
    }
    
    case "diagrams": {
      const cwd = (args?.cwd as string) || process.cwd();
      const res = runUx("diagrams", [], cwd);
      const artifacts = ["er.svg","flow.svg","er.mmd","flow.mmd"]
        .map((f) => path.join("artifacts", f))
        .filter((p) => fs.existsSync(path.join(cwd, p)));
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ ok: res.code === 0, code: res.code, output: res.out, artifacts }) 
        }] 
      };
    }
    
    case "init": {
      const cwd = (args?.cwd as string) || process.cwd();
      const res = runUx("init", [], cwd);
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ ok: res.code === 0, code: res.code, output: res.out }) 
        }] 
      };
    }
    
    case "write_claude_commands": {
      const cwd = (args?.cwd as string) || process.cwd();
      // Reuse CLI entrypoint side-effect that writes commands on start
      const res = runUx("--help", [], cwd);
      const exists = fs.existsSync(path.join(cwd, ".claude", "commands"));
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({ ok: exists, code: res.code, output: res.out, wrote: exists }) 
        }] 
      };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[flowlock-mcp] ready (stdio)");
})();