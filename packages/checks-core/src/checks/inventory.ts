import fs from "node:fs";
import path from "node:path";
import type { UXSpec } from "flowlock-uxspec";
import type { CheckResult } from "flowlock-plugin-sdk";

/**
 * Production-grade inventory validation.
 * - Requires artifacts/runtime_inventory.json (path can be overridden via env FLOWLOCK_INVENTORY or ctx in future).
 * - Validates inventory schema shape.
 * - Cross-checks Spec ↔ DB entities/fields (non-derived/non-external).
 * - Verifies API endpoints for fields that declare source: "api/<path>".
 * - Verifies each UI read has provenance (captured|derived|external) or matches a spec field.
 * - Emits a concise PASS with counts or FAIL with precise reasons.
 */

type InvEntity = { id: string; fields: { id: string; type?: string }[] };
type InvEndpoint = { path: string; methods: string[]; returns?: { entity: string; fields: string[] } };
type RuntimeInventory = {
  db: { dialect?: string; entities: InvEntity[] };
  api: { endpoints: InvEndpoint[] };
  ui: { reads: string[]; writes: string[] };
};

function loadInventory(): RuntimeInventory | null {
  const override = process.env.FLOWLOCK_INVENTORY;
  const file = path.resolve(process.cwd(), override || "artifacts/runtime_inventory.json");
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

function isEntityFieldProvable(spec: UXSpec, key: string): boolean {
  // key "Entity.field"
  const [e, f] = key.split(".");
  if (!e || !f) return false;

  const ent = (spec.entities ?? []).find((x: any) => x.id === e);
  if (!ent) return false;

  // If field is listed in spec (non-derived/non-external) it's provable via DB
  const fld = (ent.fields ?? []).find((x: any) => x.id === f);
  if (fld && !fld.derived && !fld.external) return true;

  // Derived via glossary
  const derived = new Set(
    (spec.glossary ?? [])
      .filter((g: any) => (g.kind?.toLowerCase?.() === "derived" || g.kind?.toLowerCase?.() === "calculated"))
      .map((g: any) => g.key || g.term)
  );
  if (derived.has(`${e}.${f}`)) return true;

  // External with source specified in spec
  if (fld?.external && typeof fld.source === "string") return true;

  // Captured via flow writes
  const captured = new Set<string>();
  for (const flow of (spec.flows ?? [])) {
    for (const step of (flow.steps ?? [])) {
      for (const w of (step.writes ?? [])) captured.add(String(w));
    }
  }
  if (captured.has(`${e}.${f}`)) return true;

  return false;
}

function validateSchema(inv: any): string[] {
  const errs: string[] = [];
  const isArray = Array.isArray;

  // db.entities
  if (!inv?.db || !isArray(inv.db.entities)) errs.push("inventory.db.entities must be an array");
  else {
    for (const e of inv.db.entities) {
      if (typeof e?.id !== "string" || !e.id) errs.push("each db.entities[i].id must be a non-empty string");
      if (!isArray(e?.fields)) errs.push(`db.entities[${e?.id ?? "?"}].fields must be an array`);
      else {
        for (const f of e.fields) {
          if (typeof f?.id !== "string" || !f.id)
            errs.push(`db.entities[${e.id}].fields[*].id must be a non-empty string`);
        }
      }
    }
  }

  // api.endpoints
  if (!inv?.api || !isArray(inv.api.endpoints)) errs.push("inventory.api.endpoints must be an array");
  else {
    const allowed = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
    for (const ep of inv.api.endpoints) {
      if (typeof ep?.path !== "string" || !ep.path) errs.push("each api.endpoints[i].path must be a non-empty string");
      if (!isArray(ep?.methods) || ep.methods.some((m: any) => !allowed.has(String(m))))
        errs.push(`api.endpoints[${ep?.path ?? "?"}].methods must be an array of HTTP verbs`);
      if (ep?.returns) {
        if (typeof ep.returns.entity !== "string" || !Array.isArray(ep.returns.fields))
          errs.push(`api.endpoints[${ep.path}].returns must be { entity: string, fields: string[] }`);
      }
    }
  }

  // ui.reads/writes
  if (!inv?.ui || !isArray(inv.ui.reads) || !isArray(inv.ui.writes)) errs.push("inventory.ui.reads and inventory.ui.writes must be arrays");

  return errs;
}

export function checkInventory(spec: UXSpec): CheckResult[] {
  const out: CheckResult[] = [];

  const inv = loadInventory();
  if (!inv) {
    out.push({
      id: "inventory.file.missing",
      level: "error",
      status: "fail",
      message: "Missing artifacts/runtime_inventory.json. Run `uxcg inventory` before auditing.",
    });
    return out;
  }

  // 1) Schema validation
  const schemaErrs = validateSchema(inv);
  for (const m of schemaErrs) out.push({ id: "inventory.schema", level: "error", status: "fail", message: m });
  if (schemaErrs.length) return out;

  // Index helpers
  const dbByEntity = new Map<string, Set<string>>();
  for (const e of inv.db.entities) dbByEntity.set(e.id, new Set((e.fields ?? []).map((f) => f.id)));
  const epByPath = new Set<string>(inv.api.endpoints.map((e) => "api/" + String(e.path).replace(/^\//, "")));

  // 2) Spec ↔ DB entity/field coverage (non-derived/non-external)
  for (const e of spec.entities ?? []) {
    const nonVirtual = (e.fields ?? []).filter((f: any) => !f.derived && !f.external);
    if (nonVirtual.length === 0) continue;
    if (!dbByEntity.has(e.id)) {
      out.push({
        id: `inventory.db.entity.missing`,
        level: "error",
        status: "fail",
        message: `DB model missing for spec entity '${e.id}'`,
      });
      continue;
    }
    const set = dbByEntity.get(e.id)!;
    for (const f of nonVirtual) {
      if (!set.has(f.id)) {
        out.push({
          id: `inventory.db.field.missing`,
          level: "error",
          status: "fail",
          message: `DB column missing for '${e.id}.${f.id}'`,
        });
      }
    }
  }

  // 3) API endpoints for fields with source "api/<path>"
  for (const e of spec.entities ?? []) {
    for (const f of e.fields ?? []) {
      if (typeof (f as any).source === "string" && (f as any).source.startsWith("api/")) {
        const p = String((f as any).source);
        if (!epByPath.has(p)) {
          out.push({
            id: `inventory.api.endpoint.missing`,
            level: "error",
            status: "fail",
            message: `Spec field '${e.id}.${f.id}' references '${p}' but endpoint not found in inventory`,
          });
        }
      }
    }
  }

  // 4) UI reads must be provable (captured | derived | external | concrete spec field)
  const uiReads = new Set<string>([
    ...((spec.screens ?? []).flatMap((s: any) => (s.reads ?? []).map((r: any) => String(r)))),
    ...(inv.ui.reads ?? []),
  ]);

  for (const key of uiReads) {
    if (!isEntityFieldProvable(spec, key)) {
      out.push({
        id: "inventory.ui.read.unproven",
        level: "error",
        status: "fail",
        message: `UI read '${key}' has no provenance in spec (not captured, derived, external, or declared field).`,
      });
    }
  }

  if (out.length === 0) {
    const entityCount = inv.db.entities.length;
    const fieldCount = inv.db.entities.reduce((n, e) => n + (e.fields?.length ?? 0), 0);
    const epCount = inv.api.endpoints.length;
    const readsCount = inv.ui.reads.length;
    out.push({
      id: "inventory.ok",
      level: "info",
      status: "pass",
      message: `Inventory OK — DB entities: ${entityCount}, fields: ${fieldCount}, API endpoints: ${epCount}, UI reads: ${readsCount}.`,
    });
  }

  return out;
}
