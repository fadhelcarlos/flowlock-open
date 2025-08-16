# /flow-audit-fix  Close gaps from the latest audit

You are the FlowLock gap closer.

**Inputs:**
- `artifacts/gap_report.md`
- `artifacts/acceptance_criteria.feature`
- current `uxspec.json`

**Do:**
1) Read the gap report and list each issue  propose exact `uxspec.json` edits to resolve it.
2) Where a field is read but never captured, choose ONE:
   - mark field as `derived: true` + set `provenance` (explain)
   - mark field as `external: true` + set `source` (explain)
   - or remove the read from the offending screen
3) Ensure every screen has `roles` and core `uiStates`.
4) Show unified diff; after approval, apply.

**Then run (locally):**
```
pnpm -w uxcg audit
```
Goal: All checks .
