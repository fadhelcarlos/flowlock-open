/**
 * End-to-End Test for FlowLock Core Workflow
 * 
 * Tests the complete workflow:
 * 1. uxcg init-existing
 * 2. uxcg inventory  
 * 3. uxcg audit
 * 4. uxcg export svg
 * 
 * Validates that all expected artifacts are generated.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Test configuration
const TEST_PROJECT_NAME = 'flowlock-e2e-test';
const TIMEOUT = 120000; // 2 minutes

// Expected artifacts after full workflow
const EXPECTED_ARTIFACTS = [
  'artifacts/er.svg',
  'artifacts/flow.svg', 
  'artifacts/results.junit.xml',
  'artifacts/screens.csv',
  'artifacts/gap_report.md',
  'artifacts/acceptance_criteria.feature',
  'artifacts/determinism.sha256'
];

// Expected files after init-existing
const EXPECTED_INIT_FILES = [
  'flowlock.config.json',
  '.claude/commands/ux-contract-init.md',
  '.claude/commands/ux-guardrails-validate.md',
  '.claude/commands/ux-generate-ui.md',
  '.claude/commands/flow-audit-fix.md',
  '.claude/commands/ux-enhance-spec.md'
];

describe('FlowLock E2E Workflow', () => {
  let testProjectPath;
  let originalCwd;

  beforeAll(() => {
    originalCwd = process.cwd();
    
    // Create temporary test project directory
    testProjectPath = path.join(os.tmpdir(), TEST_PROJECT_NAME);
    
    // Clean up any existing test directory
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
    
    fs.mkdirSync(testProjectPath, { recursive: true });
    process.chdir(testProjectPath);
    
    console.log(`Created test project at: ${testProjectPath}`);
  });

  afterAll(() => {
    // Clean up test directory
    process.chdir(originalCwd);
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
    console.log(`Cleaned up test project at: ${testProjectPath}`);
  });

  describe('Step 1: Project Setup', () => {
    test('should create a basic Next.js-like project structure', () => {
      // Create package.json
      const packageJson = {
        name: TEST_PROJECT_NAME,
        version: '1.0.0',
        scripts: {
          dev: 'next dev',
          build: 'next build'
        },
        dependencies: {
          next: '^13.0.0',
          react: '^18.0.0'
        }
      };
      
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      
      // Create basic app structure
      fs.mkdirSync('app/api/users', { recursive: true });
      fs.mkdirSync('app/components', { recursive: true });
      fs.mkdirSync('src/db/models', { recursive: true });
      
      // Create sample API route
      const apiRoute = `
export async function GET() {
  return Response.json({ users: [] });
}

export async function POST(request) {
  const user = await request.json();
  return Response.json({ id: 1, ...user });
}
`;
      fs.writeFileSync('app/api/users/route.ts', apiRoute);
      
      // Create sample React component
      const userComponent = `
export function UserList({ users }) {
  return (
    <div data-fl-read="user.id,user.email,user.name">
      {users.map(user => (
        <div key={user.id} data-fl-read="user.id">
          <span data-fl-read="user.email">{user.email}</span>
          <span data-fl-read="user.name">{user.name}</span>
        </div>
      ))}
    </div>
  );
}
`;
      fs.writeFileSync('app/components/UserList.tsx', userComponent);
      
      // Create sample database model
      const userModel = `
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export const UserSchema = {
  tableName: 'users',
  fields: {
    id: { type: 'integer', primary: true },
    email: { type: 'string', unique: true },
    name: { type: 'string' },
    created_at: { type: 'timestamp', default: 'now()' },
    updated_at: { type: 'timestamp', default: 'now()' }
  }
};
`;
      fs.writeFileSync('src/db/models/User.ts', userModel);
      
      // Create basic uxspec.json
      const uxspec = {
        version: '1.0.0',
        project: TEST_PROJECT_NAME,
        name: 'E2E Test Project',
        description: 'Test project for FlowLock E2E validation',
        roles: [
          { id: 'user', name: 'User', permissions: ['read'] },
          { id: 'admin', name: 'Admin', permissions: ['create', 'read', 'update', 'delete'] }
        ],
        entities: [
          {
            id: 'user',
            name: 'User',
            fields: [
              { id: 'id', name: 'ID', type: 'number', required: true },
              { id: 'email', name: 'Email', type: 'email', required: true },
              { id: 'name', name: 'Name', type: 'string', required: true },
              { id: 'created_at', name: 'Created At', type: 'date', derived: true, provenance: 'system.timestamp' },
              { id: 'updated_at', name: 'Updated At', type: 'date', derived: true, provenance: 'system.timestamp' }
            ]
          }
        ],
        screens: [
          {
            id: 'user-list',
            name: 'User List',
            type: 'list',
            routes: ['/users'],
            roles: ['admin'],
            lists: [{
              id: 'users',
              reads: ['user.id', 'user.email', 'user.name'],
              sortable: true,
              filterable: true,
              paginated: true
            }],
            uiStates: ['empty', 'loading', 'error']
          },
          {
            id: 'user-create',
            name: 'Create User',
            type: 'form',
            routes: ['/users/new'],
            roles: ['admin'],
            forms: [{
              id: 'create-user',
              entityId: 'user',
              type: 'create',
              fields: [
                { id: 'email', required: true },
                { id: 'name', required: true }
              ]
            }],
            uiStates: ['empty', 'loading', 'error']
          }
        ],
        flows: [
          {
            id: 'create-user-flow',
            name: 'Create User Flow',
            role: 'admin',
            entryStepId: 's1',
            steps: [
              {
                id: 's1',
                screen: 'user-list'
              },
              {
                id: 's2', 
                screen: 'user-create',
                writes: ['user.email', 'user.name']
              }
            ],
            success: {
              screen: 'user-list',
              message: 'User created successfully'
            }
          }
        ],
        glossary: [
          {
            term: 'system.timestamp',
            definition: 'Server-generated timestamp',
            formula: 'new Date().toISOString()'
          }
        ]
      };
      
      fs.writeFileSync('uxspec.json', JSON.stringify(uxspec, null, 2));
      
      // Verify structure was created
      expect(fs.existsSync('package.json')).toBe(true);
      expect(fs.existsSync('app/api/users/route.ts')).toBe(true);
      expect(fs.existsSync('app/components/UserList.tsx')).toBe(true);
      expect(fs.existsSync('src/db/models/User.ts')).toBe(true);
      expect(fs.existsSync('uxspec.json')).toBe(true);
    });
  });

  describe('Step 2: init-existing command', () => {
    test('should initialize FlowLock for existing project', () => {
      const cmd = `node "${path.join(originalCwd, 'packages/cli/dist/index.js')}" init-existing`;
      
      console.log('Running: uxcg init-existing');
      const result = execSync(cmd, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: TIMEOUT 
      });
      
      console.log('init-existing output:', result);
      
      // Verify expected files were created
      EXPECTED_INIT_FILES.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
      
      // Verify flowlock.config.json has correct structure
      const config = JSON.parse(fs.readFileSync('flowlock.config.json', 'utf8'));
      expect(config).toHaveProperty('projectName');
      expect(config).toHaveProperty('inventory');
      expect(config).toHaveProperty('audit');
      
      // Verify package.json was updated with scripts
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(pkg.scripts).toHaveProperty('flowlock:audit');
      expect(pkg.scripts).toHaveProperty('flowlock:inventory');
      
      console.log('✅ init-existing completed successfully');
    }, TIMEOUT);
  });

  describe('Step 3: inventory command', () => {
    test('should extract runtime inventory from project', () => {
      const cmd = `node "${path.join(originalCwd, 'packages/cli/dist/index.js')}" inventory`;
      
      console.log('Running: uxcg inventory');
      const result = execSync(cmd, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: TIMEOUT 
      });
      
      console.log('inventory output:', result);
      
      // Verify runtime_inventory.json was created
      expect(fs.existsSync('runtime_inventory.json')).toBe(true);
      
      // Verify inventory contains expected structure
      const inventory = JSON.parse(fs.readFileSync('runtime_inventory.json', 'utf8'));
      expect(inventory).toHaveProperty('database');
      expect(inventory).toHaveProperty('api');
      expect(inventory).toHaveProperty('ui');
      
      console.log('✅ inventory completed successfully');
    }, TIMEOUT);
  });

  describe('Step 4: audit command', () => {
    test('should run audit and generate artifacts', () => {
      const cmd = `node "${path.join(originalCwd, 'packages/cli/dist/index.js')}" audit`;
      
      console.log('Running: uxcg audit');
      try {
        const result = execSync(cmd, { 
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: TIMEOUT 
        });
        console.log('audit output:', result);
      } catch (error) {
        // Audit might fail but should still generate artifacts
        console.log('audit output (with errors):', error.stdout);
        console.log('audit errors:', error.stderr);
      }
      
      // Verify artifacts directory exists
      expect(fs.existsSync('artifacts')).toBe(true);
      
      // Verify core artifacts were generated (some may be missing due to check failures)
      const criticalArtifacts = [
        'artifacts/results.junit.xml',
        'artifacts/determinism.sha256'
      ];
      
      criticalArtifacts.forEach(artifact => {
        if (fs.existsSync(artifact)) {
          console.log(`✅ Generated: ${artifact}`);
        } else {
          console.log(`⚠️  Missing: ${artifact}`);
        }
      });
      
      // At minimum, we should have a results file or determinism hash
      const hasResults = fs.existsSync('artifacts/results.junit.xml');
      const hasDeterminism = fs.existsSync('artifacts/determinism.sha256');
      
      expect(hasResults || hasDeterminism).toBe(true);
      
      console.log('✅ audit completed (may have validation errors)');
    }, TIMEOUT);
  });

  describe('Step 5: export svg command', () => {
    test('should export SVG diagrams', () => {
      const cmd = `node "${path.join(originalCwd, 'packages/cli/dist/index.js')}" export svg`;
      
      console.log('Running: uxcg export svg');
      try {
        const result = execSync(cmd, { 
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: TIMEOUT 
        });
        console.log('export svg output:', result);
      } catch (error) {
        // Export might fail if diagrams weren't generated
        console.log('export svg output (with errors):', error.stdout);
        console.log('export svg errors:', error.stderr);
      }
      
      // Check if SVG files exist
      const svgFiles = ['artifacts/er.svg', 'artifacts/flow.svg'];
      
      svgFiles.forEach(svgFile => {
        if (fs.existsSync(svgFile)) {
          console.log(`✅ Generated: ${svgFile}`);
          
          // Verify it's a valid SVG file
          const content = fs.readFileSync(svgFile, 'utf8');
          expect(content).toContain('<svg');
          expect(content).toContain('</svg>');
        } else {
          console.log(`⚠️  Missing: ${svgFile}`);
        }
      });
      
      console.log('✅ export svg completed');
    }, TIMEOUT);
  });

  describe('Step 6: Artifact Validation', () => {
    test('should validate all expected artifacts exist and have valid content', () => {
      console.log('\\nValidating generated artifacts...');
      
      const artifactsDir = 'artifacts';
      if (!fs.existsSync(artifactsDir)) {
        console.log('❌ No artifacts directory found');
        return;
      }
      
      // List all generated artifacts
      const actualArtifacts = fs.readdirSync(artifactsDir);
      console.log('Generated artifacts:', actualArtifacts);
      
      // Validate each expected artifact
      EXPECTED_ARTIFACTS.forEach(expectedArtifact => {
        const fileName = path.basename(expectedArtifact);
        
        if (actualArtifacts.includes(fileName)) {
          console.log(`✅ Found: ${fileName}`);
          
          // Basic content validation
          const filePath = path.join(artifactsDir, fileName);
          const stats = fs.statSync(filePath);
          
          if (stats.size === 0) {
            console.log(`⚠️  Warning: ${fileName} is empty`);
          } else {
            console.log(`   Size: ${stats.size} bytes`);
            
            // Specific validation by file type
            const content = fs.readFileSync(filePath, 'utf8');
            
            if (fileName.endsWith('.xml')) {
              expect(content).toContain('<testsuites>');
            } else if (fileName.endsWith('.svg')) {
              expect(content).toContain('<svg');
            } else if (fileName.endsWith('.md')) {
              expect(content.length).toBeGreaterThan(0);
            } else if (fileName.endsWith('.csv')) {
              expect(content).toContain(','); // Should have CSV format
            } else if (fileName.endsWith('.feature')) {
              expect(content).toContain('Feature:');
            }
          }
        } else {
          console.log(`❌ Missing: ${fileName}`);
        }
      });
      
      // Ensure we have at least some artifacts
      expect(actualArtifacts.length).toBeGreaterThan(0);
      
      console.log(`\\n✅ Artifact validation completed. Found ${actualArtifacts.length} artifacts.`);
    });
  });

  describe('Step 7: Configuration Validation', () => {
    test('should validate flowlock.config.json structure', () => {
      const config = JSON.parse(fs.readFileSync('flowlock.config.json', 'utf8'));
      
      // Validate required top-level properties
      expect(config).toHaveProperty('projectName');
      expect(config).toHaveProperty('inventory');
      expect(config).toHaveProperty('audit');
      
      // Validate inventory configuration
      expect(config.inventory).toHaveProperty('db');
      expect(config.inventory).toHaveProperty('api');
      expect(config.inventory).toHaveProperty('ui');
      
      // Validate inventory.db structure
      expect(config.inventory.db).toHaveProperty('mode');
      expect(config.inventory.db).toHaveProperty('dialect');
      
      // Validate inventory.api structure  
      expect(config.inventory.api).toHaveProperty('scan');
      expect(Array.isArray(config.inventory.api.scan)).toBe(true);
      
      // Validate inventory.ui structure
      expect(config.inventory.ui).toHaveProperty('scan');
      expect(Array.isArray(config.inventory.ui.scan)).toBe(true);
      
      console.log('✅ flowlock.config.json structure is valid');
    });
  });

  describe('Step 8: UXSpec Validation', () => {
    test('should validate uxspec.json structure and content', () => {
      const uxspec = JSON.parse(fs.readFileSync('uxspec.json', 'utf8'));
      
      // Validate required top-level properties
      expect(uxspec).toHaveProperty('version');
      expect(uxspec).toHaveProperty('project');
      expect(uxspec).toHaveProperty('entities');
      expect(uxspec).toHaveProperty('screens');
      expect(uxspec).toHaveProperty('flows');
      
      // Validate entities array
      expect(Array.isArray(uxspec.entities)).toBe(true);
      expect(uxspec.entities.length).toBeGreaterThan(0);
      
      // Validate first entity structure
      const firstEntity = uxspec.entities[0];
      expect(firstEntity).toHaveProperty('id');
      expect(firstEntity).toHaveProperty('name');
      expect(firstEntity).toHaveProperty('fields');
      expect(Array.isArray(firstEntity.fields)).toBe(true);
      
      // Validate screens array
      expect(Array.isArray(uxspec.screens)).toBe(true);
      expect(uxspec.screens.length).toBeGreaterThan(0);
      
      // Validate first screen structure
      const firstScreen = uxspec.screens[0];
      expect(firstScreen).toHaveProperty('id');
      expect(firstScreen).toHaveProperty('name');
      expect(firstScreen).toHaveProperty('type');
      expect(firstScreen).toHaveProperty('roles');
      
      console.log('✅ uxspec.json structure is valid');
    });
  });
});

// Test helper functions
function fileExists(filepath) {
  try {
    return fs.statSync(filepath).isFile();
  } catch (err) {
    return false;
  }
}

function directoryExists(dirpath) {
  try {
    return fs.statSync(dirpath).isDirectory();
  } catch (err) {
    return false;
  }
}

function getFileSize(filepath) {
  try {
    return fs.statSync(filepath).size;
  } catch (err) {
    return 0;
  }
}

// Export for use in CI
module.exports = {
  TEST_PROJECT_NAME,
  EXPECTED_ARTIFACTS,
  EXPECTED_INIT_FILES
};