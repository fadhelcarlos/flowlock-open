import * as fs from "fs";
import * as path from "path";

function buildGapReportMarkdown(results: any[]) {
  const issues = results.filter((r: any) => r.status === "fail");
  const lines = [
    "# Gap Report",
    "",
    `Total issues: ${issues.length}`,
    "",
    "| ID | Severity | Location | Symptom | Proposed fix |",
    "|---|---|---|---|---|"
  ];
  for (const r of issues) {
    const loc = (r.meta?.screen || r.meta?.entity || r.ref || "-").toString().replace(/\|/g, "/");
    const sev = r.level || "info";
    const sym = (r.message || "-").replace(/\|/g, "/");
    const fix = r.suggestion || "Align spec (roles/uiStates/state machine) and update components to match.";
    lines.push(`| ${r.id} | ${sev} | ${loc} | ${sym} | ${fix} |`);
  }
  return lines.join("\n");
}

export function writeGapReport(outDir: string, results: any[]) {
  const content = buildGapReportMarkdown(results);

  // 1) Artifacts folder
  const artifactsFile = path.join(outDir, "gap_report.md");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(artifactsFile, content);

  // 2) Docs folder (for nice repo docs)
  const docsDir = path.join(outDir, "..", "docs", "flow_audit");
  const docsFile = path.join(docsDir, "gap_report.md");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(docsFile, content);

  return { artifactsFile, docsFile };
}
