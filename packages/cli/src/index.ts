import { Command } from "commander";
import { initCommand } from "./commands/init";
import { auditCommand } from "./commands/audit";
import { diagramsCommand } from "./commands/diagrams";
import { exportCommand } from "./commands/export";
import { watchCommand } from "./commands/watch";
import { agentCommand } from "./commands/agent";
import { writeClaudeCommands } from "./templates/claude";

// NEW: added commands for existing-project init and inventory builder
import { initExistingCommand } from "./commands/init-existing";
import { inventoryCommand } from "./commands/inventory";

const program = new Command();

program
  .name("uxcg")
  .description("FlowLock UX Code Generator CLI")
  .version("0.0.0");

// ──────────────────────────────────────────────────────────────────────────────
// Project scaffolding / initialization
// ──────────────────────────────────────────────────────────────────────────────
program
  .command("init")
  .description("Initialize a new FlowLock project")
  .action(initCommand);

// NEW: wire FlowLock into an existing repository (no scaffolding)
program
  .command("init-existing")
  .alias("wire")
  .description("Wire FlowLock into an existing repo (creates flowlock.config.json, seeds agent commands, adds scripts)")
  .option("--skip-scripts", "Skip adding npm scripts to package.json")
  .option("--skip-commands", "Skip creating Claude command cards")
  .action(initExistingCommand);

// ──────────────────────────────────────────────────────────────────────────────
// Core audit & artifacts
// ──────────────────────────────────────────────────────────────────────────────
program
  .command("audit")
  .alias("check")
  .description("Run UX specification checks and generate artifacts")
  .option("--fix", "Autofix roles/uiStates and obvious HONEST reads, then re-run")
  .option("--inventory", "Require runtime inventory (fails if missing/stale)")
  .option("--only <checks>", "Run only specific checks (comma-separated)")
  .option("--skip <checks>", "Skip specific checks (comma-separated)")
  .option("--json", "Output results as JSON")
  .option("--quiet", "Suppress non-error output")
  .action((opts) => auditCommand(opts));

program
  .command("diagrams")
  .description("Generate only diagram artifacts")
  .action(diagramsCommand);

program
  .command("export <format>")
  .description("Export artifacts in specific format (junit|csv|svg)")
  .action(exportCommand);

// ──────────────────────────────────────────────────────────────────────────────
// Inventory (DB/API/UI) extraction
// ──────────────────────────────────────────────────────────────────────────────
program
  .command("inventory")
  .alias("inv")
  .description("Build runtime inventory (DB/API/UI) from your codebase")
  .option("--config <path>", "Path to flowlock.config.json (default: flowlock.config.json)", "flowlock.config.json")
  .option("--out <file>", "Output file path (default: artifacts/runtime_inventory.json)", "artifacts/runtime_inventory.json")
  .option("--db-only", "Extract only database entities")
  .option("--api-only", "Extract only API endpoints")
  .option("--ui-only", "Extract only UI reads/writes")
  .action((opts) => inventoryCommand(opts));

// ──────────────────────────────────────────────────────────────────────────────
// Watch mode & Agent
// ──────────────────────────────────────────────────────────────────────────────
program
  .command("watch")
  .description("Watch for changes and run audit automatically")
  .option("--cloud", "Enable cloud sync")
  .option("--cloudUrl <url>", "Cloud endpoint URL")
  .option("--projectId <id>", "Project identifier")
  .action(watchCommand);

program.addCommand(agentCommand);

// Ensure agent commands exist for Claude/Cursor users
try {
  writeClaudeCommands(process.cwd());
} catch {}

program.parse(process.argv);
