import * as fs from "fs";
import * as path from "path";

export function printArtifacts(dir = "artifacts") {
  try {
    console.log("\n Artifacts generated:");
    const files = fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .sort();
    for (const f of files) console.log(`   ${path.join(dir, f)}`);
  } catch {
    console.log("\n Artifacts generated:\n   (none)");
  }
}
