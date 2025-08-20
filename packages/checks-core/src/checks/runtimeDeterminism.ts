import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { UXSpec } from "flowlock-uxspec";
import type { CheckResult } from "flowlock-plugin-sdk";

/**
 * Production-grade determinism check.
 * - Computes a SHA-256 over *stable* JSON of (spec + inventory).
 * - Writes/reads artifacts/determinism.sha256 to assert stability across runs.
 * - If file does not exist -> writes it and PASS (first baseline).
 * - If exists and mismatch -> FAIL with both hashes.
 * - If matches -> PASS with hash.
 */

const HASH_FILE = path.resolve(process.cwd(), "artifacts/determinism.sha256");

function stableStringify(value: any): string {
  // Recursively sort object keys to avoid key-order nondeterminism
  const seen = new WeakSet();
  const stringify = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return "[[circular]]";
    seen.add(v);

    if (Array.isArray(v)) return v.map(stringify);

    const out: Record<string, any> = {};
    for (const k of Object.keys(v).sort()) {
      // Drop obviously volatile keys if present
      if (k === "_timestamp" || k === "updatedAt" || k === "createdAt") continue;
      out[k] = stringify(v[k]);
    }
    return out;
  };
  return JSON.stringify(stringify(value));
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function loadInventoryObject(): any {
  const override = process.env.FLOWLOCK_INVENTORY;
  const file = path.resolve(process.cwd(), override || "artifacts/runtime_inventory.json");
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

export function checkRuntimeDeterminism(spec: UXSpec): CheckResult[] {
  try {
    const inv = loadInventoryObject(); // inventory may be required by your pipeline; if missing we still hash spec alone
    const payload = { spec, inventory: inv ?? {} };
    const normalized = stableStringify(payload);
    const currentHash = sha256(normalized);

    if (!fs.existsSync(path.dirname(HASH_FILE))) fs.mkdirSync(path.dirname(HASH_FILE), { recursive: true });

    if (!fs.existsSync(HASH_FILE)) {
      fs.writeFileSync(HASH_FILE, currentHash + "\n", "utf8");
      return [{
        id: "runtime_determinism.baseline",
        level: "info",
        status: "pass",
        message: `Baseline determinism hash created: ${currentHash}`,
      }];
    }

    const prev = fs.readFileSync(HASH_FILE, "utf8").trim();
    if (prev !== currentHash) {
      return [{
        id: "runtime_determinism.mismatch",
        level: "error",
        status: "fail",
        message: `Determinism mismatch. previous=${prev} current=${currentHash}. Changes in spec/inventory produce different results.`,
      }];
    }

    return [{
      id: "runtime_determinism.ok",
      level: "info",
      status: "pass",
      message: `Determinism verified: ${currentHash}`,
    }];
  } catch (err: any) {
    return [{
      id: "runtime_determinism.error",
      level: "error",
      status: "fail",
      message: `Determinism check failed: ${err?.message ?? String(err)}`,
    }];
  }
}
