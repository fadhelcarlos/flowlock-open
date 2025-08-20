# FlowLock Quick Reference

## Installation
```bash
# CLI (global) - v0.5.0
npm install -g flowlock-uxcg@latest

# All packages (in project) - v0.4.1
npm install flowlock-uxspec@latest flowlock-runner@latest flowlock-checks-core@latest

# MCP Server (for Claude) - v0.3.0
npm install flowlock-mcp@latest
```

## Key Features
- **15 validation checks** (up from 7): Core (7) + Extended (5) + Runtime (3)
- **Enhanced schema**: JTBD, entity relations, routes, CTAs, state machines
- **5 Claude commands** (up from 4): New `/ux-enhance-spec`
- **Backward compatible**: All v2 specs work without changes

## CLI Commands
```bash
uxcg init                    # Initialize project
uxcg audit                   # Run validation
uxcg audit --fix            # Auto-heal issues
uxcg audit --verbose        # Show detailed debug output
uxcg debug <check>          # Debug specific check failures
uxcg debug creatable --entity=user  # Debug creatable for specific entity
uxcg diagrams               # Generate diagrams only
uxcg export junit           # Export test results
uxcg watch --cloud          # Dev mode with sync
uxcg agent --cloud <url>    # Connect to cloud
```

## uxspec.json Structure (Enhanced)
```json
{
  "version": "1.0.0",
  "project": "my-app",
  "name": "App Name",
  "description": "App description",
  "roles": [
    { "id": "admin", "name": "Admin", "permissions": ["create", "read", "update", "delete"] }
  ],
  "jtbd": [
    { "role": "admin", "tasks": ["Manage users"], "description": "Admin tasks" }
  ],
  "entities": [{
    "id": "user",
    "name": "User",
    "fields": [
      { "id": "id", "name": "ID", "type": "string", "required": true },
      { "id": "created", "name": "Created", "type": "date", 
        "derived": true, "provenance": "System timestamp" },
      { "id": "avatar", "name": "Avatar", "type": "url",
        "external": true, "source": "Gravatar" }
    ],
    "relations": [
      { "id": "orders", "to": "order", "kind": "1:many" }
    ]
  }],
  "screens": [{
    "id": "user-list",
    "name": "User List",
    "type": "list",
    "routes": ["/users"],
    "roles": ["admin"],
    "uiStates": ["empty", "loading", "error"],
    "lists": [{
      "id": "users",
      "reads": ["user.id", "user.name"],
      "sortable": true
    }],
    "ctas": [{
      "label": "Add User",
      "to": "user-create",
      "type": "primary"
    }]
  }],
  "flows": [{
    "id": "main-flow",
    "name": "Main Flow",
    "jtbd": "admin",
    "role": "admin",
    "entryStepId": "step1",
    "steps": [{
      "id": "step1",
      "screen": "user-list",
      "writes": ["user.email"],
      "transition": {
        "entity": "user",
        "from": "pending",
        "to": "active"
      }
    }],
    "success": {
      "screen": "user-detail",
      "message": "User created"
    }
  }],
  "states": [{
    "entity": "user",
    "allowed": ["pending", "active"],
    "initial": "pending",
    "transitions": [
      { "from": "pending", "to": "active", "trigger": "verify" }
    ]
  }],
  "glossary": [{
    "term": "system.timestamp",
    "definition": "Server timestamp",
    "formula": "new Date().toISOString()"
  }]
}
```

## Field Types
- `string` - Text
- `number` - Numeric (supports min/max)
- `boolean` - True/false
- `date` - Date/time
- `email` - Email address
- `url` - Web URL
- `text` - Long text
- `enum` - Enumeration (with enum array)

## Field Modifiers
- `required: true` - Must be provided
- `derived: true` + `provenance` - System generated
- `external: true` + `source` - From other system

## Screen Types
- `list` - Collection view
- `detail` - Single item
- `form` - Data entry
- `dashboard` - Overview
- `success` - Completion
- `error` - Failure

## Required UI States
- `empty` - No data
- `loading` - Fetching
- `error` - Failed

## 15 Validation Checks

