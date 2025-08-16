import fs from "node:fs";
const [,, patchFile, targetFile] = process.argv;
if (!patchFile || !targetFile) {
  console.error("Usage: node tools/merge-json.mjs <patch.json> <target.json>");
  process.exit(1);
}
const patch = JSON.parse(fs.readFileSync(patchFile, "utf8"));
const target = JSON.parse(fs.readFileSync(targetFile, "utf8"));
for (const k of Object.keys(patch)) target[k] = patch[k];
fs.writeFileSync(targetFile, JSON.stringify(target, null, 2));
console.log(`Merged ${patchFile} -> ${targetFile}`);
