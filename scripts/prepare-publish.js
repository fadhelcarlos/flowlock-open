#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Fix package.json for publishing by replacing workspace:* with actual versions
function prepareForPublish(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Map of workspace packages to their versions
  const workspaceVersions = {
    'flowlock-shared': '^0.10.0',
    'flowlock-uxspec': '^0.10.0',
    'flowlock-plugin-sdk': '^0.10.0',
    'flowlock-inventory': '^0.10.0',
    'flowlock-checks-core': '^0.10.0',
    'flowlock-runner': '^0.10.0',
    'flowlock-uxcg': '^0.10.0',
    '@flowlock/cli-tui': '^0.10.0'
  };
  
  let updated = false;
  
  // Fix dependencies
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => {
      if (packageJson.dependencies[dep] === 'workspace:*') {
        packageJson.dependencies[dep] = workspaceVersions[dep] || '^0.10.0';
        updated = true;
        console.log(`  Fixed dependency: ${dep} -> ${packageJson.dependencies[dep]}`);
      }
    });
  }
  
  // Fix devDependencies
  if (packageJson.devDependencies) {
    Object.keys(packageJson.devDependencies).forEach(dep => {
      if (packageJson.devDependencies[dep] === 'workspace:*') {
        packageJson.devDependencies[dep] = workspaceVersions[dep] || '^0.10.0';
        updated = true;
        console.log(`  Fixed devDependency: ${dep} -> ${packageJson.devDependencies[dep]}`);
      }
    });
  }
  
  if (updated) {
    // Save the fixed package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Fixed ${packageJson.name} for publishing`);
  }
  
  return packageJson.name;
}

// Fix the TUI package specifically
console.log('🔧 Preparing @flowlock/cli-tui for publishing...\n');
prepareForPublish('packages/cli-tui');

console.log('\n📝 Next steps:');
console.log('1. Bump version: cd packages/cli-tui && npm version patch');
console.log('2. Publish: npm publish --access public');
console.log('3. Install: npm install -g @flowlock/cli-tui');