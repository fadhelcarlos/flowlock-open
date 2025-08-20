# FlowLock E-Commerce Reference Application

## Overview

This is a complete reference implementation demonstrating all FlowLock features through a realistic e-commerce application. It serves as both a learning resource and a template for building production applications.

## Table of Contents

1. [Features Demonstrated](#features-demonstrated)
2. [Entity Model](#entity-model)
3. [Relationships](#relationships)
4. [User Flows](#user-flows)
5. [State Machines](#state-machines)
6. [Jobs To Be Done (JTBD)](#jobs-to-be-done-jtbd)
7. [UI Components](#ui-components)
8. [Glossary & Derived Fields](#glossary--derived-fields)
9. [Running the Checks](#running-the-checks)
10. [Tutorial](#tutorial)

## Features Demonstrated

### ✅ All 15 FlowLock Checks

**Core Checks (7):**
1. **HONEST Check** - Validates data honesty and integrity
2. **CREATABLE Check** - Ensures entities can be created with required fields
3. **REACHABILITY Check** - Validates all screens are reachable from navigation
4. **UI Check** - Validates UI component consistency
5. **STATE Check** - Validates state machine transitions
6. **SCREEN Check** - Validates screen structure and components
7. **SPEC Check** - Validates overall spec structure

**Extended Checks (5):**
8. **JTBD Check** - Validates all Jobs To Be Done are addressed by flows
9. **RELATIONS Check** - Validates entity relationships and detects circular references
10. **ROUTES Check** - Ensures unique routes with proper formatting
11. **CTAs Check** - Validates navigation targets and detects orphaned screens
12. **RUNTIME_DETERMINISM Check** - Validates runtime behavior is deterministic

**Runtime Checks (3):**
13. **INVENTORY Check** - Validates runtime inventory tracking
14. **DATABASE_VALIDATION** - Validates database schema against spec
15. **MIGRATION_VALIDATION** - Validates database migrations

## Entity Model

### Core Entities

#### User
- Central entity for authentication and user management
- Fields include email, password, name, role, status
- Tracks email verification and last login
- Has one-to-one relationship with Profile
- Has one-to-many relationships with Orders, Reviews, Addresses, Wishlists

#### Product
- Main catalog entity
- Includes SKU, pricing, inventory, ratings
- External integration with inventory API
- Supports multiple images and tags
- Belongs to Category and Vendor
- Has reviews from Users

#### Order
- Transactional entity for purchases
- Complex pricing calculations (subtotal, tax, shipping, discounts)
- Multiple status states with state machine
- Links to User, Address, and OrderItems
- Supports tracking integration

#### Cart
- Session-based shopping cart
- Can be user-linked or anonymous
- Automatically expires after timeout
- Converts to Order on checkout

### Supporting Entities

#### Profile
- Extended user information
- One-to-one with User
- Stores preferences and personal details

#### Category
- Hierarchical product categorization
- Self-referential for parent/child relationships
- Used for navigation and filtering

#### Review
- User-generated product feedback
- Linked to User, Product, and optionally Order
- Requires approval workflow

#### Address
- Shipping and billing addresses
- Multiple per user
- Can be marked as default

#### Vendor
- Third-party sellers
- Commission-based model
- Own product management

#### Wishlist
- Saved products for later
- Can be public or private
- Many-to-many with Products

## Relationships

### Relationship Types Demonstrated

#### 1:1 (One-to-One)
- **User ↔ Profile**: Each user has exactly one profile
- **User ↔ Cart**: Each user has one active cart

#### 1:Many (One-to-Many)
- **User → Orders**: A user can have multiple orders
- **User → Reviews**: A user can write multiple reviews
- **User → Addresses**: A user can have multiple addresses
- **Category → Products**: A category contains multiple products
- **Order → OrderItems**: An order contains multiple line items
- **Product → ProductImages**: A product can have multiple images
- **Vendor → Products**: A vendor can sell multiple products

#### Many:1 (Many-to-One)
- **Product → Category**: Multiple products belong to one category
- **Review → Product**: Multiple reviews for one product
- **Order → User**: Multiple orders belong to one user

#### Many:Many (Many-to-Many)
- **Product ↔ Tag**: Products can have multiple tags, tags can apply to multiple products (through product_tag)
- **Wishlist ↔ Product**: Wishlists contain multiple products, products can be in multiple wishlists (through wishlist_product)

#### Self-Referential
- **Category → Category**: Categories can have parent/child relationships

## User Flows

### 1. User Signup Flow
**Purpose**: New user registration and onboarding
```
Home → Signup → Email Verification → Profile Setup → Home
```
- Creates user account
- Sends verification email
- Optional profile completion
- State transition: null → pending → active

### 2. User Login Flow
**Purpose**: Existing user authentication
```
Login → Home
```
- Authenticates credentials
- Updates last login timestamp
- Redirects to dashboard

### 3. Browse and Purchase Flow
**Purpose**: Complete shopping experience
```
Home → Product List → Product Detail → Cart → Checkout → Order Confirmation → Order Detail
```
- Product discovery
- Cart management
- Payment processing
- Order creation
- State transitions: Cart (active → converted), Order (pending → confirmed)

### 4. Write Review Flow
**Purpose**: Post-purchase feedback
```
Order Detail → Product Detail → Review Form → Product Detail
```
- Verified purchase validation
- Rating and comment submission
- Review moderation queue
- State transition: Review (null → pending)

### 5. Admin Order Management Flow
**Purpose**: Order processing and fulfillment
```
Admin Dashboard → Order List → Order Detail → Update Status
```
- View pending orders
- Update tracking information
- Process shipments
- State transitions: Order (confirmed → processing → shipped)

## State Machines

### User States
```
pending → active → suspended → deleted
        ↔ suspended
```
- **Initial**: pending (awaiting email verification)
- **Terminal**: deleted
- **Triggers**: verify_email, suspend, reactivate, delete

### Order States
```
pending → confirmed → processing → shipped → delivered
     ↓        ↓           ↓                      ↓
cancelled  cancelled   cancelled              refunded
```
- **Initial**: pending
- **Terminal**: delivered, cancelled, refunded
- **Triggers**: confirm_payment, start_processing, ship, deliver, cancel, refund

### Product States
```
draft → active ↔ out_of_stock → discontinued
   ↓                               ↑
discontinued ←--------------------┘
```
- **Initial**: draft
- **Terminal**: discontinued
- **Triggers**: publish, deplete_stock, restock, discontinue

### Cart States
```
active → converted
   ↓
abandoned
```
- **Initial**: active
- **Terminal**: converted, abandoned
- **Triggers**: checkout_complete, expire

### Review States
```
pending → approved
   ↓
rejected
```
- **Initial**: pending
- **Terminal**: approved, rejected
- **Triggers**: approve, reject

## Jobs To Be Done (JTBD)

### Customer
**Goal**: Shop efficiently and make informed purchase decisions
- Find products within budget
- Compare similar products
- Read reviews before purchasing
- Save items for later
- Track orders
- Return or exchange products
- Get recommendations
- Apply discount codes
- Share wishlist
- Set price alerts

### Admin
**Goal**: Efficiently manage e-commerce operations
- Monitor sales and revenue
- Manage product inventory
- Process and fulfill orders
- Handle customer inquiries
- Approve or reject reviews
- Manage promotions
- Generate reports
- Monitor system performance
- Manage vendor relationships
- Handle returns and refunds

### Vendor
**Goal**: Manage product listings and maximize sales
- List and manage products
- Update inventory levels
- View sales analytics
- Respond to customer reviews
- Manage pricing and promotions
- Track commission and payouts
- Upload product images
- Update product descriptions
- View competitor pricing
- Manage shipping options

### Guest
**Goal**: Explore products without commitment
- Browse products without account
- Search for specific items
- View product details
- Compare products
- Read reviews
- Add items to cart
- Calculate shipping costs
- Check product availability
- View return policy
- Contact customer support

## UI Components

### Screen Types

#### Dashboard
- **home**: Featured products, categories, promotions
- **account_dashboard**: User account overview
- **admin_dashboard**: Admin metrics and management

#### List
- **product_list**: Product catalog with filters
- **order_list**: Order history
- **wishlist**: Saved products

#### Detail
- **product_detail**: Full product information
- **order_detail**: Order information and tracking
- **cart**: Shopping cart contents

#### Form
- **signup**: User registration
- **login**: Authentication
- **checkout**: Order placement
- **review_form**: Product review submission

#### Success
- **email_verification**: Post-signup confirmation
- **order_confirmation**: Post-purchase confirmation

### UI Components

#### Cards
Display grouped information:
- Product info cards
- Order summary cards
- User account cards
- Category cards

#### Lists
Tabular/grid data display:
- Product grids with sorting/filtering
- Order tables with pagination
- Cart items
- Review lists

#### CTAs (Call-to-Actions)
Navigation and actions:
- **Primary**: Main actions (Add to Cart, Checkout)
- **Secondary**: Alternative actions (Continue Shopping)
- **Link**: Navigation (Back, View Details)
- **Danger**: Destructive actions (Delete, Cancel)

#### Routes
URL patterns:
- Static: `/products`, `/cart`, `/checkout`
- Dynamic: `/products/:slug`, `/orders/:id`
- Aliases: `/catalog` → `/products`

## Glossary & Derived Fields

### System-Generated Fields

#### system.uuid
- Generates unique identifiers
- Formula: `crypto.randomUUID()`
- Used for all entity IDs

#### system.timestamp
- Server timestamps
- Formula: `new Date().toISOString()`
- Used for created_at, updated_at

#### system.orderNumber
- Human-readable order numbers
- Formula: `'ORD-' + Date.now().toString(36).toUpperCase() + '-' + random`

### Computed Fields

#### computed.fullName
- Concatenates first and last name
- Formula: `first_name + ' ' + last_name`

#### computed.slug
- URL-friendly names
- Formula: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`

#### computed.avgRating
- Product average rating
- Formula: `SUM(reviews.rating) / COUNT(reviews)`

#### computed.orderTotal
- Final order amount
- Formula: `subtotal + tax_amount + shipping_amount - discount_amount`

### External Integrations

#### inventory_api
- External inventory management
- Source: `https://api.inventory.example.com/v2`
- Fields: product.sku, product.stock_quantity

#### shipping_api
- Shipping provider integration
- Source: `https://api.shipping.example.com/v1`
- Fields: order.tracking_number

#### cdn_api
- Image hosting CDN
- Source: `https://cdn.example.com`
- Fields: product_image.url

## Running the Checks

### Prerequisites
```bash
npm install -g @flowlock/cli
```

### Run All Checks
```bash
cd examples/complete-reference
flowlock check
```

### Run Individual Checks
```bash
flowlock check:required
flowlock check:types
flowlock check:relationships
flowlock check:flows
flowlock check:states
flowlock check:roles
flowlock check:derived
flowlock check:external
flowlock check:screens
flowlock check:forms
flowlock check:glossary
```

### Generate Artifacts
```bash
flowlock generate
```

This creates:
- `artifacts/er.mmd` - Entity relationship diagram
- `artifacts/flow.mmd` - Flow diagrams
- `artifacts/screens.csv` - Screen inventory
- `artifacts/acceptance_criteria.feature` - BDD test scenarios
- `artifacts/gap_report.md` - Implementation gaps
- `artifacts/determinism.sha256` - Spec checksum
- `artifacts/results.junit.xml` - Test results

## Tutorial

### Step 1: Understanding the Structure

1. **Start with Entities**: Review the entity definitions to understand the data model
2. **Explore Relationships**: See how entities connect to each other
3. **Follow a Flow**: Walk through the Browse and Purchase flow to see the full user journey

### Step 2: Customizing for Your Needs

1. **Add a New Entity**: 
   ```json
   {
     "id": "coupon",
     "name": "Coupon",
     "fields": [
       {
         "id": "code",
         "name": "Code",
         "type": "string",
         "required": true,
         "unique": true
       }
     ]
   }
   ```

2. **Create a Relationship**:
   ```json
   {
     "id": "coupons",
     "to": "coupon",
     "kind": "many:many",
     "through": "order_coupon"
   }
   ```

3. **Define a Flow**:
   ```json
   {
     "id": "apply_coupon_flow",
     "name": "Apply Coupon",
     "steps": [...]
   }
   ```

### Step 3: Validation

1. Run checks after each change
2. Review error messages for guidance
3. Use the gap report to identify missing implementations

### Step 4: Code Generation

1. Generate TypeScript types:
   ```bash
   flowlock generate:types
   ```

2. Generate API routes:
   ```bash
   flowlock generate:api
   ```

3. Generate UI components:
   ```bash
   flowlock generate:ui
   ```

## Best Practices

1. **Start Small**: Begin with core entities and expand
2. **Validate Often**: Run checks frequently during development
3. **Use State Machines**: Model complex workflows as state transitions
4. **Define Glossary Terms**: Document all computed and derived fields
5. **Map User Journeys**: Create flows for critical user paths
6. **Consider Roles Early**: Design with permissions in mind
7. **Document External Dependencies**: Clearly mark external API fields

## Troubleshooting

### Common Issues

1. **Relationship Errors**: Ensure both entities exist and relationship types match
2. **Flow Validation**: Check that all referenced screens and entities exist
3. **State Machine Conflicts**: Verify no duplicate or circular transitions
4. **Derived Field Errors**: Ensure provenance terms are defined in glossary

### Getting Help

- Review error messages carefully - they provide specific guidance
- Check the gap report for missing implementations
- Consult the main FlowLock documentation
- Use verbose mode for detailed debugging: `flowlock check --verbose`

## Next Steps

1. **Extend the Model**: Add new features like subscriptions, loyalty programs, or multi-vendor support
2. **Implement the Backend**: Use the generated types and APIs as a starting point
3. **Build the UI**: Create components based on the screen definitions
4. **Add Testing**: Use the acceptance criteria for test scenarios
5. **Deploy**: Use the inventory.json for CI/CD pipeline configuration

## License

MIT - See LICENSE file for details

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

## Support

For questions and support, please open an issue in the FlowLock repository.