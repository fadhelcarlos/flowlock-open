import * as fs from "fs";
import * as path from "path";

function buildAcceptanceFeature(spec: any) {
  const roles: string[] = spec?.roles || [];
  const jtbd: Record<string, string[]> = spec?.jtbd || {};

  const lines: string[] = [];
  lines.push("Feature: Core user journeys");
  for (const role of roles) {
    const tasks: string[] = jtbd[role] || [];
    for (const t of tasks) {
      lines.push("");
      lines.push(`  Scenario: ${role}  ${t}`);
      lines.push(`    Given I am a ${role}`);
      lines.push(`    When I perform: ${t}`);
      lines.push("    Then I see success state and data is persisted");
    }
  }
  if (lines.length === 1) {
    lines.push("");
    lines.push("  # TODO: Add roles & JTBD in uxspec.json to expand scenarios automatically.");
  }
  return lines.join("\n");
}

export function writeAcceptance(outDir: string, spec: any) {
  const content = buildAcceptanceFeature(spec);

  // 1) Artifacts folder
  const artifactsFile = path.join(outDir, "acceptance_criteria.feature");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(artifactsFile, content);

  // 2) Docs folder (for nice repo docs)
  const docsDir = path.join(outDir, "..", "docs", "flow_audit");
  const docsFile = path.join(docsDir, "acceptance_criteria.feature");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(docsFile, content);

  return { artifactsFile, docsFile };
}
