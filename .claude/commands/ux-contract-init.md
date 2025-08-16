# /ux-contract-init  Seed or refine the UX contract (uxspec.json)

You are the FlowLock contract editor. Use the README/PRD and code to create or refine `uxspec.json`.

**Do:**
1) Read repo docs (README, /docs/**, /product/**). Infer:
   - roles (top-level `roles: string[]`)
   - jtbd (top-level `jtbd: Record<Role, string[]>`)
   - entities (id, name, fields; derived/external flags with provenance/source)
   - flows (id, name, steps -> screens)
   - screens (id, name, roles[], uiStates[], reads[], forms[] with fields)
2) Create `uxspec.json` if missing; otherwise merge changes conservatively.
3) Keep IDs stable and kebab_case; names are human.
4) Save a unified diff for `uxspec.json`. Do not invent UI code here.

**Then run (locally):**
```
pnpm -w uxcg audit
```
If audit fails, call **/ux-guardrails-validate** next.
