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
    "ux-enhance-spec.md": ENHANCE_SPEC.trim() + "\n",
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
# /ux-contract-init — Seed or refine the UX contract (uxspec.json)

You are the FlowLock v3 contract editor. Use the README/PRD and code to create or refine \`uxspec.json\` with all enhanced features.

**Do:**
1) Read repo docs (README, /docs/**, /product/**). Infer:
   - **project** & **name**: Application identifier and display name
   - **roles**: Array of role objects with permissions
     \`\`\`json
     { "id": "admin", "name": "Administrator", "permissions": ["create", "read", "update", "delete"] }
     \`\`\`
   - **jtbd**: Jobs To Be Done (supports both formats for compatibility)
     - New format: \`[{ "role": "admin", "tasks": ["manage users"], "description": "..." }]\`
     - Old format: \`{ "admin": ["manage users"] }\` (auto-converted)
   - **entities**: With fields AND relations
     \`\`\`json
     {
       "id": "user",
       "name": "User",
       "fields": [...],
       "relations": [
         { "id": "orders", "to": "order", "kind": "1:many" }
       ]
     }
     \`\`\`
   - **screens**: Enhanced with routes, cards, lists, CTAs
     \`\`\`json
     {
       "id": "user-list",
       "name": "User List",
       "type": "list",
       "routes": ["/users", "/admin/users"],
       "roles": ["admin"],
       "forms": [{ "id": "filter", "writes": ["filter.*"] }],
       "cards": [{ "id": "stats", "reads": ["user.count"] }],
       "lists": [{ "id": "users", "reads": ["user.*"], "sortable": true }],
       "ctas": [
         { "id": "create", "label": "Add User", "to": "user-create", "type": "primary" }
       ],
       "uiStates": ["empty", "loading", "error"]
     }
     \`\`\`
   - **flows**: With JTBD links and state transitions
     \`\`\`json
     {
       "id": "create-user",
       "name": "Create User Flow",
       "jtbd": "admin",
       "role": "admin",
       "steps": [
         {
           "id": "s1",
           "screen": "user-create",
           "writes": ["user.email", "user.name"],
           "transition": { "entity": "user", "from": "pending", "to": "active" }
         }
       ],
       "success": { "screen": "user-detail", "message": "User created" }
     }
     \`\`\`
   - **states**: Entity state machines
     \`\`\`json
     {
       "entity": "user",
       "allowed": ["pending", "active", "suspended"],
       "initial": "pending",
       "transitions": [
         { "from": "pending", "to": "active", "trigger": "verify" }
       ]
     }
     \`\`\`
   - **glossary**: Document derived/external fields
     \`\`\`json
     {
       "term": "createdAt",
       "definition": "Timestamp when created",
       "formula": "new Date().toISOString()"
     }
     \`\`\`

2) Create \`uxspec.json\` if missing; otherwise merge changes conservatively.
3) Keep IDs stable and kebab-case; names are human-readable.
4) If creating glossary entries, also update \`uxspec/glossary.yml\`.
5) Save a unified diff for \`uxspec.json\`. Do not invent UI code here.

**Then run (locally):**
\`\`\`bash
# First, extract runtime inventory if you have an existing codebase:
npx flowlock-uxcg inventory
# Or for existing projects:
npx flowlock-uxcg init-existing

# Then run audit:
npx flowlock-uxcg audit --inventory  # Enforces inventory requirement
# Or if installed globally:
uxcg audit
\`\`\`
If audit fails, call **/ux-guardrails-validate** next.
`;

