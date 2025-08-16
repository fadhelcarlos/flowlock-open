# FlowLock — Agent-Native UX Contracts & Guardrails

## 1) Big picture (what FlowLock is)

FlowLock is a small set of conventions, checks, and tools that turn a repo into a UX contract that AI agents (and humans) can trust.

**Single source of truth:** `uxspec.json` describes roles, JTBD, entities, screens, and flows.

**Guardrails:** a deterministic audit (HONEST, UI, SCREEN, STATE, CREATABLE, REACHABILITY, SPEC) that enforces the contract against the spec.

**Agent-native:** IDE agents (Claude Code, Cursor, Copilot, etc.) get command cards and prompts that:
- Create/refine the contract from your docs/code,
- Auto-heal failing audits, and
- Scaffold consistent UI stubs after the spec is green.

**Always-on diagrams & artifacts:** ER + Flow diagrams (Mermaid), screens CSV, JUnit, acceptance criteria, gap report.

**CI gating + Cloud:** Audits run in CI, post artifacts to a simple FlowLock Cloud (self-host or SaaS). A dashboard shows history & artifacts; SSE/long polling supports live updates.

**Who it's for:** product-minded founders, PMs, and devs who work with AI assistants and want repeatable, auditable delivery without runaway hallucinations.

## 2) System goals and non-goals

### Goals

- **Be frictionless:** one file (`uxspec.json`) + one CLI (`uxcg audit`) + IDE agent commands.
- **Be agent-first:** every failure/gap results in clear prompts + diffs agents can apply safely.
- **Be deterministic:** checks are repeatable, artifacts are stable, CI is binary (pass/fail).
- **Be observable:** artifacts and audit results are always produced & posted.
- **Be extensible:** plugin SDK for new checks/domains.

### Non-goals

- We don't invent your backend; we describe data contracts and UI obligations.
- We're not a UI framework; generated scaffolds are minimal placeholders honoring the contract.

## 3) Core artifacts & contracts

### uxspec.json (contract)

#### Top-level

- `version`: string
- `name`: string
- `roles`: `Array<{ id: string; name: string; permissions?: string[] }>`
- `jtbd`: `Record<RoleId, string[]>` (optional but recommended)
- `entities`: `UXEntity[]`
- `screens`: `UXScreen[]`
- `flows`: `UXFlow[]`
- `policies?`: `UXPolicy[]`

#### Entities

```typescript
type UXField = {
  id: string; name: string; type: 'string'|'number'|'email'|'date'|'text'|'boolean'|'json';
  required?: boolean;
  derived?: boolean; provenance?: string; // when derived
  external?: boolean; source?: string;    // when coming from another system
}
type UXEntity = { id: string; name: string; fields: UXField[] }
```

#### Screens

```typescript
type ScreenType = 'list'|'detail'|'form'|'dashboard'|'success'|'error';

type UXForm = {
  id: string; entityId: string;
  type: 'create'|'update';
  fields: Array<{ fieldId: string; label?: string; required?: boolean }>;
}

type UXScreen = {
  id: string; name: string; type: ScreenType;
  entityId?: string;
  reads?: string[];    // 'entity.field'
  forms?: UXForm[];
  roles: string[];     // required
  uiStates: Array<'empty'|'loading'|'error'|string>; // at least those 3
}
```

#### Flows

```typescript
type UXFlowStepLink = { targetStepId: string; condition?: string }
type UXFlowStep = { id: string; screenId: string; next?: UXFlowStepLink[] }
type UXFlow = { id: string; name: string; entryStepId: string; steps: UXFlowStep[]; roles?: string[] }
```

## 4) End-to-end lifecycle

### Authoring

1. Agent runs `/ux-contract-init` to seed/refine `uxspec.json` from README/PRD/code.
2. You run `pnpm -w uxcg audit`.
3. If parser fails, the healer normalizes structure (e.g., autotype missing screen types, ensure screen roles and core uiStates).

### Audit & gap reporting

- **Checks run:** HONEST / UI / SCREEN / CREATABLE / REACHABILITY / STATE / SPEC.
- **Artifacts emitted:** `er.mmd`/`er.svg`, `flow.mmd`/`flow.svg`, `screens.csv`, `results.junit.xml`, `gap_report.md`, `acceptance_criteria.feature`.

### Healing

Agent runs `/ux-guardrails-validate` or `/flow-audit-fix` to propose diffs to `uxspec.json` (e.g., mark `product.price` external with `source: catalog_api` or mark fields derived with provenance).

### Scaffolding

After green audit, `/ux-generate-ui` outputs minimal screen components honoring roles, uiStates, and data shape (no backend calls).

### CI & Cloud

