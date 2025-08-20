# flowlock-uxspec

UX specification schema and TypeScript types for FlowLock.

## Overview

This package defines the complete schema for FlowLock UX specifications, providing TypeScript types and JSON schema validation. It supports comprehensive UX modeling including entities, screens, flows, UI components, and validation rules.

## Features

- **Complete Type Definitions**: Full TypeScript types for all spec elements
- **JSON Schema Validation**: Strict schema validation for spec files
- **Comprehensive Coverage**: Supports entities, screens, flows, JTBD, relations, routes, and more
- **Backward Compatibility**: Works with existing specs while supporting new features

## Installation

```bash
npm install flowlock-uxspec
```

## Schema Structure

### Top-Level Structure

```typescript
interface UXSpec {
  entities: Entity[];           // Data models
  screens: Screen[];           // UI screens
  flows: Flow[];               // User workflows
  roles?: Role[];              // User roles
  jtbd?: JTBD[];              // Jobs To Be Done
  glossary?: GlossaryItem[];  // Derived fields
  stateMachines?: StateMachine[]; // State transitions
}
```

### Entities

Define your data models with fields and relationships:

```json
{
  "entities": [
    {
      "id": "User",
      "fields": [
        { "id": "email", "type": "string", "required": true },
        { "id": "name", "type": "string" },
        { "id": "role", "type": "enum", "values": ["admin", "user"] },
        { "id": "createdAt", "type": "datetime", "derived": true }
      ],
      "relations": [
        {
          "entity": "Post",
          "type": "1:many",
          "field": "posts"
        }
      ]
    }
  ]
}
```

### Screens

Define UI screens with components and navigation:

```json
{
  "screens": [
    {
      "id": "user-profile",
      "name": "User Profile",
      "type": "detail",
      "route": "/users/:id",
      "role": "authenticated",
      "forms": [
        {
          "id": "edit-profile",
          "entity": "User",
          "writes": ["name", "email", "bio"]
        }
      ],
      "lists": [
        {
          "id": "user-posts",
          "entity": "Post",
          "reads": ["title", "createdAt", "status"],
          "sortable": true,
          "filterable": ["status"],
          "paginated": true
        }
      ],
      "cards": [
        {
          "id": "user-stats",
          "title": "Statistics",
          "reads": ["User.postCount", "User.followerCount"]
        }
      ],
      "ctas": [
        {
          "id": "edit-profile",
          "label": "Edit Profile",
          "type": "primary",
          "target": "edit-profile-screen"
        }
      ],
      "states": {
        "empty": "No user data available",
        "loading": "Loading user profile...",
        "error": "Failed to load user profile"
      }
    }
  ]
}
```

### Flows

Define user workflows and data operations:

```json
{
  "flows": [
    {
      "id": "user-registration",
      "name": "User Registration",
      "description": "New user sign-up process",
      "steps": [
        {
          "screen": "registration-form",
          "action": "fill-form",
          "writes": ["User.email", "User.password", "User.name"]
        },
        {
          "screen": "email-verification",
          "action": "verify-email"
        },
        {
          "screen": "welcome",
          "action": "complete"
        }
      ],
      "jtbd": "create-account"
    }
  ]
}
```

### Jobs To Be Done (JTBD)

Define user goals and link them to flows:

```json
{
  "jtbd": [
    {
      "id": "manage-content",
      "role": "admin",
      "tasks": [
        "Create and publish posts",
        "Moderate user comments",
        "Review content analytics"
      ],
      "description": "Admin needs to manage all content on the platform"
    }
  ]
}
```

### Relations

Define relationships between entities:

```json
{
  "entities": [
    {
      "id": "User",
      "relations": [
        {
          "entity": "Post",
          "type": "1:many",
          "field": "posts",
          "inverse": "author"
        }
      ]
    },
    {
      "id": "Post",
      "relations": [
        {
          "entity": "User",
          "type": "many:1",
          "field": "author",
          "inverse": "posts"
        }
      ]
    }
  ]
}
```

### Glossary

Document derived and calculated fields:

```json
{
  "glossary": [
    {
      "field": "User.fullName",
      "formula": "firstName + ' ' + lastName",
      "description": "Concatenated full name"
    },
    {
      "field": "Product.totalPrice",
      "formula": "price * quantity * (1 + taxRate)",
      "description": "Total price including tax"
    },
    {
      "field": "User.creditScore",
      "source": "Experian API",
      "external": true,
      "description": "External credit score"
    }
  ]
}
```

## TypeScript Usage

```typescript
import { UXSpec, Entity, Screen, Flow } from 'flowlock-uxspec';

// Type-safe spec creation
const spec: UXSpec = {
  entities: [
    {
      id: 'User',
      fields: [
        { id: 'email', type: 'string', required: true },
        { id: 'name', type: 'string' }
      ]
    }
  ],
  screens: [
    {
      id: 'user-list',
      name: 'User List',
      type: 'list'
    }
  ],
  flows: []
};

// Validate spec
import { validateSpec } from 'flowlock-uxspec';

const result = validateSpec(spec);
if (result.valid) {
  console.log('Spec is valid!');
} else {
  console.error('Validation errors:', result.errors);
}
```

## Field Types

Supported field types for entities:

- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `date` - Date only
- `datetime` - Date and time
- `enum` - Enumerated values (requires `values` array)
- `json` - JSON objects
- `array` - Arrays (specify `items` type)

## Field Modifiers

- `required: true` - Field must be provided
- `derived: true` - Calculated field (formula in glossary)
- `external: true` - Data from external source
- `unique: true` - Must be unique across entity

## Screen Types

- `list` - Table/grid view of multiple records
- `detail` - Single record view
- `form` - Data entry/edit screen
- `dashboard` - Overview with multiple components
- `landing` - Entry point for role
- `modal` - Popup/overlay screen
- `wizard` - Multi-step process

## Validation Rules

The schema enforces:

1. **Unique IDs**: All entities, screens, and flows must have unique IDs
2. **Valid References**: Screen references in flows must exist
3. **Role Consistency**: Screens must have valid role assignments
4. **Field References**: UI reads/writes must reference valid entity fields
5. **Relationship Integrity**: Relations must be bidirectional
6. **Route Uniqueness**: No duplicate routes across screens
7. **JTBD Coverage**: All jobs must have implementing flows

## Migration from v2

To upgrade existing specs:

1. Convert string roles to objects
2. Add relations to entities
3. Enhance forms with detailed write specifications
4. Add cards, lists, and CTAs to screens
5. Define routes for screens
6. Add JTBD array
7. Document derived fields in glossary

## Contributing

See the main repository for contribution guidelines.

## License

MIT