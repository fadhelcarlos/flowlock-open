import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { Runner } from 'flowlock-runner';
import type { CheckResult } from 'flowlock-plugin-sdk';

export async function auditCommand() {
  const specPath = path.join(process.cwd(), 'uxspec.json');
  
  try {
    console.log(chalk.cyan('🔍 Running FlowLock audit...\\n'));
    
    const runner = await Runner.fromFile(specPath);
    const result = await runner.runAndSave('artifacts');
    
    printResults(result.checkResults);
    
    console.log(chalk.cyan('\\n📁 Artifacts generated:'));
    console.log('  • artifacts/er.svg');
    console.log('  • artifacts/flow.svg');
    console.log('  • artifacts/screens.csv');
    console.log('  • artifacts/results.junit.xml');
    
    const hasErrors = result.checkResults.some(r => r.level === 'error' && r.status === 'fail');
    
    if (hasErrors) {
      console.log(chalk.red('\\n❌ Audit failed with errors'));
      process.exit(1);
    } else {
      console.log(chalk.green('\\n✅ Audit completed successfully'));
    }
  } catch (error) {
    console.error(chalk.red('\\n❌ Audit failed:'), error);
    process.exit(1);
  }
}

function printResults(results: CheckResult[]) {
  const grouped = new Map<string, CheckResult[]>();
  
  for (const result of results) {
    const checkId = result.id.split('_')[0];
    if (!grouped.has(checkId)) {
      grouped.set(checkId, []);
    }
    grouped.get(checkId)!.push(result);
  }
  
  for (const [checkId, checkResults] of grouped) {
    console.log(chalk.bold(`\\n📋 ${checkId.replace(/_/g, ' ').toUpperCase()}`));
    
    for (const result of checkResults) {
      const icon = result.status === 'pass' ? '✅' : result.level === 'error' ? '❌' : '⚠️ ';
      const color = result.status === 'pass' ? chalk.green : result.level === 'error' ? chalk.red : chalk.yellow;
      
      console.log(`  ${icon} ${color(result.message)}`);
      if (result.ref) {
        console.log(chalk.gray(`     → ${result.ref}`));
      }
    }
  }
}