# Inventory Examples

This directory contains example inventory files and configurations to help you understand the inventory system.

## Files

### `basic-inventory.json`
A simple example showing the basic structure of an inventory file with users, products, and orders.

### `ecommerce-inventory.json`
A comprehensive e-commerce example with:
- Complete user management entities
- Product catalog with categories
- Shopping cart system
- Order processing
- Payment tracking
- Address management

### `minimal-inventory.json`
The absolute minimum viable inventory for a simple todo app using SQLite.

### `config-example.json`
A complete `flowlock.config.json` example showing all inventory configuration options with common patterns for:
- Multiple schema file locations
- Various API framework patterns
- Component scanning patterns

## Usage

### 1. As Reference
Use these files to understand the expected structure when:
- Setting up a new project
- Debugging inventory generation issues
- Understanding the relationship between spec and inventory

### 2. For Testing
You can use these inventory files to test the audit system:

```bash
# Copy an example inventory to your project
cp examples/basic-inventory.json ../../artifacts/runtime_inventory.json

# Run audit against it
npx flowlock audit
```

### 3. As Templates
Copy and modify these files for your project:

```bash
# Use the config example as a starting point
cp examples/config-example.json ../../../flowlock.config.json

# Customize for your project structure
```

## Key Concepts Demonstrated

### Entity-Field Structure
Each entity has an ID and fields array:
```json
{
  "id": "User",
  "fields": [
    { "id": "email", "type": "varchar" },
    { "id": "name", "type": "varchar" }
  ]
}
```

### API Endpoint Format
Endpoints include path, methods, and optional return type:
```json
{
  "path": "/api/users",
  "methods": ["GET", "POST"],
  "returns": {
    "entity": "User",
    "fields": ["id", "email", "name"]
  }
}
```

### UI Bindings
UI reads and writes use Entity.field notation:
```json
{
  "reads": ["User.name", "Product.price"],
  "writes": ["User.email", "Order.status"]
}
```

## Common Patterns

### Database Dialects
- `postgres`: Most common, full type information
- `mysql`: Similar to postgres
- `sqlite`: Simpler types (INTEGER, TEXT, REAL)

### Schema Discovery Modes
- `auto`: Try schema files first, fall back to live DB
- `schema`: Only use schema files (offline mode)
- `live`: Only introspect live database

### API Patterns
- Next.js: `app/api/**/route.ts`
- Express: `src/routes/**/*.ts`
- NestJS: `src/**/*.controller.ts`
- OpenAPI: `openapi.{yml,yaml,json}`

### UI Patterns
- React: `**/*.tsx`, `**/*.jsx`
- Data attributes: `data-fl-read`, `data-fl-write`

## Troubleshooting

If your generated inventory doesn't match expectations:

1. **Check glob patterns**: Ensure your scan patterns match your file structure
2. **Verify schema files**: Confirm schema files exist and are readable
3. **Test database connection**: For live mode, ensure DATABASE_URL is set
4. **Examine data attributes**: Check that UI components have proper data-fl-* attributes
5. **Review API annotations**: Ensure @flowlock JSDoc comments are properly formatted