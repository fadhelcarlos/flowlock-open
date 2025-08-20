import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import SwaggerParser from "@apidevtools/swagger-parser";

/** Output shape written to artifacts/runtime_inventory.json */
export type RuntimeInventory = {
  db: { dialect?: string; entities: { id: string; fields: { id: string; type?: string }[] }[] };
  api: { endpoints: ApiEndpoint[] };
  ui:  { reads: string[]; writes: string[] };
};

export type ApiEndpoint = {
  path: string;
  methods: string[];
  returns?: { entity: string; fields: string[] };
};

export type InventoryEntity = {
  id: string;
  fields: { id: string; type?: string }[];
};

export type InventoryConfig = {
  db?: {
    mode?: "schema" | "live" | "auto";
    dialect?: "postgres" | "mysql" | "sqlite";
    urlEnv?: string;
    schemaFiles?: string[];
  };
  api?: {
    scan?: string[];
    jsdoc?: boolean;
    openapiPrefer?: boolean;
  };
  ui?: {
    scan?: string[];
    readAttribute?: string;
    writeAttribute?: string;
  };
};

export async function buildInventory(cfgPath = "flowlock.config.json", outFile = "artifacts/runtime_inventory.json") {
  // --- Load config (JSON or YAML) -------------------------------------------
  let raw = fs.readFileSync(cfgPath, "utf8");
  const cfg = cfgPath.endsWith(".yaml") || cfgPath.endsWith(".yml")
    ? YAML.parse(raw)
    : JSON.parse(raw);

  const inv: RuntimeInventory = { db: { dialect: cfg.inventory.db?.dialect, entities: [] }, api: { endpoints: [] }, ui: { reads: [], writes: [] } };

  // --- DB: mode = schema | live | auto --------------------------------------
  const mode = cfg.inventory.db?.mode ?? "auto";
  const dialect = cfg.inventory.db?.dialect ?? "postgres";

  if (mode === "schema" || mode === "auto") {
    for (const file of (cfg.inventory.db?.schemaFiles ?? [])) {
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, "utf8");
      if (file.endsWith(".prisma")) {
        const modelRe = /model\s+(\w+)\s+\{([\s\S]*?)\}/g;
        let m: RegExpExecArray | null;
        while ((m = modelRe.exec(src))) {
          const name = m[1];
          const fields = [...m[2].matchAll(/^\s*(\w+)\s+([\w\[\]!?.]+)/gm)].map(r => ({ id: r[1], type: r[2] }));
          pushEntity(inv, name, fields);
        }
      } else if (/\.(ts|js)$/.test(file)) {
        const f = [...src.matchAll(/model\(|table\(|@Entity\(|new\s+EntitySchema\(/g)].length;
        if (f) {
          const fieldMatches = [...src.matchAll(/["'`](\w+)["'`]\s*:\s*(?:\w+\(|\{)|@Column\([^)]*\)\s*(\w+)\s*:/g)];
          const name = path.basename(file).replace(/\.(ts|js)$/,"");
          const fields = fieldMatches.map(m => ({ id: (m[1]||m[2])?.trim(), type: "unknown" })).filter(x=>x.id);
          pushEntity(inv, pascal(name), fields);
        }
      }
    }
  }

  if ((mode === "live" || (mode === "auto" && inv.db.entities.length === 0)) && process.env[cfg.inventory.db?.urlEnv || "DATABASE_URL"]) {
    const url = process.env[cfg.inventory.db?.urlEnv || "DATABASE_URL"] as string;
    if (dialect === "postgres") await introspectPostgres(url, inv);
    if (dialect === "mysql")    await introspectMySQL(url, inv);
    if (dialect === "sqlite")   await introspectSQLite(url, inv);
  }

  // --- API: OpenAPI (preferred) ---------------------------------------------
  const apiGlobs: string[] = cfg.inventory.api?.scan ?? [];
  const openapiFiles = await fg(apiGlobs.filter(g=>/openapi\.(yml|yaml|json)/.test(g)));
  if (openapiFiles.length) {
    const file = openapiFiles[0];
    const doc: any = await SwaggerParser.dereference(path.resolve(file));
    for (const [p, methods] of Object.entries<any>(doc.paths || {})) {
      const ep: ApiEndpoint = { path: normalizeApiPath(String(p)), methods: Object.keys(methods).map(m=>m.toUpperCase()) };
      const get = (methods.get || methods.post || methods.put || methods.patch);
      const schema = get?.responses?.["200"]?.content?.["application/json"]?.schema;
      if (schema?.title && schema?.properties) {
        ep.returns = { entity: schema.title, fields: Object.keys(schema.properties) };
      }
      inv.api.endpoints.push(ep);
    }
  }

  // --- API: static scan (Next.js routes, Express/Nest/Fastify) --------------
  const codeFiles = await fg(apiGlobs.filter(g=>!/openapi\.(yml|yaml|json)/.test(g)));
  for (const rel of codeFiles) {
    const src = fs.readFileSync(rel, "utf8");
    const ep: ApiEndpoint = { path: normalizeApiPath(rel.replace(/^app\/api\/|\/route\.tsx?$/g, "")), methods: [] };
    if (/export\s+async\s+function\s+GET/.test(src) || /\.get\(/.test(src)) ep.methods.push("GET");
    if (/export\s+async\s+function\s+POST/.test(src) || /\.post\(/.test(src)) ep.methods.push("POST");
    if (/\.put\(/.test(src)) ep.methods.push("PUT");
    if (/\.patch\(/.test(src)) ep.methods.push("PATCH");
    if (/\.delete\(/.test(src)) ep.methods.push("DELETE");
    const m = src.match(/@flowlock\s+returns\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/);
    if (m) ep.returns = { entity: m[1], fields: m[2].split(",").map(s=>s.trim()) };
    if (ep.methods.length) inv.api.endpoints.push(ep);
  }

  // --- UI reads/writes ------------------------------------------------------
  const uiFiles = await fg(cfg.inventory.ui?.scan ?? []);
  for (const rel of uiFiles) {
    const src = fs.readFileSync(rel, "utf8");
    const readAttr = cfg.inventory.ui?.readAttribute || "data-fl-read";
    const writeAttr = cfg.inventory.ui?.writeAttribute || "data-fl-write";
    inv.ui.reads.push(...[...src.matchAll(new RegExp(`${readAttr}=['"\`]([\\w]+\\.[\\w]+)['"\`]`,'g'))].map(m=>m[1]));
    inv.ui.writes.push(...[...src.matchAll(new RegExp(`${writeAttr}=['"\`]([\\w]+\\.[\\w]+)['"\`]`,'g'))].map(m=>m[1]));
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(inv, null, 2));
  return outFile;
}

// ----------------- helpers & DB introspection -------------------------------
function pushEntity(inv: RuntimeInventory, id: string, fields: any[]) {
  if (!id) return;
  const i = inv.db.entities.findIndex(e => e.id === id);
  const entry = { id, fields };
  if (i >= 0) inv.db.entities[i] = entry; else inv.db.entities.push(entry);
}
const pascal = (s: string) => s.replace(/(^|[-_./])(\w)/g, (_, __, a)=> a.toUpperCase());
const normalizeApiPath = (p: string) => (p.startsWith("/")? p : "/"+p).replace(/\\/g,"/");

async function introspectPostgres(url: string, inv: RuntimeInventory) {
  const { Client } = await import("pg");
  const c = new Client({ connectionString: url }); await c.connect();
  const res = await c.query(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema='public'
    order by table_name, ordinal_position;
  `);
  const map = new Map<string, { id: string; fields: any[] }>();
  for (const r of res.rows) {
    const t = pascal(r.table_name);
    if (!map.has(t)) map.set(t, { id: t, fields: [] });
    map.get(t)!.fields.push({ id: r.column_name, type: r.data_type });
  }
  inv.db.entities.push(...map.values());
  await c.end();
}

async function introspectMySQL(url: string, inv: RuntimeInventory) {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(url);
  const [rows] = await conn.execute(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = database()
    order by table_name, ordinal_position;
  `);
  const map = new Map<string, any>();
  for (const r of rows as any[]) {
    const t = pascal(r.TABLE_NAME);
    if (!map.has(t)) map.set(t, { id: t, fields: [] });
    map.get(t)!.fields.push({ id: r.COLUMN_NAME, type: r.DATA_TYPE });
  }
  inv.db.entities.push(...map.values());
  await conn.end();
}

async function introspectSQLite(url: string, inv: RuntimeInventory) {
  const file = url.replace(/^sqlite:/,"");
  const sqlite = (await import("better-sqlite3")).default;
  const db = new sqlite(file);
  const tables = db.prepare(`select name from sqlite_master where type='table' and name not like 'sqlite_%'`).all();
  for (const t of tables) {
    const cols = db.prepare(`pragma table_info('${t.name}')`).all();
    pushEntity(inv, pascal(t.name), cols.map((c:any)=> ({ id: c.name, type: c.type })));
  }
  db.close();
}
