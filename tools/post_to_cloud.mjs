#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

// Configuration from environment
const CLOUD_URL = process.env.FLOWLOCK_CLOUD_URL;
const PROJECT_ID = process.env.FLOWLOCK_PROJECT_ID;
const TOKEN = process.env.FLOWLOCK_TOKEN;

if (!CLOUD_URL || !PROJECT_ID) {
  console.error('Error: FLOWLOCK_CLOUD_URL and FLOWLOCK_PROJECT_ID environment variables are required');
  process.exit(1);
}

// Check if artifacts exist
const artifactDir = 'artifacts';
const expectedArtifacts = [
  'er.mmd',
  'er.svg',
  'flow.mmd',
  'flow.svg',
  'screens.csv',
  'results.junit.xml',
  'gap_report.md',
  'acceptance_criteria.feature'
];

const existingArtifacts = expectedArtifacts.filter(file => 
  fs.existsSync(`${artifactDir}/${file}`)
);

if (existingArtifacts.length === 0) {
  console.error('Error: No artifacts found. Run "pnpm -w uxcg audit" first.');
  process.exit(1);
}

// Parse JUnit results if available
let stats = {
  tests: 0,
  failures: 0,
  errors: 0,
  skipped: 0
};

const junitPath = `${artifactDir}/results.junit.xml`;
if (fs.existsSync(junitPath)) {
  try {
    const junitContent = fs.readFileSync(junitPath, 'utf8');
    
    // Extract stats using regex
    const testsMatch = junitContent.match(/tests="(\d+)"/);
    const failuresMatch = junitContent.match(/failures="(\d+)"/);
    const errorsMatch = junitContent.match(/errors="(\d+)"/);
    const skippedMatch = junitContent.match(/skipped="(\d+)"/);
    
    if (testsMatch) stats.tests = parseInt(testsMatch[1]);
    if (failuresMatch) stats.failures = parseInt(failuresMatch[1]);
    if (errorsMatch) stats.errors = parseInt(errorsMatch[1]);
    if (skippedMatch) stats.skipped = parseInt(skippedMatch[1]);
  } catch (error) {
    console.warn('Warning: Could not parse JUnit results:', error.message);
  }
}

// Prepare payload
const payload = {
  project: PROJECT_ID,
  kind: 'junit',
  payload: {
    stats,
    artifacts: existingArtifacts,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString()
  }
};

console.log('Posting to FlowLock Cloud...');
console.log(`URL: ${CLOUD_URL}/ingest`);
console.log(`Project: ${PROJECT_ID}`);
console.log(`Artifacts: ${existingArtifacts.length} files`);
console.log(`Stats: ${stats.tests} tests, ${stats.failures} failures, ${stats.errors} errors`);

// Prepare curl command
const headers = [
  '-H "Content-Type: application/json"'
];

if (TOKEN) {
  headers.push(`-H "Authorization: Bearer ${TOKEN}"`);
}

const curlCommand = [
  'curl',
  '-X POST',
  `"${CLOUD_URL}/ingest"`,
  ...headers,
  `-d '${JSON.stringify(payload)}'`,
  '--fail-with-body'
].join(' ');

try {
  const result = execSync(curlCommand, { encoding: 'utf8', shell: true });
  console.log('Success! Response:', result);
  
  // If successful, print dashboard URL
  console.log(`\nView dashboard: ${CLOUD_URL}/dashboard?project=${PROJECT_ID}`);
} catch (error) {
  console.error('Error posting to FlowLock Cloud:');
  if (error.stdout) console.error(error.stdout);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
}