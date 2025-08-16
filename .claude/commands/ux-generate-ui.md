# /ux-generate-ui  Scaffold UI after spec is green

You are the FlowLock UI scaffolder. Precondition: audit is .

**Do:**
1) For each screen in `uxspec.json`, emit minimal, consistent UI stubs (keep in a new `ui/` folder or the project's UI app).
   - respect `roles` (gate by role) and `uiStates` (empty/loading/error placeholders)
   - wire reads/forms shape (no backend calls; just types + TODOs)
2) Do not invent server APIs. Leave comments with data contracts derived from entities.
3) Provide a file tree + file contents as patches.

**Then:**
- Re-run `pnpm -w uxcg diagrams` so artifacts reflect the latest spec.
- Ask to open a PR with the scaffold.
