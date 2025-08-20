import * as fs from "fs";
import * as path from "path";
import { Runner } from "flowlock-runner";

/* ========================= Types (local) ========================= */
type CheckResult = {
  id: string;
  level: string; // "error" | "warn" | ...
  status: "pass" | "fail" | string;
  message: string;
  meta?: any;
};

type UXField = {
  id: string;
  name: string;
  type?: string;
  required?: boolean;
  derived?: boolean;
  provenance?: string;
  external?: boolean;
  source?: string;
};

type UXEntity = {
  id: string;
  name: string;
  fields: UXField[];
};

type UXScreen = {
  id: string;
  name: string;
  type?: "list" | "detail" | "form" | "dashboard" | "success" | "error";
  roles?: string[];
  uiStates?: string[];
};

type UXSpec = {
  roles?: string[];
  jtbd?: Record<string, string[]>;
  entities?: UXEntity[];
  screens?: UXScreen[];
};

export interface AuditOptions {
  fix?: boolean;
  spec?: string;   // default: uxspec.json
  outDir?: string; // default: artifacts
  inventory?: boolean; // require runtime inventory
  only?: string;    // run only specific checks
  skip?: string;    // skip specific checks
  json?: boolean;   // output as JSON
  quiet?: boolean;  // suppress non-error output
  verbose?: boolean; // show detailed debug output
  level?: 'basic' | 'enhanced' | 'strict'; // validation level (default: enhanced)
}

/* ========================= Small utils ========================== */
function loadJson<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function saveJson(p: string, obj: any) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}
function listArtifacts(outDir: string) {
  try {
    const files = fs.readdirSync(outDir, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => path.join(outDir, d.name))
      .sort();
    if (files.length) {
      console.log("\n Artifacts generated:");
      for (const f of files) console.log("  • " + f.replace(/\\/g, "/"));
    } else {
      console.log("\n Artifacts generated:\n  (none)");
    }
  } catch {
    console.log("\n Artifacts generated:\n  (none)");
  }
}
function ensureCoreUiStates(states?: string[]): string[] {
  const req = ["empty", "loading", "error"];
  const set = new Set([...(states || [])]);
  for (const s of req) set.add(s);
  return Array.from(set);
}
function groupOf(id: string): string {
  const x = id.toLowerCase();
  if (x.startsWith("honest")) return "HONEST";
  if (x.startsWith("creatable")) return "CREATABLE";
  if (x.startsWith("reach")) return "REACHABILITY";
  if (x.startsWith("ui_") || x.startsWith("ui-") || x.startsWith("ui")) return "UI";
  if (x.startsWith("state_machine")) return "STATE";
  if (x.startsWith("screen")) return "SCREEN";
  if (x.startsWith("spec")) return "SPEC";
  if (x.startsWith("jtbd")) return "JTBD";
  if (x.startsWith("relations")) return "RELATIONS";
  if (x.startsWith("routes")) return "ROUTES";
  if (x.startsWith("ctas")) return "CTAS";
  if (x.startsWith("inventory")) return "INVENTORY";
  if (x.startsWith("runtime_determinism") || x.startsWith("runtime-determinism")) return "RUNTIME_DETERMINISM";
  if (x.startsWith("database_validation") || x.startsWith("database-validation")) return "DATABASE_VALIDATION";
  if (x.startsWith("migration_validation") || x.startsWith("migration-validation")) return "MIGRATION_VALIDATION";
  return "OTHER";
}

