import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "packages", "cli", "src", "commands", "audit.ts");
let s = fs.readFileSync(file, "utf8");

// 1) import helper (idempotent)
if (!s.includes('printArtifacts')) {
  s = s.replace(/(^import[^\n]*\n)+/m, (m) =>
    m + 'import { printArtifacts } from "../lib/printArtifacts";\n'
  );
}

// 2) remove any static artifact logs
const lines = s.split(/\r?\n/);
const keep = [];
for (const line of lines) {
  const t = line.trim();
  const isHeader = t.startsWith("console.log(") && /Artifacts generated/i.test(t);
  const isBullet = t.startsWith("console.log(") && /artifacts[\/\\]/i.test(t);
  if (isHeader || isBullet) continue;
  keep.push(line);
}
s = keep.join("\n");

// 3) ensure we call printArtifacts() exactly once after runAndSave(...)
const runRe = /(await\s+runner\.runAndSave\([^)]*\)\s*;)/;
if (runRe.test(s) && !/printArtifacts\(\)/.test(s)) {
  s = s.replace(runRe, `$1\n  printArtifacts("artifacts");`);
}

// 4) dedupe any accidental duplicates
let seen = false;
s = s.replace(/printArtifacts\(\s*["']?artifacts["']?\s*\)\s*;/g, () => (seen ? "" : (seen = true, 'printArtifacts("artifacts");')));

fs.writeFileSync(file, s, "utf8");
console.log("? audit.ts patched: single dynamic artifact print");
