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
function groupOf(id: string): "HONEST"|"CREATABLE"|"REACHABILITY"|"UI"|"STATE"|"SCREEN"|"SPEC"|"OTHER" {
  const x = id.toLowerCase();
  if (x.startsWith("honest")) return "HONEST";
  if (x.startsWith("creatable")) return "CREATABLE";
  if (x.startsWith("reach")) return "REACHABILITY";
  if (x.startsWith("ui_") || x.startsWith("ui-") || x.startsWith("ui")) return "UI";
  if (x.startsWith("state")) return "STATE";
  if (x.startsWith("screen")) return "SCREEN";
  if (x.startsWith("spec")) return "SPEC";
  return "OTHER";
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
function printSummary(checks: CheckResult[], specPath: string) {
  const groups: Record<string, CheckResult[]> = {
    HONEST: [], CREATABLE: [], REACHABILITY: [], UI: [], STATE: [], SCREEN: [], SPEC: [], OTHER: []
  };
  for (const r of checks) groups[groupOf(r.id)].push(r);

  const hasFail = (arr: CheckResult[]) => arr.some(r => String(r.status).toLowerCase() === "fail");

  console.log("\n📋 HONEST");
  if (!hasFail(groups.HONEST)) {
    console.log("  ✅ All screen reads are properly captured, derived, or external");
  } else {
    for (const r of groups.HONEST) if (r.status === "fail") console.log("  ❌ " + r.message + (r.meta?.field ? `\n     → ${r.meta?.field}` : ""));
  }

  console.log("\n📋 CREATABLE");
  if (!hasFail(groups.CREATABLE)) console.log("  ✅ All creatable entities have detail screens with discoverable paths");
  else for (const r of groups.CREATABLE) if (r.status === "fail") console.log("  ❌ " + r.message);

  console.log("\n📋 REACHABILITY");
  if (!hasFail(groups.REACHABILITY)) console.log("  ✅ All success screens are reachable within 3 steps");
  else for (const r of groups.REACHABILITY) if (r.status === "fail") console.log("  ❌ " + r.message);

  console.log("\n📋 UI");
  if (!hasFail(groups.UI)) console.log("  ✅ All screens declare empty/loading/error states.");
  else for (const r of groups.UI) if (r.status === "fail") console.log("  ❌ " + r.message);

  console.log("\n📋 STATE");
  if (!hasFail(groups.STATE)) console.log("  ✅ All state machines are structurally valid or not required.");
  else for (const r of groups.STATE) if (r.status === "fail") console.log("  ❌ " + r.message);

  console.log("\n📋 SCREEN");
  if (!hasFail(groups.SCREEN)) console.log("  ✅ All screens declare allowed roles.");
  else for (const r of groups.SCREEN) if (r.status === "fail") console.log("  ❌ " + r.message);

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

/* ============================ Command =========================== */
export async function auditCommand(opts?: AuditOptions) {
  const cwd = process.cwd();
  const specPath = path.join(cwd, opts?.spec || "uxspec.json");
  const outDir = opts?.outDir || "artifacts";

  // Check for runtime inventory if --inventory flag is set
  if (opts?.inventory) {
    const inventoryPath = path.join(outDir, "runtime_inventory.json");
    if (!fs.existsSync(inventoryPath)) {
      console.error("❌ Runtime inventory required but not found at:", inventoryPath);
      console.error("   Run 'npx uxcg inventory' first to generate the inventory.");
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

  // Run once; if schema fails and --fix is set, we will heal & retry inside this helper
  const res = await runRunnerWithHeal(specPath, outDir, !!opts?.fix);

  if (!opts?.quiet) {
    console.log("🔍 Running FlowLock audit...\\n");
  }
  if (opts?.json) {
    console.log(JSON.stringify(res.checkResults, null, 2));
  } else if (!opts?.quiet) {
    printSummary(res.checkResults as any, specPath);
    listArtifacts(outDir);
  }

  process.exitCode = hasErrors(res.checkResults as any) ? 1 : 0;
  if (!opts?.quiet && !opts?.json) {
    console.log(process.exitCode ? "\n❌ Audit failed with errors" : "\n✅ Audit completed successfully");
  }
}
