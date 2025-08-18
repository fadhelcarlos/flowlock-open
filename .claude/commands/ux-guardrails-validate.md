# /ux-guardrails-validate — Make the spec pass all FlowLock checks

You are the FlowLock v3 guardrails fixer. Goal: ✅ all 11 checks green.

**Input:**
- `artifacts/gap_report.md`
- audit console output
- current `uxspec.json`

**Do:**
1) Summarize failing rules (now includes 11 checks):
   - **Core**: HONEST/CREATABLE/REACHABILITY/UI/STATE/SCREEN/SPEC
   - **Enhanced**: JTBD/RELATIONS/ROUTES/CTAS

2) Propose minimal, safe edits to `uxspec.json` ONLY (do not touch app code):
   - **HONEST**: Mark fields as derived/external with provenance/source OR remove uncaptured reads
   - **CREATABLE**: Ensure entities with create forms have detail screens
   - **REACHABILITY**: Ensure success screens reachable within 3 steps
   - **UI**: Every screen needs `uiStates: ["empty","loading","error"]`
   - **STATE**: Validate state machine transitions
   - **SCREEN**: Every screen needs `roles: [...]`
   - **SPEC**: Improve coverage percentages
   - **JTBD**: Link flows to jobs, ensure all jobs have flows
   - **RELATIONS**: Fix entity relationship references
   - **ROUTES**: Ensure unique routes starting with /
   - **CTAS**: Fix navigation targets, eliminate orphans

3) For enhanced features, suggest additions:
   - Add `routes` to screens for URL navigation
   - Split simple `forms` into detailed form objects with `writes`
   - Add `cards` for display components
   - Add `lists` with sorting/filtering/pagination flags
   - Add `ctas` for navigation buttons
   - Define `states` for entities with state machines
   - Add `glossary` entries for derived fields

4) Show a unified diff patch to `uxspec.json`. Apply after approval.

**Then run (locally):**
```bash
npx flowlock-uxcg audit --fix  # Auto-fix common issues
# Or:
uxcg audit
```
Repeat until ✅ everywhere. When green, call **/ux-generate-ui**.
