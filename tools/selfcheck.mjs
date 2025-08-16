#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('FlowLock Self-Check Starting...\n');

let hasError = false;
const errors = [];

// Step 1: Build packages (optional - may already be built)
console.log('Step 1: Building packages (optional)...');
try {
  execSync('pnpm -r --filter "./packages/*" build', { 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('✅ Build successful\n');
} catch (error) {
  // Check if CLI is already built and working
  try {
    execSync('pnpm -w uxcg --version', { stdio: 'pipe' });
    console.log('⚠️  Build failed but CLI is operational\n');
  } catch (cliError) {
    console.error('❌ Build failed and CLI not operational');
    errors.push('Build failed and CLI not operational');
    hasError = true;
  }
}

// Step 2: Run audit with fix
console.log('Step 2: Running audit --fix...');
try {
  execSync('pnpm -w uxcg audit --fix', { 
    stdio: 'inherit',
    encoding: 'utf8' 
  });
  console.log('✅ Audit --fix completed\n');
} catch (error) {
  console.error('❌ Audit --fix failed');
  errors.push('Audit --fix failed');
  hasError = true;
}

// Step 3: Run audit
console.log('Step 3: Running audit...');
try {
  const auditOutput = execSync('pnpm -w uxcg audit 2>&1', { 
    encoding: 'utf8' 
  });
  
  // Check if audit was successful
  if (auditOutput.includes('✅ Audit completed successfully')) {
    console.log('✅ Audit passed\n');
  } else {
    console.error('❌ Audit did not complete successfully');
    console.log(auditOutput);
    errors.push('Audit did not pass');
    hasError = true;
  }
} catch (error) {
  console.error('❌ Audit failed');
  console.error(error.stdout || error.message);
  errors.push('Audit failed to run');
  hasError = true;
}

// Step 4: Verify artifacts exist
console.log('Step 4: Verifying artifacts...');
const requiredArtifacts = [
  'artifacts/er.mmd',
  'artifacts/er.svg',
  'artifacts/flow.mmd',
  'artifacts/flow.svg',
  'artifacts/screens.csv',
  'artifacts/results.junit.xml',
  'artifacts/gap_report.md',
  'artifacts/acceptance_criteria.feature'
];

const missingArtifacts = [];
for (const artifact of requiredArtifacts) {
  if (!fs.existsSync(artifact)) {
    missingArtifacts.push(artifact);
  }
}

if (missingArtifacts.length > 0) {
  console.error('❌ Missing artifacts:');
  missingArtifacts.forEach(a => console.error(`  - ${a}`));
  errors.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
  hasError = true;
} else {
  console.log('✅ All artifacts present\n');
}

// Step 5: Parse JUnit results
console.log('Step 5: Checking JUnit results...');
const junitPath = 'artifacts/results.junit.xml';
if (fs.existsSync(junitPath)) {
  try {
    const junitContent = fs.readFileSync(junitPath, 'utf8');
    
    // Extract test statistics
    const failuresMatch = junitContent.match(/failures="(\d+)"/);
    const errorsMatch = junitContent.match(/errors="(\d+)"/);
    
    const failures = failuresMatch ? parseInt(failuresMatch[1]) : 0;
    const errorsCount = errorsMatch ? parseInt(errorsMatch[1]) : 0;
    
    if (failures === 0 && errorsCount === 0) {
      console.log('✅ JUnit: 0 failures, 0 errors\n');
    } else {
      console.error(`❌ JUnit: ${failures} failures, ${errorsCount} errors`);
      errors.push(`JUnit has ${failures} failures and ${errorsCount} errors`);
      hasError = true;
    }
  } catch (error) {
    console.error('❌ Could not parse JUnit results');
    errors.push('Could not parse JUnit results');
    hasError = true;
  }
} else {
  console.error('❌ JUnit results file not found');
  errors.push('JUnit results file not found');
  hasError = true;
}

// Step 6: Verify command files
console.log('Step 6: Checking agent commands...');
const requiredCommands = [
  '.claude/commands/ux-contract-init.md',
  '.claude/commands/ux-guardrails-validate.md',
  '.claude/commands/ux-generate-ui.md',
  '.claude/commands/flow-audit-fix.md'
];

const missingCommands = [];
for (const cmd of requiredCommands) {
  if (!fs.existsSync(cmd)) {
    missingCommands.push(cmd);
  }
}

if (missingCommands.length > 0) {
  console.error('❌ Missing command files:');
  missingCommands.forEach(c => console.error(`  - ${c}`));
  errors.push(`Missing commands: ${missingCommands.join(', ')}`);
  hasError = true;
} else {
  console.log('✅ All command files present\n');
}

// Step 7: Verify CI workflow
console.log('Step 7: Checking CI workflow...');
const workflowPath = '.github/workflows/flowlock.yml';
if (!fs.existsSync(workflowPath)) {
  console.error('❌ GitHub Action workflow not found');
  errors.push('GitHub Action workflow not found');
  hasError = true;
} else {
  console.log('✅ GitHub Action workflow present\n');
}

// Step 8: Verify documentation
console.log('Step 8: Checking documentation...');
const requiredDocs = [
  'docs/flowlock-architecture.md',
  'docs/RUNBOOK.md'
];

const missingDocs = [];
for (const doc of requiredDocs) {
  if (!fs.existsSync(doc)) {
    missingDocs.push(doc);
  }
}

if (missingDocs.length > 0) {
  console.error('❌ Missing documentation:');
  missingDocs.forEach(d => console.error(`  - ${d}`));
  errors.push(`Missing docs: ${missingDocs.join(', ')}`);
  hasError = true;
} else {
  console.log('✅ All documentation present\n');
}

// Final result
console.log('=====================================');
if (hasError) {
  console.error('\n❌ SELF-CHECK: FAIL\n');
  console.error('Issues found:');
  errors.forEach((e, i) => console.error(`${i + 1}. ${e}`));
  process.exit(1);
} else {
  console.log('\nSELF-CHECK: PASS\n');
  process.exit(0);
}