const GUARDRAILS_VALIDATE = `
# /ux-guardrails-validate — Make the spec pass all FlowLock checks

You are the FlowLock v3 guardrails fixer. Goal: ✅ all 11 checks green.

**Input:**
- \`artifacts/gap_report.md\`
- \`artifacts/runtime_inventory.json\` (if inventory extracted)
- audit console output
- current \`uxspec.json\`

**Do:**
1) Summarize failing rules (now includes 15 checks):
   - **Core (7)**: HONEST/CREATABLE/REACHABILITY/UI/STATE/SCREEN/SPEC
   - **Enhanced (4)**: JTBD/RELATIONS/ROUTES/CTAS
   - **Runtime (4)**: INVENTORY/DETERMINISM/DATABASE_VALIDATION/MIGRATION_VALIDATION

2) Propose minimal, safe edits to \`uxspec.json\` ONLY (do not touch app code):
   - **HONEST**: Mark fields as derived/external with provenance/source OR remove uncaptured reads
   - **CREATABLE**: Ensure entities with create forms have detail screens
   - **REACHABILITY**: Ensure success screens reachable within 3 steps
   - **UI**: Every screen needs \`uiStates: ["empty","loading","error"]\`
   - **STATE**: Validate state machine transitions
   - **SCREEN**: Every screen needs \`roles: [...]\`
   - **SPEC**: Improve coverage percentages
   - **JTBD**: Link flows to jobs, ensure all jobs have flows
   - **RELATIONS**: Fix entity relationship references
   - **ROUTES**: Ensure unique routes starting with /
   - **CTAS**: Fix navigation targets, eliminate orphans
   - **INVENTORY**: Ensure runtime inventory is fresh (run \`uxcg inventory\`)
   - **DETERMINISM**: Validate DB schema matches entities, auth aligns with roles

3) For enhanced features, suggest additions:
   - Add \`routes\` to screens for URL navigation
   - Split simple \`forms\` into detailed form objects with \`writes\`
   - Add \`cards\` for display components
   - Add \`lists\` with sorting/filtering/pagination flags
   - Add \`ctas\` for navigation buttons
   - Define \`states\` for entities with state machines
   - Add \`glossary\` entries for derived fields

4) Show a unified diff patch to \`uxspec.json\`. Apply after approval.

**Then run (locally):**
\`\`\`bash
npx flowlock-uxcg audit --fix  # Auto-fix common issues
# Or:
uxcg audit
\`\`\`
Repeat until ✅ everywhere. When green, call **/ux-generate-ui**.
`;

const GENERATE_UI = `
# /ux-generate-ui — Scaffold UI with all FlowLock v3 features

You are the FlowLock v3 UI scaffolder. Precondition: audit is ✅.

**Do:**
1) For each screen in \`uxspec.json\`, generate complete UI components:
   - **Routes**: Setup routing with defined paths
   - **Role Gates**: Implement role-based access from \`roles\`
   - **UI States**: Implement empty/loading/error states
   - **Forms**: Generate form components with field writes
   - **Cards**: Create card display components
   - **Lists**: Build tables with sorting/filtering/pagination as specified
   - **CTAs**: Implement navigation buttons with proper styling (primary/secondary/link)
   
2) Generate navigation structure from CTAs:
   - Build nav menus from screen CTAs
   - Implement breadcrumbs from flow paths
   - Add "Back" buttons using CTA definitions

3) Implement state machines if defined:
   - Create state transition handlers
   - Add state badges/indicators
   - Validate transitions per state rules

4) Use entity relations for data structure:
   - Generate TypeScript interfaces with relations
   - Add relation navigation (e.g., user → orders)
   - Implement cascading operations if specified

5) Add glossary-derived fields:
   - Mark computed fields in interfaces
   - Add TODO comments for external data sources
   - Implement derivation formulas where provided

6) File structure:
   \`\`\`
   src/
     components/
       screens/
         UserList.tsx      # List screen with cards, lists, CTAs
         UserDetail.tsx    # Detail with related data
         UserCreate.tsx    # Form with field validation
       ui/
         Card.tsx         # Reusable card component
         List.tsx         # Reusable list with sorting
         StateIndicator.tsx # State machine display
     hooks/
       useRole.ts        # Role-based access
       useStateMachine.ts # State transitions
     types/
       entities.ts       # Generated from entities + relations
       states.ts         # Generated from state machines
   \`\`\`

**Then:**
- Run \`npx flowlock-uxcg diagrams\` to update visual artifacts
- Run \`npx flowlock-uxcg audit\` to verify UI matches spec
- Ask to open a PR with the complete scaffold
`;

