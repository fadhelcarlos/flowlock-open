import fs from "node:fs";
import path from "node:path";
import type { UXSpec } from "flowlock-uxspec";
import type { CheckResult } from "flowlock-plugin-sdk";
import { ErrorCodes } from "flowlock-shared/errors";

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
  if (!inv?.db) {
    errs.push("Missing 'db' section in inventory. Expected structure: { db: { entities: [...] } }. Check if 'flowlock inventory' was run successfully.");
  } else if (!isArray(inv.db.entities)) {
    errs.push(`Invalid 'db.entities' - expected an array but got ${typeof inv.db.entities}. Should be: { db: { entities: [{id: "User", fields: [...]}] } }`);
  } else {
    for (let i = 0; i < inv.db.entities.length; i++) {
      const e = inv.db.entities[i];
      if (typeof e?.id !== "string" || !e.id) {
        errs.push(`Invalid entity at db.entities[${i}] - missing or invalid 'id'. Each entity must have: { id: "EntityName", fields: [...] }`);
      }
      if (!isArray(e?.fields)) {
        errs.push(`Invalid entity '${e?.id ?? "unknown"}' - 'fields' must be an array. Expected: { id: "${e?.id ?? "EntityName"}", fields: [{id: "fieldName", type: "fieldType"}] }`);
      } else {
        for (let j = 0; j < e.fields.length; j++) {
          const f = e.fields[j];
          if (typeof f?.id !== "string" || !f.id) {
            errs.push(`Invalid field at ${e.id}.fields[${j}] - each field must have an 'id'. Expected: { id: "fieldName", type: "fieldType" }`);
          }
        }
      }
    }
  }

  // api.endpoints
  if (!inv?.api) {
    errs.push("Missing 'api' section in inventory. Expected structure: { api: { endpoints: [...] } }. Check your API scan configuration.");
  } else if (!isArray(inv.api.endpoints)) {
    errs.push(`Invalid 'api.endpoints' - expected an array but got ${typeof inv.api.endpoints}. Should be: { api: { endpoints: [{path: "/api/users", methods: ["GET"]}] } }`);
  } else {
    const allowed = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
    for (let i = 0; i < inv.api.endpoints.length; i++) {
      const ep = inv.api.endpoints[i];
      if (typeof ep?.path !== "string" || !ep.path) {
        errs.push(`Invalid endpoint at api.endpoints[${i}] - missing 'path'. Each endpoint must have: { path: "/api/resource", methods: [...] }`);
      }
      if (!isArray(ep?.methods)) {
        errs.push(`Invalid endpoint '${ep?.path ?? "unknown"}' - 'methods' must be an array of HTTP verbs. Expected: ["GET", "POST", etc.]`);
      } else if (ep.methods.some((m: any) => !allowed.has(String(m)))) {
        const invalid = ep.methods.filter((m: any) => !allowed.has(String(m)));
        errs.push(`Invalid HTTP methods [${invalid.join(", ")}] for endpoint '${ep.path}'. Allowed methods: GET, POST, PUT, PATCH, DELETE`);
      }
      if (ep?.returns) {
        if (typeof ep.returns.entity !== "string") {
          errs.push(`Invalid 'returns.entity' for endpoint '${ep.path}' - must be a string entity name`);
        }
        if (!Array.isArray(ep.returns.fields)) {
          errs.push(`Invalid 'returns.fields' for endpoint '${ep.path}' - must be an array of field names. Example: ["id", "name", "email"]`);
        }
      }
    }
  }

  // ui.reads/writes
  if (!inv?.ui) {
    errs.push("Missing 'ui' section in inventory. Expected structure: { ui: { reads: [...], writes: [...] } }. Check your UI scan configuration.");
  } else {
    if (!isArray(inv.ui.reads)) {
      errs.push(`Invalid 'ui.reads' - expected an array but got ${typeof inv.ui.reads}. Should contain field references like: ["User.name", "Product.price"]`);
    }
    if (!isArray(inv.ui.writes)) {
      errs.push(`Invalid 'ui.writes' - expected an array but got ${typeof inv.ui.writes}. Should contain field references like: ["User.email", "Order.status"]`);
    }
  }

  return errs;
}

