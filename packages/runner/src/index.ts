import { parseSpec, type UXSpec } from "flowlock-uxspec";
import { coreChecks } from "flowlock-checks-core";
import type { CheckResult, FlowlockCheck } from "flowlock-plugin-sdk";
import { generateERDiagram, generateFlowDiagram } from "./generators/mermaid";
import { generateScreensCSV } from "./generators/csv";
import { generateJUnitXML } from "./generators/junit";
import { writeGapReport } from "./generators/gapReport";
import { writeAcceptance } from "./generators/acceptance";
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
    // Load both raw JSON (with all user fields) and the parsed spec (normalized/core)
    const content = await fs.readFile(specPath, "utf-8");
    const raw = JSON.parse(content);
    const base = parseSpec(raw);
  
    // Merge screen-level extras (roles, uiStates) from the raw spec back onto parsed screens
    const mergedScreens = (base as any).screens.map((s: any, idx: number) => {
      const rawScreen = Array.isArray(raw.screens) ? raw.screens[idx] : undefined;
      const roles = Array.isArray(rawScreen?.roles) ? rawScreen.roles : s.roles;
      const uiStates = Array.isArray(rawScreen?.uiStates) ? rawScreen.uiStates : s.uiStates;
      return { ...s, roles, uiStates };
    });
  
    // Merge top-level extras (roles, jtbd) as well
    const specWithExtras = {
      ...(base as any),
      roles: Array.isArray(raw.roles) ? raw.roles : (base as any).roles,
      jtbd: raw.jtbd && typeof raw.jtbd === "object" ? raw.jtbd : (base as any).jtbd,
      screens: mergedScreens,
    } as UXSpec; // cast is fine – we’re enriching with optional fields
  
    return new Runner({
      ...config,
      spec: specWithExtras as any,
    });
  }
  

  async run(): Promise<RunnerResult> {
    const checkResults: CheckResult[] = [];
    for (const check of this.checks) {
      try {
        const results = await check.run(this.spec);
        if (Array.isArray(results)) checkResults.push(...results);
        else checkResults.push(results);
      } catch (error) {
        checkResults.push({
          id: `${check.id}_error`,
          level: "error",
          status: "fail",
          message: `Check '${check.name}' failed: ${error}`,
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

    await fs.writeFile(
      path.join(outputDir, "er.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Mermaid diagram: ${result.artifacts.erDiagram.substring(0, 100)}...</text></svg>`
    );
    await fs.writeFile(
      path.join(outputDir, "flow.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Mermaid diagram: ${result.artifacts.flowDiagram.substring(0, 100)}...</text></svg>`
    );
    await fs.writeFile(
      path.join(outputDir, "screens.csv"),
      result.artifacts.screensCSV
    );
    await fs.writeFile(
      path.join(outputDir, "results.junit.xml"),
      result.artifacts.junitXML
    );

    // Write extra documents (do not log; just write)
    void writeGapReport(outputDir, result.checkResults as any);
    void writeAcceptance(outputDir, this.spec as UXSpec);

    return result;
  }
}

export * from "./generators/mermaid";
export * from "./generators/csv";
export * from "./generators/junit";