const FLOW_AUDIT_FIX = `
# /flow-audit-fix — Close gaps from the latest audit with v3 features

You are the FlowLock v3 gap closer, handling all 15 checks including runtime validation.

**Inputs:**
- \`artifacts/gap_report.md\`
- \`artifacts/acceptance_criteria.feature\`
- \`artifacts/screens.csv\` (enhanced with routes, CTAs, components)
- current \`uxspec.json\`
- \`uxspec/glossary.yml\` (if exists)

**Do:**
1) Read the gap report and categorize issues by check type:
   - Core checks (7): HONEST, CREATABLE, REACHABILITY, UI, STATE, SCREEN, SPEC
   - Enhanced checks (4): JTBD, RELATIONS, ROUTES, CTAS
   - Runtime checks (4): INVENTORY, DETERMINISM, DATABASE_VALIDATION, MIGRATION_VALIDATION

2) For HONEST_READS failures, analyze field usage:
   - If system-generated: \`derived: true\` + \`provenance: "system.uuid"\`
   - If from external API: \`external: true\` + \`source: "api.endpoint"\`
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
   - Every screen has \`roles\` and \`uiStates\`
   - Every creatable entity has CRUD screens
   - Every flow links to JTBD
   - Every CTA points to valid screen

6) Show unified diff; after approval, apply.

**Then run (locally):**
\`\`\`bash
npx flowlock-uxcg audit --fix  # Try auto-fix first
# Then:
npx flowlock-uxcg audit
\`\`\`
Goal: All 15 checks ✅ (including runtime validation).
`;

const ENHANCE_SPEC = `
# /ux-enhance-spec — Upgrade spec to use all FlowLock v3 features

You are the FlowLock v3 enhancement specialist. Upgrade existing specs to use new features.

**Analyze current spec for:**
1) Missing JTBD definitions (convert from old format if needed)
2) Entities without relations
3) Screens without routes, cards, lists, or CTAs
4) Flows without JTBD links or state transitions
5) Missing state machines for stateful entities
6) Derived fields not in glossary

**Propose enhancements:**

1) **JTBD Migration** (if using old format):
   \`\`\`json
   // Old: { "admin": ["task1", "task2"] }
   // New: [{ "role": "admin", "tasks": ["task1", "task2"], "description": "Admin duties" }]
   \`\`\`

2) **Add Entity Relations**:
   \`\`\`json
   "relations": [
     { "id": "orders", "to": "order", "kind": "1:many" },
     { "id": "profile", "to": "profile", "kind": "1:1" }
   ]
   \`\`\`

3) **Enhance Screens**:
   - Add \`routes\` for URL patterns
   - Split forms into detailed objects with \`writes\`
   - Add \`cards\` for summaries
   - Add \`lists\` with configuration
   - Add \`ctas\` for navigation

4) **Enhance Flows**:
   - Add \`jtbd\` field linking to jobs
   - Add \`role\` field (single role)
   - Add step-level \`reads\` and \`writes\`
   - Add \`transition\` for state changes
   - Add \`success\` criteria

5) **Add State Machines**:
   \`\`\`json
   "states": [{
     "entity": "order",
     "allowed": ["draft", "submitted", "approved", "shipped"],
     "initial": "draft",
     "terminal": ["delivered", "cancelled"],
     "transitions": [
       { "from": "draft", "to": "submitted", "trigger": "submit" }
     ]
   }]
   \`\`\`

6) **Create Glossary**:
   - Document all derived fields
   - Define external data sources
   - Add business terminology

**Benefits of upgrading:**
- Better validation with 11 checks vs 7
- Richer UI generation with components
- URL-based navigation support
- State machine enforcement
- Clearer data flow documentation
- Enhanced diagrams and reports

Show comprehensive diff for approval, then apply.

**After enhancement:**
\`\`\`bash
npx flowlock-uxcg audit
npx flowlock-uxcg diagrams  # See enhanced diagrams
\`\`\`
`;