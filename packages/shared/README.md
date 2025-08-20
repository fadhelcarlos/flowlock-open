# flowlock-shared

Shared utilities and error handling for FlowLock packages.

## Overview

This package provides common functionality used across all FlowLock packages, including standardized error types, utility functions, and shared constants.

## Installation

```bash
npm install flowlock-shared
```

## Features

### Error Types

Standardized error classes for consistent error handling:

```typescript
import { ValidationError, ConfigError, ParseError } from 'flowlock-shared';

// Validation error with context
throw new ValidationError('Invalid entity name', {
  path: 'entities[0].id',
  code: 'INVALID_NAME'
});

// Configuration error
throw new ConfigError('Missing required config file');

// Parse error with line information
throw new ParseError('Invalid JSON', {
  line: 42,
  column: 15
});
```

### Error Codes

Standardized error codes for all validation checks:

```typescript
import { ErrorCodes } from 'flowlock-shared';

const issue = {
  code: ErrorCodes.MISSING_FIELD,
  severity: 'error',
  message: 'Required field missing'
};
```

### Utility Functions

Common utilities for spec manipulation:

```typescript
import { utils } from 'flowlock-shared';

// Parse entity.field notation
const { entity, field } = utils.parseFieldReference('User.email');

// Generate ID from name
const id = utils.generateId('User Profile Screen'); // "user-profile-screen"

// Deep clone objects
const cloned = utils.deepClone(spec);

// Merge specs with conflict resolution
const merged = utils.mergeSpecs(baseSpec, overrides);
```

### Constants

Shared constants and enums:

```typescript
import { CheckNames, Severity, FieldTypes } from 'flowlock-shared';

// All 15 check names
const checks = Object.values(CheckNames);

// Severity levels
const level: Severity = 'error' | 'warning' | 'info';

// Field type validation
const isValid = FieldTypes.includes('string');
```

## API Reference

### Error Classes

```typescript
class ValidationError extends Error {
  constructor(message: string, context?: {
    path?: string;
    code?: string;
    fix?: any;
  });
}

class ConfigError extends Error {
  constructor(message: string, context?: {
    file?: string;
    missing?: string[];
  });
}

class ParseError extends Error {
  constructor(message: string, context?: {
    line?: number;
    column?: number;
    file?: string;
  });
}
```

### Utility Functions

```typescript
// Field reference parsing
function parseFieldReference(ref: string): {
  entity: string;
  field: string;
};

// ID generation
function generateId(name: string): string;

// Deep cloning
function deepClone<T>(obj: T): T;

// Spec merging
function mergeSpecs(base: UXSpec, override: Partial<UXSpec>): UXSpec;

// Path validation
function isValidPath(path: string): boolean;

// Safe JSON parsing
function safeJsonParse(text: string): any | null;
```

### Constants

```typescript
// All 15 check names
enum CheckNames {
  SPEC = 'SPEC',
  HONEST = 'HONEST',
  CREATABLE = 'CREATABLE',
  REACHABILITY = 'REACHABILITY',
  UI = 'UI',
  STATE = 'STATE',
  SCREEN = 'SCREEN',
  JTBD = 'JTBD',
  RELATIONS = 'RELATIONS',
  ROUTES = 'ROUTES',
  CTAS = 'CTAS',
  RUNTIME_DETERMINISM = 'RUNTIME_DETERMINISM',
  INVENTORY = 'INVENTORY',
  DATABASE_VALIDATION = 'DATABASE_VALIDATION',
  MIGRATION_VALIDATION = 'MIGRATION_VALIDATION'
}

// Validation levels
enum ValidationLevel {
  BASIC = 'basic',
  ENHANCED = 'enhanced',
  STRICT = 'strict'
}

// Issue severity
enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// Entity field types
const FieldTypes = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'enum',
  'json',
  'array'
];

// Screen types
const ScreenTypes = [
  'list',
  'detail',
  'form',
  'dashboard',
  'landing',
  'modal',
  'wizard'
];
```

## Usage Examples

### Error Handling

```typescript
import { ValidationError, utils } from 'flowlock-shared';

function validateEntity(entity: Entity) {
  if (!entity.id) {
    throw new ValidationError('Entity missing ID', {
      path: 'entities[0]',
      code: 'MISSING_ID',
      fix: {
        description: 'Generate ID from name',
        value: utils.generateId(entity.name || 'entity')
      }
    });
  }
}
```

### Check Implementation

```typescript
import { CheckNames, Severity, ErrorCodes } from 'flowlock-shared';

export const myCheck = {
  name: CheckNames.HONEST,
  run: (spec) => {
    const issues = [];
    
    // Use standardized error codes
    issues.push({
      code: ErrorCodes.INVALID_REFERENCE,
      severity: Severity.ERROR,
      message: 'Invalid field reference'
    });
    
    return issues;
  }
};
```

### Utility Usage

```typescript
import { utils } from 'flowlock-shared';

// Parse field references in UI reads
const reads = ['User.email', 'User.name', 'Post.title'];
const parsed = reads.map(ref => utils.parseFieldReference(ref));

// Generate consistent IDs
const screens = [
  { name: 'User Profile', id: utils.generateId('User Profile') },
  { name: 'Post List', id: utils.generateId('Post List') }
];

// Safe JSON operations
const config = utils.safeJsonParse(configText);
if (!config) {
  throw new ParseError('Invalid configuration file');
}
```

## Contributing

See the main repository for contribution guidelines.

## License

MIT