GitHub Action runs audit on PR/Push, uploads artifacts, posts a JUnit summary to FlowLock Cloud (self-host or SaaS). PR comment links to `/dashboard?project=…`.

### Observe & iterate

Dashboard shows runs. Subsequent gaps trigger agent fixes; diagrams stay current.

## 5) Production-ready verification checklist (objective)

### Local

- [ ] `pnpm -w uxcg audit` on a valid repo exits with code 0 and prints:
  - "✅ Audit completed successfully"

- [ ] The following files exist after audit:
  - [ ] `artifacts/er.mmd` and `artifacts/er.svg`
  - [ ] `artifacts/flow.mmd` and `artifacts/flow.svg`
  - [ ] `artifacts/screens.csv`
  - [ ] `artifacts/results.junit.xml` (with reasonable test counts)
  - [ ] `artifacts/gap_report.md` (empty or lists issues)
  - [ ] `artifacts/acceptance_criteria.feature`

- [ ] If `uxspec.json` is malformed, `pnpm -w uxcg audit --fix`:
  - [ ] applies a pre-parse normalization (no crash),
  - [ ] prints a list of changes, then proceeds to either pass or produce actionable gaps.

- [ ] `.claude/commands` exists with:
  - [ ] `ux-contract-init.md`, `ux-guardrails-validate.md`, `ux-generate-ui.md`, `flow-audit-fix.md`.

### CI

- [ ] GitHub Action runs `pnpm -r --filter "./packages/*" build` then `pnpm -w uxcg audit` on PRs and main pushes.
- [ ] Action uploads artifacts via `actions/upload-artifact`.
- [ ] Action POSTs JSON payload to Cloud `/ingest` (200 OK).
- [ ] On PRs, a comment appears: "FlowLock: audit complete → <dashboard URL>".

### Cloud

- [ ] Service starts with `tsx apps/ingest/index.ts`, logs `FlowLock Cloud listening on :<port>`.
- [ ] `GET /` returns `ok`, `GET /healthz` returns `{ ok: true }`.
- [ ] `POST /ingest` with `Authorization: Bearer <token>` returns `{ ok: true }` and stores a row.
- [ ] `GET /runs/<project>` returns the last N rows with payloads.
- [ ] `GET /events?project=<id>` streams SSE (`hello`, `ping`, `run` on new ingest).
- [ ] `GET /dashboard?project=<id>` renders a readable UI (light/dark) and shows runs; auto-refresh 10s or via SSE.

### Mermaid

- [ ] `er.mmd` and `flow.mmd` are valid Mermaid text.
- [ ] If `mmdc` is installed, `er.svg` and `flow.svg` are fully rendered.
- [ ] If `mmdc` is absent, fallback produces an SVG wrapper that embeds the Mermaid text (so nothing is silently missing).

### Security

- [ ] Cloud rejects unauthorized ingest if `CLOUD_TOKEN` is set.
- [ ] No long timers cause warnings (heartbeat 15s; timer clamp shim present).

## 6) Technical design (how to build/extend each part)

### 6.1 Packages (monorepo)

#### packages/uxspec

- Parser & schema (Zod or equivalent) for `uxspec.json`.
- Throws `ParseError` with `details[]` (path, expected/received) for CI friendly failures.

#### packages/checks-core

- Implement HONEST / UI / SCREEN / STATE / CREATABLE / REACHABILITY / SPEC.
- Each check exports `{ id, name, run(spec): CheckResult | CheckResult[] }`.

#### packages/plugin-sdk

- Types & minimal runtime to build third-party checks.
- Consumers can add checks via Runner config.

#### packages/runner

- `Runner.fromFile(specPath)` → parses & loads.
- `Runner.run()` → returns checkResults + artifacts (text).
- `Runner.runAndSave(outputDir="artifacts")` → writes:
  - `er.mmd`, `flow.mmd` (always)
  - `er.svg`, `flow.svg` (best-effort render via Mermaid-CLI; fallback to SVG with embedded text)
  - `screens.csv`
  - `results.junit.xml`
  - `gap_report.md`
  - `acceptance_criteria.feature`

#### packages/cli

**Commands:**
- `init` (seed a minimal spec)
- `audit [--fix]`
  - `--fix`: pre-parse healer runs first without inventing semantics (just structure):
    - ensure top-level roles as objects `{ id, name }` (coerce from strings)
    - infer missing `screen.type` from id or forms presence (`*_detail` → `detail`, presence of forms → `form`, `*_success` → `success`)
    - ensure every screen has roles and at least `["empty","loading","error"]` uiStates
    - proceed to parse & run checks
    - print a `🩺 Pre-parse fix applied:` section with specific, deterministic mutations
