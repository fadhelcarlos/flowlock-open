import { Command } from 'commander';
import { initCommand } from './commands/init';
import { auditCommand } from './commands/audit';
import { diagramsCommand } from './commands/diagrams';
import { exportCommand } from './commands/export';
import { watchCommand } from './commands/watch';

const program = new Command();

program
  .name('uxcg')
  .description('FlowLock UX Code Generator CLI')
  .version('0.0.0');

program
  .command('init')
  .description('Initialize a new FlowLock project')
  .action(initCommand);

program
  .command('audit')
  .description('Run UX specification checks and generate artifacts')
  .action(auditCommand);

program
  .command('diagrams')
  .description('Generate only diagram artifacts')
  .action(diagramsCommand);

program
  .command('export <format>')
  .description('Export artifacts in specific format (junit|csv|svg)')
  .action(exportCommand);

program
  .command('watch')
  .description('Watch for changes and run audit automatically')
  .option('--cloud', 'Enable cloud sync')
  .option('--cloudUrl <url>', 'Cloud endpoint URL')
  .option('--projectId <id>', 'Project identifier')
  .action(watchCommand);

program.parse(process.argv);