### Core Checks (7)
| Check | ID | Purpose |
|-------|-----|---------|
| HONEST | `honest_reads` | Screens only read captured/derived/external fields |
| CREATABLE | `creatable_needs_detail` | Create forms need detail screens |
| REACHABILITY | `reachability` | Success screens reachable in ≤3 steps |
| UI | `ui_states` | All screens have empty/loading/error |
| STATE | `state_machines` | Valid state transitions |
| SCREEN | `screen` | All screens declare roles |
| SPEC | `spec_coverage` | Coverage percentages |

### Extended Checks (5)
| Check | ID | Purpose |
|-------|-----|---------|
| JTBD | `jtbd` | Jobs To Be Done mapped to flows |
| RELATIONS | `relations` | Entity relations are valid |
| ROUTES | `routes` | Screen routes are unique |
| CTAS | `ctas` | Navigation targets exist |
| RUNTIME_DETERMINISM | `runtime_determinism` | Guarantees reproducible audit results |

### Runtime Checks (3)
| Check | ID | Purpose |
|-------|-----|---------|
| INVENTORY | `inventory` | Validates DB/API/UI extraction against spec |
| DATABASE_VALIDATION | `database_validation` | Validates transactions, indexes, and pooling |
| MIGRATION_VALIDATION | `migration_validation` | Ensures safe, reversible database changes |

## Generated Artifacts (Enhanced)
```
artifacts/
├── er.svg                       # Entity diagram (with relations)
├── flow.svg                     # Flow diagram (with JTBD & CTAs)
├── screens.csv                  # Screen list (with routes & components)
├── entities.csv                 # Entity details (NEW)
├── flows.csv                    # Flow summary (NEW)
├── jtbd.csv                     # JTBD mapping (NEW)
├── results.junit.xml           # Test results (15 checks)
├── gap_report.md               # Issues found
├── acceptance_criteria.feature # Gherkin tests
├── er.mmd                      # Mermaid source
└── flow.mmd                    # Mermaid source
```

## Auto-Fix Capabilities
- Adds missing roles
- Ensures UI states
- Infers screen types
- Fixes structure
- Generates IDs
- Assigns roles

## GitHub Action
```yaml
- name: FlowLock Audit
  uses: ./action/uxcg-action
  with:
    cloud-url: ${{ secrets.FLOWLOCK_CLOUD_URL }}
    project-id: ${{ github.repository }}
```

## MCP Config (Claude Desktop)
```json
{
  "mcpServers": {
    "flowlock": {
      "command": "npx",
      "args": ["flowlock-mcp"]
    }
  }
}
```

## NPM Packages
| Package | Version | Install |
|---------|---------|---------|
| flowlock-uxspec | 0.6.0 | `npm i flowlock-uxspec` |
| flowlock-plugin-sdk | 0.6.0 | `npm i flowlock-plugin-sdk` |
| flowlock-checks-core | 0.6.0 | `npm i flowlock-checks-core` |
| flowlock-runner | 0.6.0 | `npm i flowlock-runner` |
| flowlock-uxcg | 0.9.1 | `npm i -g flowlock-uxcg` |
| flowlock-mcp | 0.5.0 | `npm i flowlock-mcp` |
| flowlock-inventory | 0.3.1 | `npm i flowlock-inventory` |
| flowlock-shared | 0.3.1 | `npm i flowlock-shared` |

## Common Patterns

### List → Create → Success
```json
{
  "flows": [{
    "steps": [
      { "screenId": "item-list" },
      { "screenId": "item-create" },
      { "screenId": "item-created" }
    ]
  }]
}
```

### Dashboard → Detail → Edit
```json
{
  "flows": [{
    "steps": [
      { "screenId": "dashboard" },
      { "screenId": "item-detail" },
      { "screenId": "item-edit" }
    ]
  }]
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | `npm install` |
| Audit fails | `uxcg audit --fix` |
| No diagrams | Install mermaid-cli |
| Permission error | Run as admin |
| Cloud offline | Check token/URL |

## Environment Variables
```bash
FLOWLOCK_CLOUD_URL=https://flowlock-cloud.onrender.com
FLOWLOCK_PROJECT_ID=my-project
FLOWLOCK_AUTH_TOKEN=secret-token
```

## Key Files
- `uxspec.json` - UX specification
- `artifacts/` - Generated files
- `.claude/commands/` - AI helpers
- `.github/workflows/` - CI/CD