- `diagrams` (emit only diagrams)
- `export <format>` (e.g., csv, junit, svg)
- `watch [--cloud --cloudUrl --projectId]` (local dev: re-audit on change; optional cloud post)

**Agent bootstrap:** at CLI startup, ensure `.claude/commands/*.md` exist (idempotent).

**Artifact printout:** dynamically lists actual files present.

### Checks (exact semantics)

- **HONEST:** every `screen.reads` of `entity.field` must be captured in-flow (created/updated on a prior step), or derived with provenance, or external with source. Otherwise fail.
- **UI:** each screen declares uiStates (at least the core trio).
- **SCREEN:** each screen declares roles (non-empty).
- **CREATABLE:** each entity with a create form has a reachable detail/success screen.
- **REACHABILITY:** every success screen is reachable within 3 steps of a flow.
- **STATE:** state machines (if present) are structurally valid.
- **SPEC:** spec coverage summary (roles/uiStates coverage).

### Outputs

- **JUnit:** `testsuite name="FlowLock" tests=<N> failures=<F> errors=<E> skipped=<S>` with a `<testcase>` per check or per issue; failures use `<failure message="">` child.
- **CSV (screens.csv) columns:** `screenId,screenName,type,entityId,roles,uiStates,reads,forms`.
- **Gap report (gap_report.md):** table with `ID | Severity | Location | Symptom | Proposed fix`.
- **Acceptance criteria (acceptance_criteria.feature):** Gherkin skeleton derived from flows & roles.

### 6.2 Mermaid rendering

1. Always write `.mmd` text files.
2. Try to render `er.svg`/`flow.svg` using:
   - Local `mmdc` (pnpm installed), else
   - `npx -y @mermaid-js/mermaid-cli`, else
   - Fallback SVG frame: `<svg><text>Mermaid diagram:\n...mmd...\n</text></svg>` (so nothing is silently missing).

### 6.3 IDE agent integration (agent-native)

On any CLI invocation, ensure `.claude/commands/` with:
- `ux-contract-init.md` — create/refine `uxspec.json` from repo docs; output a unified diff to apply.
- `ux-guardrails-validate.md` — read `gap_report.md` and propose minimal changes to `uxspec.json` (diff).
- `ux-generate-ui.md` — after green audit, scaffold `ui/` stubs: one component per screen honoring roles & uiStates; no data calls, just types & TODOs.
- `flow-audit-fix.md` — close gaps from the latest audit by proposing `uxspec.json` edits; explain derived/external decisions.

Agents run these with clear instructions, not free-form "do everything" prompts.

### 6.4 CI workflow

