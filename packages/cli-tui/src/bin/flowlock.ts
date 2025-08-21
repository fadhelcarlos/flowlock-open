import { spawn } from 'node:child_process';
import process from 'node:process';

const isTTY = Boolean(process.stdout.isTTY && process.stdin.isTTY);
const wantsUI = isTTY && process.env.CI !== 'true' && process.argv.length <= 2 && !process.argv.includes('--no-ui');

if (wantsUI) {
  const { startTUI } = require('../index');
  startTUI().catch((err: any) => {
    console.error(err);
    process.exit(1);
  });
} else {
  // Back-compat: forward args to headless CLI (uxcg)
  const child = spawn('uxcg', process.argv.slice(2), { 
    stdio: 'inherit', 
    shell: true 
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}