export function checkInventory(spec: UXSpec): CheckResult[] {
  const out: CheckResult[] = [];

  const inv = loadInventory();
  if (!inv) {
    const inventoryPath = path.resolve(process.cwd(), process.env.FLOWLOCK_INVENTORY || "artifacts/runtime_inventory.json");
    out.push({
      id: "inventory.file.missing",
      level: "error",
      status: "fail",
      message: "Runtime inventory file not found",
      details: {
        code: ErrorCodes.INVENTORY_MISSING,
        expected: "File should exist at configured path",
        actual: "File not found",
        location: inventoryPath,
        suggestion: `Run the following command to generate inventory:\n  npx flowlock inventory\n\nOr if using custom path, set FLOWLOCK_INVENTORY environment variable:\n  export FLOWLOCK_INVENTORY="path/to/your/inventory.json"`,
        documentation: "https://flowlock.dev/docs/inventory#generating",
        context: {
          searchedPath: inventoryPath,
          envVar: process.env.FLOWLOCK_INVENTORY || "(not set)"
        }
      }
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
      const availableEntities = Array.from(dbByEntity.keys());
      const similarEntities = availableEntities.filter(name => 
        name.toLowerCase() === e.id.toLowerCase() || 
        name.toLowerCase().includes(e.id.toLowerCase()) ||
        e.id.toLowerCase().includes(name.toLowerCase())
      );
      
      out.push({
        id: `inventory.db.entity.missing`,
        level: "error",
        status: "fail",
        message: `Database entity '${e.id}' not found in inventory`,
        details: {
          code: ErrorCodes.INVENTORY_ENTITY_MISMATCH,
          expected: `Entity '${e.id}' should exist in database`,
          actual: "Entity not found in scanned database schema",
          location: `spec.entities[${e.id}]`,
          suggestion: similarEntities.length > 0
            ? `Found similar entities: ${similarEntities.join(", ")}\n\nDid you mean one of these? Update spec or database to match.`
            : availableEntities.length > 0
            ? `Available entities: ${availableEntities.slice(0, 10).join(", ")}${availableEntities.length > 10 ? ` (and ${availableEntities.length - 10} more)` : ""}\n\nEither:\n  1. Add entity to database schema\n  2. Update spec to use existing entity\n  3. Check 'inventory.db.schemaFiles' configuration`
            : "No entities found in database. Check inventory configuration and database connection.",
          documentation: "https://flowlock.dev/docs/inventory#entity-mapping",
          context: {
            specEntity: e.id,
            availableEntities: availableEntities.slice(0, 20),
            totalAvailable: availableEntities.length
          }
        }
      });
      continue;
    }
    const set = dbByEntity.get(e.id)!;
    for (const f of nonVirtual) {
      if (!set.has(f.id)) {
        const availableFields = Array.from(set).slice(0, 5).join(", ");
        const suffix = set.size > 5 ? ` (and ${set.size - 5} more)` : "";
        const allFields = Array.from(set);
        const similarFields = allFields.filter(name =>
          name.toLowerCase() === f.id.toLowerCase() ||
          name.toLowerCase().includes(f.id.toLowerCase()) ||
          f.id.toLowerCase().includes(name.toLowerCase())
        );
        
        out.push({
          id: `inventory.db.field.missing`,
          level: "error",
          status: "fail",
          message: `Field '${f.id}' not found in entity '${e.id}'`,
          details: {
            code: ErrorCodes.INVENTORY_FIELD_MISMATCH,
            expected: `Field '${f.id}' should exist in entity '${e.id}'`,
            actual: "Field not found in database entity",
            location: `${e.id}.${f.id}`,
            suggestion: similarFields.length > 0
              ? `Found similar fields: ${similarFields.join(", ")}\n\nCorrect the field name in spec or database.`
              : `Available fields in ${e.id}: ${availableFields}${suffix}\n\nOptions:\n  1. Add field to database schema:\n     ALTER TABLE ${e.id} ADD COLUMN ${f.id} ${f.type || "VARCHAR(255)"};\n\n  2. Mark as derived in spec:\n     { "id": "${f.id}", "derived": true, "provenance": "calculated from..." }\n\n  3. Mark as external in spec:\n     { "id": "${f.id}", "external": true, "source": "api/endpoint" }`,
            documentation: "https://flowlock.dev/docs/entities#field-mapping",
            context: {
              entity: e.id,
              missingField: f.id,
              availableFields: allFields.slice(0, 20),
              fieldType: f.type || "unknown"
            }
          }
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
          const availableEndpoints = Array.from(epByPath).filter(ep => ep.includes(p.split('/')[1] || '')).slice(0, 3);
          const suggestion = availableEndpoints.length > 0 
            ? `\n  Similar endpoints found: ${availableEndpoints.join(", ")}` 
            : `\n  Available endpoints: ${Array.from(epByPath).slice(0, 3).join(", ")}`;
          out.push({
            id: `inventory.api.endpoint.missing`,
            level: "error",
            status: "fail",
            message: `Field '${e.id}.${f.id}' references API endpoint '${p}' which doesn't exist.${suggestion}\n  Solutions:\n  1. Create the API endpoint\n  2. Update the 'source' to match existing endpoint\n  3. Check 'inventory.api.scan' patterns include your API files`,
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
      const [entity, field] = key.split('.');
      const entityExists = (spec.entities ?? []).some((e: any) => e.id === entity);
      
      // Find which screens read this field for better context
      const readingScreens = (spec.screens ?? []).filter((s: any) => 
        (s.reads ?? []).includes(key)
      ).map((s: any) => s.name || s.id);
      
      // Find if field is captured anywhere
      const capturingFlows: string[] = [];
      for (const flow of (spec.flows ?? [])) {
        for (const step of (flow.steps ?? [])) {
          if ((step.writes ?? []).includes(key)) {
            capturingFlows.push(flow.name || flow.id);
            break;
          }
        }
      }
      
      let suggestion: string;
      if (!entityExists) {
        const availableEntities = (spec.entities ?? []).map((e: any) => e.id);
        const similarEntity = availableEntities.find((e: string) => 
          e.toLowerCase() === entity.toLowerCase()
        );
        suggestion = similarEntity
          ? `Entity name mismatch. Use '${similarEntity}.${field}' instead of '${key}'`
          : `Add entity to spec:\n{\n  "id": "${entity}",\n  "fields": [\n    { "id": "${field}", "type": "string" }\n  ]\n}`;
      } else {
        suggestion = capturingFlows.length > 0
          ? `Field is captured in flows: ${capturingFlows.join(", ")}. Ensure UI reads happen after capture.`
          : `Options:\n  1. Add field to entity in spec:\n     { "id": "${field}", "type": "string" }\n\n  2. Capture in a form before reading:\n     { "forms": [{ "entityId": "${entity}", "fields": [{ "fieldId": "${field}" }] }] }\n\n  3. Mark as derived in entity:\n     { "id": "${field}", "derived": true, "provenance": "..." }\n\n  4. Mark as external with source:\n     { "id": "${field}", "external": true, "source": "api/..." }`;
      }
      
      out.push({
        id: "inventory.ui.read.unproven",
        level: "error",
        status: "fail",
        message: `UI reads field '${key}' without valid provenance`,
        details: {
          code: ErrorCodes.INVENTORY_UI_READ_INVALID,
          expected: "UI reads must reference captured, derived, or external fields",
          actual: `Field '${key}' has no valid source`,
          location: readingScreens.length > 0 ? `Screens: ${readingScreens.join(", ")}` : `UI component reading '${key}'`,
          suggestion: suggestion,
          documentation: "https://flowlock.dev/docs/ui#field-binding",
          context: {
            fieldPath: key,
            entity: entity,
            field: field,
            entityExists: entityExists,
            readingScreens: readingScreens,
            capturingFlows: capturingFlows
          }
        }
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
