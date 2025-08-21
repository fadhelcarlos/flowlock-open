import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { printArtifacts } from '../lib/printArtifacts';

export async function exportCommand(format: string) {
  const formats = ['junit', 'csv', 'svg'];
  
  if (!formats.includes(format)) {
    console.error(chalk.red(`❌ Invalid format: ${format}`));
    console.log(`Available formats: ${formats.join(', ')}`);
    process.exit(1);
  }
  
  try {
    console.log(chalk.cyan(`📦 Exporting ${format} artifacts...`));
    
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });
    
    const files: Record<string, string[]> = {
      junit: ['results.junit.xml'],
      csv: ['screens.csv'],
      svg: ['er.svg', 'flow.svg'],
    };
    
    let exportedCount = 0;
    for (const file of files[format]) {
      const src = path.join('artifacts', file);
      
      try {
        await fs.access(src);
        exportedCount++;
        console.log(chalk.green(`  ✅ Found ${file}`));
      } catch {
        console.log(chalk.yellow(`  ⚠️  ${file} not found. Run 'uxcg audit' first.`));
      }
    }
    
    if (exportedCount > 0) {
      console.log(chalk.green(`\n✅ Export completed: ${exportedCount} ${format} artifact(s) ready`));
    } else {
      console.log(chalk.yellow(`\n⚠️  No ${format} artifacts found. Run 'uxcg audit' to generate them first.`));
    }
    
    // Show all artifacts
    printArtifacts('artifacts');
  } catch (error) {
    console.error(chalk.red('❌ Export failed:'), error);
    process.exit(1);
  }
}