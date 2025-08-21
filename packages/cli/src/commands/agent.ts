import { Command } from "commander";
import { httpClient, HttpError, AuthError, NetworkError } from "../utils/http-client";
import { processManager, ProcessError } from "../utils/process-manager";
import { createSSEClient, SSEClient, SSEError } from "../utils/sse-client";

interface AgentOptions {
  cloud?: string;
  project?: string;
  token?: string;
}

interface CommandRow {
  id: string;
  command: string;
  args?: any;
}

interface CommandResult {
  ok: boolean;
  code: number;
  output: string;
  error?: string;
}

class AgentManager {
  private sseClient?: SSEClient;
  private isShuttingDown = false;
  private activeCommands = new Set<string>();

  constructor(
    private baseUrl: string,
    private projectId: string,
    private token?: string
  ) {
    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGHUP', () => this.shutdown('SIGHUP'));
  }

  private async runCli(command: string, args: string[] = []): Promise<{ code: number; output: string }> {
    const processId = `cli_${command}_${Date.now()}`;
    
    try {
      const result = await processManager.runProcessWithRetry(
        processId,
        process.execPath,
        [require.resolve("../../dist/index.js"), command, ...args],
        {
          stdio: ["ignore", "pipe", "pipe"],
          shell: process.platform === "win32",
          cwd: process.cwd(),
          timeout: 300000, // 5 minutes for CLI commands
          retries: 1, // Retry once for transient failures
          retryDelay: 2000,
        }
      );

      return {
        code: result.code,
        output: (result.stdout + result.stderr).trim(),
      };
    } catch (error) {
      if (error instanceof ProcessError) {
        return {
          code: error.code || 1,
          output: error.stderr || error.stdout || error.message,
        };
      }
      throw error;
    }
  }

