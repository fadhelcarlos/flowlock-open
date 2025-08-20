# flowlock-plugin-sdk

Plugin SDK for extending FlowLock with custom validation checks.

## Overview

The plugin SDK allows developers to create custom validation checks that integrate seamlessly with FlowLock's validation system. Plugins can add domain-specific validations, integrate with external systems, or enforce custom business rules.

## Features

- **Simple Plugin API**: Easy-to-use interface for creating custom checks
- **Full Spec Access**: Access to complete UX specification for validation
- **Issue Reporting**: Standardized issue format with severity levels
- **Auto-Fix Support**: Provide automatic fixes for common issues
- **Async Support**: Perform async operations like API calls
- **TypeScript Support**: Full type safety with TypeScript

## Installation

```bash
npm install flowlock-plugin-sdk
```

## Creating a Plugin

### Basic Plugin Structure

```typescript
import { Plugin, PluginContext, Issue } from 'flowlock-plugin-sdk';

export const myPlugin: Plugin = {
  name: 'MY_CUSTOM_CHECK',
  description: 'Validates custom business rules',
  
  async run(context: PluginContext): Promise<Issue[]> {
    const { spec, options } = context;
    const issues: Issue[] = [];
    
    // Perform validation
    spec.entities.forEach(entity => {
      if (!entity.description) {
        issues.push({
          code: 'MISSING_DESCRIPTION',
          severity: 'warning',
          message: `Entity '${entity.id}' is missing a description`,
          path: `entities[${entity.id}]`
        });
      }
    });
    
    return issues;
  }
};
```

### Plugin with Auto-Fix

```typescript
import { Plugin, PluginContext, Issue } from 'flowlock-plugin-sdk';

export const autoFixPlugin: Plugin = {
  name: 'AUTO_FIX_EXAMPLE',
  description: 'Example plugin with auto-fix capability',
  
  async run(context: PluginContext): Promise<Issue[]> {
    const { spec, options } = context;
    const issues: Issue[] = [];
    
    spec.screens.forEach((screen, index) => {
      if (!screen.id) {
        issues.push({
          code: 'MISSING_SCREEN_ID',
          severity: 'error',
          message: `Screen '${screen.name}' is missing an ID`,
          path: `screens[${index}]`,
          fix: {
            description: 'Generate ID from name',
            apply: (spec) => {
              spec.screens[index].id = screen.name
                .toLowerCase()
                .replace(/\s+/g, '-');
              return spec;
            }
          }
        });
      }
    });
    
    return issues;
  }
};
```

### Async Plugin with External Validation

```typescript
import { Plugin, PluginContext, Issue } from 'flowlock-plugin-sdk';
import axios from 'axios';

export const apiValidatorPlugin: Plugin = {
  name: 'API_VALIDATOR',
  description: 'Validates API endpoints exist',
  
  async run(context: PluginContext): Promise<Issue[]> {
    const { spec, options } = context;
    const issues: Issue[] = [];
    const baseUrl = options.apiBaseUrl || 'http://localhost:3000';
    
    // Check each screen's route
    for (const screen of spec.screens) {
      if (screen.route) {
        try {
          // Convert route pattern to test URL
          const testUrl = `${baseUrl}${screen.route.replace(/:[^/]+/g, 'test')}`;
          await axios.head(testUrl);
        } catch (error) {
          issues.push({
            code: 'ROUTE_NOT_FOUND',
            severity: 'error',
            message: `Route '${screen.route}' for screen '${screen.id}' is not accessible`,
            path: `screens[${screen.id}].route`
          });
        }
      }
    }
    
    return issues;
  }
};
```

## Plugin API

### Plugin Interface

```typescript
interface Plugin {
  name: string;              // Unique check name (UPPER_SNAKE_CASE)
  description: string;       // Human-readable description
  run: (context: PluginContext) => Promise<Issue[]>;
  enabled?: boolean;         // Default enabled state
  level?: 'basic' | 'enhanced' | 'strict'; // Validation level
}
```

### PluginContext

```typescript
interface PluginContext {
  spec: UXSpec;              // The UX specification to validate
  options: PluginOptions;    // Plugin-specific options
  helpers: PluginHelpers;    // Utility functions
}

interface PluginOptions {
  fix?: boolean;             // Enable auto-fix
  quiet?: boolean;           // Suppress output
  [key: string]: any;        // Custom options
}

interface PluginHelpers {
  // Get all entity fields including derived
  getEntityFields(entityId: string): Field[];
  
  // Check if field exists in entity
  hasField(entityId: string, fieldId: string): boolean;
  
  // Get all screens for a role
  getScreensForRole(role: string): Screen[];
  
  // Find flows that write to entity
  getFlowsWritingToEntity(entityId: string): Flow[];
  
  // Parse entity.field notation
  parseFieldReference(ref: string): { entity: string; field: string };
}
```

### Issue Interface

