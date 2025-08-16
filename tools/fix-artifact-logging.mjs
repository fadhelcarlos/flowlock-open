import fs from "fs";
import path from "path";

function ensureImports(src) {
  let out = src;
  if (!/from\s+["\']fs["\']/.test(out)) out = `import * as fs from "fs";\n` + out;
  if (!/from\s+["\']path["\']/.test(out)) out = `import * as path from "path";\n` + out;
  return out;
}

function ensureHelper(src) {
  if (/function\s+printArtifacts\s*\(/.test(src)) return src;
  const helper = `
function printArtifacts(dir = "artifacts") {
  try {
    console.log("\\n Artifacts generated:");
    const files = fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .sort();
    for (const f of files) console.log("   " + path.join(dir, f));
  } catch {
    console.log("\\n Artifacts generated:\\n   (none)");
  }
}
`;
  // insert after import block or at top
  const m = src.match(/^(?:import[^\n]*\n)+/);
  return m ? src.replace(m[0], m[0] + helper) : (helper + src);
}

function removeStaticArtifactLogs(src) {
  const lines = src.split(/\r?\n/);
  const keep = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader = trimmed.startsWith('console.log(') && trimmed.includes('Artifacts generated');
    const isBullet = trimmed.startsWith('console.log(') && /artifacts[\/\\]/i.test(trimmed);
    if (isHeader || isBullet) continue;
    keep.push(line);
  }
  return keep.join("\n");
}

function ensureSinglePrintAfterRun(src) {
  // Insert ONE printArtifacts() after the first await runner.runAndSave(...)
  let out = src;
  const runRe = /(await\s+runner\.runAndSave\([^)]*\)\s*;)/;
  if (!/printArtifacts\(\)/.test(out) && runRe.test(out)) {
    out = out.replace(runRe, `$1\n  printArtifacts();`);
  }
  // De-duplicate any multiple calls
  let seen = false;
  out = out.replace(/printArtifacts\(\);/g, () => (seen ? "" : (seen = true, "printArtifacts();")));
  return out;
}

const cliFile = path.join(process.cwd(), "packages", "cli", "src", "index.ts");
let s = fs.readFileSync(cliFile, "utf8");
s = ensureImports(s);
s = ensureHelper(s);
s = removeStaticArtifactLogs(s);
s = ensureSinglePrintAfterRun(s);
fs.writeFileSync(cliFile, s, "utf8");
console.log(" CLI patched: single dynamic artifacts section");
