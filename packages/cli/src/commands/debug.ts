import { Runner } from "flowlock-runner";
import { coreChecks } from "flowlock-checks-core";
import { parseSpec } from "flowlock-uxspec";
import type { CheckResult } from "flowlock-plugin-sdk";
import * as fs from "fs/promises";
import * as path from "path";
import chalk from "chalk";

interface DebugOptions {
  entity?: string;
  screen?: string;
  flow?: string;
  verbose?: boolean;
  showPaths?: boolean;
  showPatterns?: boolean;
  showRelations?: boolean;
  all?: boolean;
}

export async function debugCommand(checkName: string, options: DebugOptions) {
  try {
    // Load spec
    const specPath = path.join(process.cwd(), "uxspec.json");
    let spec: any;
    
    try {
      const specContent = await fs.readFile(specPath, "utf-8");
      spec = parseSpec(JSON.parse(specContent));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load spec from ${specPath}`));
      console.error(chalk.gray(`Make sure uxspec.json exists in the current directory`));
      process.exit(1);
    }

    console.log(chalk.cyan(`\n🔍 Debug Analysis: ${checkName.toUpperCase()}\n`));
    
    // Enable all debug options if --all is set
    if (options.all) {
      options.verbose = true;
      options.showPaths = true;
      options.showPatterns = true;
      options.showRelations = true;
    }

    // Show spec overview
    if (options.verbose) {
      console.log(chalk.blue("📋 Spec Overview:"));
      console.log(`  - ${spec.entities?.length || 0} entities`);
      console.log(`  - ${spec.screens?.length || 0} screens`);
      console.log(`  - ${spec.flows?.length || 0} flows`);
      console.log(`  - ${spec.roles?.length || 0} roles`);
      
      if (spec.jtbd) {
        const jtbdCount = Array.isArray(spec.jtbd) 
          ? spec.jtbd.length 
          : Object.keys(spec.jtbd).length;
        console.log(`  - ${jtbdCount} JTBD definitions`);
      }
      console.log();
    }

    // Filter based on options
    const targetEntity = options.entity;
    const targetScreen = options.screen;
    const targetFlow = options.flow;

    // Show focus if specified
    if (targetEntity || targetScreen || targetFlow) {
      console.log(chalk.yellow("🎯 Focus:"));
      if (targetEntity) console.log(`  Entity: ${targetEntity}`);
      if (targetScreen) console.log(`  Screen: ${targetScreen}`);
      if (targetFlow) console.log(`  Flow: ${targetFlow}`);
      console.log();
    }

    // Find the check
    const checkList = Object.values(coreChecks);
    const check = checkList.find((c: any) => 
      c.name.toLowerCase() === checkName.toLowerCase() ||
      c.name.toLowerCase().includes(checkName.toLowerCase())
    );

    if (!check) {
      console.error(chalk.red(`❌ Check "${checkName}" not found`));
      console.log(chalk.gray("\nAvailable checks:"));
      checkList.forEach((c: any) => {
        console.log(`  - ${c.name}`);
      });
      process.exit(1);
    }

    console.log(chalk.green(`✓ Found check: ${check.name}`));
    console.log(chalk.gray(`  ${check.description}`));
    console.log();

    // Run the check
    console.log(chalk.blue("🏃 Running check..."));
    const runner = new Runner({ spec, checks: [check] });
    const runnerResults = await runner.run();
    const results = runnerResults.checkResults || [];

    // Display results with debug information
    displayDebugResults(results, spec, options);

    // Show patterns if requested
    if (options.showPatterns) {
      detectPatterns(spec, checkName, options);
    }

    // Show paths analysis if requested
    if (options.showPaths && checkName.toLowerCase().includes('reach')) {
      showPathsAnalysis(spec, options);
    }

    // Show relations if requested
    if (options.showRelations && checkName.toLowerCase().includes('relation')) {
      showRelationsGraph(spec, options);
    }

  } catch (error) {
    if (options.verbose) {
      console.error(chalk.red("Debug command failed:"));
      console.error(error instanceof Error ? error.stack : error);
    } else {
      console.error(chalk.red("Debug command failed:"));
      console.error(error instanceof Error ? error.message : String(error));
      console.log(chalk.gray("\nRun with --verbose for more details"));
    }
    process.exit(1);
  }
}

function displayDebugResults(results: CheckResult[], _spec: any, options: DebugOptions) {
  const passed = results.filter((r: CheckResult) => r.status === "pass");
  const failed = results.filter((r: CheckResult) => r.status === "fail");
  
  if (failed.length > 0) {
    console.log(chalk.red(`\n❌ ${failed.length} issue(s) found:\n`));
    
    failed.forEach((r: CheckResult, i: number) => {
      console.log(chalk.red(`${i + 1}. ${r.message}`));
      
      // Show context if available
      if ((r as any).context) {
        Object.entries((r as any).context).forEach(([key, value]) => {
          console.log(chalk.gray(`   ${key}: ${JSON.stringify(value)}`));
        });
      }
      
      // Show fix suggestion if available
      if (r.ref) {
        console.log(chalk.yellow(`   💡 ${r.ref}`));
      }
      
      // Show additional details if verbose
      if ((r as any).details && options.verbose) {
        console.log(chalk.gray(`   Details: ${JSON.stringify((r as any).details, null, 2)}`));
      }
      
      console.log();
    });
  }
  
  if (passed.length > 0) {
    console.log(chalk.green(`\n✅ ${passed.length} check(s) passed`));
    
    if (options.verbose) {
      passed.forEach((r: CheckResult) => {
        console.log(chalk.gray(`  - ${r.message}`));
      });
    }
  }
  
  // Summary
  console.log(chalk.blue("\n📊 Summary:"));
  const passedCount = results.filter((r: CheckResult) => r.status === "pass").length;
  const failedCount = results.filter((r: CheckResult) => r.status === "fail").length;
  const errors = results.filter((r: CheckResult) => r.level === "error").length;
  const warnings = results.filter((r: CheckResult) => r.level === "warning").length;
  
  console.log(`  Total: ${results.length} checks`);
  console.log(`  Passed: ${chalk.green(passedCount.toString())}`);
  console.log(`  Failed: ${chalk.red(failedCount.toString())}`);
  
  if (errors > 0 || warnings > 0) {
    console.log(`  Errors: ${chalk.red(errors.toString())}`);
    console.log(`  Warnings: ${chalk.yellow(warnings.toString())}`);
  }
}

function detectPatterns(spec: any, checkName: string, _options: DebugOptions) {
  console.log(chalk.blue("\n🔍 Pattern Detection:"));
  
  // Patterns based on check type
  if (checkName.toLowerCase().includes('honest')) {
    // Find common missing reads
    const missingReads = new Map<string, number>();
    
    spec.screens?.forEach((screen: any) => {
      screen.reads?.forEach((read: string) => {
        const [entity, field] = read.split('.');
        const entityDef = spec.entities?.find((e: any) => e.id === entity);
        
        if (entityDef && !entityDef.fields?.find((f: any) => f.id === field)) {
          const key = `${entity}.${field}`;
          missingReads.set(key, (missingReads.get(key) || 0) + 1);
        }
      });
    });
    
    if (missingReads.size > 0) {
      console.log(chalk.yellow("\n  Common missing fields:"));
      Array.from(missingReads.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([field, count]) => {
          console.log(`    - ${field} (${count} occurrences)`);
        });
    }
  }
  
  if (checkName.toLowerCase().includes('creatable')) {
    // Find entities without create flows
    const entitiesWithoutCreate = spec.entities?.filter((entity: any) => {
      return !spec.flows?.some((flow: any) => 
        flow.steps?.some((step: any) => 
          step.writes?.some((w: string) => w.startsWith(entity.id))
        )
      );
    });
    
    if (entitiesWithoutCreate?.length > 0) {
      console.log(chalk.yellow("\n  Entities without create flows:"));
      entitiesWithoutCreate.forEach((entity: any) => {
        console.log(`    - ${entity.id}`);
      });
    }
  }
  
  if (checkName.toLowerCase().includes('ui')) {
    // Find screens missing UI states
    const screensMissingStates = spec.screens?.filter((screen: any) => 
      !screen.uiStates || screen.uiStates.length === 0
    );
    
    if (screensMissingStates?.length > 0) {
      console.log(chalk.yellow("\n  Screens missing UI states:"));
      screensMissingStates.forEach((screen: any) => {
        console.log(`    - ${screen.id}`);
      });
    }
  }
}

function showPathsAnalysis(spec: any, _options: DebugOptions) {
  console.log(chalk.blue("\n🛤️ Paths Analysis:"));
  
  // Analyze flow paths
  spec.flows?.forEach((flow: any) => {
    console.log(`\n  Flow: ${flow.id}`);
    
    if (flow.steps?.length > 0) {
      const path = flow.steps.map((step: any) => {
        const screen = spec.screens?.find((s: any) => s.id === step.screen);
        return screen ? screen.id : step.screen;
      }).join(' → ');
      
      console.log(`    Path: ${path}`);
      
      if (flow.success) {
        console.log(`    Success: ${flow.success.screen || 'N/A'}`);
      }
    } else {
      console.log(chalk.gray("    No steps defined"));
    }
  });
  
  // Find unreachable screens
  const allScreenIds = new Set(spec.screens?.map((s: any) => s.id) || []);
  const reachableScreenIds = new Set<string>();
  
  spec.flows?.forEach((flow: any) => {
    flow.steps?.forEach((step: any) => {
      reachableScreenIds.add(step.screen);
    });
    if (flow.success?.screen) {
      reachableScreenIds.add(flow.success.screen);
    }
  });
  
  spec.screens?.forEach((screen: any) => {
    screen.ctas?.forEach((cta: any) => {
      if (cta.to) {
        reachableScreenIds.add(cta.to);
      }
    });
  });
  
  const unreachable = Array.from(allScreenIds).filter((id) => !reachableScreenIds.has(id as string)) as string[];
  
  if (unreachable.length > 0) {
    console.log(chalk.yellow("\n  Potentially unreachable screens:"));
    unreachable.forEach(id => {
      console.log(`    - ${id}`);
    });
  }
}

function showRelationsGraph(spec: any, _options: DebugOptions) {
  console.log(chalk.blue("\n🔗 Relations Graph:"));
  
  spec.entities?.forEach((entity: any) => {
    if (entity.relations?.length > 0) {
      console.log(`\n  ${entity.id}:`);
      
      entity.relations.forEach((rel: any) => {
        const kind = rel.kind || '1:1';
        const arrow = kind.includes('many') ? '⟹' : '→';
        console.log(`    ${arrow} ${rel.to} (${kind}) via ${rel.id}`);
        
        // Check for circular references
        const targetEntity = spec.entities?.find((e: any) => e.id === rel.to);
        if (targetEntity?.relations?.some((r: any) => r.to === entity.id)) {
          console.log(chalk.yellow(`      ⚠️ Circular reference detected`));
        }
      });
    }
  });
  
  // Find orphaned entities
  const allEntityIds = new Set(spec.entities?.map((e: any) => e.id) || []);
  const relatedEntityIds = new Set<string>();
  
  spec.entities?.forEach((entity: any) => {
    entity.relations?.forEach((rel: any) => {
      relatedEntityIds.add(entity.id);
      relatedEntityIds.add(rel.to);
    });
  });
  
  const orphaned = Array.from(allEntityIds).filter((id) => !relatedEntityIds.has(id as string)) as string[];
  
  if (orphaned.length > 0) {
    console.log(chalk.yellow("\n  Entities without relations:"));
    orphaned.forEach(id => {
      console.log(`    - ${id}`);
    });
  }
}