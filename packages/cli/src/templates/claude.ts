import * as fs from "fs";
import * as path from "path";

/** Write agent commands into .claude/commands (idempotent) */
export function writeClaudeCommands(cwd: string) {
  const dir = path.join(cwd, ".claude", "commands");
  fs.mkdirSync(dir, { recursive: true });

  const files: Record<string, string> = {
    "ux-contract-init.md": CONTRACT_INIT.trim() + "\n",
    "ux-guardrails-validate.md": GUARDRAILS_VALIDATE.trim() + "\n",
    "ux-generate-ui.md": GENERATE_UI.trim() + "\n",
    "flow-audit-fix.md": FLOW_AUDIT_FIX.trim() + "\n",
  };

  for (const [name, content] of Object.entries(files)) {
    const p = path.join(dir, name);
    try {
      const current = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
      if (current.trim() === content.trim()) continue;
    } catch {}
    fs.writeFileSync(p, content, "utf8");
  }
}

const CONTRACT_INIT = `
# /ux-contract-init  Seed or refine the UX contract (uxspec.json)

You are the FlowLock contract editor. Use the README/PRD and code to create or refine \`uxspec.json\`.

**Do:**
1) Read repo docs (README, /docs/**, /product/**). Infer:
   - roles (top-level \`roles: string[]\`)
   - jtbd (top-level \`jtbd: Record<Role, string[]>\`)
   - entities (id, name, fields; derived/external flags with provenance/source)
   - flows (id, name, steps -> screens)
   - screens (id, name, roles[], uiStates[], reads[], forms[] with fields)
2) Create \`uxspec.json\` if missing; otherwise merge changes conservatively.
3) Keep IDs stable and kebab_case; names are human.
4) Save a unified diff for \`uxspec.json\`. Do not invent UI code here.

**Then run (locally):**
\`\`\`
pnpm -w uxcg audit
\`\`\`
If audit fails, call **/ux-guardrails-validate** next.
`;

const GUARDRAILS_VALIDATE = `
# /ux-guardrails-validate  Make the spec pass FlowLock checks

You are the FlowLock guardrails fixer. Goal: green checks.

**Input:**
- \`artifacts/gap_report.md\`
- audit console output
- current \`uxspec.json\`

**Do:**
1) Summarize failing rules (HONEST/CREATABLE/REACHABILITY/UI/STATE/SCREEN/SPEC).
2) Propose minimal, safe edits to \`uxspec.json\` ONLY (do not touch app code).
   - HONEST: either mark fields derived/external with provenance/source OR remove reads not captured in the same flow.
   - UI: ensure every screen has \`uiStates: ["empty","loading","error"]\` at minimum.
   - SCREEN: ensure every screen has \`roles: [...]\`.
3) Show a unified diff patch to \`uxspec.json\`. Apply after approval.

**Then run (locally):**
\`\`\`
pnpm -w uxcg audit
\`\`\`
Repeat until  everywhere. When green, call **/ux-generate-ui**.
`;

const GENERATE_UI = `
# /ux-generate-ui  Scaffold UI after spec is green

You are the FlowLock UI scaffolder. Precondition: audit is .

**Do:**
1) For each screen in \`uxspec.json\`, emit minimal, consistent UI stubs (keep in a new \`ui/\` folder or the project's UI app).
   - respect \`roles\` (gate by role) and \`uiStates\` (empty/loading/error placeholders)
   - wire reads/forms shape (no backend calls; just types + TODOs)
2) Do not invent server APIs. Leave comments with data contracts derived from entities.
3) Provide a file tree + file contents as patches.

**Then:**
- Re-run \`pnpm -w uxcg diagrams\` so artifacts reflect the latest spec.
- Ask to open a PR with the scaffold.
`;

const FLOW_AUDIT_FIX = `
# /flow-audit-fix  Close gaps from the latest audit

You are the FlowLock gap closer.

**Inputs:**
- \`artifacts/gap_report.md\`
- \`artifacts/acceptance_criteria.feature\`
- current \`uxspec.json\`

**Do:**
1) Read the gap report and list each issue  propose exact \`uxspec.json\` edits to resolve it.
2) Where a field is read but never captured, choose ONE:
   - mark field as \`derived: true\` + set \`provenance\` (explain)
   - mark field as \`external: true\` + set \`source\` (explain)
   - or remove the read from the offending screen
3) Ensure every screen has \`roles\` and core \`uiStates\`.
4) Show unified diff; after approval, apply.

**Then run (locally):**
\`\`\`
pnpm -w uxcg audit
\`\`\`
Goal: All checks .
`;
