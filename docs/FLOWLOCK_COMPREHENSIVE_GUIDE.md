# FlowLock Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Package Documentation](#package-documentation)
   - [flowlock-uxspec](#flowlock-uxspec)
   - [flowlock-plugin-sdk](#flowlock-plugin-sdk)
   - [flowlock-checks-core](#flowlock-checks-core)
   - [flowlock-runner](#flowlock-runner)
   - [flowlock-uxcg (CLI)](#flowlock-uxcg-cli)
   - [flowlock-mcp](#flowlock-mcp)
4. [Getting Started](#getting-started)
5. [UX Specification Format](#ux-specification-format)
6. [Validation Checks](#validation-checks)
7. [CLI Commands](#cli-commands)
8. [Cloud Integration](#cloud-integration)
9. [MCP Server](#mcp-server)
10. [CI/CD Integration](#cicd-integration)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

FlowLock is an **agent-native UX contract and guardrails system** that ensures AI agents and human developers maintain consistent, auditable delivery without hallucinations. It provides a single source of truth through `uxspec.json` and enforces contracts via deterministic audits.

### Key Features
- **Specification-driven development** - Define your entire UX in a single JSON file
- **Comprehensive validation** - 15 validation checks across core, extended, and runtime categories
- **Graduated validation levels** - Flexible check behavior based on project maturity
- **Auto-healing** - Automatic fixes for common structural issues
- **Agent-friendly** - Built for AI agents with Claude/Cursor command cards
- **CI/CD ready** - GitHub Actions integration out of the box
- **Cloud dashboard** - Real-time monitoring and collaboration
- **MCP integration** - Model Context Protocol server for AI assistants

### Latest Versions (npm)
- `flowlock-uxspec`: 0.4.0
- `flowlock-plugin-sdk`: 0.4.0
- `flowlock-checks-core`: 0.4.0
- `flowlock-runner`: 0.4.0
- `flowlock-uxcg`: 0.4.0 (CLI)
- `flowlock-mcp`: 0.4.0

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        uxspec.json                          │
│  (Central UX Contract - Single Source of Truth)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
    ┌─────▼──────┐          ┌──────▼──────┐
    │  CLI Tool  │          │   Runner    │
    │   (uxcg)   │          │  (Engine)   │
    └─────┬──────┘          └──────┬──────┘
          │                         │
          │      ┌──────────────────┴──────────────────┐
          │      │                                     │
    ┌─────▼──────▼─────┐                    ┌─────────▼─────────┐
    │  Validation      │                    │   Artifact        │
    │  Checks (15)     │                    │   Generation      │
    └──────────────────┘                    └─────────┬─────────┘
                                                      │
                                            ┌─────────▼─────────┐
                                            │  Generated Files  │
                                            │  • Diagrams       │
                                            │  • Reports        │
                                            │  • Test Results   │
                                            └───────────────────┘
```

---

## Package Documentation

### flowlock-uxspec
**Version:** 0.4.0  
**Purpose:** Core schema definitions and validation using Zod

#### Key Exports
```typescript
// Schema Types
export type Role = { id: string; name: string; permissions?: string[] }
export type Field = { 
  id: string; 
  name: string; 
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'text';
  required?: boolean;
  derived?: boolean;    // System-generated field
  provenance?: string;  // How derived field is calculated
  external?: boolean;   // From external system
  source?: string;      // External system name
}
export type Entity = { id: string; name: string; fields: Field[] }
export type Screen = {
  id: string;
  name: string;
  type: 'list' | 'detail' | 'form' | 'dashboard' | 'success' | 'error';
  entityId?: string;
  forms?: Form[];
  reads?: string[];  // field IDs this screen displays
}
export type Flow = {
  id: string;
  name: string;
  entryStepId: string;
  steps: FlowStep[];
  roles?: string[];
}
export type UXSpec = {
  version: string;
  name: string;
  roles?: Role[];
  entities: Entity[];
  screens: Screen[];
  flows: Flow[];
  policies?: Policy[];
}

// Parser Function
export function parseSpec(json: unknown): UXSpec
```

**Installation:**
```bash
npm install flowlock-uxspec
```

---

### flowlock-plugin-sdk
**Version:** 0.4.0  
**Purpose:** Plugin interface for custom validation checks with graduated validation support

#### Key Exports
```typescript
export type CheckLevel = 'error' | 'warning' | 'info';
export type CheckStatus = 'pass' | 'fail' | 'skip';
export type ValidationLevel = 'strict' | 'standard' | 'lenient';

export interface CheckResult {
  id: string;
  level: CheckLevel;
  status: CheckStatus;
  message: string;
  ref?: string;  // Optional reference to problematic element
}

export interface FlowlockCheck {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'extended' | 'runtime';
  validationLevel?: ValidationLevel;
  run(spec: UXSpec): CheckResult | CheckResult[] | Promise<CheckResult | CheckResult[]>;
}
```

**Installation:**
```bash
npm install flowlock-plugin-sdk
```

---

### flowlock-checks-core
**Version:** 0.4.0  
**Purpose:** Comprehensive validation checks (15 total) with graduated validation support

#### Validation Checks (15 Total)

##### Core Checks (7)
These fundamental checks ensure basic UX consistency:

1. **HONEST** (`honest`)
   - Ensures screens only read fields that are:
     - Captured by forms in the same flow
     - Marked as `derived` with `provenance`
     - Marked as `external` with `source`
   - Validation levels:
     - `strict`: All reads must have valid sources
     - `standard`: Warns for missing sources
     - `lenient`: Info-only reporting

2. **CREATABLE** (`creatable`)
   - Every entity with a create form must have:
     - A detail screen to view created items
     - A discoverable path to reach that screen
   - Validation levels:
     - `strict`: All creatable entities need detail screens
     - `standard`: Warns for missing detail screens
     - `lenient`: Info-only suggestions

3. **REACHABILITY** (`reachability`)
   - Success screens must be reachable from flow entry
   - Maximum 3 steps by default (configurable)
   - Validation levels:
     - `strict`: Max 3 steps enforced
     - `standard`: Max 5 steps allowed
     - `lenient`: Max 7 steps, warnings only

4. **UI** (`ui`)
   - All screens must declare UI states:
     - `empty` - No data to display
     - `loading` - Fetching data
     - `error` - Error occurred
   - Validation levels:
     - `strict`: All states required
     - `standard`: Loading/error required
     - `lenient`: Suggests states only

5. **STATE** (`stateMachine`)
   - Validates state machine structures
   - Ensures terminal states exist
   - Validates transitions
   - Validation levels:
     - `strict`: Complete state machines required
     - `standard`: Basic validation only
     - `lenient`: Optional state machines

6. **SCREEN** (`screen`)
   - All screens must declare allowed roles
   - Ensures role-based access control
   - Validation levels:
     - `strict`: Roles required on all screens
     - `standard`: Warns for missing roles
     - `lenient`: Suggests role additions

7. **SPEC** (`spec`)
   - Reports coverage percentages:
     - % of entities/fields used in forms
     - % of screens with roles defined
     - % of screens with UI states
   - Always informational regardless of validation level

##### Extended Checks (5)
These checks provide deeper validation for mature projects:

8. **JTBD** (`jtbd`)
   - Validates all Jobs To Be Done are addressed by flows
   - Ensures flows link back to JTBD roles
   - Validation levels:
     - `strict`: All JTBD must have flows
     - `standard`: Warns for unaddressed JTBD
     - `lenient`: Info-only reporting

9. **RELATIONS** (`relations`)
   - Validates entity relationships are properly defined
   - Checks for circular references
   - Ensures target entities exist
   - Validation levels:
     - `strict`: All relations must be valid
     - `standard`: Warns for issues
     - `lenient`: Suggests improvements

10. **ROUTES** (`routes`)
    - Ensures screen routes are unique
    - Validates route format (must start with /)
    - Checks route parameters match entity fields
    - Validation levels:
      - `strict`: Unique, valid routes required
      - `standard`: Warns for duplicates
      - `lenient`: Suggests route patterns

11. **CTAS** (`ctas`)
    - Validates Call-to-Actions point to valid screens
    - Detects orphaned screens with no incoming CTAs
    - Warns about self-referencing CTAs
    - Validation levels:
      - `strict`: All CTAs must be valid
      - `standard`: Warns for broken CTAs
      - `lenient`: Info-only suggestions

12. **RUNTIME_DETERMINISM** (`runtimeDeterminism`)
    - Verifies deterministic audits across runs
    - Computes SHA-256 hash of spec + inventory
    - Ensures same inputs always yield same results
    - Critical for CI/CD pipeline stability
    - Always runs at strict level (determinism is binary)

##### Runtime Checks (3)
These checks validate against actual implementation:

13. **INVENTORY** (`inventory`)
    - Ensures runtime inventory was extracted
    - Validates DB entities match spec entities
    - Checks API endpoints coverage
    - Verifies UI reads/writes alignment
    - Validation levels:
      - `strict`: Full inventory match required
      - `standard`: Warns for mismatches
      - `lenient`: Suggests alignments

14. **DATABASE_VALIDATION** (`databaseValidation`)
    - Validates transaction boundaries
    - Checks for missing indexes on frequently queried fields
    - Verifies auth table integration with roles
    - Validates connection pooling configuration
    - Ensures data integrity constraints
    - Validation levels:
      - `strict`: All DB patterns enforced
      - `standard`: Critical issues only
      - `lenient`: Performance suggestions

15. **MIGRATION_VALIDATION** (`migrationValidation`)
    - Validates migration safety and reversibility
    - Checks for transaction support in DDL operations
    - Verifies rollback scripts exist
    - Ensures data integrity in migrations
    - Validates migration dependencies
    - Validation levels:
      - `strict`: Full migration safety required
      - `standard`: Critical safety checks only
      - `lenient`: Best practice suggestions

#### Graduated Validation Configuration

Set validation levels in `flowlock.config.json`:
```json
{
  "validationLevels": {
    "default": "standard",
    "checks": {
      "honest": "strict",
      "creatable": "standard",
      "reachability": "lenient",
      "inventory": "strict"
    }
  }
}
```

Or via CLI:
```bash
# Set default level
uxcg audit --validation-level standard

# Override specific checks
uxcg audit --strict honest,inventory --lenient reachability
```

**Installation:**
```bash
npm install flowlock-checks-core
```

---

### flowlock-runner
**Version:** 0.4.0  
**Purpose:** Orchestrates checks and generates artifacts with graduated validation support

#### Key Features
- Runs all 15 validation checks
- Supports graduated validation levels
- Generates Mermaid diagrams (ER & Flow)
- Creates CSV reports
- Produces JUnit XML for CI
- Writes gap reports and acceptance criteria

#### API
```typescript
import { Runner } from "flowlock-runner";

// From file with config
const runner = await Runner.fromFile("uxspec.json", {
  validationLevel: 'standard',
  checkOverrides: {
    honest: 'strict',
    reachability: 'lenient'
  }
});

// From object
const runner = new Runner({ 
  spec: mySpecObject,
  validationLevel: 'standard'
});

// Run checks
const result = await runner.run();

// Run and save artifacts
const result = await runner.runAndSave("artifacts");
```

**Generated Artifacts:**
- `er.mmd` / `er.svg` - Entity relationship diagram
- `flow.mmd` / `flow.svg` - User flow diagram  
- `screens.csv` - Screen inventory
- `results.junit.xml` - Test results
- `gap_report.md` - Issues and recommended fixes
- `acceptance_criteria.feature` - Gherkin scenarios
- `validation_report.json` - Detailed check results with levels

**Installation:**
```bash
npm install flowlock-runner
```

---

### flowlock-uxcg (CLI)
**Version:** 0.4.0  
**Purpose:** Command-line interface for FlowLock with full graduated validation support

#### Commands

##### `uxcg init`
Initialize a new FlowLock project with enhanced features
- Interactive prompts for project setup
- Options for scaffolding new projects
- Adds Claude/Cursor command cards
- Sets up GitHub Actions workflow
- Adds npm scripts (audit, fix, watch)
- Optional Husky git hooks for pre-commit validation
- Creates `uxspec/glossary.yml` and `glossary.md`
- Enhanced starter spec with JTBD, relations, CTAs, and more
- Configures default validation levels

##### `uxcg init-existing`
Initialize FlowLock in an existing project (aliases: `wire`)
- Creates `flowlock.config.json` with sensible defaults
- Adds Claude/Cursor command cards
- Updates package.json with FlowLock scripts
- Non-destructive - won't overwrite existing files
- Perfect for adding FlowLock to existing codebases

##### `uxcg inventory [options]`
Extract runtime inventory from your codebase (alias: `inv`)
- `--config <path>` - Path to flowlock.config.json (default: flowlock.config.json)
- `--out <file>` - Output file path (default: artifacts/runtime_inventory.json)
- `--db-only` - Extract only database entities
- `--api-only` - Extract only API endpoints
- `--ui-only` - Extract only UI reads/writes
- Analyzes:
  - Database schemas (Prisma, TypeORM, Drizzle, etc.)
  - API endpoints (OpenAPI, JSDoc, route files)
  - UI components (React, Vue, Angular)

##### `uxcg audit [options]`
Run validation checks and generate artifacts
- `--fix` - Enable auto-healing for common issues
- `--inventory` - Require runtime inventory (fails if missing/stale)
- `--only <checks>` - Run only specific checks (comma-separated)
- `--skip <checks>` - Skip specific checks (comma-separated)
- `--validation-level <level>` - Set default validation level (strict/standard/lenient)
- `--strict <checks>` - Apply strict validation to specific checks
- `--standard <checks>` - Apply standard validation to specific checks  
- `--lenient <checks>` - Apply lenient validation to specific checks
- `--json` - Output results as JSON
- `--quiet` - Suppress non-error output

##### `uxcg debug [check]`
Debug specific validation checks or the entire system
- Shows detailed execution trace for checks
- Helpful for understanding validation failures
- Displays validation level per check

##### `uxcg diagrams`
Generate only diagram artifacts (ER & Flow)

##### `uxcg export <format>`
Export specific artifact formats:
- `junit` - Test results XML
- `csv` - Screen inventory
- `svg` - Diagram images
- `validation` - Validation report with levels

##### `uxcg watch [options]`
Watch mode for development
- `--cloud` - Enable cloud sync
- `--cloudUrl <url>` - Cloud endpoint
- `--projectId <id>` - Project identifier
- `--validation-level <level>` - Set validation level for watch mode

##### `uxcg agent [options]`
Connect to FlowLock Cloud for remote control
- `--cloud <url>` - Cloud base URL
- `--project <id>` - Project ID
- `--token <token>` - Bearer token

**Installation:**
```bash
# Global installation (recommended)
npm install -g flowlock-uxcg

# Then use anywhere
uxcg init
uxcg audit
```

---

### flowlock-mcp
**Version:** 0.4.0  
**Purpose:** Model Context Protocol server for AI assistants with graduated validation support

#### Features
MCP server that exposes FlowLock functionality to AI assistants like Claude Desktop.

#### Available Tools
1. **ping** - Health check
2. **audit** - Run FlowLock audit (with optional --fix and validation levels)
3. **diagrams** - Generate diagram artifacts
4. **init** - Initialize FlowLock project
5. **write_claude_commands** - Ensure .claude/commands exist
6. **debug** - Debug specific checks or validation

#### Setup for Claude Desktop
Add to your Claude Desktop config:
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

**Installation:**
```bash
npm install flowlock-mcp
```

---

## Getting Started

### Quick Start
```bash
# 1. Install the CLI globally
npm install -g flowlock-uxcg

# 2. Initialize a new project
uxcg init

# 3. Edit uxspec.json to define your UX

# 4. Run audit to validate
uxcg audit

# 5. Fix any issues (or use --fix for auto-healing)
uxcg audit --fix

# 6. Adjust validation levels as needed
uxcg audit --validation-level lenient
```

### Project Setup Options

#### Option 1: Add to Existing Project
```bash
cd your-project
uxcg init-existing
```

#### Option 2: Scaffold New Project
```bash
uxcg init
# Choose "Scaffold a new project"
# Select template (Blank or Next.js + Tailwind)
```

---

## UX Specification Format

### Enhanced Features

FlowLock supports comprehensive UX specification features:

#### Core Schema Fields

1. **JTBD (Jobs To Be Done)**
   - Track user goals and tasks
   - Link flows to specific job outcomes
   
2. **Entity Relations**
   - Define relationships between entities (1:1, 1:many, many:1, many:many)
   - Support ordered and cascade options
   
3. **Enhanced Screen Components**
   - **Forms**: Track explicit writes to fields
   - **Cards**: Display components with specific reads
   - **Lists**: Configurable tables with sorting, filtering, pagination
   - **CTAs**: Navigation buttons with types (primary, secondary, link)
   
4. **Routes**
   - Define URL patterns for each screen
   - Support dynamic parameters (e.g., `/users/:id`)
   
5. **State Machines**
   - Define allowed states for entities
   - Specify transitions with triggers
   - Mark initial and terminal states
   
6. **Glossary**
   - Document derived fields with formulas
   - Define external data sources
   - Track business terminology

### Complete Example
```json
{
  "version": "1.0.0",
  "project": "user-mgmt",
  "name": "User Management System",
  "description": "Comprehensive user management with all FlowLock features",
  "roles": [
    { "id": "admin", "name": "Administrator", "permissions": ["create", "read", "update", "delete"] },
    { "id": "user", "name": "Regular User", "permissions": ["read:own", "update:own"] }
  ],
  "jtbd": [
    {
      "role": "admin",
      "tasks": ["Manage user accounts", "View system reports", "Configure settings"],
      "description": "System administration tasks"
    }
  ],
  "entities": [
    {
      "id": "user",
      "name": "User",
      "fields": [
        { "id": "id", "name": "ID", "type": "string", "required": true },
        { "id": "email", "name": "Email", "type": "email", "required": true },
        { "id": "name", "name": "Name", "type": "string", "required": true },
        { "id": "createdAt", "name": "Created At", "type": "date", 
          "derived": true, "provenance": "System timestamp on creation" },
        { "id": "avatar", "name": "Avatar URL", "type": "url", 
          "external": true, "source": "Gravatar API" }
      ]
    }
  ],
  "screens": [
    {
      "id": "user-list",
      "name": "User List",
      "type": "list",
      "entityId": "user",
      "reads": ["user.id", "user.email", "user.name"],
      "roles": ["admin", "user"],
      "uiStates": ["empty", "loading", "error"]
    },
    {
      "id": "user-create",
      "name": "Create User",
      "type": "form",
      "entityId": "user",
      "forms": [{
        "id": "create-form",
        "entityId": "user",
        "type": "create",
        "fields": [
          { "fieldId": "email", "label": "Email Address" },
          { "fieldId": "name", "label": "Full Name" }
        ]
      }],
      "roles": ["admin"],
      "uiStates": ["loading", "error"]
    },
    {
      "id": "user-created",
      "name": "User Created Successfully",
      "type": "success",
      "roles": ["admin"],
      "uiStates": []
    }
  ],
  "flows": [
    {
      "id": "create-user-flow",
      "name": "Create User Flow",
      "entryStepId": "step1",
      "steps": [
        {
          "id": "step1",
          "screenId": "user-list",
          "next": [{ "targetStepId": "step2" }]
        },
        {
          "id": "step2",
          "screenId": "user-create",
          "next": [{ "targetStepId": "step3" }]
        },
        {
          "id": "step3",
          "screenId": "user-created"
        }
      ],
      "roles": ["admin"]
    }
  ]
}
```

---

## Validation Checks

### Check Categories and Severity
- **Core Checks (7)** - Fundamental UX consistency
- **Extended Checks (5)** - Deeper validation for mature projects  
- **Runtime Checks (3)** - Validation against implementation

### Graduated Validation Levels
Each check can operate at three levels:
- **strict** - Errors fail the audit, enforce all rules
- **standard** - Balance between strictness and flexibility
- **lenient** - Warnings/info only, never fails audit

### Auto-Healing with `--fix`
The audit command with `--fix` flag automatically:
1. **Adds missing roles** - Ensures top-level roles exist
2. **Converts string roles to objects** - Proper role structure
3. **Infers screen types** - Based on naming patterns
4. **Ensures UI states** - Adds empty/loading/error
5. **Generates IDs from names** - Creates missing IDs
6. **Adds roles to screens** - Copies from top-level if missing

### Example Output
```bash
$ uxcg audit --validation-level standard

🔍 Running FlowLock audit (validation: standard)...

📋 Core Checks (7)
  ✅ HONEST - All screen reads are properly captured
  ✅ CREATABLE - All entities have detail screens
  ✅ REACHABILITY - Success screens reachable
  ⚠️  UI - Screen 'user-list' missing UI state: error [standard]
  ✅ STATE - State machines valid
  ✅ SCREEN - All screens have roles
  ℹ️  SPEC - Coverage: Roles 75%, UI states 50%

📋 Extended Checks (5)
  ✅ JTBD - All jobs addressed
  ✅ RELATIONS - Entity relationships valid
  ⚠️  ROUTES - Duplicate route: /users [standard]
  ✅ CTAS - All CTAs valid
  ✅ RUNTIME_DETERMINISM - Audit deterministic

📋 Runtime Checks (3)
  ⚠️  INVENTORY - DB mismatch: user.lastLogin [standard]
  ✅ DATABASE_VALIDATION - DB patterns valid
  ✅ MIGRATION_VALIDATION - Migrations safe

Summary: 12 passed, 3 warnings, 0 errors

Artifacts generated:
  • artifacts/er.svg
  • artifacts/flow.svg
  • artifacts/screens.csv
  • artifacts/results.junit.xml
  • artifacts/gap_report.md
  • artifacts/validation_report.json

✅ Audit passed with warnings
```

---

## Cloud Integration

### FlowLock Cloud Features
- Real-time dashboard
- Audit history tracking
- PR comment integration
- Team collaboration
- SSE live updates
- Validation level tracking

### Agent Mode
Connect your local environment to cloud:
```bash
uxcg agent --cloud https://flowlock-cloud.onrender.com --project my-project
```

The agent will:
1. Poll for pending commands
2. Execute audit/diagrams remotely
3. Stream results back to cloud
4. Stay connected for live commands

### Cloud Endpoints
- `POST /ingest` - Submit audit results
- `GET /runs/:project` - Get run history
- `GET /dashboard` - Web UI
- `GET /events` - SSE stream

---

## MCP Server

### Configuration
Add to Claude Desktop config (`~/AppData/Roaming/Claude/claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "flowlock": {
      "command": "node",
      "args": ["C:/path/to/flowlock-mcp/dist/server.js"],
      "cwd": "C:/your/project"
    }
  }
}
```

### Using with Claude
Once configured, Claude can:
- Initialize FlowLock projects
- Run audits with graduated validation
- Generate diagrams
- Apply fixes automatically
- Debug specific checks

---

## CI/CD Integration

### GitHub Actions
```yaml
name: FlowLock Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: FlowLock Audit
        uses: ./action/uxcg-action
        with:
          validation-level: ${{ github.ref == 'refs/heads/main' && 'strict' || 'standard' }}
          cloud-url: ${{ secrets.FLOWLOCK_CLOUD_URL }}
          project-id: ${{ github.repository }}
          auth-token: ${{ secrets.FLOWLOCK_TOKEN }}
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: flowlock-artifacts
          path: artifacts/
```

### GitLab CI
```yaml
flowlock_audit:
  script:
    - npm install -g flowlock-uxcg
    - |
      if [ "$CI_COMMIT_BRANCH" = "main" ]; then
        uxcg audit --validation-level strict
      else
        uxcg audit --validation-level standard
      fi
  artifacts:
    paths:
      - artifacts/
    reports:
      junit: artifacts/results.junit.xml
```

---

## Best Practices

### 1. Specification Design
- **Use consistent IDs** - kebab-case throughout
- **Define roles first** - Before screens and flows
- **Mark external data** - Always specify source
- **Document provenance** - For all derived fields
- **Include all UI states** - empty/loading/error minimum

### 2. Development Workflow
1. Start with `uxcg init`
2. Define entities and fields
3. Create screens with proper types
4. Map out flows
5. Run `uxcg audit --fix` frequently
6. Commit small, focused changes

### 3. Graduated Validation Strategy
- **Early Development**: Use `lenient` to focus on structure
- **Pre-Production**: Switch to `standard` for balance
- **Production**: Use `strict` for maximum safety
- **Legacy Projects**: Start `lenient`, gradually increase

### 4. Field Types
- **Required fields** - User must provide
- **Derived fields** - System calculates (needs provenance)
- **External fields** - From other systems (needs source)

### 5. Screen Types
- `list` - Collection views
- `detail` - Single item display
- `form` - Data entry
- `dashboard` - Overview/metrics
- `success` - Completion confirmation
- `error` - Failure states

### 6. Agent Integration
- Use Claude command cards (`.claude/commands/`)
- Let agents run `audit --fix` for auto-healing
- Configure appropriate validation levels
- Review agent-proposed spec changes
- Maintain audit trail in git

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors
```bash
# Reinstall dependencies
pnpm install --no-frozen-lockfile
# or
npm install
```

#### 2. Audit failures after spec changes
```bash
# Use auto-fix first
uxcg audit --fix

# Try lenient validation during development
uxcg audit --validation-level lenient

# Then manually address remaining issues
```

#### 3. Diagram generation fails
- Ensure Mermaid CLI is installed: `npm install -g @mermaid-js/mermaid-cli`
- Or use the `.mmd` source files directly

#### 4. Permission errors on Windows
- Run terminal as Administrator
- Or use WSL/Git Bash

#### 5. Cloud connection issues
- Check firewall/proxy settings
- Verify auth token is valid
- Ensure project ID matches

### Debug Mode
```bash
# Debug specific check
uxcg debug honest

# Debug all checks
uxcg debug

# Verbose output
DEBUG=* uxcg audit

# Check version
uxcg --version
```

---

## Migration Guide

### From Earlier Versions to 0.4.x
1. Update all packages to 0.4.x
2. Run `uxcg audit --fix` to update spec structure
3. Configure validation levels in `flowlock.config.json`
4. Review generated `.claude/commands/` files
5. Update CI/CD configs to use validation levels

### Validation Level Migration
```json
// Add to flowlock.config.json
{
  "validationLevels": {
    "default": "standard",
    "checks": {
      // Customize per check as needed
      "honest": "strict",
      "inventory": "strict",
      "reachability": "lenient"
    }
  }
}
```

---

## Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: This guide and architecture docs
- **Examples**: Check `/examples` directory
- **Community**: Discussions and Q&A on GitHub

---

## License

MIT License - See LICENSE file for details

---

*Last updated: January 2025*
*FlowLock v0.4.0*