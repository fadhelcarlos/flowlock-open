import fs from "fs";
import path from "path";

const rfile = path.join(process.cwd(), "packages", "runner", "src", "index.ts");
let src = fs.readFileSync(rfile, "utf8");

const out = src
  .split(/\r?\n/)
  .filter(line => {
    const t = line.trim();
    if (t.startsWith("console.log(") && /Extra artifacts/i.test(t)) return false;
    if (t.startsWith("console.log(") && /artifacts[\/\\][^"]*"/i.test(t)) return false;
    return true;
  })
  .join("\n");

fs.writeFileSync(rfile, out, "utf8");
console.log(" Runner patched: extra artifacts silenced");
