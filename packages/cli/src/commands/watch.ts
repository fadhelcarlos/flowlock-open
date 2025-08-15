import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { Runner } from 'flowlock-runner';
import WebSocket from 'ws';

interface WatchOptions {
  cloud?: boolean;
  cloudUrl?: string;
  projectId?: string;
}

export async function watchCommand(options: WatchOptions) {
  console.log(chalk.cyan('👁️  Starting FlowLock watch mode...\\n'));
  
  const specPath = path.join(process.cwd(), 'uxspec.json');
  const appDirs = ['app', 'apps'];
  
  const watchPaths = [specPath];
  for (const dir of appDirs) {
    try {
      await fs.access(dir);
      watchPaths.push(`${dir}/**/*.{ts,tsx,js,jsx}`);
    } catch {
      // Directory doesn't exist, skip
    }
  }
  
  console.log('Watching:');
  watchPaths.forEach(p => console.log(`  • ${p}`));
  
  if (options.cloud) {
    console.log(chalk.yellow('\\n☁️  Cloud sync enabled (stub)'));
    console.log(`  URL: ${options.cloudUrl || 'https://api.flowlock.dev'}`);
    console.log(`  Project: ${options.projectId || 'auto-detected'}`);
  }
  
  let isRunning = false;
  
  const runAudit = async () => {
    if (isRunning) return;
    isRunning = true;
    
    console.log(chalk.dim('\\n---'));
    console.log(chalk.cyan('🔄 Change detected, running audit...'));
    
    try {
      const runner = await Runner.fromFile(specPath);
      const result = await runner.runAndSave('artifacts');
      
      const errors = result.checkResults.filter(r => r.level === 'error' && r.status === 'fail');
      const warnings = result.checkResults.filter(r => r.level === 'warning' && r.status === 'fail');
      
      if (errors.length > 0) {
        console.log(chalk.red(`  ❌ ${errors.length} errors`));
      }
      if (warnings.length > 0) {
        console.log(chalk.yellow(`  ⚠️  ${warnings.length} warnings`));
      }
      if (errors.length === 0 && warnings.length === 0) {
        console.log(chalk.green('  ✅ All checks passed'));
      }
      
      if (options.cloud) {
        // Stub for cloud sync
        console.log(chalk.dim('  📤 Syncing to cloud... (stub)'));
        // Would POST/WS to cloudUrl with projectId and results
      }
    } catch (error) {
      console.error(chalk.red('  ❌ Audit failed:'), error);
    } finally {
      isRunning = false;
    }
  };
  
  const watcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
  });
  
  watcher.on('change', runAudit);
  watcher.on('add', runAudit);
  watcher.on('unlink', runAudit);
  
  // Run initial audit
  await runAudit();
  
  console.log(chalk.dim('\\nPress Ctrl+C to stop watching'));
}