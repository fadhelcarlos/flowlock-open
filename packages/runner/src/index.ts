import { parseSpec, type UXSpec } from "flowlock-uxspec";
import { coreChecks } from "flowlock-checks-core";
import type { CheckResult, FlowlockCheck } from "flowlock-plugin-sdk";
import { formatError } from "flowlock-shared";
import { generateERDiagram, generateFlowDiagram } from "./generators/mermaid";
import { generateScreensCSV } from "./generators/csv";
import { generateJUnitXML } from "./generators/junit";
import { writeGapReport } from "./generators/gapReport";
import { writeAcceptance } from "./generators/acceptance";
import { renderMermaidCLI } from "./utils/render";
import * as fs from "fs/promises";
import * as path from "path";

export interface RunnerConfig {
  spec?: UXSpec;
  specPath?: string;
  outputDir?: string;
  checks?: FlowlockCheck[];
  config?: Record<string, unknown>;
}

export interface RunnerResult {
  checkResults: CheckResult[];
  artifacts: {
    erDiagram: string;
    flowDiagram: string;
    screensCSV: string;
    junitXML: string;
  };
}

export class Runner {
  private spec: UXSpec;
  private checks: FlowlockCheck[];

  constructor(config: RunnerConfig) {
    if (config.spec) {
      this.spec = config.spec;
    } else if (config.specPath) {
      throw new Error("Use loadSpec method for file-based specs");
    } else {
      throw new Error("Either spec or specPath must be provided");
    }
    this.checks = config.checks || coreChecks;
  }

  static async fromFile(
    specPath: string,
    config?: Omit<RunnerConfig, "spec" | "specPath">
  ): Promise<Runner> {
    const content = await fs.readFile(specPath, "utf-8");
    const json = JSON.parse(content);
    const spec = parseSpec(json);
// Passthrough: keep non-canonical fields so checks can see them
try {
  if (Array.isArray(json?.roles)) (spec as any).roles = json.roles;
  if (json?.jtbd) (spec as any).jtbd = json.jtbd;

  const rawScreens = Array.isArray(json?.screens) ? json.screens : [];
  if (Array.isArray((spec as any).screens)) {
    for (const s of (spec as any).screens as any[]) {
      const raw = rawScreens.find((r:any) => r && r.id === s.id) || {};
      if (Array.isArray(raw.roles) && !s.roles) (s as any).roles = raw.roles;
      if (Array.isArray(raw.uiStates) && !s.uiStates) (s as any).uiStates = raw.uiStates;
    }
  }
} catch { /* no-op */ }
    return new Runner({ ...config, spec });
  }

  async run(): Promise<RunnerResult> {
    const checkResults: CheckResult[] = [];
    for (const check of this.checks) {
      try {
        const results = await check.run(this.spec);
        if (Array.isArray(results)) checkResults.push(...results);
        else checkResults.push(results);
      } catch (error) {
        const formattedMessage = formatError(error);
        checkResults.push({
          id: `${check.id}_error`,
          level: "error",
          status: "fail",
          message: `Check '${check.name}' failed: ${formattedMessage}`
        });
      }
    }

    const artifacts = {
      erDiagram: generateERDiagram(this.spec),
      flowDiagram: generateFlowDiagram(this.spec),
      screensCSV: generateScreensCSV(this.spec),
      junitXML: generateJUnitXML(checkResults),
    };

    return { checkResults, artifacts };
  }

  async runAndSave(outputDir: string = "artifacts"): Promise<RunnerResult> {
    const result = await this.run();
    await fs.mkdir(outputDir, { recursive: true });

    // Save Mermaid sources (always)
    const erMmd = path.join(outputDir, "er.mmd");
    const flowMmd = path.join(outputDir, "flow.mmd");
    await fs.writeFile(erMmd, result.artifacts.erDiagram, "utf8");
    await fs.writeFile(flowMmd, result.artifacts.flowDiagram, "utf8");
    
    // Save formatted results
    const { formatCheckSummary, exportResultsJSON } = await import("./utils/format");
    await fs.writeFile(
      path.join(outputDir, "check-results.json"),
      exportResultsJSON(result.checkResults),
      "utf8"
    );
    await fs.writeFile(
      path.join(outputDir, "check-summary.txt"),
      formatCheckSummary(result.checkResults),
      "utf8"
    );

    // Try rendering SVGs; fallback writes a small notice SVG
    const erSvg = path.join(outputDir, "er.svg");
    const flowSvg = path.join(outputDir, "flow.svg");

    const erOk = await renderMermaidCLI(erMmd, erSvg);
    if (!erOk) {
      await fs.writeFile(
        erSvg,
        `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Mermaid source saved to er.mmd (renderer unavailable)</text></svg>`
      );
    }

    const flowOk = await renderMermaidCLI(flowMmd, flowSvg);
    if (!flowOk) {
      await fs.writeFile(
        flowSvg,
        `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Mermaid source saved to flow.mmd (renderer unavailable)</text></svg>`
      );
    }

    // Other artifacts
    await fs.writeFile(path.join(outputDir, "screens.csv"), result.artifacts.screensCSV);
    await fs.writeFile(path.join(outputDir, "results.junit.xml"), result.artifacts.junitXML);

    // Extra docs (both return file paths; we dont rely on them)
    const gap = writeGapReport(outputDir, result.checkResults as any);
    const acc = writeAcceptance(outputDir, (this as any).spec as UXSpec);
    if ((gap as any)?.artifactsFile) console.log("  " + path.normalize((gap as any).artifactsFile));
    if ((acc as any)?.artifactsFile) console.log("  " + path.normalize((acc as any).artifactsFile));

    return result;
  }
}

export * from "./generators/mermaid";
export * from "./generators/csv";
export * from "./utils/format";
export * from "./generators/junit";
export { DebugAnalyzer } from "./utils/debug";