  private async handleCommand(cmdRow: CommandRow): Promise<void> {
    const { id, command, args } = cmdRow;
    this.activeCommands.add(id);
    
    let result: CommandResult = { ok: false, code: 1, output: "", error: undefined };

    try {
      console.log(`📋 Executing command: ${command} ${args ? JSON.stringify(args) : ''}`);
      
      switch (command) {
        case "audit":
          const auditResult = await this.runCli("audit");
          result = { ok: auditResult.code === 0, code: auditResult.code, output: auditResult.output };
          break;
          
        case "audit_fix":
          const fixResult = await this.runCli("audit", ["--fix"]);
          result = { ok: fixResult.code === 0, code: fixResult.code, output: fixResult.output };
          break;
          
        case "audit_inventory":
          const invResult = await this.runCli("audit", ["--inventory"]);
          result = { ok: invResult.code === 0, code: invResult.code, output: invResult.output };
          break;
          
        case "inventory":
          const inventoryResult = await this.runCli("inventory");
          result = { ok: inventoryResult.code === 0, code: inventoryResult.code, output: inventoryResult.output };
          break;
          
        case "init_existing":
          const initResult = await this.runCli("init-existing");
          result = { ok: initResult.code === 0, code: initResult.code, output: initResult.output };
          break;
          
        case "diagrams":
          const diagramResult = await this.runCli("diagrams");
          result = { ok: diagramResult.code === 0, code: diagramResult.code, output: diagramResult.output };
          break;
          
        case "export":
          if (!args?.format) {
            result = { ok: false, code: 1, output: "", error: "Export format not specified" };
            break;
          }
          const exportResult = await this.runCli("export", [args.format]);
          result = { ok: exportResult.code === 0, code: exportResult.code, output: exportResult.output };
          break;
          
        case "watch":
          result = { ok: false, code: 1, output: "", error: "Watch command not available in agent mode (requires interactive session)" };
          break;
          
        default:
          result = { ok: false, code: 1, output: "", error: `Unknown command: ${command}` };
      }

      console.log(`${result.ok ? '✅' : '❌'} Command ${command} ${result.ok ? 'completed successfully' : 'failed'}`);
      
    } catch (error) {
      console.error(`💥 Command ${command} threw an error:`, error);
      result = {
        ok: false,
        code: 1,
        output: "",
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Report result back to cloud
    await this.reportCommandResult(id, result);
    this.activeCommands.delete(id);
  }

  private async reportCommandResult(commandId: string, result: CommandResult): Promise<void> {
    const url = `${this.baseUrl}/command/${encodeURIComponent(commandId)}/done`;
    const headers = this.token ? { authorization: `Bearer ${this.token}` } : {};
    
    // Limit output size to prevent oversized payloads
    const maxOutputLength = 20000;
    const truncatedOutput = result.output.length > maxOutputLength 
      ? result.output.slice(0, maxOutputLength) + '\n[... output truncated ...]'
      : result.output;

    const payload = {
      ok: result.ok,
      output: truncatedOutput,
      error: result.error,
    };

    try {
      await httpClient.post(url, payload, headers);
      console.log(`📤 Reported command ${commandId} result to cloud`);
    } catch (error) {
      if (error instanceof AuthError) {
        console.error(`🔐 Authentication failed when reporting command result: ${error.message}`);
      } else if (error instanceof NetworkError) {
        console.error(`🌐 Network error when reporting command result: ${error.message}`);
      } else {
        console.error(`💥 Failed to report command result:`, error);
      }
      // Don't throw - this is not critical enough to crash the agent
    }
  }

  private async processBacklog(): Promise<void> {
    try {
      console.log(`🔄 Checking for pending commands...`);
      const url = `${this.baseUrl}/commands?project=${encodeURIComponent(this.projectId)}`;
      const headers = this.token ? { authorization: `Bearer ${this.token}` } : {};
      
      const backlog = await httpClient.get(url, headers);
      
      if (Array.isArray(backlog) && backlog.length > 0) {
        console.log(`📋 Found ${backlog.length} pending command(s)`);
        for (const commandRow of backlog) {
          if (!this.isShuttingDown) {
            await this.handleCommand(commandRow);
          }
        }
      } else {
        console.log(`✅ No pending commands`);
      }
    } catch (error) {
      if (error instanceof AuthError) {
        console.error(`🔐 Authentication failed when fetching backlog: ${error.message}`);
        throw error; // Re-throw auth errors as they're critical
      } else if (error instanceof NetworkError) {
        console.warn(`🌐 Network error when fetching backlog: ${error.message}. Will retry with live connection.`);
      } else {
        console.warn(`⚠️  Failed to fetch command backlog:`, error);
      }
    }
  }

  private connectToLiveEvents(): void {
    const sseUrl = `${this.baseUrl}/events?project=${encodeURIComponent(this.projectId)}`;
    const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
    
    this.sseClient = createSSEClient(sseUrl, {
      headers,
      timeout: 60000, // 1 minute timeout
      reconnectInterval: 2000, // Start with 2 second reconnection
      maxReconnectAttempts: 10,
      reconnectBackoffMultiplier: 1.5,
      maxReconnectInterval: 30000, // Max 30 seconds between reconnects
    });

    this.sseClient.on('connecting', () => {
      console.log(`🔌 Connecting to live event stream...`);
    });

    this.sseClient.on('connected', () => {
      console.log(`✅ Connected to live event stream`);
    });

    this.sseClient.on('reconnecting', ({ attempt, delay }) => {
      console.log(`🔄 Reconnecting to event stream (attempt ${attempt}) in ${delay}ms...`);
    });

    this.sseClient.on('command', async (data) => {
      if (data && data.project === this.projectId && !this.isShuttingDown) {
        const commandRow = data.row || data;
        await this.handleCommand(commandRow);
      }
    });

    this.sseClient.on('error', (error: SSEError) => {
      if (error.code === 'HTTP_ERROR' && error.message.includes('401')) {
        console.error(`🔐 Authentication failed for event stream: Invalid or expired token`);
        this.shutdown('AUTH_FAILED');
      } else if (error.code === 'MAX_RECONNECT_ATTEMPTS') {
        console.error(`💥 Event stream connection failed permanently: ${error.message}`);
        this.shutdown('CONNECTION_FAILED');
      } else {
        console.warn(`⚠️  Event stream error: ${error.message}`);
      }
    });

    this.sseClient.on('disconnected', () => {
      console.log(`⚡ Disconnected from event stream`);
    });

    this.sseClient.connect();
  }

  async start(): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Agent manager is shutting down');
    }

    console.log(`🚀 Starting FlowLock agent...`);
    console.log(`📍 Cloud URL: ${this.baseUrl}`);
    console.log(`📁 Project: ${this.projectId}`);
    console.log(`🔐 Authentication: ${this.token ? 'Enabled' : 'Disabled'}`);

    // Process any pending commands first
    await this.processBacklog();

    // Connect to live event stream
    this.connectToLiveEvents();

    console.log(`🎯 Agent is ready and listening for commands...`);
  }

