# FlowLock Runbook

## Quick Start for New Repositories

### 1. Install FlowLock

```bash
pnpm add -D flowlock-uxcg
```

Or from monorepo:
```bash
pnpm add -D ./packages/cli
```

### 2. Initialize Specification

```bash
npx uxcg init
```

This creates a minimal `uxspec.json` file.

### 3. Run First Audit

```bash
pnpm -w uxcg audit --fix
```

The `--fix` flag applies structural normalizations:
- Coerces roles to objects
- Infers screen types
- Ensures core UI states

### 4. Use Agent Commands

In your IDE with AI assistant:

1. **Create/refine contract**: Run `/ux-contract-init`
2. **Fix failures**: Run `/flow-audit-fix`
3. **Generate UI**: Run `/ux-generate-ui` (after green audit)

### 5. Verify Success

```bash
pnpm -w uxcg audit
```

Should show all checks green:
- ✅ HONEST
- ✅ CREATABLE
- ✅ REACHABILITY
- ✅ UI
- ✅ STATE
- ✅ SCREEN
- ✅ SPEC

## Setting Up CI/CD with Cloud

### 1. Add GitHub Action

Create `.github/workflows/flowlock-audit.yml`:

```yaml
name: FlowLock UX Audit
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
# ... (see full workflow in repo)
```

### 2. Configure Repository Secrets

In GitHub repository settings:

- `FLOWLOCK_CLOUD_URL`: Your Cloud instance URL
- `FLOWLOCK_PROJECT_ID`: Unique project identifier
- `FLOWLOCK_TOKEN`: Bearer token (if auth enabled)

**Note on Permissions**: For PR comments to work, ensure either:
- Repository Settings → Actions → General → Workflow permissions → "Read and write permissions"
- OR add a Personal Access Token (PAT) with `pull-requests: write` permission

### 3. Deploy FlowLock Cloud

#### Option A: Self-Host on Render

1. Fork the FlowLock repo
2. Connect to Render
3. Set environment variables:
   - `PORT`: 3000
   - `CLOUD_TOKEN`: Your secret token
   - `DB_PATH`: flowlock.db

#### Option B: Local Development

```bash
cd apps/ingest
pnpm install
tsx index.ts
```

### 4. Test Integration

Push a commit and verify:
1. Action runs successfully
2. Artifacts uploaded
3. Cloud receives payload
4. PR comment appears (on PRs)

## Common Operations

### Fix HONEST Check Failures

Product fields reading external data:
```json
{
  "id": "price",
  "type": "number",
  "external": true,
  "source": "catalog_api"
}
```

User fields derived from system:
```json
{
  "id": "id",
  "type": "string",
  "derived": true,
  "provenance": "system.uuid"
}
```

### Add New Screen

1. Add to `screens` array in `uxspec.json`
2. Include required fields:
   - `id`, `name`, `type`
   - `roles` (array of role IDs)
   - `uiStates` (at least ["empty", "loading", "error"])
3. Run audit to verify

### Create User Flow

```json
{
  "id": "user_onboarding",
  "name": "User Onboarding",
  "entryStepId": "step_1",
  "steps": [
    {
      "id": "step_1",
      "screenId": "welcome",
      "next": [{"targetStepId": "step_2"}]
    }
  ]
}
```

### Debug Audit Failures

1. Check `artifacts/gap_report.md` for details
2. Look for proposed fixes in the table
3. Apply changes to `uxspec.json`
4. Re-run audit

### Local Testing

Test without cloud:
```bash
# Run audit
pnpm -w uxcg audit

# Generate only diagrams
pnpm -w uxcg diagrams

# Watch mode for development
pnpm -w uxcg watch
```

Test cloud posting:
```bash
export FLOWLOCK_CLOUD_URL=http://localhost:3000
export FLOWLOCK_PROJECT_ID=my-project
export FLOWLOCK_TOKEN=secret-token

node tools/post_to_cloud.mjs
```

## Troubleshooting

### "Parser failed" Error

Run with `--fix` flag to auto-heal:
```bash
pnpm -w uxcg audit --fix
```

### Missing Artifacts

Ensure audit completes:
```bash
ls -la artifacts/
```

Should see: er.mmd, flow.mmd, screens.csv, etc.

### Cloud Connection Failed

Check environment variables:
```bash
echo $FLOWLOCK_CLOUD_URL
echo $FLOWLOCK_PROJECT_ID
```

Test with curl:
```bash
curl $FLOWLOCK_CLOUD_URL/healthz
```

### Agent Commands Not Found

CLI auto-creates on startup. Verify:
```bash
ls .claude/commands/
```

Should contain 4 markdown files.

## Advanced Configuration

### Custom Checks

Add to Runner configuration:
```javascript
import { Runner } from '@flowlock/runner';
import { myCustomCheck } from './checks';

const runner = new Runner({
  checks: [...coreChecks, myCustomCheck]
});
```

### Multiple Projects

Use different PROJECT_ID per repo:
```bash
export FLOWLOCK_PROJECT_ID=frontend-app
export FLOWLOCK_PROJECT_ID=backend-api
```

### Retention Policies

In Cloud deployment, configure:
- Keep last N runs
- Archive after X days
- Delete after Y days

## Monitoring

### Key Metrics

- Audit pass rate
- Time to green
- Gap count trends
- Most common failures

### Alerts

Set up notifications for:
- Audit failures on main branch
- Degradation in pass rate
- Cloud service downtime

## Migration Guide

### From Manual Specs

1. Export existing docs to markdown
2. Run `/ux-contract-init` with docs
3. Review generated spec
4. Iterate with `/flow-audit-fix`

### From Other Tools

1. Map entities to FlowLock format
2. Convert screens and flows
3. Add roles and UI states
4. Run audit and fix gaps