import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "packages", "cli", "src", "index.ts");
let src = fs.readFileSync(file, "utf8");

/**
 * Ensure we can use fs/path in the CLI file (add imports if missing)
 */
if (!/from\s+['"]fs['"]/.test(src)) {
  src = src.replace(/^/m, `import * as fs from "fs";\n`);
}
if (!/from\s+['"]path['"]/.test(src)) {
  src = src.replace(/^/m, `import * as path from "path";\n`);
}

/**
 * Replace the static "Artifacts generated" block with a dynamic listing.
 * We search for the header line and the following bullet lines that start with "   ".
 */
const header = /(\n\\?n?\\?s* Artifacts generated:\s*\n)((?:\s*[^\n]*\n)+)/m;
if (header.test(src)) {
  src = src.replace(header, (_m, p1) => {
    return `${p1}  // Dynamically list everything in artifacts/\n  { try {\n    const outDir = "artifacts";\n    const files = fs.readdirSync(outDir, { withFileTypes: true })\n      .filter(d => d.isFile())\n      .map(d => d.name)\n      .sort();\n    for (const f of files) {\n      console.log(\`   \${path.join(outDir, f)}\`);\n    }\n  } catch (e) {\n    console.log("   (no artifacts found)");\n  } }\n`;
  });
} else {
  // If the exact block isn't found, append a safe dynamic print near the end of the commands success path.
  // This is a fallback so the CLI always shows the full list.
  src += `

/* FlowLock patch: dynamic artifacts footer */
try {
  console.log('\\n Artifacts generated:');
  const outDir = 'artifacts';
  const files = fs.readdirSync(outDir, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name)
    .sort();
  for (const f of files) {
    console.log(\`   \${path.join(outDir, f)}\`);
  }
} catch {}
`;
}

fs.writeFileSync(file, src, "utf8");
console.log(" Patched CLI to dynamically list artifacts");