/* ========================= Validation Levels ========================= */
/**
 * Validation levels control which checks are run:
 * - Basic: 7 checks (core UX consistency)
 * - Enhanced: 12 checks (basic + extended validation) - DEFAULT
 * - Strict: 15 checks (enhanced + runtime validation, requires inventory)
 * 
 * All 15 checks:
 * 1. honest_reads (HONEST)
 * 2. creatable_needs_detail (CREATABLE)
 * 3. reachability (REACHABILITY)
 * 4. ui_states (UI)
 * 5. state_machines (STATE)
 * 6. screen (SCREEN)
 * 7. spec_coverage (SPEC)
 * 8. jtbd (JTBD)
 * 9. relations (RELATIONS)
 * 10. routes (ROUTES)
 * 11. ctas (CTAS)
 * 12. runtime_determinism (RUNTIME_DETERMINISM)
 * 13. inventory (INVENTORY)
 * 14. database_validation (DATABASE_VALIDATION)
 * 15. migration_validation (MIGRATION_VALIDATION)
 */
const VALIDATION_LEVELS = {
  basic: {
    name: 'Basic',
    description: 'Core 7 checks only - essential UX consistency',
    groups: ['HONEST', 'CREATABLE', 'REACHABILITY', 'UI', 'STATE', 'SCREEN', 'SPEC']
  },
  enhanced: {
    name: 'Enhanced',
    description: 'Basic + Extended checks (12 total) - comprehensive validation',
    groups: ['HONEST', 'CREATABLE', 'REACHABILITY', 'UI', 'STATE', 'SCREEN', 'SPEC',
             'JTBD', 'RELATIONS', 'ROUTES', 'CTAS', 'RUNTIME_DETERMINISM']
  },
  strict: {
    name: 'Strict',
    description: 'All 15 checks - full system validation (requires inventory)',
    groups: ['HONEST', 'CREATABLE', 'REACHABILITY', 'UI', 'STATE', 'SCREEN', 'SPEC',
             'JTBD', 'RELATIONS', 'ROUTES', 'CTAS', 'RUNTIME_DETERMINISM', 
             'INVENTORY', 'DATABASE_VALIDATION', 'MIGRATION_VALIDATION']
  }
};

function shouldRunCheck(checkGroup: string, level: 'basic' | 'enhanced' | 'strict'): boolean {
  const config = VALIDATION_LEVELS[level];
  return config.groups.includes(checkGroup);
}
function hasErrors(checks: CheckResult[]): boolean {
  return checks.some(r => String(r.status).toLowerCase() === "fail" && String(r.level).toLowerCase() === "error");
}

/* ====================== Pre-parse self-heal ====================== */
/** infer screen.type if missing, based on id/name heuristics */
function inferScreenType(s: Partial<UXScreen>): UXScreen["type"] {
  const k = ((s.name || s.id || "") as string).toLowerCase();
  if (/(^|[\s_-])(list|catalog|table|browse)([\s_-]|$)/.test(k)) return "list";
  if (/(^|[\s_-])(create|new|edit|form)([\s_-]|$)/.test(k)) return "form";
  if (/(^|[\s_-])(success|done|created)([\s_-]|$)/.test(k)) return "success";
  if (/(^|[\s_-])(error|failed|failure)([\s_-]|$)/.test(k)) return "error";
  if (/(^|[\s_-])(dashboard|home|overview)([\s_-]|$)/.test(k)) return "dashboard";
  if (/(^|[\s_-])(detail|view)([\s_-]|$)/.test(k)) return "detail";
  return "detail";
}
function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function titleCase(id: string) {
  return id.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Make uxspec.json structurally valid even if user removed fields */
function healSpecStructure(spec: any): { changed: number; notes: string[] } {
  let changed = 0;
  const notes: string[] = [];

  // --- ensure top-level roles are objects ---
  if (!Array.isArray(spec.roles) || spec.roles.length === 0) {
    spec.roles = [
      { id: "admin",  name: "Admin"  },
      { id: "viewer", name: "Viewer" }
    ];
    notes.push("added top-level roles: admin, viewer");
    changed++;
  } else if (typeof spec.roles[0] === "string") {
    // coerce existing string roles to objects
    spec.roles = spec.roles.map((id: string) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
    }));
    notes.push("coerced top-level roles (strings -> objects)");
    changed++;
  }

  if (!Array.isArray(spec.screens)) {
    spec.screens = [];
    notes.push("ensured screens: []");
    changed++;
  }

  for (const s of spec.screens as any[]) {
    if (!s.id && s.name) {
      s.id = slug(s.name);
      notes.push(`screen: set id from name -> ${s.id}`);
      changed++;
    }
    if (!s.name && s.id) {
      s.name = titleCase(s.id);
      notes.push(`screen ${s.id}: set name from id -> ${s.name}`);
      changed++;
    }
    if (!s.type) {
      s.type = inferScreenType(s);
      notes.push(`screen ${s.id}: inferred type -> ${s.type}`);
      changed++;
    }
    if (!Array.isArray(s.roles) || s.roles.length === 0) {
      s.roles = spec.roles.slice();
      notes.push(`screen ${s.id}: set roles -> [${s.roles.join(", ")}]`);
      changed++;
    }
    const before = s.uiStates ? s.uiStates.slice() : [];
    s.uiStates = ensureCoreUiStates(s.uiStates);
    if (JSON.stringify(before) !== JSON.stringify(s.uiStates)) {
      notes.push(`screen ${s.id}: ensure uiStates -> [${s.uiStates.join(", ")}]`);
      changed++;
    }
  }

  return { changed, notes };
}

