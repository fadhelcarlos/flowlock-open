# FlowLock Migration Guide

## Entity Reference Field Naming Convention

### Overview
FlowLock supports both `entity` and `entityId` field names for backward compatibility. This flexibility allows existing specifications to continue working while encouraging migration to the simpler `entity` convention.

### Current Support
As of FlowLock v1.0.0, the following components support both field names:

#### Screens
```json
// Both formats are valid:
{
  "id": "user-detail",
  "type": "detail",
  "entity": "user"  // Preferred
}

{
  "id": "user-detail", 
  "type": "detail",
  "entityId": "user"  // Still supported
}
```

#### Forms
```json
// Both formats are valid:
{
  "id": "user-form",
  "entity": "user",  // Preferred
  "fields": [...]
}

{
  "id": "user-form",
  "entityId": "user",  // Still supported
  "fields": [...]
}
```

#### Cards and Lists
```json
// Both formats are valid:
{
  "id": "user-card",
  "entity": "user",  // Preferred
  "reads": ["user.name"]
}

{
  "id": "user-list",
  "entityId": "user",  // Still supported
  "reads": ["user.name"]
}
```

### Migration Strategy

#### Step 1: Audit Current Usage
Use the following command to identify all uses of `entityId` in your specification:
```bash
grep -n '"entityId"' uxspec.json
```

#### Step 2: Gradual Migration
Both field names will continue to work, so you can migrate incrementally:

1. **New Components**: Always use `entity` for new screens, forms, cards, and lists
2. **Updates**: When updating existing components, switch from `entityId` to `entity`
3. **Bulk Migration**: Use the provided migration script (see below)

#### Step 3: Validation
After migration, run the FlowLock validation to ensure everything works:
```bash
npx flowlock validate
```

### Migration Script
To automatically migrate all `entityId` references to `entity`:

```javascript
// migrate-entity-fields.js
const fs = require('fs');

function migrateSpec(specPath) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  
  // Migrate screens
  if (spec.screens) {
    spec.screens = spec.screens.map(screen => {
      if (screen.entityId && !screen.entity) {
        screen.entity = screen.entityId;
        delete screen.entityId;
      }
      return screen;
    });
  }
  
  // Migrate forms within screens
  if (spec.screens) {
    spec.screens = spec.screens.map(screen => {
      if (screen.forms) {
        screen.forms = screen.forms.map(form => {
          if (form.entityId && !form.entity) {
            form.entity = form.entityId;
            delete form.entityId;
          }
          return form;
        });
      }
      return screen;
    });
  }
  
  // Migrate cards and lists
  if (spec.screens) {
    spec.screens = spec.screens.map(screen => {
      ['cards', 'lists'].forEach(componentType => {
        if (screen[componentType]) {
          screen[componentType] = screen[componentType].map(component => {
            if (component.entityId && !component.entity) {
              component.entity = component.entityId;
              delete component.entityId;
            }
            return component;
          });
        }
      });
      return screen;
    });
  }
  
  // Save migrated spec
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log(`✅ Migration complete: ${specPath}`);
}

// Run migration
migrateSpec('./uxspec.json');
```

### Best Practices

#### Recommended (using `entity`)
```json
{
  "screens": [
    {
      "id": "product-list",
      "type": "list",
      "entity": "product",
      "forms": [
        {
          "id": "product-filter",
          "entity": "product",
          "type": "read"
        }
      ]
    }
  ]
}
```

#### Still Supported (using `entityId`)
```json
{
  "screens": [
    {
      "id": "product-list",
      "type": "list",
      "entityId": "product",
      "forms": [
        {
          "id": "product-filter",
          "entityId": "product",
          "type": "read"
        }
      ]
    }
  ]
}
```

### Priority Resolution
If both `entity` and `entityId` are present (not recommended), FlowLock will use `entity` as the authoritative value:

```json
{
  "entity": "user",      // This value will be used
  "entityId": "product"  // This will be ignored
}
```

### Validation Rules
The FlowLock validation system will:
1. Accept both `entity` and `entityId` field names
2. Prefer `entity` when both are present
3. Generate warnings (not errors) for specs using `entityId` to encourage migration
4. Ensure all checks work correctly with either naming convention

### Timeline
- **Current**: Both `entity` and `entityId` are fully supported
- **Future**: `entityId` will remain supported for backward compatibility
- **Recommendation**: Use `entity` for all new development

### Support
If you encounter any issues during migration:
1. Check the validation output: `npx flowlock validate`
2. Review the troubleshooting guide: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Report issues: https://github.com/flowlock/flowlock/issues