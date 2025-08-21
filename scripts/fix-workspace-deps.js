#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Packages to update
const packages = [
  'packages/shared',
  'packages/uxspec',
  'packages/plugin-sdk',
  'packages/inventory',
  'packages/checks-core',
  'packages/runner',
  'packages/cli',
  'packages/cli-tui',
  'packages/mcp'
];

// Update dependencies to use workspace protocol for local packages
function fixWorkspaceDeps(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let updated = false;
  
  // Update dependencies
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => {
      if (dep.startsWith('flowlock-') || dep === '@flowlock/cli-tui') {
        packageJson.dependencies[dep] = 'workspace:*';
        updated = true;
      }
    });
  }
  
  // Update devDependencies
  if (packageJson.devDependencies) {
    Object.keys(packageJson.devDependencies).forEach(dep => {
      if (dep.startsWith('flowlock-') || dep === '@flowlock/cli-tui') {
        packageJson.devDependencies[dep] = 'workspace:*';
        updated = true;
      }
    });
  }
  
  if (updated) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Fixed workspace deps in ${packageJson.name}`);
  }
  
  return packageJson.name;
}

console.log('🔧 Fixing workspace dependencies to use workspace:* protocol\n');

// Fix all packages
packages.forEach(packagePath => {
  if (fs.existsSync(packagePath)) {
    fixWorkspaceDeps(packagePath);
  }
});

console.log('\n✅ Done! Run "pnpm install" to update lockfile.');