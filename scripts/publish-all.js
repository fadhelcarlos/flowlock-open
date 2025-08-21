#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Publishing order based on dependency graph
const PUBLISH_ORDER = [
  // Level 1: Foundation packages (no FlowLock dependencies)
  'packages/shared',
  'packages/uxspec',
  
  // Level 2: Mid-tier packages
  'packages/plugin-sdk',
  'packages/inventory',
  
  // Level 3: Core packages
  'packages/checks-core',
  'packages/runner',
  
  // Level 4: Consumer packages
  'packages/cli',
  
  // Level 5: TUI package
  'packages/cli-tui'
];

// Skip private packages
const SKIP_PACKAGES = ['packages/mcp'];

function getPackageInfo(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return {
    name: packageJson.name,
    version: packageJson.version,
    private: packageJson.private
  };
}

function publishPackage(packagePath, dryRun = false) {
  const info = getPackageInfo(packagePath);
  
  if (info.private) {
    console.log(`⏭️  Skipping ${info.name} (private package)`);
    return false;
  }
  
  console.log(`\n📦 Publishing ${info.name}@${info.version}...`);
  
  try {
    // Check if already published
    try {
      execSync(`npm view ${info.name}@${info.version}`, { 
        stdio: 'pipe',
        cwd: packagePath 
      });
      console.log(`✅ ${info.name}@${info.version} already published`);
      return true;
    } catch {
      // Not published yet, continue
    }
    
    if (dryRun) {
      console.log(`  [DRY RUN] Would publish ${info.name}@${info.version}`);
    } else {
      // Build before publishing
      console.log(`  Building ${info.name}...`);
      execSync('pnpm build', { 
        stdio: 'inherit',
        cwd: packagePath 
      });
      
      // Publish to npm
      console.log(`  Publishing to npm...`);
      execSync('npm publish --access public', { 
        stdio: 'inherit',
        cwd: packagePath 
      });
      
      console.log(`✅ Successfully published ${info.name}@${info.version}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to publish ${info.name}: ${error.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipBuild = args.includes('--skip-build');
  
  console.log('🚀 FlowLock Package Publisher');
  console.log('==============================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No packages will be published\n');
  }
  
  // Check npm login
  try {
    execSync('npm whoami', { stdio: 'pipe' });
  } catch {
    console.error('❌ Not logged in to npm. Please run "npm login" first.');
    process.exit(1);
  }
  
  // Build all packages first
  if (!skipBuild && !dryRun) {
    console.log('\n📨 Building all packages...');
    execSync('pnpm build', { stdio: 'inherit' });
  }
  
  // Publish packages in order
  const results = [];
  for (const packagePath of PUBLISH_ORDER) {
    if (SKIP_PACKAGES.includes(packagePath)) {
      continue;
    }
    
    if (!fs.existsSync(packagePath)) {
      console.log(`⚠️  Package not found: ${packagePath}`);
      continue;
    }
    
    const success = publishPackage(packagePath, dryRun);
    const info = getPackageInfo(packagePath);
    results.push({ name: info.name, version: info.version, success });
    
    if (!success && !dryRun) {
      console.error('\n⚠️  Publishing failed. Stopping to prevent dependency issues.');
      break;
    }
  }
  
  // Summary
  console.log('\n📊 Publishing Summary:');
  console.log('======================');
  results.forEach(({ name, version, success }) => {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${name}@${version}`);
  });
  
  if (!dryRun && results.every(r => r.success)) {
    console.log('\n✨ All packages published successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Verify packages on npm: https://www.npmjs.com/~YOUR_USERNAME');
    console.log('2. Test installation: npm install -g @flowlock/cli-tui');
    console.log('3. Create GitHub release');
    console.log('4. Update documentation');
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});