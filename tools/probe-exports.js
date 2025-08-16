const fs = require("fs");
const path = require("path");
const root = path.join(process.cwd(), "packages", "checks-core", "src");
function walk(dir){ return fs.readdirSync(dir).flatMap(f=>{
  const p = path.join(dir,f); const s = fs.statSync(p);
  return s.isDirectory() ? walk(p) : f.endsWith(".ts") ? [p] : [];
});}
for (const file of walk(root)) {
  const src = fs.readFileSync(file, "utf8");
  const ex = [...src.matchAll(/\bexport\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g)].map(m=>m[1]);
  const hasDefault = /\bexport\s+default\b/.test(src);
  console.log(path.relative(root,file) + " => " +
    (ex.length? ("exports: "+ex.join(", ")) : "exports: (none)") +
    (hasDefault ? " + default" : ""));
}
