import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { Runner } from 'flowlock-runner';

export async function diagramsCommand() {
  const specPath = path.join(process.cwd(), 'uxspec.json');
  
  try {
    console.log(chalk.cyan('📊 Generating diagrams...\\n'));
    
    const runner = await Runner.fromFile(specPath);
    const result = await runner.run();
    
    await fs.mkdir('artifacts', { recursive: true });
    
    await fs.writeFile(
      path.join('artifacts', 'er.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Mermaid ER: ${result.artifacts.erDiagram.substring(0, 100)}...</text></svg>`
    );
    
    await fs.writeFile(
      path.join('artifacts', 'flow.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Mermaid Flow: ${result.artifacts.flowDiagram.substring(0, 100)}...</text></svg>`
    );
    
    console.log(chalk.green('✅ Diagrams generated:'));
    console.log('  • artifacts/er.svg');
    console.log('  • artifacts/flow.svg');
  } catch (error) {
    console.error(chalk.red('❌ Failed to generate diagrams:'), error);
    process.exit(1);
  }
}