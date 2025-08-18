# FlowLock Quick Reference

## Installation
```bash
# CLI (global)
npm install -g flowlock-uxcg

# All packages (in project)
npm install flowlock-uxspec flowlock-runner flowlock-checks-core

# MCP Server (for Claude)
npm install flowlock-mcp
```

## CLI Commands
```bash
uxcg init                    # Initialize project
uxcg audit                   # Run validation
uxcg audit --fix            # Auto-heal issues
uxcg diagrams               # Generate diagrams only
uxcg export junit           # Export test results
uxcg watch --cloud          # Dev mode with sync
uxcg agent --cloud <url>    # Connect to cloud
```

## uxspec.json Structure
```json
{
  "version": "1.0.0",
  "name": "App Name",
  "roles": [
    { "id": "admin", "name": "Admin" }
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
    ]
  }],
  "screens": [{
    "id": "user-list",
    "name": "User List",
    "type": "list",
    "reads": ["user.id", "user.name"],
    "roles": ["admin"],
    "uiStates": ["empty", "loading", "error"]
  }],
  "flows": [{
    "id": "main-flow",
    "name": "Main Flow",
    "entryStepId": "step1",
    "steps": [{
      "id": "step1",
      "screenId": "user-list",
      "next": [{ "targetStepId": "step2" }]
    }]
  }]
}
```

## Field Types
- `string` - Text
- `number` - Numeric
- `boolean` - True/false
- `date` - Date/time
- `email` - Email address
- `url` - Web URL
- `text` - Long text

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

## 7 Core Checks

| Check | ID | Purpose |
|-------|-----|---------|
| HONEST | `honest_reads` | Screens only read captured/derived/external fields |
| CREATABLE | `creatable_needs_detail` | Create forms need detail screens |
| REACHABILITY | `reachability` | Success screens reachable in ≤3 steps |
| UI | `ui_states` | All screens have empty/loading/error |
| STATE | `state_machines` | Valid state transitions |
| SCREEN | `screen` | All screens declare roles |
| SPEC | `spec_coverage` | Coverage percentages |

## Generated Artifacts
```
artifacts/
├── er.svg                       # Entity diagram
├── flow.svg                     # Flow diagram
├── screens.csv                  # Screen list
├── results.junit.xml           # Test results
├── gap_report.md               # Issues found
└── acceptance_criteria.feature # Gherkin tests
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
| flowlock-uxspec | 0.2.1 | `npm i flowlock-uxspec` |
| flowlock-plugin-sdk | 0.2.1 | `npm i flowlock-plugin-sdk` |
| flowlock-checks-core | 0.2.1 | `npm i flowlock-checks-core` |
| flowlock-runner | 0.2.1 | `npm i flowlock-runner` |
| flowlock-uxcg | 0.2.1 | `npm i -g flowlock-uxcg` |
| flowlock-mcp | 0.1.1 | `npm i flowlock-mcp` |

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
