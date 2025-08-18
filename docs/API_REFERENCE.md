# FlowLock API Reference

## Table of Contents
- [flowlock-uxspec API](#flowlock-uxspec-api)
- [flowlock-runner API](#flowlock-runner-api)
- [flowlock-checks-core API](#flowlock-checks-core-api)
- [flowlock-plugin-sdk API](#flowlock-plugin-sdk-api)
- [Creating Custom Checks](#creating-custom-checks)
- [Programmatic Usage Examples](#programmatic-usage-examples)

---

## flowlock-uxspec API

### parseSpec(json: unknown): UXSpec
Parses and validates a UX specification from JSON.

```typescript
import { parseSpec } from 'flowlock-uxspec';

try {
  const spec = parseSpec(jsonData);
  console.log('Valid spec:', spec.name);
} catch (error) {
  if (error instanceof ParseError) {
    console.error('Validation failed:', error.details);
  }
}
```

### Schema Exports

#### UXSpecSchema
Zod schema for complete specification validation.

```typescript
import { UXSpecSchema } from 'flowlock-uxspec';
import { z } from 'zod';

// Validate data
const result = UXSpecSchema.safeParse(data);
if (result.success) {
  const spec = result.data;
}
```

#### Individual Schemas
```typescript
import {
  RoleSchema,
  EntitySchema,
  FieldSchema,
  ScreenSchema,
  FlowSchema,
  PolicySchema
} from 'flowlock-uxspec';
```

### Type Definitions

```typescript
import type {
  UXSpec,
  Role,
  Entity,
  Field,
  Screen,
  Flow,
  FlowStep,
  Form,
  FormField,
  Policy
} from 'flowlock-uxspec';

// Use in your code
const mySpec: UXSpec = {
  version: "1.0.0",
  name: "My App",
  entities: [],
  screens: [],
  flows: []
};
```

---

## flowlock-runner API

### Class: Runner

#### Constructor
```typescript
new Runner(config: RunnerConfig)
```

**RunnerConfig:**
```typescript
interface RunnerConfig {
  spec?: UXSpec;           // Spec object
  specPath?: string;       // Path to spec file (use fromFile instead)
  outputDir?: string;      // Output directory for artifacts
  checks?: FlowlockCheck[]; // Custom checks (default: coreChecks)
  config?: Record<string, unknown>; // Additional configuration
}
```

#### Static Methods

##### Runner.fromFile(specPath: string, config?: RunnerConfig): Promise<Runner>
Creates a Runner instance from a spec file.

```typescript
const runner = await Runner.fromFile('uxspec.json', {
  outputDir: 'my-artifacts',
  checks: customChecks
});
```

#### Instance Methods

##### run(): Promise<RunnerResult>
Executes all checks and generates artifacts in memory.

```typescript
const result = await runner.run();
console.log('Check results:', result.checkResults);
console.log('ER Diagram:', result.artifacts.erDiagram);
```

**RunnerResult:**
```typescript
interface RunnerResult {
  checkResults: CheckResult[];
  artifacts: {
    erDiagram: string;    // Mermaid ER diagram
    flowDiagram: string;  // Mermaid flow diagram
    screensCSV: string;   // CSV screen inventory
    junitXML: string;     // JUnit XML results
  };
}
```

##### runAndSave(outputDir?: string): Promise<RunnerResult>
Executes checks and saves artifacts to disk.

```typescript
const result = await runner.runAndSave('artifacts');
// Files created:
// - artifacts/er.mmd, er.svg
// - artifacts/flow.mmd, flow.svg
// - artifacts/screens.csv
// - artifacts/results.junit.xml
// - artifacts/gap_report.md
// - artifacts/acceptance_criteria.feature
```

### Generator Functions

#### generateERDiagram(spec: UXSpec): string
Generates Mermaid ER diagram from spec.

```typescript
import { generateERDiagram } from 'flowlock-runner';

const mermaidCode = generateERDiagram(spec);
// Returns: "erDiagram\n  User { ... }"
```

#### generateFlowDiagram(spec: UXSpec): string
Generates Mermaid flow diagram from spec.

```typescript
import { generateFlowDiagram } from 'flowlock-runner';

const mermaidCode = generateFlowDiagram(spec);
// Returns: "graph TD\n  screen1[User List] --> ..."
```

#### generateScreensCSV(spec: UXSpec): string
Generates CSV inventory of screens.

```typescript
import { generateScreensCSV } from 'flowlock-runner';

const csv = generateScreensCSV(spec);
// Returns: "ID,Name,Type,Entity,Roles\nuser-list,User List,list,user,admin"
```

#### generateJUnitXML(results: CheckResult[]): string
Generates JUnit XML from check results.

```typescript
import { generateJUnitXML } from 'flowlock-runner';

const xml = generateJUnitXML(checkResults);
// Returns: "<?xml version=\"1.0\"?><testsuites>..."
```

---

## flowlock-checks-core API

### coreChecks: FlowlockCheck[]
Array of all built-in checks.

```typescript
import { coreChecks } from 'flowlock-checks-core';

// Use with runner
const runner = new Runner({
  spec: mySpec,
  checks: coreChecks
});
```

### Individual Check Exports

```typescript
import {
  honestReads,         // or honestReadsCheck
  creatableNeedsDetail, // or creatableNeedsDetailCheck
  reachability,        // or reachabilityCheck
  uiStates,
  stateMachine,
  screen,              // or roleBoundaries (alias)
  coverage
} from 'flowlock-checks-core';

// Run individual check
const results = await honestReads.run(spec);
```

### Check Objects

Each check implements the `FlowlockCheck` interface:

```typescript
interface FlowlockCheck {
  id: string;           // Unique identifier
  name: string;         // Display name
  description: string;  // What it checks
  run(spec: UXSpec): CheckResult | CheckResult[] | Promise<CheckResult | CheckResult[]>;
}
```

Example check properties:
```typescript
honestReadsCheck = {
  id: 'honest_reads',
  name: 'Honest Reads Check',
  description: 'Ensures screens only read properly captured fields',
  run: (spec) => { /* ... */ }
}
```

---

## flowlock-plugin-sdk API

### Types

#### CheckLevel
```typescript
type CheckLevel = 'error' | 'warning' | 'info';
```

#### CheckStatus
```typescript
type CheckStatus = 'pass' | 'fail' | 'skip';
```

#### CheckResult
```typescript
interface CheckResult {
  id: string;           // Unique result ID
  level: CheckLevel;    // Severity level
  status: CheckStatus;  // Pass/fail status
  message: string;      // Human-readable message
  ref?: string;         // Optional reference (e.g., "screen:user-list")
}
```

#### FlowlockCheck
```typescript
interface FlowlockCheck {
  id: string;
  name: string;
  description: string;
  run(spec: UXSpec): CheckResult | CheckResult[] | Promise<CheckResult | CheckResult[]>;
}
```

#### CheckContext
```typescript
interface CheckContext {
  spec: UXSpec;
  config?: Record<string, unknown>;
}
```

---

## Creating Custom Checks

### Basic Check Implementation

```typescript
import type { FlowlockCheck, CheckResult } from 'flowlock-plugin-sdk';
import type { UXSpec } from 'flowlock-uxspec';

export const myCustomCheck: FlowlockCheck = {
  id: 'my_custom_check',
  name: 'My Custom Check',
  description: 'Validates something specific',
  
  run(spec: UXSpec): CheckResult[] {
    const results: CheckResult[] = [];
    
    // Perform validation
    for (const screen of spec.screens) {
      if (/* some condition */) {
        results.push({
          id: `my_check_${screen.id}`,
          level: 'error',
          status: 'fail',
          message: `Screen ${screen.name} has an issue`,
          ref: `screen:${screen.id}`
        });
      }
    }
    
    // Add pass result if no issues
    if (results.length === 0) {
      results.push({
        id: 'my_custom_check',
        level: 'info',
        status: 'pass',
        message: 'All screens pass custom validation'
      });
    }
    
    return results;
  }
};
```

### Async Check Implementation

```typescript
export const asyncCheck: FlowlockCheck = {
  id: 'async_check',
  name: 'Async Validation',
  description: 'Performs async validation',
  
  async run(spec: UXSpec): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    
    // Async operations
    const data = await fetchExternalData();
    
    // Validate against external data
    for (const entity of spec.entities) {
      if (!data.includes(entity.id)) {
        results.push({
          id: `async_${entity.id}`,
          level: 'warning',
          status: 'fail',
          message: `Entity ${entity.name} not found in external system`
        });
      }
    }
    
    return results;
  }
};
```

### Using Custom Checks

```typescript
import { Runner } from 'flowlock-runner';
import { coreChecks } from 'flowlock-checks-core';
import { myCustomCheck, asyncCheck } from './my-checks';

// Combine core and custom checks
const allChecks = [
  ...coreChecks,
  myCustomCheck,
  asyncCheck
];

// Use with runner
const runner = new Runner({
  spec: mySpec,
  checks: allChecks
});

const result = await runner.run();
```

---

## Programmatic Usage Examples

### Example 1: Validate Spec in Code

```typescript
import { parseSpec } from 'flowlock-uxspec';
import { Runner } from 'flowlock-runner';
import * as fs from 'fs';

async function validateProject() {
  // Load and parse spec
  const specJson = JSON.parse(
    fs.readFileSync('uxspec.json', 'utf8')
  );
  
  let spec;
  try {
    spec = parseSpec(specJson);
  } catch (error) {
    console.error('Invalid spec:', error);
    return false;
  }
  
  // Run validation
  const runner = new Runner({ spec });
  const result = await runner.run();
  
  // Check for errors
  const errors = result.checkResults.filter(
    r => r.status === 'fail' && r.level === 'error'
  );
  
  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(e => console.error(`- ${e.message}`));
    return false;
  }
  
  console.log('✅ Validation passed!');
  return true;
}
```

### Example 2: Generate Artifacts Only

```typescript
import { parseSpec } from 'flowlock-uxspec';
import { generateERDiagram, generateFlowDiagram } from 'flowlock-runner';
import * as fs from 'fs';

function generateDiagrams(specPath: string) {
  const spec = parseSpec(
    JSON.parse(fs.readFileSync(specPath, 'utf8'))
  );
  
  const erDiagram = generateERDiagram(spec);
  const flowDiagram = generateFlowDiagram(spec);
  
  fs.writeFileSync('er.mmd', erDiagram);
  fs.writeFileSync('flow.mmd', flowDiagram);
  
  console.log('Diagrams generated!');
}
```

### Example 3: Custom Check Plugin

```typescript
// my-plugin.ts
import type { FlowlockCheck } from 'flowlock-plugin-sdk';

export const checks: FlowlockCheck[] = [
  {
    id: 'naming_convention',
    name: 'Naming Convention',
    description: 'Ensures IDs use kebab-case',
    run(spec) {
      const results = [];
      const regex = /^[a-z]+(-[a-z]+)*$/;
      
      for (const entity of spec.entities) {
        if (!regex.test(entity.id)) {
          results.push({
            id: `naming_${entity.id}`,
            level: 'warning',
            status: 'fail',
            message: `Entity ID '${entity.id}' should use kebab-case`
          });
        }
      }
      
      return results;
    }
  }
];

// Export for use
export default checks;
```

### Example 4: CI/CD Integration

```typescript
// ci-validate.ts
import { Runner } from 'flowlock-runner';
import * as fs from 'fs';

async function ciValidation() {
  const runner = await Runner.fromFile('uxspec.json');
  const result = await runner.runAndSave();
  
  // Write summary for CI
  const summary = {
    total: result.checkResults.length,
    passed: result.checkResults.filter(r => r.status === 'pass').length,
    failed: result.checkResults.filter(r => r.status === 'fail').length,
    errors: result.checkResults.filter(
      r => r.status === 'fail' && r.level === 'error'
    ).length
  };
  
  fs.writeFileSync('validation-summary.json', 
    JSON.stringify(summary, null, 2)
  );
  
  // Exit with error if validation failed
  if (summary.errors > 0) {
    process.exit(1);
  }
}

ciValidation();
```

### Example 5: Watch Mode Implementation

```typescript
import { Runner } from 'flowlock-runner';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

function watchSpec() {
  const watcher = chokidar.watch('uxspec.json');
  
  watcher.on('change', async () => {
    console.log('Spec changed, running validation...');
    
    try {
      const runner = await Runner.fromFile('uxspec.json');
      const result = await runner.run();
      
      const errors = result.checkResults.filter(
        r => r.status === 'fail' && r.level === 'error'
      );
      
      if (errors.length > 0) {
        console.error(`❌ ${errors.length} errors found`);
      } else {
        console.log('✅ Validation passed');
      }
    } catch (error) {
      console.error('Failed to validate:', error);
    }
  });
  
  console.log('Watching uxspec.json for changes...');
}
```

---

## Error Handling

### ParseError
Thrown when spec validation fails.

```typescript
import { ParseError } from 'flowlock-uxspec';

try {
  const spec = parseSpec(data);
} catch (error) {
  if (error instanceof ParseError) {
    console.error('Parse error:', error.message);
    console.error('Details:', error.details);
  }
}
```

### Runner Errors
Runner wraps check errors gracefully.

```typescript
const result = await runner.run();

// Check for check execution errors
const checkErrors = result.checkResults.filter(
  r => r.id.endsWith('_error')
);

if (checkErrors.length > 0) {
  console.error('Some checks failed to execute:');
  checkErrors.forEach(e => console.error(e.message));
}
```

---

## TypeScript Support

All packages include TypeScript definitions. For best experience:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```

Import types explicitly:
```typescript
import type { UXSpec, Screen, Entity } from 'flowlock-uxspec';
import type { CheckResult, FlowlockCheck } from 'flowlock-plugin-sdk';
import type { RunnerConfig, RunnerResult } from 'flowlock-runner';
```

---

*API Reference v0.2.1*
