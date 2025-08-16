import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "packages", "cli", "src", "index.ts");
let src = fs.readFileSync(file, "utf8");

// Ensure imports (idempotent)
if (!/from\s+["\']fs["\']/.test(src)) src = `import * as fs from "fs";\n` + src;
if (!/from\s+["\']path["\']/.test(src)) src = `import * as path from "path";\n` + src;

// Inject helper once
if (!/function\s+printArtifacts\s*\(/.test(src)) {
  src = src.replace(/^/m, `function printArtifacts(dir = "artifacts") {
  try {
    console.log('\\n Artifacts generated:');
    const files = fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .sort();
    for (const f of files) console.log('   ' + path.join(dir, f));
  } catch {
    console.log('\\n Artifacts generated:\\n   (none)');
  }
}\n`);
}

// Replace ALL static blocks (both success and fail branches)
const hdr = /(\n\s* Artifacts generated:\s*\n)((?:\s*\s*artifacts[\/\\][^\n]+\n)+)/g;
src = src.replace(hdr, (_m, p1) => `${p1}  /* FlowLock dynamic listing */\n  printArtifacts();\n`);

// Fallback: if no header was found in some path, append one guaranteed print at end of command execution.
// (Wrapped in a guard so it wont spam if already present.)
if (!/printArtifacts\(\)\s*;/.test(src)) {
  src += `\n// FlowLock dynamic artifacts footer\ntry { printArtifacts(); } catch {}\n`;
}

fs.writeFileSync(file, src, "utf8");
console.log(" Patched CLI to replace ALL static artifact summaries with a dynamic listing");
