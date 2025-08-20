# flowlock-runner

Test runner and artifact generator for FlowLock validation.

## Overview

The runner package orchestrates FlowLock's validation checks and generates comprehensive artifacts including diagrams, reports, and test files. It manages the execution of all 15 validation checks across the three validation levels (basic, enhanced, strict).

## Features

- **Check Orchestration**: Runs validation checks in proper sequence
- **Artifact Generation**: Creates diagrams, reports, and test files
- **Graduated Validation**: Supports basic, enhanced, and strict validation levels
- **Auto-Fix Support**: Applies fixes for common issues
- **Multiple Output Formats**: Generates Mermaid diagrams, CSV, JUnit XML, and more

## Installation

```bash
npm install flowlock-runner
```

## Usage

### Programmatic API

```javascript
import { Runner } from 'flowlock-runner';
import spec from './uxspec.json';

// Create runner instance
const runner = new Runner({
  spec,
  outDir: './artifacts',
  fix: true,
  level: 'enhanced' // 'basic', 'enhanced', or 'strict'
});

// Run validation
const results = await runner.run();

// Check results
if (results.passed) {
  console.log('All checks passed!');
} else {
  console.log(`${results.passCount}/${results.checkCount} checks passed`);
}
```

### Configuration Options

```javascript
const runner = new Runner({
  spec: specification,           // UX specification object
  outDir: './artifacts',         // Output directory for artifacts
  fix: false,                    // Enable auto-fix
  level: 'enhanced',            // Validation level
  only: ['HONEST', 'UI'],       // Run only specific checks
  skip: ['INVENTORY'],          // Skip specific checks
  quiet: false,                 // Suppress output
  json: false,                  // Output as JSON
  inventoryPath: './inventory.json' // Path to runtime inventory
});
```

## Validation Levels

### Basic Level (7 checks)
Core validation for essential UX consistency:
- SPEC, HONEST, CREATABLE, REACHABILITY, UI, STATE, SCREEN

### Enhanced Level (12 checks)
Comprehensive validation for production readiness:
- All Basic checks plus:
- JTBD, RELATIONS, ROUTES, CTAS, RUNTIME_DETERMINISM

### Strict Level (15 checks)
Full system validation with runtime verification:
- All Enhanced checks plus:
- INVENTORY, DATABASE_VALIDATION, MIGRATION_VALIDATION

## Generated Artifacts

The runner generates the following artifacts in the output directory:

### Diagrams
- **`er.mmd`** - Entity relationship diagram (Mermaid source)
- **`er.svg`** - Entity relationship diagram (rendered)
- **`flow.mmd`** - User flow diagram (Mermaid source)
- **`flow.svg`** - User flow diagram (rendered)

### Reports
- **`gap_report.md`** - Detailed validation report with issues and recommendations
- **`screens.csv`** - Screen inventory with types, roles, and routes
- **`results.junit.xml`** - JUnit format test results for CI/CD
- **`acceptance_criteria.feature`** - Gherkin scenarios for testing

### Example Gap Report

```markdown
# FlowLock Gap Report

## Summary
- Checks Run: 12
- Passed: 10
- Failed: 2

## Issues Found

### Error: Entity 'User' missing required field 'email'
**Location**: entities[0].fields
**Recommendation**: Add email field to User entity

### Warning: Screen 'Dashboard' missing empty state
**Location**: screens[2].states
**Recommendation**: Define empty state message
```

## API Reference

### Runner Class

```javascript
class Runner {
  constructor(options: RunnerOptions);
  
  // Run all configured checks
  async run(): Promise<RunnerResults>;
  
  // Generate artifacts only (no validation)
  async generateArtifacts(): Promise<void>;
  
  // Get current configuration
  getConfig(): RunnerOptions;
}
```

### RunnerOptions

```typescript
interface RunnerOptions {
  spec: UXSpec;              // UX specification
  outDir?: string;           // Output directory (default: 'artifacts')
  fix?: boolean;             // Enable auto-fix (default: false)
  level?: 'basic' | 'enhanced' | 'strict'; // Validation level
  only?: string[];           // Run only these checks
  skip?: string[];           // Skip these checks
  quiet?: boolean;           // Suppress console output
  json?: boolean;            // Output as JSON
  inventoryPath?: string;    // Path to runtime inventory
}
```

### RunnerResults

```typescript
interface RunnerResults {
  passed: boolean;           // All checks passed
  checkCount: number;        // Total checks run
  passCount: number;         // Checks that passed
  issues: Issue[];           // All issues found
  fixedSpec?: UXSpec;        // Fixed specification (if fix: true)
  artifacts: {               // Generated artifact paths
    diagrams: string[];
    reports: string[];
    tests: string[];
  };
}
```

## Diagram Generation

### Entity Relationship Diagram
Shows all entities, fields, and relationships:
- Entity boxes with field lists
- Relationship lines with cardinality
- Primary keys and foreign keys
- Derived and external field indicators

### Flow Diagram
Visualizes user journeys and screen navigation:
- Role-based subgraphs
- Screen nodes with types
- Flow transitions
- CTA navigation paths
- JTBD connections

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run FlowLock Validation
  run: npx flowlock-uxcg audit --level=enhanced --json

- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: artifacts/results.junit.xml
```

### Jenkins

```groovy
stage('Validate UX Spec') {
  steps {
    sh 'npm run flowlock:audit'
    junit 'artifacts/results.junit.xml'
  }
}
```

## Troubleshooting

### Common Issues

**No artifacts generated**
- Ensure output directory is writable
- Check if Mermaid CLI is installed for SVG generation
- Verify spec file is valid JSON

**Checks failing unexpectedly**
- Review the gap report for detailed error messages
- Ensure spec follows the schema
- Try running with `--fix` to auto-correct issues

**Performance issues**
- Use `--only` to run specific checks
- Disable diagram generation if not needed
- Consider using `--quiet` to reduce console output

## Contributing

See the main repository for contribution guidelines.

## License

MIT