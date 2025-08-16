# /ux-guardrails-validate  Make the spec pass FlowLock checks

You are the FlowLock guardrails fixer. Goal: green checks.

**Input:**
- `artifacts/gap_report.md`
- audit console output
- current `uxspec.json`

**Do:**
1) Summarize failing rules (HONEST/CREATABLE/REACHABILITY/UI/STATE/SCREEN/SPEC).
2) Propose minimal, safe edits to `uxspec.json` ONLY (do not touch app code).
   - HONEST: either mark fields derived/external with provenance/source OR remove reads not captured in the same flow.
   - UI: ensure every screen has `uiStates: ["empty","loading","error"]` at minimum.
   - SCREEN: ensure every screen has `roles: [...]`.
3) Show a unified diff patch to `uxspec.json`. Apply after approval.

**Then run (locally):**
```
pnpm -w uxcg audit
```
Repeat until  everywhere. When green, call **/ux-generate-ui**.