YAML (final form you've applied) does:
1. Checkout → setup pnpm & Node → `pnpm -r --filter "./packages/*" build` → `pnpm -w uxcg audit`
2. Upload artifacts (svg/mmd/csv/xml/md/feature)
3. POST summary to Cloud:
   ```json
   { "project": "...", "kind": "junit", "payload": { "stats": {...}, "artifacts": [...] } }
   ```
4. On PRs, comment link to `CLOUD_URL/dashboard?project=PROJECT_ID`

**Secrets used:**
- `FLOWLOCK_CLOUD_URL`, `FLOWLOCK_PROJECT_ID`, `FLOWLOCK_TOKEN`

### 6.5 FlowLock Cloud (self-host now; SaaS later)

**App:** `apps/ingest/index.ts` (Hono + Better-Sqlite3)

**Env:** `PORT`, `CLOUD_TOKEN` (optional auth), `DB_PATH` (default `flowlock.db`)

**DB schema:**
```sql
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project TEXT,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Endpoints:**
- `GET /` → `"ok"`
- `GET /healthz` → `{ ok: true }`
- `POST /ingest` (auth if `CLOUD_TOKEN` set)
  - Body: `{ project: string, kind: 'junit'|'audit', payload: any }`
  - Returns `{ ok: true }`; emits run to live listeners.
- `GET /runs/:project` → JSON array of recent runs (payload parsed).
- `GET /events?project=...` → SSE stream (hello, ping every 15s, run).
- `GET /dashboard?project=...` → Human UI that:
  - Shows latest runs (cards with artifacts list and JUnit stats)
  - Auto-refresh (every 10s) and/or listens to SSE
  - Accessible, readable styles (dark and light)

**Stability fixes baked in:**
- Heartbeat `setInterval` = 15s
- Timer clamp shim to avoid `TimeoutOverflowWarning`
- Backtick-free HTML (avoid esbuild/tsx template literal parsing issues in prod)

#### SaaS direction

- Multi-tenant DB, API keys per repo/org.
- "Project" becomes `{ orgId, repoId, branch, prNumber }` composite, or a normalized slug.
- Signed upload URLs for artifacts; retention policies.
- RBAC & SSO.

### 6.6 Extensibility (plugin checks)

**FlowlockCheck interface:**

```typescript
export type CheckLevel = 'info'|'warn'|'error';
export type CheckStatus = 'pass'|'fail'|'skip';
export type CheckResult = {
  id: string; level: CheckLevel; status: CheckStatus;
  message: string; location?: string; fix?: string;
};
export interface FlowlockCheck {
  id: string; name: string;
  run(spec: UXSpec): Promise<CheckResult|CheckResult[]>;
}
```

Third-party packages can export new checks and be included by `Runner({ checks: [ ...core, ...custom ] })`.

## 7) Onboarding flows

### New project (local only)

1. `pnpm add -D flowlock-uxcg` (or install from your monorepo)
2. Run `npx uxcg init` (seeds a minimal `uxspec.json`)
3. Run `pnpm -w uxcg audit --fix` (normalizes; prints gaps & artifacts)
4. In your IDE agent, run `/ux-contract-init` → accepts diff → re-audit
5. Iterate `/flow-audit-fix` until green
6. Run `/ux-generate-ui` to get stubs
7. Commit & push

### Team + CI + Cloud

1. Add the provided GitHub Action (the final YAML you applied)
2. Set repo secrets (`FLOWLOCK_CLOUD_URL`, `FLOWLOCK_PROJECT_ID`, `FLOWLOCK_TOKEN`)
3. Self-host FlowLock Cloud on Render (or use SaaS once available)
4. Every PR shows "audit complete → dashboard link"

## 8) Current vs Ideal — gap map

| Area | Ideal | Current | Actions |
|------|-------|---------|---------|
| Healer | Never crashes; coerces roles to objects; infers screen types; ensures uiStates/roles | Fixed roles coercion bug; prints pre-parse list | Keep tests for coercions & regressions |
| Agent bootstrap | `.claude/commands` always present | Implemented in CLI startup | Add Cursor/Copilot variants (same content) |
| Mermaid | Always outputs mmd; renders svg if possible; fallback svg text if not | Implemented (mmd + attempt render, fallback) | Add pnpm mmdc install hint in docs |
| Cloud stability | No timer overflow; safe HTML; SSE 15s | Implemented fixes | Add light theme + nicer cards (ship CSS) |
| SaaS | Hosted multi-tenant | Self-host Render now | Plan production SaaS (keys, orgs, quotas) |
| Docs | Agents & humans can onboard without us | You're reading it | Publish at flowlock.dev/docs |

## 9) Reference payloads & formats

### POST /ingest (Cloud)

```json
{
  "project": "my-repo",
  "kind": "junit",
  "payload": {
    "stats": { "tests": 12, "failures": 0, "errors": 0, "skipped": 1 },
    "artifacts": ["er.svg","flow.svg","screens.csv","results.junit.xml","gap_report.md","acceptance_criteria.feature"],
    "startedAt": "2025-08-16T01:23:45.000Z",
    "finishedAt": "2025-08-16T01:23:47.000Z"
  }
}
```

### screens.csv columns

```
screenId,screenName,type,entityId,roles,uiStates,reads,forms
```

### Gap report row

```
| honest_reads_user_list_user.id | error | screen:user_list,field:user.id | Screen 'User List' reads field 'user.id' which is not captured in the same flow | Mark user.id as derived (system.uuid) or capture earlier in flow. |
```

### Acceptance criteria (example)

```gherkin
Feature: Core user journeys
  Scenario: Admin creates a user
    Given I am an "admin"
    When I go to "User List"
    And I submit "Create User"
    Then I see "User Created"
    And I can view "User Detail"
```

## 10) What "done" looks like

- A fresh repo can go from zero → green audit in one sitting using the agent cards.
- CI enforces the contract on every PR.
- Diagrams & artifacts are always current and visible in Cloud.
- Agents generate UI stubs only after spec is green.
- Adding a new domain check is a tiny plugin.

## Final notes for agents reading this

**You are expected to:**
1. Use `/ux-contract-init` to build/merge `uxspec.json` from docs/code.
2. Run `pnpm -w uxcg audit --fix`. If it fails, use `/ux-guardrails-validate` or `/flow-audit-fix` to propose exact diffs.
3. When green, run `/ux-generate-ui` and open a PR with the scaffold.

**You must not** invent APIs—only reflect the declared data contracts (entities, fields) and screen obligations.

**Always** keep IDs stable and use `kebab_case` for IDs; names are human-friendly.

**Every diff** you propose should be minimal and safe to pass the checks deterministically.