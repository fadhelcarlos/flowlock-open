// packages/cli/src/commands/init-existing.ts
import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import { copyFlowLockResources } from "../utils/copy-resources";
import { printArtifacts } from "../lib/printArtifacts";

const CONFIG = "flowlock.config.json";
const CLAUDE_DIR = ".claude/commands";

export const initExistingCommand = async () => {
  try {
  // Copy FlowLock resources (examples, docs, README) first
  console.log("Copying FlowLock resources...");
  copyFlowLockResources(process.cwd());
  
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
  const pkgPath = "package.json";
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.scripts ||= {};
      
      // Add multiple useful scripts
      pkg.scripts["flowlock:audit"] = "npx flowlock-uxcg audit";
      pkg.scripts["flowlock:audit:fix"] = "npx flowlock-uxcg audit --fix";
      pkg.scripts["flowlock:inventory"] = "npx flowlock-uxcg inventory";
      pkg.scripts["flowlock:diagrams"] = "npx flowlock-uxcg diagrams";
      
      // Only add selfcheck if tools/selfcheck.mjs exists
      if (fs.existsSync("tools/selfcheck.mjs")) {
        pkg.scripts["flowlock:selfcheck"] = "node tools/selfcheck.mjs";
      }
      
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log("✓ package.json scripts updated");
    } catch (e) {
      console.log("• Could not update package.json scripts (manual update recommended)");
    }
  } else {
    console.log("• No package.json found, skipping script setup");
  }

  console.log(chalk.green("\n✅ FlowLock initialization complete!"));
  console.log(chalk.blue("\n📦 Resources added:"));
  console.log(chalk.gray("  • .flowlock/examples (sample implementations)"));
  console.log(chalk.gray("  • .flowlock/docs (documentation)"));
  console.log(chalk.gray("  • .flowlock/README.md (getting started guide)"));
  console.log(chalk.gray("  • .claude/commands (helper files for Claude/Cursor)"));
  
  console.log(chalk.blue("\n🚀 Next steps:"));
  console.log(chalk.yellow("  1.") + " Edit flowlock.config.json to match your project structure");
  console.log(chalk.yellow("  2.") + " Run " + chalk.cyan("'npx flowlock-uxcg inventory'") + " to extract runtime inventory");
  console.log(chalk.yellow("  3.") + " Create a uxspec.json with your UX specification");
  console.log(chalk.yellow("  4.") + " Run " + chalk.cyan("'npx flowlock-uxcg audit'") + " to validate your spec");
  
  // Show any artifacts that might already exist
  try {
    if (fs.existsSync("artifacts")) {
      printArtifacts("artifacts");
    }
  } catch {
    // Ignore if artifacts directory doesn't exist
  }
  } catch (error) {
    console.error("Error during initialization:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};
