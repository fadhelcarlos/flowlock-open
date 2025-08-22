#!/usr/bin/env node
import process from 'node:process';

// Force TUI mode for testing
process.stdout.isTTY = true as any;
process.stdin.isTTY = true as any;
process.env.CI = '';

console.log('Starting FlowLock TUI (forced mode)...');

import('../index.js').then(({ startTUI }) => {
  startTUI().catch((err: any) => {
    console.error('TUI Error:', err);
    process.exit(1);
  });
}).catch(err => {
  console.error('Failed to load TUI module:', err);
  process.exit(1);
});