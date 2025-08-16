# FlowLock Architecture

## Overview

FlowLock is an agent-native UX contract and guardrails system that ensures AI agents and human developers maintain consistent, auditable delivery without hallucinations. It provides a single source of truth through `uxspec.json` and enforces contracts via deterministic audits.

## Core Components

### 1. UX Specification (uxspec.json)

The central contract file that defines:
- **Roles**: User types and their permissions
- **JTBD**: Jobs to be done per role
- **Entities**: Data models with fields and their properties
- **Screens**: UI screens with types, reads, forms, roles, and UI states
- **Flows**: User journeys through screens
- **Policies**: Optional business rules

### 2. Checks and Guardrails

Seven deterministic checks enforce the contract:

- **HONEST**: Ensures all screen reads are properly captured, derived, or external
- **UI**: Validates all screens declare empty/loading/error states
- **SCREEN**: Confirms all screens declare allowed roles
- **CREATABLE**: Verifies creatable entities have reachable detail screens
- **REACHABILITY**: Ensures success screens are reachable within 3 steps
- **STATE**: Validates state machine structures
- **SPEC**: Reports coverage metrics for roles and UI states

### 3. CLI Tool (uxcg)

Commands:
- `init`: Seeds a minimal spec
- `audit [--fix]`: Runs checks with optional pre-parse healing
- `diagrams`: Generates ER and flow diagrams
- `export <format>`: Exports specific artifact formats
- `watch`: Development mode with auto-refresh

### 4. Generated Artifacts

Always produced after audit:
- `er.mmd` / `er.svg`: Entity relationship diagrams
- `flow.mmd` / `flow.svg`: User flow diagrams
- `screens.csv`: Screen inventory
- `results.junit.xml`: Test results
- `gap_report.md`: Issues and fixes
- `acceptance_criteria.feature`: Gherkin scenarios

### 5. Agent Integration

Auto-generated command cards in `.claude/commands/`:
- `ux-contract-init.md`: Create/refine spec from docs
- `ux-guardrails-validate.md`: Fix audit failures
- `ux-generate-ui.md`: Scaffold UI components
- `flow-audit-fix.md`: Close gaps via spec edits

### 6. CI/CD Pipeline

GitHub Action workflow:
1. Builds packages in monorepo
2. Runs FlowLock audit
3. Uploads artifacts
4. Posts results to FlowLock Cloud
5. Comments on PRs with dashboard link

### 7. FlowLock Cloud

Self-hosted or SaaS service:
- **Endpoints**:
  - `GET /`: Health check
  - `POST /ingest`: Receive audit results
  - `GET /runs/:project`: Retrieve run history
  - `GET /events`: SSE stream for live updates
  - `GET /dashboard`: Web UI

## Data Flow

1. **Authoring**: Developer/agent creates `uxspec.json`
2. **Validation**: CLI runs audit checks
3. **Healing**: Auto-fix or agent proposes changes
4. **Artifacts**: Diagrams and reports generated
5. **CI**: Automated validation on every commit
6. **Cloud**: Results posted for dashboard visibility
7. **Iteration**: Gaps trigger fixes, cycle repeats

## Entity Field Types

Fields can be:
- **Required**: Must be provided
- **Derived**: System-generated with provenance
- **External**: From another system with source

## Screen Types

- `list`: Collection view
- `detail`: Single item view
- `form`: Data entry
- `dashboard`: Overview
- `success`: Completion state
- `error`: Failure state

## Extensibility

### Plugin SDK

Third-party checks implement:
```typescript
interface FlowlockCheck {
  id: string;
  name: string;
  run(spec: UXSpec): Promise<CheckResult|CheckResult[]>;
}
```

### Custom Domains

Add domain-specific validations via plugin architecture.

## Security

- No secrets in code (use environment variables)
- Bearer token authentication for Cloud
- Audit logs for all operations

## Best Practices

1. Keep IDs stable and use kebab-case
2. Mark external data sources explicitly
3. Include all three core UI states
4. Define roles before screens
5. Run audit before UI generation
6. Commit small, labeled changes