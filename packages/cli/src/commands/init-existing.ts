// packages/cli/src/commands/init-existing.ts
import fs from "node:fs";
import path from "node:path";

const CONFIG = "flowlock.config.json";
const CLAUDE_DIR = ".claude/commands";

export const initExistingCommand = async () => {
  if (!fs.existsSync(CONFIG)) {
    fs.writeFileSync(
      CONFIG,
      JSON.stringify(
        {
          projectName: path.basename(process.cwd()),
          inventory: {
            db: { mode: "auto", dialect: "postgres", urlEnv: "DATABASE_URL", schemaFiles: [] },
            api: { scan: ["app/api/**/route.ts{,x}"], jsdoc: true, openapiPrefer: true },
            ui: { scan: ["app/**/*.{tsx,jsx}"], readAttribute: "data-fl-read", writeAttribute: "data-fl-write" }
          },
          audit: { requireInventory: true, checks: ["DB_SCHEMA", "API_SURFACE", "DB_PROVENANCE"] }
        },
        null,
        2
      )
    );
    console.log("✓ wrote", CONFIG);
  } else {
    console.log("•", CONFIG, "already exists");
  }

  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  const files: Record<string, string> = {
    "ux-contract-init.md": "# UX Contract Init\n- Extract inventory\n- Generate uxspec\n- Run audit --fix",
    "ux-guardrails-validate.md": "# Guardrails Validate\n- Run audit\n- Post results",
    "ux-generate-ui.md": "# Generate UI stubs\n- Suggest components with data-fl-read",
    "flow-audit-fix.md": "# Auto-fix\n- Add derived/external provenance",
    "ux-enhance-spec.md": "# Enhance\n- Improve states/edges"
  };
  for (const [k, v] of Object.entries(files)) {
    const p = path.join(CLAUDE_DIR, k);
    if (!fs.existsSync(p)) fs.writeFileSync(p, v);
  }
  console.log("✓ ensured", CLAUDE_DIR);

  // Add a convenience script to package.json
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  pkg.scripts ||= {};
  pkg.scripts["flowlock:selfcheck"] = "node tools/selfcheck.mjs";
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
  console.log("✓ package.json scripts updated");
};
