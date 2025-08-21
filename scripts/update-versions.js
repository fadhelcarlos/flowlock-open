#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const NEW_VERSION = '0.10.0';

// Packages to update (in dependency order)
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

// Update version in package.json
function updatePackageVersion(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const oldVersion = packageJson.version;
  packageJson.version = NEW_VERSION;
  
  // Update dependencies to use new versions
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => {
      if (dep.startsWith('flowlock-')) {
        // Update to use caret range with new version
        packageJson.dependencies[dep] = `^${NEW_VERSION}`;
      }
    });
  }
  
  if (packageJson.devDependencies) {
    Object.keys(packageJson.devDependencies).forEach(dep => {
      if (dep.startsWith('flowlock-')) {
        packageJson.devDependencies[dep] = `^${NEW_VERSION}`;
      }
    });
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log(`✅ Updated ${packageJson.name}: ${oldVersion} → ${NEW_VERSION}`);
  return packageJson.name;
}

console.log(`🚀 Updating all packages to version ${NEW_VERSION}\n`);

// Update all packages
const updatedPackages = [];
packages.forEach(packagePath => {
  if (fs.existsSync(packagePath)) {
    const name = updatePackageVersion(packagePath);
    updatedPackages.push(name);
  }
});

console.log('\n📦 Updated packages:');
updatedPackages.forEach(name => console.log(`  - ${name}`));

console.log('\n⚠️  Next steps:');
console.log('1. Run: pnpm install');
console.log('2. Run: pnpm build');
console.log('3. Commit changes');
console.log('4. Publish packages in order');