  async shutdown(reason?: string): Promise<void> {
    if (this.isShuttingDown) return;
    
    console.log(`\n🛑 Shutting down agent${reason ? ` (${reason})` : ''}...`);
    this.isShuttingDown = true;

    // Wait for active commands to complete (with timeout)
    if (this.activeCommands.size > 0) {
      console.log(`⏳ Waiting for ${this.activeCommands.size} active command(s) to complete...`);
      const timeout = setTimeout(() => {
        console.log(`⏰ Timeout reached, forcing shutdown...`);
      }, 10000); // 10 second timeout
      
      while (this.activeCommands.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      clearTimeout(timeout);
    }

    // Disconnect SSE client
    if (this.sseClient) {
      this.sseClient.disconnect();
      this.sseClient = undefined;
    }

    // Shutdown process manager
    await processManager.shutdown();

    console.log(`✅ Agent shutdown complete`);
    process.exit(reason === 'AUTH_FAILED' ? 1 : 0);
  }
}

export const agentCommand = new Command("agent")
  .description("Connect to FlowLock Cloud and execute remote commands")
  .option("--cloud <url>", "Cloud base URL (e.g. https://flowlock-cloud.onrender.com)")
  .option("--project <id>", "Project id (e.g. demo)")
  .option("--token <token>", "Bearer token (optional)")
  .action(async (opts: AgentOptions) => {
    const baseUrl = (opts.cloud || "").replace(/\/$/, "");
    let projectId = opts.project || "demo";
    const token = opts.token;

    if (!baseUrl) {
      console.error("❌ Missing required --cloud <url> parameter");
      console.log("💡 Example: flowlock agent --cloud https://flowlock-cloud.onrender.com");
      process.exit(1);
    }

    try {
      // For authenticated connections, get the proper connection details
      if (token) {
        try {
          console.log(`🔐 Authenticating with FlowLock Cloud...`);
          
          const connectInfo = await httpClient.get(`${baseUrl}/agent/connect`, {
            authorization: `Bearer ${token}`
          });
          
          if (connectInfo.ok) {
            projectId = connectInfo.project; // Use authenticated project
            console.log(`✅ Authenticated as: ${connectInfo.user}`);
            console.log(`📁 Project: ${connectInfo.projectName} (${projectId})`);
            console.log(`🔗 Dashboard: ${connectInfo.endpoints.dashboard}`);
          } else {
            console.error(`❌ Authentication failed: ${connectInfo.error || "Invalid token"}`);
            console.log("💡 Please check your token and try again");
            process.exit(1);
          }
        } catch (error) {
          if (error instanceof AuthError) {
            console.error(`❌ Authentication failed: ${error.message}`);
            console.log("💡 Please check your token and try again");
            process.exit(1);
          } else if (error instanceof NetworkError) {
            console.error(`❌ Network error during authentication: ${error.message}`);
            console.log("💡 Please check your internet connection and cloud URL");
            process.exit(1);
          } else {
            console.error(`❌ Failed to authenticate:`, error);
            process.exit(1);
          }
        }
      } else {
        console.log(`🔓 Running in unauthenticated mode`);
        console.log(`🔗 Dashboard: ${baseUrl}/dashboard?project=${projectId}`);
      }

      // Create and start the agent manager
      const agentManager = new AgentManager(baseUrl, projectId, token);
      await agentManager.start();

      // Keep the process alive until shutdown
      await new Promise(() => {}); // This will only resolve when process is killed
      
    } catch (error) {
      console.error(`💥 Fatal error:`, error);
      process.exit(1);
    }
  });