# flowlock-checks-core

Core validation checks for FlowLock UX specifications.

## Overview

This package provides the validation engine for FlowLock, implementing 15 comprehensive checks to ensure UX specifications are complete, consistent, and implementable.

## Validation Checks

The checks are organized into three graduated validation levels:

### Basic Level (7 Core Checks)
Essential checks for UX consistency:
- **SPEC** - Validates the JSON structure against the schema
- **HONEST** - Ensures all UI reads have valid data sources
- **CREATABLE** - Verifies all entities can be created through flows
- **REACHABILITY** - Checks all screens are reachable from defined roles
- **UI** - Validates UI structure (forms, lists, etc.)
- **STATE** - Ensures screens have proper UI states (empty, loading, error)
- **SCREEN** - Validates screen configuration and types

### Enhanced Level (+5 Extended Checks)
Comprehensive validation for production readiness:
- **JTBD** - Validates Jobs To Be Done are addressed by flows
- **RELATIONS** - Validates entity relationships and detects circular references
- **ROUTES** - Ensures unique routes with proper formatting
- **CTAS** - Validates navigation CTAs and detects orphaned screens
- **RUNTIME_DETERMINISM** - Ensures consistent runtime behavior

### Strict Level (+3 Runtime Checks)
Full system validation with runtime verification:
- **INVENTORY** - Cross-checks spec against actual database/API implementation
- **DATABASE_VALIDATION** - Validates database schema matches spec entities
- **MIGRATION_VALIDATION** - Ensures migrations are safe and complete

## Installation

```bash
npm install flowlock-checks-core
```

## Usage

### Programmatic API

```javascript
import { runChecks } from 'flowlock-checks-core';
import spec from './uxspec.json';

// Run all checks
const results = await runChecks(spec);

// Run specific checks
const results = await runChecks(spec, {
  only: ['HONEST', 'CREATABLE', 'REACHABILITY']
});

// Skip certain checks
const results = await runChecks(spec, {
  skip: ['INVENTORY', 'DATABASE_VALIDATION']
});

// Run with graduated validation
const results = await runChecks(spec, {
  level: 'enhanced' // 'basic', 'enhanced', or 'strict'
});
```

### Individual Check Usage

```javascript
import { checks } from 'flowlock-checks-core';

// Run a single check
const honestResults = await checks.honest(spec);
const creatableResults = await checks.creatable(spec);

// Check with options
const inventoryResults = await checks.inventory(spec, {
  inventoryPath: './artifacts/runtime_inventory.json'
});
```

## Check Details

### HONEST Check
Validates that all UI reads have valid data sources:
- Fields are either captured in flows or marked as derived/external
- Derived fields have formulas in the glossary
- External fields have sources defined

### CREATABLE Check
Ensures every entity can be created:
- At least one flow writes to each entity
- Required fields are captured
- Creation flows are accessible to appropriate roles

### REACHABILITY Check
Verifies navigation completeness:
- All screens are reachable from role landing pages
- Navigation paths exist through flows and CTAs
- No orphaned screens

### UI Check
Validates UI components:
- Forms have proper field configurations
- Lists specify correct entity bindings
- Cards and CTAs are properly structured

### STATE Check
Ensures robust UI states:
- Screens define empty, loading, and error states
- State messages are user-friendly
- Fallback behaviors are specified

### JTBD Check
Validates Jobs To Be Done:
- All defined jobs have corresponding flows
- Flows properly implement job requirements
- Role assignments are correct

### RELATIONS Check
Validates entity relationships:
- Relationships are bidirectional
- No circular dependencies
- Cardinality is properly defined

### ROUTES Check
Ensures routing consistency:
- Routes are unique across screens
- Dynamic parameters are properly formatted
- URL patterns follow conventions

### INVENTORY Check
Cross-validates against runtime:
- Database entities match spec
- API endpoints align with external data needs
- UI bindings correspond to defined reads/writes

## Auto-Fix Capabilities

Many checks support auto-fixing common issues:

```javascript
import { runChecks } from 'flowlock-checks-core';

const results = await runChecks(spec, {
  fix: true
});

// Fixed spec is available in results
const fixedSpec = results.fixedSpec;
```

Auto-fixable issues include:
- Missing screen IDs (generated from names)
- String roles converted to objects
- Missing UI states added with defaults
- Screen types inferred from names
- Missing top-level roles added

## Result Format

```javascript
{
  passed: boolean,
  checkCount: number,
  passCount: number,
  issues: [
    {
      code: 'MISSING_FIELD',
      severity: 'error',
      message: 'Entity User is missing required field email',
      path: 'entities[0].fields',
      fix: { /* auto-fix details if available */ }
    }
  ],
  fixedSpec: { /* updated spec if fix: true */ }
}
```

## Contributing

See the main repository for contribution guidelines.

## License

MIT