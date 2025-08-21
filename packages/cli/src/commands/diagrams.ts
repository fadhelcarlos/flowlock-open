import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { Runner } from 'flowlock-runner';
import { printArtifacts } from '../lib/printArtifacts';

export async function diagramsCommand() {
  const specPath = path.join(process.cwd(), 'uxspec.json');
  
  try {
    console.log(chalk.cyan('📊 Generating diagrams...\\n'));
    
    const runner = await Runner.fromFile(specPath);
    await runner.runAndSave('artifacts');
    
    console.log(chalk.green('✅ Diagrams generated successfully'));
    
    // Show all artifacts (not just the ones we know about)
    printArtifacts('artifacts');
  } catch (error) {
    console.error(chalk.red('❌ Failed to generate diagrams:'), error);
    process.exit(1);
  }
}