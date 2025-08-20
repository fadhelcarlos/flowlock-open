# FlowLock Claude/Cursor Command Cards

This document describes the updated Claude/Cursor command cards that are automatically generated when you run `npx flowlock-uxcg init`. These commands help AI assistants work with FlowLock more effectively.

## Overview

FlowLock includes 5 command cards:

1. **`/ux-contract-init`** - Create or refine the UX specification
2. **`/ux-guardrails-validate`** - Fix failing validation checks
3. **`/ux-generate-ui`** - Scaffold UI components from spec
4. **`/flow-audit-fix`** - Close gaps identified by audit
5. **`/ux-enhance-spec`** - Enhance specs with advanced features

## Command Features

### Enhanced Features Support

All commands now understand and work with:

- **JTBD (Jobs To Be Done)** - Both array format (new) and object format (legacy)
- **Entity Relations** - 1:1, 1:many, many:1, many:many relationships
- **Enhanced Screens**:
  - Routes for URL patterns
  - Cards for display components
  - Lists with sorting/filtering/pagination
  - CTAs (Call to Actions) for navigation
- **State Machines** - Entity state transitions with triggers
- **Glossary** - Derived and external field definitions

### New Validation Checks

Commands now handle 15 checks (up from 7):

**Core Checks (7):**
- HONEST - Field read validation
- CREATABLE - Create forms need detail screens
- REACHABILITY - 3-click rule
- UI - Empty/loading/error states
- STATE - State machine validation
- SCREEN - Role-based access
- SPEC - Coverage reporting

**Extended Checks (5):**
- JTBD - Jobs to flows mapping
- RELATIONS - Entity relationship validation
- ROUTES - Unique URL patterns
- CTAS - Navigation validation
- RUNTIME_DETERMINISM - Audit result consistency

**Runtime Checks (3):**
- INVENTORY - Runtime extraction validation
- DATABASE_VALIDATION - Database best practices
- MIGRATION_VALIDATION - Safe migration patterns

## Command Details

### /ux-contract-init

Creates or refines `uxspec.json` from your PRD/README.

**New Features:**
- Generates enhanced entity relations
- Creates screen routes and CTAs
- Links flows to JTBD
- Adds state machines
- Creates glossary entries

**Example generated structure:**
```json
{
  "project": "my-app",
  "jtbd": [
    { "role": "admin", "tasks": ["manage users"], "description": "Admin tasks" }
  ],
  "entities": [{
    "id": "user",
    "fields": [...],
    "relations": [{ "id": "orders", "to": "order", "kind": "1:many" }]
  }],
  "screens": [{
    "id": "user-list",
    "routes": ["/users"],
    "cards": [{ "id": "stats", "reads": ["user.count"] }],
    "lists": [{ "id": "users", "reads": ["user.*"], "sortable": true }],
    "ctas": [{ "label": "Add User", "to": "user-create", "type": "primary" }]
  }]
}
```

### /ux-guardrails-validate

Fixes validation failures to get all checks green.

**New Features:**
- Handles 15 checks instead of 7
- Suggests route additions
- Recommends CTA improvements
- Proposes state machine definitions
- Auto-converts to enhanced formats

**Auto-fix support:**
```bash
npx flowlock-uxcg audit --fix
```

### /ux-generate-ui

Scaffolds complete UI from specification.

**New Features:**
- Generates routing from screen routes
- Creates card components
- Builds sortable/filterable lists
- Implements CTA navigation
- Adds state machine handlers
- Types include entity relations

**Generated structure:**
```
src/
  components/
    screens/      # Full screens with all components
    ui/           # Reusable cards, lists, CTAs
  hooks/
    useRole.ts    # Role-based access
    useStateMachine.ts  # State transitions
  types/
    entities.ts   # With relations
    states.ts     # State machines
```

### /flow-audit-fix

Closes gaps from audit reports.

**New Features:**
- Categorizes issues by all 15 checks
- Suggests enhanced feature additions
- Handles JTBD linking
- Fixes relation issues
- Adds missing routes and CTAs

### /ux-enhance-spec (NEW)

Upgrades existing specs to use enhanced features.

**What it does:**
- Migrates old JTBD format to new
- Adds entity relations
- Enhances screens with components
- Links flows to JTBD
- Creates state machines
- Documents in glossary

**Benefits:**
- Better validation (15 vs 7 checks)
- Richer UI generation
- URL navigation support
- State enforcement
- Enhanced diagrams

## Usage

### In Claude Desktop or Cursor

1. Type the command (e.g., `/ux-contract-init`)
2. The AI will read your project and suggest changes
3. Review and approve the proposed diff
4. Run the suggested commands locally

### Command Flow

```mermaid
graph LR
    A[/ux-contract-init] --> B[Create/Update spec]
    B --> C[Run audit]
    C --> D{Passes?}
    D -->|No| E[/ux-guardrails-validate]
    E --> C
    D -->|Yes| F[/ux-generate-ui]
    
    G[Existing spec] --> H[/ux-enhance-spec]
    H --> B
```

## Installation

Commands are automatically installed when you run:

```bash
npx flowlock-uxcg init
```

This creates:
```
.claude/
  commands/
    ux-contract-init.md
    ux-guardrails-validate.md
    ux-generate-ui.md
    flow-audit-fix.md
    ux-enhance-spec.md
```

## Backward Compatibility

All commands support both:
- **Old format**: JTBD as object, simple forms
- **New format**: JTBD as array, enhanced components

This ensures smooth migration from legacy specs.

## Best Practices

1. **Start with `/ux-enhance-spec`** if you have an existing spec
2. **Use `/ux-contract-init`** for new projects
3. **Run audit frequently** to catch issues early
4. **Let AI handle `/ux-guardrails-validate`** for complex fixes
5. **Review generated UI** from `/ux-generate-ui` before committing

## Troubleshooting

### Commands not appearing in Claude/Cursor

```bash
# Regenerate commands
npx flowlock-uxcg init
# Check they exist
ls .claude/commands/
```

### Old commands still showing

```bash
# Remove old commands
rm -rf .claude/commands
# Regenerate with latest
npx flowlock-uxcg@latest init
```

### Commands not understanding new features

Update to latest FlowLock:
```bash
npm install -g flowlock-uxcg@latest
```

## Summary

FlowLock commands provide:
- ✅ Full support for all new features
- ✅ Backward compatibility with v2 specs
- ✅ 15 validation checks vs 7
- ✅ Enhanced UI generation
- ✅ Better AI assistance

When users run `uxcg init`, they automatically get these updated commands for the best AI-assisted development experience.
