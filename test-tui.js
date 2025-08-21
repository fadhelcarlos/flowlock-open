#!/usr/bin/env node

// Test if TUI can start
console.log('Testing TUI launch...');
console.log('TTY detection:', {
  stdout: process.stdout.isTTY,
  stdin: process.stdin.isTTY,
  CI: process.env.CI,
  argv: process.argv.length
});

// Force TUI mode for testing
process.stdout.isTTY = true;
process.stdin.isTTY = true;

try {
  const { startTUI } = require('./packages/cli-tui/dist/index.js');
  console.log('TUI module loaded successfully');
  console.log('Starting TUI...');
  
  startTUI().then(() => {
    console.log('TUI started');
  }).catch(err => {
    console.error('TUI error:', err);
  });
} catch (err) {
  console.error('Failed to load TUI:', err);
}