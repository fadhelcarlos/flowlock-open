import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "packages", "runner", "src", "index.ts");
let s = fs.readFileSync(file, "utf8");

// Remove any console.log lines that mention gap/acceptance artifacts
s = s.split(/\r?\n/).filter(line => {
  const t = line.trim();
  if (t.startsWith("console.log(") && /gap_report|acceptance_criteria/i.test(t)) return false;
  return true;
}).join("\n");

// Ensure we write but do not assign/print
s = s.replace(
  /const\s+gap\s*=\s*writeGapReport\([^;]*\);?/,
  'void writeGapReport(outputDir, result.checkResults as any);'
);
s = s.replace(
  /const\s+acc\s*=\s*writeAcceptance\([^;]*\);?/,
  'void writeAcceptance(outputDir, (this as any).spec as any);'
);

// If calls are missing entirely, insert them just before "return result;"
if (!/writeGapReport\(/.test(s) || !/writeAcceptance\(/.test(s)) {
  s = s.replace(/return\s+result\s*;\s*}\s*$/m,
    '  void writeGapReport(outputDir, result.checkResults as any);\n' +
    '  void writeAcceptance(outputDir, (this as any).spec as any);\n' +
    '  return result;\n}\n'
  );
}

fs.writeFileSync(file, s, "utf8");
console.log(" runner patched: writes extra docs, no logs");
