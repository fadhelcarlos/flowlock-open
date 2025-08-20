# Flowlock Inventory

The inventory system automatically discovers and validates your runtime infrastructure (database schema, API endpoints, UI components) and cross-checks it against your UX specification for consistency.

## Table of Contents
- [Overview](#overview)
- [Configuration](#configuration)
- [Inventory Schema](#inventory-schema)
- [Usage](#usage)
- [Examples](#examples)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)

## Overview

The inventory system serves three main purposes:
1. **Discovery**: Automatically discovers database entities, API endpoints, and UI components from your codebase
2. **Validation**: Ensures your runtime inventory matches your UX specification
3. **Documentation**: Provides a single source of truth for your application's data structure

### Key Concepts

- **Spec Entities**: Business domain models defined in `uxspec.json` that describe your data structure
- **Runtime Inventory**: Actual implementation discovered from your database schema, API code, and UI components
- **Provenance**: The origin of data (captured from user, derived via calculation, or external from APIs)

## Configuration

Configure inventory discovery in your `flowlock.config.json`:

```json
{
  "$schema": "https://schema.flowlock.dev/config.v1.json",
  "projectName": "your-project",
  "inventory": {
    "db": {
      "mode": "auto",              // "schema" | "live" | "auto"
      "dialect": "postgres",       // "postgres" | "mysql" | "sqlite"
      "urlEnv": "DATABASE_URL",    // Environment variable with DB connection
      "schemaFiles": [             // Schema files to scan
        "prisma/schema.prisma",
        "src/db/schema.ts",
        "src/entities/**/*.entity.ts"
      ]
    },
    "api": {
      "scan": [                    // Glob patterns for API endpoints
        "app/api/**/route.ts{,x}",       // Next.js App Router
        "src/**/*.controller.ts",         // NestJS
        "src/routes/**/*.ts",             // Express
        "openapi.{yml,yaml,json}"        // OpenAPI spec
      ],
      "jsdoc": true,               // Parse JSDoc annotations
      "openapiPrefer": true        // Prefer OpenAPI over code scanning
    },
    "ui": {
      "scan": [                    // UI files to scan
        "app/**/*.{tsx,jsx}",
        "src/components/**/*.{tsx,jsx}"
      ],
      "readAttribute": "data-fl-read",   // Attribute for read bindings
      "writeAttribute": "data-fl-write"  // Attribute for write bindings
    }
  }
}
```

### Configuration Options

#### Database (`inventory.db`)

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `mode` | `"schema" \| "live" \| "auto"` | Discovery mode | `"auto"` |
| `dialect` | `"postgres" \| "mysql" \| "sqlite"` | Database type | `"postgres"` |
| `urlEnv` | `string` | Environment variable containing DB connection string | `"DATABASE_URL"` |
| `schemaFiles` | `string[]` | Paths to schema files (Prisma, TypeORM, etc.) | `[]` |

**Modes**:
- `schema`: Only scan schema files (offline)
- `live`: Only introspect live database
- `auto`: Try schema files first, fall back to live DB if no entities found

#### API (`inventory.api`)

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `scan` | `string[]` | Glob patterns for API files | `[]` |
| `jsdoc` | `boolean` | Parse JSDoc `@flowlock` annotations | `true` |
| `openapiPrefer` | `boolean` | Prefer OpenAPI spec over code scanning | `true` |

#### UI (`inventory.ui`)

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `scan` | `string[]` | Glob patterns for UI component files | `[]` |
| `readAttribute` | `string` | HTML attribute for read bindings | `"data-fl-read"` |
| `writeAttribute` | `string` | HTML attribute for write bindings | `"data-fl-write"` |

## Inventory Schema

The generated `artifacts/runtime_inventory.json` file contains:

```typescript
type RuntimeInventory = {
  // Database entities discovered from schema/introspection
  db: {
    dialect?: "postgres" | "mysql" | "sqlite";
    entities: Array<{
      id: string;        // Entity name (e.g., "User", "Product")
      fields: Array<{
        id: string;      // Field name (e.g., "email", "createdAt")
        type?: string;   // Database type (e.g., "varchar", "timestamp")
      }>;
    }>;
  };
  
  // API endpoints discovered from code/OpenAPI
  api: {
    endpoints: Array<{
      path: string;      // Endpoint path (e.g., "/api/users")
      methods: string[]; // HTTP methods (e.g., ["GET", "POST"])
      returns?: {        // Optional return type info
        entity: string;  // Entity name
        fields: string[]; // Field names returned
      };
    }>;
  };
  
  // UI data bindings discovered from components
  ui: {
    reads: string[];     // Fields read by UI (e.g., ["User.name", "Product.price"])
    writes: string[];    // Fields written by UI (e.g., ["User.email", "Order.status"])
  };
};
```

## Usage

### 1. Generate Inventory

```bash
# Using npm
npm run flowlock inventory

# Using npx
npx flowlock inventory

# With custom config
npx flowlock inventory --config custom-config.json

# Output to custom location
npx flowlock inventory --output custom-inventory.json
```

### 2. Validate Against Spec

```bash
# Run audit to check inventory matches spec
npx flowlock audit

# Specific checks
npx flowlock audit --checks INVENTORY
```

## Examples

### Example 1: Prisma Schema

**Schema File** (`prisma/schema.prisma`):
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
}

enum Role {
  USER
  ADMIN
}
```

**Generated Inventory**:
```json
{
  "db": {
    "dialect": "postgres",
    "entities": [
      {
        "id": "User",
        "fields": [
          { "id": "id", "type": "String" },
          { "id": "email", "type": "String" },
          { "id": "name", "type": "String" },
          { "id": "role", "type": "Role" },
          { "id": "createdAt", "type": "DateTime" }
        ]
      },
      {
        "id": "Post",
        "fields": [
          { "id": "id", "type": "String" },
          { "id": "title", "type": "String" },
          { "id": "content", "type": "String?" },
          { "id": "published", "type": "Boolean" },
          { "id": "authorId", "type": "String" }
        ]
      }
    ]
  }
}
```

### Example 2: Next.js API Routes

**API Route** (`app/api/users/route.ts`):
```typescript
/**
 * @flowlock returns User {id,email,name,role}
 */
export async function GET() {
  const users = await db.user.findMany();
  return Response.json(users);
}

export async function POST(request: Request) {
  const data = await request.json();
  const user = await db.user.create({ data });
  return Response.json(user);
}
```

**Generated Inventory**:
```json
{
  "api": {
    "endpoints": [
      {
        "path": "/api/users",
        "methods": ["GET", "POST"],
        "returns": {
          "entity": "User",
          "fields": ["id", "email", "name", "role"]
        }
      }
    ]
  }
}
```

### Example 3: React Components with Data Bindings

**Component** (`app/components/UserProfile.tsx`):
```tsx
export function UserProfile({ userId }: { userId: string }) {
  return (
    <div>
      <h1 data-fl-read="User.name">John Doe</h1>
      <p data-fl-read="User.email">john@example.com</p>
      <input 
        data-fl-write="User.bio"
        placeholder="Tell us about yourself"
      />
    </div>
  );
}
```

**Generated Inventory**:
```json
{
  "ui": {
    "reads": ["User.name", "User.email"],
    "writes": ["User.bio"]
  }
}
```

### Example 4: TypeORM Entities

**Entity** (`src/entities/Product.entity.ts`):
```typescript
@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  inStock: boolean;
}
```

**Generated Inventory**:
```json
{
  "db": {
    "dialect": "postgres",
    "entities": [
      {
        "id": "Product",
        "fields": [
          { "id": "id", "type": "unknown" },
          { "id": "name", "type": "unknown" },
          { "id": "price", "type": "unknown" },
          { "id": "description", "type": "unknown" },
          { "id": "inStock", "type": "unknown" }
        ]
      }
    ]
  }
}
```

## How It Works

### 1. Database Discovery

The system discovers database entities through two methods:

**Schema Scanning** (Offline):
- Parses Prisma schema files (`.prisma`)
- Scans TypeORM/Sequelize entity files
- Extracts model names and field definitions
- Works without database connection

**Live Introspection** (Online):
- Connects to running database
- Queries information schema
- Gets actual table and column information
- Provides accurate type information

### 2. API Discovery

The system discovers API endpoints through:

**OpenAPI Specification** (Preferred):
- Parses OpenAPI/Swagger files
- Extracts paths, methods, and response schemas
- Provides complete type information

**Code Scanning**:
- Scans Next.js API routes
- Detects Express/Fastify/NestJS endpoints
- Parses JSDoc `@flowlock` annotations
- Infers HTTP methods from code patterns

### 3. UI Discovery

The system discovers UI data bindings by:

- Scanning component files for data attributes
- Extracting `data-fl-read` attributes for read operations
- Extracting `data-fl-write` attributes for write operations
- Mapping to Entity.field format

### 4. Validation

The inventory check validates:

1. **Schema Structure**: Ensures inventory.json has correct format
2. **Entity Coverage**: All spec entities exist in database
3. **Field Coverage**: All non-derived/non-external fields exist
4. **API Coverage**: External fields have corresponding endpoints
5. **UI Provenance**: All UI reads have valid data sources

## Troubleshooting

### Common Issues

#### "Missing artifacts/runtime_inventory.json"
**Solution**: Run `npx flowlock inventory` before running audit

#### "DB model missing for spec entity 'X'"
**Causes**:
- Entity defined in spec but not in database
- Schema file not included in `schemaFiles` config
- Entity name mismatch (case-sensitive)

**Solution**:
1. Check entity exists in database/schema
2. Verify `schemaFiles` includes your schema
3. Ensure entity names match exactly

#### "DB column missing for 'Entity.field'"
**Causes**:
- Field defined in spec but not in database
- Field marked incorrectly (should be `derived` or `external`)

**Solution**:
1. Add missing field to database schema
2. Or mark field as `derived: true` or `external: true` in spec

#### "UI read 'X.y' has no provenance"
**Causes**:
- UI reads field not defined in spec
- Field not captured in any flow
- Missing derived/external annotation

**Solution**:
1. Add field to entity in spec
2. Or add to glossary as derived field
3. Or capture in a flow's `writes` array

### Debugging Tips

1. **Verbose Output**: Set `DEBUG=flowlock:*` environment variable
2. **Check Generated Inventory**: Examine `artifacts/runtime_inventory.json`
3. **Validate Config**: Ensure glob patterns match your project structure
4. **Test Patterns**: Use `npx glob-test "your/pattern/**/*.ts"` to test globs

### Best Practices

1. **Keep Spec and Code in Sync**: Update spec when adding new entities/fields
2. **Use Consistent Naming**: Match entity/field names between spec and code
3. **Annotate External Data**: Mark external fields with `source` property
4. **Document Derived Fields**: Add derived fields to glossary
5. **Track UI Bindings**: Use data attributes consistently in components
6. **Version Control**: Commit `runtime_inventory.json` for tracking changes

## API Reference

### CLI Commands

```bash
# Generate inventory
flowlock inventory [options]
  --config <path>    Config file path (default: flowlock.config.json)
  --output <path>    Output file path (default: artifacts/runtime_inventory.json)
  --verbose          Show detailed output

# Validate inventory
flowlock audit --checks INVENTORY
```

### Programmatic Usage

```typescript
import { buildInventory } from 'flowlock-inventory';

// Generate inventory
const inventoryPath = await buildInventory(
  'flowlock.config.json',  // Config path
  'artifacts/runtime_inventory.json'  // Output path
);

// Load and use inventory
import inventory from './artifacts/runtime_inventory.json';

// Access entities
inventory.db.entities.forEach(entity => {
  console.log(`Entity: ${entity.id}`);
  entity.fields.forEach(field => {
    console.log(`  - ${field.id}: ${field.type}`);
  });
});
```

## Related Documentation

- [UX Specification Guide](../uxspec/README.md) - Learn about spec entities and fields
- [Audit Checks](../checks-core/README.md) - Understand validation rules
- [Configuration](../cli/README.md#configuration) - Full config options