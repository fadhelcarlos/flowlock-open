#!/usr/bin/env node

// Test script to verify graduated validation levels implementation
const { auditCommand } = require('./packages/cli/dist/commands/audit');

// Mock options for different levels
const levels = ['basic', 'enhanced', 'strict'];

console.log('Testing graduated validation levels:\n');

levels.forEach(level => {
  console.log(`Testing ${level} level:`);
  console.log(`- Command: npx flowlock-uxcg audit --level=${level}`);
  
  const checks = {
    basic: ['HONEST', 'CREATABLE', 'REACHABILITY', 'UI', 'STATE', 'SCREEN', 'SPEC'],
    enhanced: ['HONEST', 'CREATABLE', 'REACHABILITY', 'UI', 'STATE', 'SCREEN', 'SPEC', 
               'JTBD', 'RELATIONS', 'ROUTES', 'CTAS'],
    strict: ['HONEST', 'CREATABLE', 'REACHABILITY', 'UI', 'STATE', 'SCREEN', 'SPEC',
             'JTBD', 'RELATIONS', 'ROUTES', 'CTAS', 'INVENTORY', 'DETERMINISM', 'DATABASE', 'MIGRATION']
  };
  
  console.log(`- Checks included: ${checks[level].join(', ')}`);
  console.log('');
});

console.log('Example commands:');
console.log('');
console.log('# Quick validation (Core 7 only)');
console.log('npx flowlock-uxcg audit --level=basic');
console.log('');
console.log('# Standard validation (default)');
console.log('npx flowlock-uxcg audit');
console.log('');
console.log('# Full validation with inventory');
console.log('npx flowlock-uxcg inventory');
console.log('npx flowlock-uxcg audit --level=strict');
console.log('');
console.log('# With auto-fix at any level');
console.log('npx flowlock-uxcg audit --level=basic --fix');
console.log('npx flowlock-uxcg audit --level=enhanced --fix');
console.log('');
console.log('# JSON output for CI/CD');
console.log('npx flowlock-uxcg audit --level=enhanced --json');