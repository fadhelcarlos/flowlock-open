import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export async function exportCommand(format: string) {
  const formats = ['junit', 'csv', 'svg'];
  
  if (!formats.includes(format)) {
    console.error(chalk.red(`❌ Invalid format: ${format}`));
    console.log(`Available formats: ${formats.join(', ')}`);
    process.exit(1);
  }
  
  try {
    console.log(chalk.cyan(`📦 Exporting ${format} artifacts...\\n`));
    
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });
    
    const files: Record<string, string[]> = {
      junit: ['results.junit.xml'],
      csv: ['screens.csv'],
      svg: ['er.svg', 'flow.svg'],
    };
    
    for (const file of files[format]) {
      const src = path.join('artifacts', file);
      const dest = path.join('artifacts', file);
      
      try {
        await fs.access(src);
        await fs.copyFile(src, dest);
        console.log(chalk.green(`✅ Exported ${file}`));
      } catch {
        console.log(chalk.yellow(`⚠️  ${file} not found. Run 'uxcg audit' first.`));
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Export failed:'), error);
    process.exit(1);
  }
}