/** Try to parse by running the runner; if schema fails and --fix is on, heal then retry once. */
async function runRunnerWithHeal(specPath: string, outDir: string, allowHeal: boolean) {
  try {
    const r = await Runner.fromFile(specPath);
    return await r.runAndSave(outDir);
  } catch (e: any) {
    const msg = String(e?.message || "");
    const isSchema = /Invalid UX specification:/i.test(msg) || /ParseError/i.test(e?.name || "");
    if (!allowHeal || !isSchema) throw e;

    // heal uxspec.json
    let spec: any;
    try { spec = loadJson(specPath); } catch { throw e; }
    const heal = healSpecStructure(spec);
    if (heal.changed > 0) {
      saveJson(specPath, spec);
      console.log("\n🩺 Pre-parse fix applied:");
      for (const n of heal.notes) console.log("  • " + n);
      // retry once
      const r = await Runner.fromFile(specPath);
      return await r.runAndSave(outDir);
    }
    // nothing healed, rethrow original
    throw e;
  }
}

/* =========================== Printing =========================== */
function printSummary(checks: CheckResult[], specPath: string, level: 'basic' | 'enhanced' | 'strict') {
  const groups: Record<string, CheckResult[]> = {
    HONEST: [], CREATABLE: [], REACHABILITY: [], UI: [], STATE: [], SCREEN: [], SPEC: [],
    JTBD: [], RELATIONS: [], ROUTES: [], CTAS: [],
    RUNTIME_DETERMINISM: [], INVENTORY: [], DATABASE_VALIDATION: [], MIGRATION_VALIDATION: [], OTHER: []
  };
  for (const r of checks) {
    const group = groupOf(r.id);
    if (!groups[group]) groups[group] = [];
    groups[group].push(r);
  }

  const hasFail = (arr: CheckResult[]) => arr.some(r => String(r.status).toLowerCase() === "fail");

  // Print validation level header
  const levelConfig = VALIDATION_LEVELS[level];
  console.log(`\n🎯 Validation Level: ${levelConfig.name}`);
  console.log(`   ${levelConfig.description}`);
  console.log('');

  // Basic checks (always run at all levels)
  if (shouldRunCheck('HONEST', level)) {
    console.log("\n📋 HONEST");
    if (!hasFail(groups.HONEST)) {
      console.log("  ✅ All screen reads are properly captured, derived, or external");
    } else {
      for (const r of groups.HONEST) if (r.status === "fail") console.log("  ❌ " + r.message + (r.meta?.field ? `\n     → ${r.meta?.field}` : ""));
    }
  }

  if (shouldRunCheck('CREATABLE', level)) {
    console.log("\n📋 CREATABLE");
    if (!hasFail(groups.CREATABLE)) console.log("  ✅ All creatable entities have detail screens with discoverable paths");
    else for (const r of groups.CREATABLE) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('REACHABILITY', level)) {
    console.log("\n📋 REACHABILITY");
    if (!hasFail(groups.REACHABILITY)) console.log("  ✅ All success screens are reachable within 3 steps");
    else for (const r of groups.REACHABILITY) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('UI', level)) {
    console.log("\n📋 UI");
    if (!hasFail(groups.UI)) console.log("  ✅ All screens declare empty/loading/error states.");
    else for (const r of groups.UI) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('STATE', level)) {
    console.log("\n📋 STATE");
    if (!hasFail(groups.STATE)) console.log("  ✅ All state machines are structurally valid or not required.");
    else for (const r of groups.STATE) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('SCREEN', level)) {
    console.log("\n📋 SCREEN");
    if (!hasFail(groups.SCREEN)) console.log("  ✅ All screens declare allowed roles.");
    else for (const r of groups.SCREEN) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('SPEC', level)) {
    try {
      const spec = loadJson<UXSpec>(specPath);
      const screens = spec.screens || [];
      const total = screens.length || 1;
      const rolesOk = screens.filter(s => Array.isArray(s.roles) && s.roles.length > 0).length;
      const uiOk = screens.filter(s => {
        const st = new Set(s.uiStates || []);
        return st.has("empty") && st.has("loading") && st.has("error");
      }).length;
      const rPct = Math.round((rolesOk / total) * 100);
      const uPct = Math.round((uiOk / total) * 100);
      console.log("\n📋 SPEC");
      if (rPct === 100 && uPct === 100) {
        console.log(`  ✅ Spec coverage — Roles: ${rPct}% — UI states: ${uPct}%`);
      } else {
        console.log(`  ⚠️  Spec coverage — Roles: ${rPct}% — UI states: ${uPct}%`);
      }
    } catch {
      console.log("\n📋 SPEC");
      console.log("  ⚠️  Could not compute coverage.");
    }
  }

  // Enhanced checks (run at enhanced and strict levels)
  if (shouldRunCheck('JTBD', level)) {
    console.log("\n📋 JTBD");
    if (!hasFail(groups.JTBD)) console.log("  ✅ All Jobs To Be Done are addressed by flows");
    else for (const r of groups.JTBD) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('RELATIONS', level)) {
    console.log("\n📋 RELATIONS");
    if (!hasFail(groups.RELATIONS)) console.log("  ✅ All entity relations are properly defined");
    else for (const r of groups.RELATIONS) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('ROUTES', level)) {
    console.log("\n📋 ROUTES");
    if (!hasFail(groups.ROUTES)) console.log("  ✅ All routes are unique and properly formatted");
    else for (const r of groups.ROUTES) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('CTAS', level)) {
    console.log("\n📋 CTAS");
    if (!hasFail(groups.CTAS)) console.log("  ✅ All CTAs point to valid screens");
    else for (const r of groups.CTAS) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  // Runtime determinism check (run at enhanced and strict levels)
  if (shouldRunCheck('RUNTIME_DETERMINISM', level)) {
    console.log("\n📋 RUNTIME_DETERMINISM");
    if (!hasFail(groups.RUNTIME_DETERMINISM)) console.log("  ✅ Audit results are deterministic");
    else for (const r of groups.RUNTIME_DETERMINISM) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  // Strict checks (run only at strict level)
  if (shouldRunCheck('INVENTORY', level)) {
    console.log("\n📋 INVENTORY");
    if (!hasFail(groups.INVENTORY)) console.log("  ✅ Runtime inventory is complete and consistent");
    else for (const r of groups.INVENTORY) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('DATABASE_VALIDATION', level)) {
    console.log("\n📋 DATABASE_VALIDATION");
    if (!hasFail(groups.DATABASE_VALIDATION)) console.log("  ✅ Database structure follows best practices");
    else for (const r of groups.DATABASE_VALIDATION) if (r.status === "fail") console.log("  ❌ " + r.message);
  }

  if (shouldRunCheck('MIGRATION_VALIDATION', level)) {
    console.log("\n📋 MIGRATION_VALIDATION");
    if (!hasFail(groups.MIGRATION_VALIDATION)) console.log("  ✅ Migrations are safe and reversible");
    else for (const r of groups.MIGRATION_VALIDATION) if (r.status === "fail") console.log("  ❌ " + r.message);
  }
}

/* ============================ Command =========================== */
export async function auditCommand(opts?: AuditOptions) {
  const cwd = process.cwd();
  const specPath = path.join(cwd, opts?.spec || "uxspec.json");
  const outDir = opts?.outDir || "artifacts";
  const level = opts?.level || 'enhanced'; // Default to enhanced level

  // Validate level option
  if (level && !['basic', 'enhanced', 'strict'].includes(level)) {
    console.error(`❌ Invalid validation level: ${level}`);
    console.error("   Valid levels are: basic, enhanced, strict");
    process.exitCode = 1;
    return;
  }

  // Auto-enable inventory flag for strict level
  const requireInventory = opts?.inventory || level === 'strict';

  // Check for runtime inventory if required
  if (requireInventory) {
    const inventoryPath = path.join(outDir, "runtime_inventory.json");
    if (!fs.existsSync(inventoryPath)) {
      console.error("❌ Runtime inventory required but not found at:", inventoryPath);
      console.error(level === 'strict' 
        ? "   Strict level requires inventory. Run 'npx flowlock-uxcg inventory' first or use --level=enhanced"
        : "   Run 'npx flowlock-uxcg inventory' first to generate the inventory.");
      process.exitCode = 1;
      return;
    }
    // Check if inventory is stale (older than 24 hours)
    const stats = fs.statSync(inventoryPath);
    const age = Date.now() - stats.mtimeMs;
    const dayMs = 24 * 60 * 60 * 1000;
    if (age > dayMs) {
      console.warn("⚠️  Runtime inventory is older than 24 hours. Consider regenerating.");
    }
  }

  // Set verbose environment variable if needed
  if (opts?.verbose) {
    process.env.FLOWLOCK_VERBOSE = "true";
    process.env.FLOWLOCK_DEBUG = "true";
  }

  // Run once; if schema fails and --fix is set, we will heal & retry inside this helper
  const res = await runRunnerWithHeal(specPath, outDir, !!opts?.fix);

  // Filter check results based on validation level
  const filteredResults = (res.checkResults as CheckResult[]).filter(check => {
    const group = groupOf(check.id);
    return shouldRunCheck(group, level);
  });

  if (!opts?.quiet) {
    console.log("🔍 Running FlowLock audit...\n");
  }
  if (opts?.json) {
    const output = {
      level,
      levelDescription: VALIDATION_LEVELS[level].description,
      results: filteredResults
    };
    console.log(JSON.stringify(output, null, 2));
  } else if (!opts?.quiet) {
    printSummary(filteredResults, specPath, level);
    listArtifacts(outDir);
  }

  process.exitCode = hasErrors(filteredResults) ? 1 : 0;
  if (!opts?.quiet && !opts?.json) {
    // const totalChecks = VALIDATION_LEVELS[level].groups.length; // Reserved for future use
    const checkCounts = { basic: 7, enhanced: 12, strict: 15 };
    console.log(`\n📊 Summary: Ran ${checkCounts[level]} of 15 total checks (${level} level)`);
    console.log(process.exitCode ? "❌ Audit failed with errors" : "✅ Audit completed successfully");
  }
}
