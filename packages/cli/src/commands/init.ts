import * as fs from 'fs/promises';
import * as path from 'path';
import { starterSpec } from '../templates/starter-spec';
import { packageScripts, huskyPreCommit } from '../templates/package-scripts';

export async function initCommand() {
  console.log('🚀 Initializing FlowLock UX specification...');
  
  const specPath = path.join(process.cwd(), 'uxspec.json');
  const packagePath = path.join(process.cwd(), 'package.json');
  
  try {
    await fs.access(specPath);
    console.log('⚠️  uxspec.json already exists. Skipping...');
  } catch {
    await fs.writeFile(specPath, JSON.stringify(starterSpec, null, 2));
    console.log('✅ Created uxspec.json');
  }
  
  try {
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    packageJson.scripts = {
      ...packageJson.scripts,
      ...packageScripts,
    };
    
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added scripts to package.json');
  } catch {
    console.log('⚠️  No package.json found. Creating one...');
    const newPackage = {
      name: 'my-ux-project',
      version: '1.0.0',
      scripts: packageScripts,
    };
    await fs.writeFile(packagePath, JSON.stringify(newPackage, null, 2));
    console.log('✅ Created package.json with scripts');
  }
  
  try {
    await fs.mkdir('.husky', { recursive: true });
    await fs.writeFile('.husky/pre-commit', huskyPreCommit);
    await fs.chmod('.husky/pre-commit', 0o755);
    console.log('✅ Set up Husky pre-commit hook');
  } catch (error) {
    console.log('⚠️  Could not set up Husky:', error);
  }
  
  console.log('\\n🎉 FlowLock initialization complete!');
  console.log('\\nNext steps:');
  console.log('  1. Edit uxspec.json to define your UX specification');
  console.log('  2. Run "npm run uxcg:audit" to validate your spec');
  console.log('  3. Run "npm run uxcg:watch" to enable live validation');
}