```typescript
interface Issue {
  code: string;              // Error code (UPPER_SNAKE_CASE)
  severity: 'error' | 'warning' | 'info';
  message: string;           // Human-readable message
  path?: string;             // JSON path to issue location
  fix?: {                    // Optional auto-fix
    description: string;     // What the fix does
    apply: (spec: UXSpec) => UXSpec; // Function to apply fix
  };
}
```

## Registering Plugins

### In Code

```typescript
import { registerPlugin } from 'flowlock-plugin-sdk';
import { myPlugin } from './my-plugin';

// Register plugin
registerPlugin(myPlugin);

// Run checks with plugin
import { runChecks } from 'flowlock-checks-core';
const results = await runChecks(spec);
```

### Via Configuration

Create a `flowlock.config.json`:

```json
{
  "plugins": [
    "./plugins/my-plugin.js",
    "@company/flowlock-plugin-security",
    {
      "path": "./plugins/api-validator.js",
      "options": {
        "apiBaseUrl": "https://api.example.com"
      }
    }
  ]
}
```

## Best Practices

### 1. Clear Error Messages

```typescript
// Good
`Entity '${entity.id}' field '${field.id}' uses reserved name`

// Bad
`Invalid field name`
```

### 2. Appropriate Severity

- **Error**: Blocks deployment, must be fixed
- **Warning**: Should be fixed but not blocking
- **Info**: Suggestions and best practices

### 3. Precise Path Information

```typescript
// Good - specific path
path: `entities[2].fields[0].type`

// Bad - vague path
path: `entities`
```

### 4. Provide Fixes When Possible

```typescript
fix: {
  description: 'Add missing required field',
  apply: (spec) => {
    spec.entities[index].fields.push({
      id: 'id',
      type: 'string',
      required: true
    });
    return spec;
  }
}
```

### 5. Handle Errors Gracefully

```typescript
async run(context: PluginContext): Promise<Issue[]> {
  try {
    // Validation logic
    return issues;
  } catch (error) {
    return [{
      code: 'PLUGIN_ERROR',
      severity: 'error',
      message: `Plugin failed: ${error.message}`
    }];
  }
}
```

## Example Plugins

### Business Rule Validator

```typescript
export const businessRulePlugin: Plugin = {
  name: 'BUSINESS_RULES',
  description: 'Validates company-specific business rules',
  
  async run(context: PluginContext): Promise<Issue[]> {
    const issues: Issue[] = [];
    const { spec } = context;
    
    // All customer-facing screens must have help text
    spec.screens
      .filter(s => s.role === 'customer')
      .forEach(screen => {
        if (!screen.helpText) {
          issues.push({
            code: 'MISSING_HELP_TEXT',
            severity: 'warning',
            message: `Customer screen '${screen.id}' needs help text`,
            path: `screens[${screen.id}].helpText`
          });
        }
      });
    
    // All forms must have validation rules
    spec.screens.forEach(screen => {
      screen.forms?.forEach(form => {
        if (!form.validation) {
          issues.push({
            code: 'MISSING_VALIDATION',
            severity: 'error',
            message: `Form '${form.id}' needs validation rules`,
            path: `screens[${screen.id}].forms[${form.id}].validation`
          });
        }
      });
    });
    
    return issues;
  }
};
```

### Performance Validator

```typescript
export const performancePlugin: Plugin = {
  name: 'PERFORMANCE',
  description: 'Validates performance best practices',
  
  async run(context: PluginContext): Promise<Issue[]> {
    const issues: Issue[] = [];
    const { spec } = context;
    
    // Warn about lists without pagination
    spec.screens.forEach(screen => {
      screen.lists?.forEach(list => {
        if (!list.paginated) {
          issues.push({
            code: 'UNPAGINATED_LIST',
            severity: 'warning',
            message: `List '${list.id}' should use pagination for performance`,
            path: `screens[${screen.id}].lists[${list.id}].paginated`,
            fix: {
              description: 'Enable pagination with default page size of 20',
              apply: (spec) => {
                const screenIndex = spec.screens.findIndex(s => s.id === screen.id);
                const listIndex = spec.screens[screenIndex].lists.findIndex(l => l.id === list.id);
                spec.screens[screenIndex].lists[listIndex].paginated = true;
                spec.screens[screenIndex].lists[listIndex].pageSize = 20;
                return spec;
              }
            }
          });
        }
      });
    });
    
    return issues;
  }
};
```

## Testing Plugins

```typescript
import { myPlugin } from './my-plugin';
import { createTestContext } from 'flowlock-plugin-sdk/testing';

describe('My Plugin', () => {
  it('should detect missing descriptions', async () => {
    const spec = {
      entities: [
        { id: 'User', fields: [] }
      ],
      screens: [],
      flows: []
    };
    
    const context = createTestContext(spec);
    const issues = await myPlugin.run(context);
    
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('MISSING_DESCRIPTION');
  });
});
```

## Contributing

See the main repository for contribution guidelines.

## License

MIT