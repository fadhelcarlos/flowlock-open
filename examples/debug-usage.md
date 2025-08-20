# Debug Command Usage Examples

This document shows real-world examples of using the FlowLock debug command to troubleshoot common issues.

## Example 1: Debugging CREATABLE Check Failure

### The Problem
Your audit shows:
```
📋 CREATABLE
  ❌ Entity 'product' has a create form but no detail screen
```

### Debug Investigation
```bash
npx flowlock-uxcg debug creatable --entity=product --verbose
```

### Debug Output
```
🔍 Debug Analysis: CREATABLE

What this check validates:
  1. Entities with create forms must have detail screens
  2. Detail screens must be reachable in at least one flow
  3. Detail screen patterns: type='detail' + entity/entityId field

Entity Analysis:

❌ Entity: product (product)
  ✓ Has 1 create form(s):
    - Screen: add-product, Form: new-product-form
  ✗ No detail screens found
  Expected patterns:
    - Screen with type='detail' and entity='product'
    - Screen with type='detail' and entityId='product'
    - Screen with id='product-detail' or 'productDetail'

🔍 Pattern Detection:
  Missing Detail Pattern: 1 entities have create forms but no detail screens
    → Add detail screens for: product
```

### The Fix
Add a detail screen to your ux.json:
```json
{
  "id": "product-detail",
  "type": "detail",
  "entity": "product",
  "displays": [
    {
      "id": "product-info",
      "entityId": "product",
      "type": "detail"
    }
  ]
}
```

## Example 2: Debugging REACHABILITY Issues

### The Problem
```
📋 REACHABILITY
  ❌ Success screen 'checkout-success' requires 5 steps (max: 3) in flow 'purchase'
```

### Debug Investigation
```bash
npx flowlock-uxcg debug reachability --flow=purchase --show-paths
```

### Debug Output
```
🛤️ REACHABILITY CHECK ANALYSIS

❌ Flow: purchase (purchase)
  Entry: cart-review
  Success screens (1):
    - checkout-success: TOO DEEP (5 steps)
      Path: cart-review → shipping-info → payment-info → order-review → confirmation → checkout-success

  Possible fixes:
    1. Combine shipping-info and payment-info into single screen
    2. Remove order-review if not essential
    3. Increase max steps configuration
```

### The Fix
Either simplify the flow or adjust configuration:
```json
// Option 1: Combine steps
{
  "id": "checkout-info",
  "screenId": "checkout-form",
  "next": [
    { "targetStepId": "confirmation" }
  ]
}

// Option 2: Increase max steps in config
{
  "reachability": {
    "maxSteps": 5
  }
}
```

## Example 3: Debugging RELATIONS Issues

### The Problem
```
📋 RELATIONS
  ❌ Relation 'belongs_to_user' references non-existent entity 'users'
```

### Debug Investigation
```bash
npx flowlock-uxcg debug relations --entity=order --show-relations
```

### Debug Output
```
🔗 RELATIONS CHECK ANALYSIS

❌ Entity: order (order)
  Relations:
    - belongs_to_user: many:1 → users [target missing]
      Did you mean: user?
    - has_items: 1:many → order_item ✓

🗺️ Relationship Graph:
  order:
    → users (many:1) [MISSING]
    → order_item (1:many)
  
  user:
    (no outgoing relations)

⚠️ Orphaned entities (no relations):
  - user
```

### The Fix
Update the relation to use correct entity name:
```json
{
  "id": "order",
  "relations": [
    {
      "id": "belongs_to_user",
      "to": "user",  // Changed from "users"
      "kind": "many:1"
    }
  ]
}
```

## Example 4: Debugging UI_STATES Issues

### The Problem
```
📋 UI
  ❌ Screen 'product-list' with data displays should declare loading state
```

### Debug Investigation
```bash
npx flowlock-uxcg debug ui_states --screen=product-list --verbose
```

### Debug Output
```
🎨 UI STATES CHECK ANALYSIS

❌ Screen: product-list
  Type: list
  Required states:
    ✗ loading
    ✗ empty
    ✓ error
  Declared states:
    - error
  
  Reasoning:
    - Has data (displays): needs loading state
    - Has list display: needs empty state
    - Has forms: needs error state
```

### The Fix
Add missing UI states:
```json
{
  "id": "product-list",
  "type": "list",
  "uiStates": ["loading", "empty", "error"],
  "displays": [...]
}
```

## Example 5: Using Pattern Detection

### Command
```bash
npx flowlock-uxcg debug creatable --show-patterns --all
```

### Output Shows System-Wide Issues
```
🔍 Pattern Detection:
  Missing Detail Pattern: 3 entities have create forms but no detail screens
    → Add detail screens for: product, category, supplier
  
  Unreachable Screens: 2 screens are not reachable in any flow
    → Add these screens to flows: help-page, terms-of-service
```

## Example 6: CI/CD Integration

### Automated Debug on Failure
```yaml
# .github/workflows/flowlock.yml
name: FlowLock Audit
on: [push]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run FlowLock Audit
        id: audit
        run: |
          npx flowlock-uxcg audit || echo "AUDIT_FAILED=true" >> $GITHUB_ENV
      
      - name: Debug Failures
        if: env.AUDIT_FAILED == 'true'
        run: |
          echo "## Debug Report" >> $GITHUB_STEP_SUMMARY
          echo '```' >> $GITHUB_STEP_SUMMARY
          npx flowlock-uxcg debug creatable --verbose >> $GITHUB_STEP_SUMMARY
          npx flowlock-uxcg debug reachability --show-paths >> $GITHUB_STEP_SUMMARY
          npx flowlock-uxcg debug relations --show-relations >> $GITHUB_STEP_SUMMARY
          echo '```' >> $GITHUB_STEP_SUMMARY
```

## Tips

1. **Start with the specific entity/screen/flow** that's failing
2. **Use --verbose** when you need to understand the checking logic
3. **Use --show-patterns** to find systemic issues
4. **Pipe to files** for large outputs: `debug creatable --all > debug.log`
5. **Check multiple related entities** when debugging relationships