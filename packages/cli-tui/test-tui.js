/* eslint-env node */
import process from 'node:process';

// Force TUI mode for testing
process.stdout.isTTY = true;
process.stdin.isTTY = true;
process.env.CI = '';

console.log('Starting FlowLock TUI (test mode)...');

import('./dist/index.js').then(({ startTUI }) => {
  startTUI().catch((err) => {
    console.error('TUI Error:', err);
    process.exit(1);
  });
}).catch(err => {
  console.error('Failed to load TUI module:', err);
  process.exit(1);
});