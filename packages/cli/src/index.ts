import { Command } from "commander";
import { initCommand } from "./commands/init";
import { auditCommand } from "./commands/audit";
import { diagramsCommand } from "./commands/diagrams";
import { exportCommand } from "./commands/export";
import { watchCommand } from "./commands/watch";
import { agentCommand } from "./commands/agent";
import { writeClaudeCommands } from "./templates/claude";

const program = new Command();

program
  .name("uxcg")
  .description("FlowLock UX Code Generator CLI")
  .version("0.0.0");

program
  .command("init")
  .description("Initialize a new FlowLock project")
  .action(initCommand);

program
  .command("audit")
  .description("Run UX specification checks and generate artifacts")
  .option("--fix", "Autofix roles/uiStates and obvious HONEST reads, then re-run")
  .action((opts) => auditCommand(opts));

program
  .command("diagrams")
  .description("Generate only diagram artifacts")
  .action(diagramsCommand);

program
  .command("export <format>")
  .description("Export artifacts in specific format (junit|csv|svg)")
  .action(exportCommand);

program
  .command("watch")
  .description("Watch for changes and run audit automatically")
  .option("--cloud", "Enable cloud sync")
  .option("--cloudUrl <url>", "Cloud endpoint URL")
  .option("--projectId <id>", "Project identifier")
  .action(watchCommand);

program
  .addCommand(agentCommand);

// Ensure agent commands exist for Claude/Cursor users
try { writeClaudeCommands(process.cwd()); } catch {}

program.parse(process.argv);
