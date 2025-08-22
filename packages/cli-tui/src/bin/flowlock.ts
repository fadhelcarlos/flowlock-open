import { spawn } from 'node:child_process';
import process from 'node:process';

const isTTY = Boolean(process.stdout.isTTY && process.stdin.isTTY);
const wantsUI = isTTY && process.env.CI !== 'true' && process.argv.length <= 2 && !process.argv.includes('--no-ui');

if (wantsUI) {
  import('../index.js').then(({ startTUI }) => {
    startTUI().catch((err: any) => {
      console.error(err);
      process.exit(1);
    });
  });
} else {
  // Back-compat: forward args to headless CLI (npx flowlock-uxcg)
  const child = spawn('npx', ['flowlock-uxcg', ...process.argv.slice(2)], { 
    stdio: 'inherit', 
    shell: true 
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}