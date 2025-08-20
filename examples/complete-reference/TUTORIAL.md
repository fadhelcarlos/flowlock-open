# FlowLock E-Commerce Tutorial

## Introduction

Welcome to the FlowLock E-Commerce Reference Tutorial! This guide will walk you through a complete implementation of an e-commerce application using FlowLock, demonstrating every feature of the framework.

## Prerequisites

- Node.js 18+ installed
- Basic understanding of JSON
- Familiarity with e-commerce concepts

## Tutorial Structure

This tutorial is organized into 10 lessons, each focusing on a specific FlowLock feature:

1. [Setting Up Your Project](#lesson-1-setting-up-your-project)
2. [Defining Entities](#lesson-2-defining-entities)
3. [Creating Relationships](#lesson-3-creating-relationships)
4. [Building User Flows](#lesson-4-building-user-flows)
5. [Implementing State Machines](#lesson-5-implementing-state-machines)
6. [Designing Screens](#lesson-6-designing-screens)
7. [Creating Forms](#lesson-7-creating-forms)
8. [Managing Roles & Permissions](#lesson-8-managing-roles--permissions)
9. [Working with Derived Fields](#lesson-9-working-with-derived-fields)
10. [External Integrations](#lesson-10-external-integrations)

---

## Lesson 1: Setting Up Your Project

### Objective
Learn how to initialize a FlowLock project and understand the basic structure.

### Steps

1. **Create Project Structure**
```bash
mkdir my-ecommerce
cd my-ecommerce
```

2. **Create uxspec.json**
```json
{
  "version": "1.0.0",
  "project": "my-ecommerce",
  "name": "My E-Commerce Store",
  "description": "An online store built with FlowLock",
  "entities": [],
  "screens": [],
  "flows": [],
  "roles": [],
  "states": [],
  "glossary": []
}
```

3. **Create inventory.json**
```json
{
  "spec": "uxspec.json",
  "runner": "@flowlock/cli",
  "checks": ["check:required", "check:types"]
}
```

### Key Concepts
- **uxspec.json**: The heart of your application specification
- **inventory.json**: Configuration for validation and generation
- **Checks**: Automated validation of your specification

### Exercise
Create a new project with a custom name and description.

---

## Lesson 2: Defining Entities

### Objective
Learn how to model your application's data using entities and fields.

### Core Entity: User

```json
{
  "id": "user",
  "name": "User",
  "fields": [
    {
      "id": "id",
      "name": "ID",
      "type": "string",
      "required": true,
      "derived": true,
      "provenance": "system.uuid"
    },
    {
      "id": "email",
      "name": "Email",
      "type": "email",
      "required": true,
      "unique": true
    },
    {
      "id": "first_name",
      "name": "First Name",
      "type": "string",
      "required": true
    },
    {
      "id": "last_name",
      "name": "Last Name",
      "type": "string",
      "required": true
    }
  ]
}
```

### Field Types Available
- **Basic**: string, number, boolean, date, datetime
- **Specialized**: email, phone, url, uuid
- **Complex**: json, text, decimal, integer
- **Enums**: Define specific allowed values

### Field Properties
- **required**: Must have a value
- **unique**: Must be unique across all records
- **derived**: System-generated or computed
- **sensitive**: Contains PII or sensitive data
- **external**: Comes from external API

### Exercise
Add a Product entity with at least 5 fields including price and stock quantity.

---

## Lesson 3: Creating Relationships

### Objective
Master the four types of entity relationships in FlowLock.

### 1:1 Relationship - User and Profile

```json
// In User entity
"relations": [
  {
    "id": "profile",
    "to": "profile",
    "kind": "1:1",
    "cascade": true
  }
]

// In Profile entity
"relations": [
  {
    "id": "user",
    "to": "user",
    "kind": "1:1"
  }
]
```

### 1:Many Relationship - User and Orders

```json
// In User entity
"relations": [
  {
    "id": "orders",
    "to": "order",
    "kind": "1:many"
  }
]

// In Order entity
"relations": [
  {
    "id": "user",
    "to": "user",
    "kind": "many:1"
  }
]
```

### Many:Many Relationship - Products and Tags

```json
// In Product entity
"relations": [
  {
    "id": "tags",
    "to": "tag",
    "kind": "many:many",
    "through": "product_tag"
  }
]

// In Tag entity
"relations": [
  {
    "id": "products",
    "to": "product",
    "kind": "many:many",
    "through": "product_tag"
  }
]
```

### Self-Referential - Category Hierarchy

```json
"relations": [
  {
    "id": "parent",
    "to": "category",
    "kind": "many:1",
    "self": true
  },
  {
    "id": "children",
    "to": "category",
    "kind": "1:many",
    "self": true
  }
]
```

### Exercise
Create a relationship between Products and Categories where each product belongs to one category.

---

## Lesson 4: Building User Flows

### Objective
Design complete user journeys through your application.

### Anatomy of a Flow

```json
{
  "id": "purchase_flow",
  "name": "Complete Purchase",
  "jtbd": "customer",
  "role": "customer",
  "entryStepId": "browse_products",
  "steps": [],
  "success": {
    "screen": "order_confirmation",
    "message": "Thank you for your purchase!"
  }
}
```

### Flow Steps

```json
{
  "id": "add_to_cart",
  "screenId": "product_detail",
  "next": [
    {
      "targetStepId": "view_cart",
      "condition": "user clicks add to cart"
    },
    {
      "targetStepId": "continue_shopping",
      "condition": "user continues browsing"
    }
  ],
  "reads": ["product.price", "product.stock"],
  "writes": ["cart_item.product_id", "cart_item.quantity"],
  "transition": {
    "entity": "cart",
    "from": null,
    "to": "active"
  }
}
```

### Key Components
- **Steps**: Individual screens in the journey
- **Next**: Conditional branching logic
- **Reads/Writes**: Data operations
- **Transitions**: State changes

### Exercise
Create a user registration flow from signup to email verification.

---

## Lesson 5: Implementing State Machines

### Objective
Model complex business logic using state machines.

### Order State Machine

```json
{
  "entity": "order",
  "allowed": ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
  "initial": "pending",
  "terminal": ["delivered", "cancelled"],
  "transitions": [
    {
      "from": "pending",
      "to": "confirmed",
      "trigger": "confirm_payment"
    },
    {
      "from": "confirmed",
      "to": "processing",
      "trigger": "start_processing"
    },
    {
      "from": "processing",
      "to": "shipped",
      "trigger": "ship"
    },
    {
      "from": "shipped",
      "to": "delivered",
      "trigger": "deliver"
    },
    {
      "from": "pending",
      "to": "cancelled",
      "trigger": "cancel"
    }
  ]
}
```

### State Properties
- **allowed**: All possible states
- **initial**: Starting state for new entities
- **terminal**: End states (no transitions out)
- **transitions**: Valid state changes and their triggers

### Best Practices
1. Keep states simple and descriptive
2. Define all edge cases (cancellations, errors)
3. Use triggers that map to business events
4. Consider parallel states for complex workflows

### Exercise
Create a state machine for a Product with states: draft, active, out_of_stock, discontinued.

---

## Lesson 6: Designing Screens

### Objective
Define the user interface structure of your application.

### Screen Types

#### List Screen - Product Catalog
```json
{
  "id": "product_list",
  "name": "Product Catalog",
  "type": "list",
  "entityId": "product",
  "reads": ["product.name", "product.price", "product.image"],
  "roles": ["customer", "guest"],
  "uiStates": ["loading", "error", "empty", "ready"],
  "routes": ["/products", "/catalog"],
  "lists": [
    {
      "id": "product_grid",
      "reads": ["product.name", "product.price"],
      "sortable": true,
      "filterable": true,
      "paginated": true,
      "filters": ["category", "price_range", "rating"]
    }
  ]
}
```

#### Detail Screen - Product Page
```json
{
  "id": "product_detail",
  "name": "Product Detail",
  "type": "detail",
  "entityId": "product",
  "reads": ["product.name", "product.description", "product.price"],
  "cards": [
    {
      "id": "product_info",
      "reads": ["product.name", "product.description"]
    },
    {
      "id": "product_specs",
      "reads": ["product.weight", "product.dimensions"]
    }
  ]
}
```

#### Form Screen - Checkout
```json
{
  "id": "checkout",
  "name": "Checkout",
  "type": "form",
  "entityId": "order",
  "forms": [
    {
      "id": "checkout_form",
      "entityId": "order",
      "type": "create",
      "fields": [
        {
          "fieldId": "shipping_address",
          "label": "Shipping Address",
          "required": true
        }
      ]
    }
  ]
}
```

### Exercise
Create a dashboard screen showing user's recent orders and recommendations.

---

## Lesson 7: Creating Forms

### Objective
Build interactive forms for data collection and updates.

### Form Types

#### Create Form - User Registration
```json
{
  "id": "signup_form",
  "entityId": "user",
  "type": "create",
  "fields": [
    {
      "fieldId": "email",
      "label": "Email Address",
      "required": true,
      "validation": "email"
    },
    {
      "fieldId": "password",
      "label": "Password",
      "required": true,
      "validation": "password",
      "minLength": 8
    }
  ],
  "writes": ["user.email", "user.password"]
}
```

#### Update Form - Edit Profile
```json
{
  "id": "profile_edit_form",
  "entityId": "profile",
  "type": "update",
  "fields": [
    {
      "fieldId": "bio",
      "label": "About Me",
      "maxLength": 500
    },
    {
      "fieldId": "avatar_url",
      "label": "Profile Picture",
      "validation": "url"
    }
  ],
  "reads": ["profile.bio", "profile.avatar_url"],
  "writes": ["profile.bio", "profile.avatar_url"]
}
```

### Validation Rules
- **email**: Valid email format
- **phone**: Valid phone number
- **url**: Valid URL
- **password**: Strong password requirements
- **minLength/maxLength**: Character limits
- **min/max**: Numeric ranges

### Exercise
Create a product review form with rating and comment fields.

---

## Lesson 8: Managing Roles & Permissions

### Objective
Implement role-based access control (RBAC) for your application.

### Defining Roles

```json
{
  "id": "customer",
  "name": "Customer",
  "permissions": [
    "read:product",
    "create:order",
    "read:order:own",
    "update:order:own",
    "create:review",
    "update:profile:own"
  ]
}
```

### Permission Format
- **Action**: create, read, update, delete
- **Resource**: Entity name
- **Scope**: own, all, specific conditions

### Special Permissions
- **Wildcard**: `"*"` grants all permissions
- **Scoped**: `:own` limits to user's own resources
- **Conditional**: Can include business logic

### Jobs To Be Done (JTBD)

```json
{
  "role": "customer",
  "tasks": [
    "Find products within budget",
    "Compare similar items",
    "Track my orders",
    "Write product reviews"
  ],
  "description": "Shop efficiently and make informed purchases"
}
```

### Exercise
Create a vendor role that can manage their own products but not others'.

---

## Lesson 9: Working with Derived Fields

### Objective
Understand computed and system-generated fields.

### System-Generated Fields

```json
{
  "id": "id",
  "name": "ID",
  "type": "string",
  "derived": true,
  "provenance": "system.uuid"
}
```

### Computed Fields

```json
{
  "id": "total",
  "name": "Order Total",
  "type": "decimal",
  "derived": true,
  "provenance": "computed.orderTotal"
}
```

### Glossary Definitions

```json
{
  "term": "system.uuid",
  "definition": "Generates unique identifier",
  "formula": "crypto.randomUUID()"
},
{
  "term": "computed.orderTotal",
  "definition": "Calculates order total",
  "formula": "subtotal + tax + shipping - discount"
},
{
  "term": "computed.slug",
  "definition": "URL-friendly version of name",
  "formula": "name.toLowerCase().replace(/[^a-z0-9]+/g, '-')"
}
```

### Types of Derived Fields
1. **System**: IDs, timestamps, random values
2. **Computed**: Calculations, aggregations
3. **Transformed**: Formatted, normalized values
4. **External**: API-provided values

### Exercise
Create a computed field for average product rating based on reviews.

---

## Lesson 10: External Integrations

### Objective
Connect your application to external services and APIs.

### External Field Definition

```json
{
  "id": "stock_quantity",
  "name": "Stock Quantity",
  "type": "integer",
  "external": true,
  "source": "inventory_api"
}
```

### Integration Configuration

```json
"integrations": {
  "external": {
    "inventory_api": {
      "url": "https://api.inventory.example.com/v2",
      "auth": "bearer",
      "timeout": 5000,
      "retry": 3
    },
    "shipping_api": {
      "url": "https://api.shipping.example.com/v1",
      "auth": "apikey",
      "headers": {
        "X-API-Key": "${SHIPPING_API_KEY}"
      }
    }
  }
}
```

### Glossary Entry for External Source

```json
{
  "term": "inventory_api",
  "definition": "External inventory management system",
  "source": "https://api.inventory.example.com/v2",
  "documentation": "https://docs.inventory.example.com"
}
```

### Best Practices
1. Always define timeout and retry logic
2. Use environment variables for credentials
3. Document all external dependencies
4. Implement fallback mechanisms
5. Cache external data when appropriate

### Exercise
Add an external payment gateway integration for order processing.

---

## Putting It All Together

### Complete Purchase Flow

Let's trace through a complete purchase to see how all components work together:

1. **User browses products** (List Screen)
   - Reads product data from entities
   - Filters by category (relationship)
   - Shows prices (derived from external API)

2. **User views product detail** (Detail Screen)
   - Displays all product information
   - Shows reviews (1:many relationship)
   - Checks stock (external field)

3. **User adds to cart** (State Transition)
   - Creates cart if not exists
   - Cart state: null → active
   - Stores in session

4. **User proceeds to checkout** (Form Screen)
   - Collects shipping information
   - Validates all fields
   - Calculates total (computed field)

5. **User completes purchase** (Multiple State Transitions)
   - Order: null → pending → confirmed
   - Cart: active → converted
   - Inventory: Updated via external API

6. **Order confirmation** (Success Screen)
   - Shows order number (system-generated)
   - Sends email (external integration)
   - Updates user's order history

### Testing Your Implementation

Run all checks:
```bash
flowlock check
```

Expected output:
```
✅ Required fields check passed
✅ Types check passed
✅ Relationships check passed
✅ Flows check passed
✅ States check passed
✅ Roles check passed
✅ Derived fields check passed
✅ External fields check passed
✅ Screens check passed
✅ Forms check passed
✅ Glossary check passed

All checks passed! Your specification is valid.
```

---

## Advanced Topics

### 1. Multi-Tenant Architecture

Add tenant isolation:
```json
{
  "id": "tenant_id",
  "name": "Tenant ID",
  "type": "string",
  "required": true,
  "indexed": true
}
```

### 2. Event Sourcing

Track all changes:
```json
{
  "id": "event",
  "name": "Event",
  "fields": [
    {"id": "entity_type", "type": "string"},
    {"id": "entity_id", "type": "string"},
    {"id": "event_type", "type": "string"},
    {"id": "payload", "type": "json"},
    {"id": "timestamp", "type": "datetime"}
  ]
}
```

### 3. Versioning

Support multiple API versions:
```json
"versioning": {
  "strategy": "url",
  "current": "v2",
  "supported": ["v1", "v2"],
  "deprecated": ["v0"]
}
```

### 4. Internationalization

Multi-language support:
```json
{
  "id": "translations",
  "type": "json",
  "structure": {
    "en": {"name": "Product Name"},
    "es": {"name": "Nombre del Producto"},
    "fr": {"name": "Nom du Produit"}
  }
}
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Relationship validation fails
**Solution**: Ensure both entities exist and relationship types are complementary (1:many on one side, many:1 on the other).

#### Issue: Flow step references unknown screen
**Solution**: Check that all screenId values in flow steps match actual screen definitions.

#### Issue: State transition creates a loop
**Solution**: Review state machine to ensure no circular transitions exist. Use terminal states appropriately.

#### Issue: Derived field has no provenance
**Solution**: Add the provenance term to the glossary with its formula.

#### Issue: External field fails validation
**Solution**: Ensure the source is defined in the glossary and the integration configuration exists.

---

## Best Practices Checklist

### Entity Design
- [ ] Use meaningful, consistent naming
- [ ] Mark sensitive fields appropriately
- [ ] Define all required fields
- [ ] Add proper validation rules
- [ ] Document computed fields

### Relationships
- [ ] Ensure bidirectional consistency
- [ ] Use cascade for dependent entities
- [ ] Consider performance implications
- [ ] Document relationship cardinality

### Flows
- [ ] Cover happy path and edge cases
- [ ] Include error handling steps
- [ ] Define clear success criteria
- [ ] Test all conditional branches

### State Machines
- [ ] Keep states simple and clear
- [ ] Define all valid transitions
- [ ] Include rollback scenarios
- [ ] Document trigger conditions

### Security
- [ ] Implement proper RBAC
- [ ] Validate all inputs
- [ ] Encrypt sensitive data
- [ ] Audit critical operations

---

## Next Steps

### 1. Extend the Example
- Add wishlist functionality
- Implement product recommendations
- Create admin analytics dashboard
- Add multi-currency support

### 2. Generate Code
```bash
flowlock generate:types
flowlock generate:api
flowlock generate:ui
flowlock generate:database
```

### 3. Build the Application
- Set up your development environment
- Implement the generated interfaces
- Add business logic
- Deploy to production

### 4. Share Your Work
- Contribute improvements
- Share custom entities
- Create plugins
- Help others learn

---

## Resources

### Documentation
- [FlowLock Official Docs](https://flowlock.dev/docs)
- [API Reference](https://flowlock.dev/api)
- [Examples Repository](https://github.com/flowlock/examples)

### Community
- [Discord Server](https://discord.gg/flowlock)
- [GitHub Discussions](https://github.com/flowlock/flowlock/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/flowlock)

### Tools
- [FlowLock VS Code Extension](https://marketplace.visualstudio.com/items?itemName=flowlock)
- [Online Validator](https://flowlock.dev/validator)
- [Spec Generator](https://flowlock.dev/generator)

---

## Conclusion

Congratulations! You've completed the FlowLock E-Commerce Tutorial. You now understand:

- How to model complex data structures with entities
- Creating relationships between entities
- Building complete user flows
- Implementing state machines for business logic
- Designing screens and forms
- Managing roles and permissions
- Working with derived and external fields

This foundation enables you to build robust, well-specified applications that can be validated, tested, and generated automatically.

Remember: **Specification-first development leads to better, more maintainable applications.**

Happy building with FlowLock! 🚀