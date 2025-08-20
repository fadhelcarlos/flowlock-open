# FlowLock Troubleshooting Guide

This guide helps you resolve common FlowLock validation errors with specific, actionable solutions.

## Table of Contents
- [Inventory Errors](#inventory-errors)
- [Validation Errors](#validation-errors)
- [Flow & Screen Errors](#flow--screen-errors)
- [Configuration Errors](#configuration-errors)
- [Determinism Errors](#determinism-errors)

## Error Code Reference

Each FlowLock error includes a specific code for quick identification:

| Code Prefix | Category | Example |
|------------|----------|---------|
| INV_xxx | Inventory issues | INV_001: Missing inventory file |
| VAL_xxx | Validation failures | VAL_002: Type mismatch |
| FLW_xxx | Flow problems | FLW_001: Unreachable screen |
| SCR_xxx | Screen issues | SCR_001: Invalid read |
| CFG_xxx | Configuration errors | CFG_001: File not found |
| DET_xxx | Determinism problems | DET_002: Circular dependency |

## Inventory Errors

### INV_001: Runtime inventory file not found

**Error Message:**
```
[INV_001] Runtime inventory file not found
  📍 Location: /path/to/artifacts/runtime_inventory.json
```

**Cause:** FlowLock cannot find the inventory file that maps your spec to your actual implementation.

**Solution:**
1. Generate the inventory file:
   ```bash
   npx flowlock inventory
   ```

2. If using a custom path, set the environment variable:
   ```bash
   export FLOWLOCK_INVENTORY="path/to/your/inventory.json"
   npx flowlock check
   ```

3. Check your `flowlock.config.json` for inventory settings:
   ```json
   {
     "inventory": {
       "output": "artifacts/runtime_inventory.json",
       "db": {
         "schemaFiles": ["prisma/schema.prisma", "src/db/*.sql"]
       },
       "api": {
         "scan": ["src/api/**/*.ts", "src/routes/**/*.js"]
       }
     }
   }
   ```

---

### INV_003: Entity mismatch between spec and database

**Error Message:**
```
[INV_003] Database entity 'UserProfile' not found in inventory
  📍 Location: spec.entities[UserProfile]
  ❌ Expected: Entity 'UserProfile' should exist in database
  ⚠️  Actual: Entity not found in scanned database schema
  💡 Fix: Found similar entities: User, Profile
```

**Cause:** Your spec references an entity that doesn't exist in your database.

**Solutions:**

1. **Fix naming mismatch:**
   ```json
   // In spec.json, change:
   { "id": "UserProfile", ... }
   // To match database:
   { "id": "User", ... }
   ```

2. **Add missing table to database:**
   ```sql
   CREATE TABLE UserProfile (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     bio TEXT
   );
   ```

3. **Update inventory scan configuration:**
   ```json
   {
     "inventory": {
       "db": {
         "schemaFiles": ["add/your/schema/file.sql"]
       }
     }
   }
   ```

---

### INV_004: Field mismatch

**Error Message:**
```
[INV_004] Field 'emailAddress' not found in entity 'User'
  📍 Location: User.emailAddress
  💡 Fix: Found similar fields: email, user_email
```

**Solutions:**

1. **Correct field name in spec:**
   ```json
   // Change from:
   { "id": "emailAddress", "type": "string" }
   // To:
   { "id": "email", "type": "string" }
   ```

2. **Add field to database:**
   ```sql
   ALTER TABLE User ADD COLUMN emailAddress VARCHAR(255);
   ```

3. **Mark as derived field:**
   ```json
   {
     "id": "emailAddress",
     "derived": true,
     "provenance": "Computed from email field"
   }
   ```

4. **Mark as external field:**
   ```json
   {
     "id": "emailAddress",
     "external": true,
     "source": "api/user/profile"
   }
   ```

---

### INV_005: API endpoint mismatch

**Error Message:**
```
[INV_005] API endpoint 'api/users/profile' not found
  📍 Location: User.profileData.source
  💡 Fix: Similar endpoints found:
     api/users
     api/user/details
```

**Solutions:**

1. **Implement missing endpoint:**
   ```typescript
   // Add to your API routes:
   app.get('/api/users/profile', async (req, res) => {
     const profile = await getUserProfile(req.user.id);
     res.json(profile);
   });
   ```

2. **Update field source to existing endpoint:**
   ```json
   {
     "id": "profileData",
     "external": true,
     "source": "api/user/details"  // Use existing endpoint
   }
   ```

3. **Check inventory scanning:**
   ```json
   {
     "inventory": {
       "api": {
         "scan": ["src/**/*.ts", "add/missing/path/*.js"]
       }
     }
   }
   ```

---

### INV_006: UI reads field without provenance

**Error Message:**
```
[INV_006] UI reads field 'Order.totalAmount' without valid provenance
  📍 Location: Screens: CheckoutReview, OrderConfirmation
  💡 Fix: Options:
     1. Add field to entity in spec
     2. Capture in a form before reading
     3. Mark as derived in entity
     4. Mark as external with source
```

**Solutions:**

1. **Add field to entity:**
   ```json
   {
     "id": "Order",
     "fields": [
       { "id": "totalAmount", "type": "decimal" }
     ]
   }
   ```

2. **Capture field in a form:**
   ```json
   {
     "screens": [{
       "id": "checkout",
       "forms": [{
         "entityId": "Order",
         "fields": [
           { "fieldId": "totalAmount" }
         ]
       }]
     }]
   }
   ```

3. **Mark as calculated field:**
   ```json
   {
     "id": "totalAmount",
     "derived": true,
     "provenance": "Sum of OrderItem.price * OrderItem.quantity"
   }
   ```

## Validation Errors

### VAL_001: Missing required field

**Error Message:**
```
[VAL_001] Required field 'userId' is missing
  📍 Location: Order entity
  💡 Fix: Add field with appropriate type
```

**Solution:**
```json
{
  "id": "Order",
  "fields": [
    { "id": "userId", "type": "uuid", "required": true }
  ]
}
```

---

### VAL_002: Type mismatch

**Error Message:**
```
[VAL_002] Type mismatch in Order.quantity
  ❌ Expected: integer
  ⚠️  Actual: string
  💡 Fix: Update field type
```

**Solution:**
```json
// Change from:
{ "id": "quantity", "type": "string" }
// To:
{ "id": "quantity", "type": "integer" }
```

## Flow & Screen Errors

### FLW_001: Unreachable screen

**Error Message:**
```
[FLW_001] Screen 'PaymentSuccess' unreachable in flow 'Checkout'
  📍 Location: Flow: Checkout (checkout-flow)
  💡 Fix: Add a transition from one of these steps: payment-step, review-step
```

**Solution:**
```json
{
  "flows": [{
    "id": "checkout-flow",
    "steps": [{
      "id": "payment-step",
      "next": [{
        "condition": "payment.success",
        "targetStepId": "success-step"  // Add this transition
      }]
    }, {
      "id": "success-step",
      "screenId": "PaymentSuccess"
    }]
  }]
}
```

---

### FLW_004: Flow depth exceeded

**Error Message:**
```
[FLW_004] Flow 'Registration' exceeds max depth 3, actual 7
  📍 Location: Flow: Registration -> Screen: Complete
  💡 Fix: Consider removing intermediate screens or combining steps
```

**Solutions:**

1. **Combine related screens:**
   ```json
   // Instead of: personal-info -> contact-info -> address -> ...
   // Use: profile-setup (combines all info) -> verification -> complete
   ```

2. **Increase max depth in config:**
   ```json
   {
     "checks": {
       "reachability": {
         "maxSteps": 5  // Increase from default 3
       }
     }
   }
   ```

3. **Split into multiple flows:**
   ```json
   // Split registration into:
   // 1. basic-registration-flow (email, password)
   // 2. profile-completion-flow (additional details)
   ```

---

### SCR_001: Screen reads uncaptured field

**Error Message:**
```
[SCR_001] Screen 'ProfileView' reads uncaptured field 'User.lastLogin'
  📍 Location: Screen: ProfileView (profile-view)
  💡 Fix: Field is captured in: LoginFlow. Ensure this screen comes after capture.
```

**Solution:**
```json
{
  "flows": [{
    "id": "profile-flow",
    "steps": [{
      "id": "capture-login",
      "writes": ["User.lastLogin"]  // Capture field first
    }, {
      "id": "show-profile",
      "screenId": "ProfileView"  // Then read it
    }]
  }]
}
```

## Configuration Errors

### CFG_001: Configuration file not found

**Error Message:**
```
[CFG_001] Config file not found
  📍 Location: /project/flowlock.config.json
  💡 Fix: Create file or update path
```

**Solution:**
```bash
# Create default config:
npx flowlock init

# Or create manually:
cat > flowlock.config.json << EOF
{
  "version": "1.0.0",
  "spec": "uxspec.json",
  "checks": {
    "enabled": ["inventory", "reachability", "honest-reads"]
  }
}
EOF
```

---

### CFG_003: Missing required configuration

**Error Message:**
```
[CFG_003] Missing required config 'spec'
  📍 Location: flowlock.config.json
  💡 Fix: Add to configuration
```

**Solution:**
```json
{
  "spec": "uxspec.json",  // Add this
  "inventory": { ... }
}
```

## Determinism Errors

### DET_001: Unreachable state

**Error Message:**
```
[DET_001] State 'processing' is unreachable from 'idle'
  📍 Location: State machine: OrderStateMachine
  💡 Fix: Add transition or remove state
```

**Solution:**
```json
{
  "stateMachines": [{
    "id": "OrderStateMachine",
    "transitions": [{
      "from": "idle",
      "to": "processing",
      "event": "START_PROCESSING"  // Add this transition
    }]
  }]
}
```

---

### DET_002: Circular dependency

**Error Message:**
```
[DET_002] Circular dependency detected: A -> B -> C -> A
  💡 Fix: Break cycle by removing one dependency
```

**Solution:**
```json
// Remove one dependency to break the cycle:
{
  "steps": [{
    "id": "A",
    "dependsOn": ["B"]  // Remove dependency on C
  }, {
    "id": "B",
    "dependsOn": ["C"]
  }, {
    "id": "C",
    "dependsOn": []  // Remove dependency on A
  }]
}
```

## Best Practices

### 1. Run checks frequently
```bash
# During development:
npx flowlock check --watch

# Before commits:
npx flowlock check --strict
```

### 2. Keep inventory updated
```bash
# After database changes:
npx flowlock inventory --update

# In CI/CD:
npx flowlock inventory && npx flowlock check
```

### 3. Use meaningful names
- Match entity/field names between spec and implementation
- Use consistent casing (camelCase vs snake_case)
- Avoid abbreviations that differ between layers

### 4. Document external dependencies
```json
{
  "fields": [{
    "id": "userData",
    "external": true,
    "source": "api/external/user",
    "description": "Fetched from external user service"
  }]
}
```

### 5. Progressive validation
Start with basic checks and gradually enable stricter ones:
```json
{
  "checks": {
    "enabled": ["inventory"],  // Start here
    "pending": ["reachability", "honest-reads"],  // Add these next
    "strict": ["determinism", "state-machine"]  // Finally these
  }
}
```

## Getting Help

1. **Check error details:** Each error includes specific context and suggestions
2. **Review documentation:** https://flowlock.dev/docs
3. **Enable verbose logging:**
   ```bash
   DEBUG=flowlock:* npx flowlock check --verbose
   ```
4. **Report issues:** https://github.com/flowlock/flowlock/issues

## Common Patterns

### Pattern: Form -> Process -> Display
```json
{
  "flows": [{
    "steps": [
      { "id": "capture", "writes": ["Entity.field"] },
      { "id": "process", "transitions": [...] },
      { "id": "display", "reads": ["Entity.field"] }
    ]
  }]
}
```

### Pattern: External data integration
```json
{
  "entities": [{
    "fields": [{
      "id": "externalData",
      "external": true,
      "source": "api/service/endpoint",
      "cache": "5m"
    }]
  }]
}
```

### Pattern: Calculated fields
```json
{
  "entities": [{
    "fields": [{
      "id": "total",
      "derived": true,
      "provenance": "sum(items.price * items.quantity)",
      "dependencies": ["items"]
    }]
  }]
}
```