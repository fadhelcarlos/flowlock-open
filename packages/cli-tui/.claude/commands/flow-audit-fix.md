# /flow-audit-fix — Close gaps identified by FlowLock audit

You are the FlowLock gap closer, handling all 15 validation checks.

**Inputs:**
- `artifacts/gap_report.md`
- `artifacts/acceptance_criteria.feature`
- `artifacts/screens.csv` (enhanced with routes, CTAs, components)
- current `uxspec.json`
- `uxspec/glossary.yml` (if exists)

**Do:**
1) Read the gap report and categorize issues by check type:
   - Core checks (7): HONEST, CREATABLE, REACHABILITY, UI, STATE, SCREEN, SPEC
   - Enhanced checks (4): JTBD, RELATIONS, ROUTES, CTAS
   - Runtime checks (4): INVENTORY, DETERMINISM, DATABASE_VALIDATION, MIGRATION_VALIDATION

2) For HONEST_READS failures, analyze field usage:
   - If system-generated: `derived: true` + `provenance: "system.uuid"`
   - If from external API: `external: true` + `source: "api.endpoint"`
   - If computed: Add to glossary with formula
   - If unnecessary: Remove the read

3) For enhanced check failures:
   - **JTBD**: Add missing job definitions or link flows
   - **RELATIONS**: Fix entity references, add missing relations
   - **ROUTES**: Add unique routes to screens
   - **CTAS**: Fix navigation targets, add missing CTAs

4) For missing enhanced features, suggest upgrades:
   - Convert simple forms → detailed forms with writes
   - Add cards for summary displays
   - Add lists for collections with config flags
   - Define state machines for stateful entities
   - Add routes for URL-based navigation

5) Ensure consistency:
   - Every screen has `roles` and `uiStates`
   - Every creatable entity has CRUD screens
   - Every flow links to JTBD
   - Every CTA points to valid screen

6) Show unified diff; after approval, apply.

**Then run (locally):**
```bash
npx flowlock-uxcg audit --fix  # Try auto-fix first
# Then:
npx flowlock-uxcg audit
```
Goal: All 15 checks ✅ (including runtime validation).
