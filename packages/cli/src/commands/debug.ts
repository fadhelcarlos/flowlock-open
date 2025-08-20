import { Runner, DebugAnalyzer } from "flowlock-runner";
import { coreChecks } from "flowlock-checks-core";
import { parseSpec, type UXSpec } from "flowlock-uxspec";
import type { FlowlockCheck, CheckResult } from "flowlock-plugin-sdk";
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
    const specPath = path.join(process.cwd(), "ux.json");
    const specContent = await fs.readFile(specPath, "utf-8");
    const spec = parseSpec(JSON.parse(specContent));
    
    // Initialize debug analyzer
    const analyzer = new DebugAnalyzer(spec, options);
    
    console.log(chalk.cyan(`\n🔍 Debug Analysis: ${checkName.toUpperCase()}\n`));
    
    // Find the check
    const check = coreChecks.find(c => 
      c.id === checkName || 
      c.id.toLowerCase().includes(checkName.toLowerCase()) ||
      c.name.toLowerCase().includes(checkName.toLowerCase())
    );
    
    if (!check) {
      console.error(chalk.red(`❌ Check not found: ${checkName}`));
      console.log(chalk.yellow("\nAvailable checks:"));
      coreChecks.forEach(c => {
        console.log(`  - ${chalk.cyan(c.id)} (${c.name})`);
      });
      return;
    }
    
    console.log(chalk.gray(`Check ID: ${check.id}`));
    console.log(chalk.gray(`Description: ${check.description}\n`));
    
    // Run check with debug mode
    process.env.FLOWLOCK_DEBUG = "true";
    process.env.FLOWLOCK_VERBOSE = options.verbose ? "true" : "false";
    
    const results = await check.run(spec);
    const resultsArray = Array.isArray(results) ? results : [results];
    
    // Analyze based on check type
    switch (check.id) {
      case "creatable_needs_detail":
        await debugCreatable(analyzer, resultsArray, options);
        break;
      
      case "reachability":
        await debugReachability(analyzer, resultsArray, options);
        break;
      
      case "relations":
        await debugRelations(analyzer, resultsArray, options);
        break;
      
      case "honest_reads":
        await debugHonestReads(analyzer, resultsArray, options);
        break;
      
      case "ui_states":
        await debugUIStates(analyzer, resultsArray, options);
        break;
      
      case "state_machines":
        await debugStateMachines(analyzer, resultsArray, options);
        break;
      
      default:
        await debugGeneric(analyzer, resultsArray, options);
    }
    
    // Show summary
    showDebugSummary(resultsArray);
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Debug failed: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function debugCreatable(
  analyzer: DebugAnalyzer,
  results: CheckResult[],
  options: DebugOptions
) {
  console.log(chalk.yellow("📋 CREATABLE CHECK ANALYSIS\n"));
  
  // Show what the check is looking for
  console.log(chalk.cyan("What this check validates:"));
  console.log("  1. Entities with create forms must have detail screens");
  console.log("  2. Detail screens must be reachable in at least one flow");
  console.log("  3. Detail screen patterns: type='detail' + entity/entityId field\n");
  
  // Analyze entities
  const analysis = analyzer.analyzeCreatable(options.entity);
  
  console.log(chalk.cyan("Entity Analysis:"));
  for (const [entityId, info] of analysis.entities) {
    const hasIssue = results.some(r => r.ref?.includes(`entity:${entityId}`));
    const icon = hasIssue ? "❌" : "✅";
    
    console.log(`\n${icon} Entity: ${chalk.bold(info.name)} (${entityId})`);
    
    if (info.createForms.length > 0) {
      console.log(chalk.green(`  ✓ Has ${info.createForms.length} create form(s):`));
      info.createForms.forEach(f => {
        console.log(`    - Screen: ${f.screenId}, Form: ${f.formId}`);
      });
    } else {
      console.log(chalk.gray("  - No create forms"));
    }
    
    if (info.detailScreens.length > 0) {
      console.log(chalk.green(`  ✓ Has ${info.detailScreens.length} detail screen(s):`));
      info.detailScreens.forEach(s => {
        console.log(`    - ${s.id} (matched by: ${s.matchedBy})`);
      });
    } else if (info.createForms.length > 0) {
      console.log(chalk.red("  ✗ No detail screens found"));
      console.log(chalk.yellow("  Expected patterns:"));
      console.log(`    - Screen with type='detail' and entity='${entityId}'`);
      console.log(`    - Screen with type='detail' and entityId='${entityId}'`);
      console.log(`    - Screen with id='${entityId}-detail' or '${entityId}Detail'`);
    }
    
    if (options.showPaths && info.detailScreens.length > 0) {
      console.log(chalk.cyan("  Flow paths:"));
      info.detailScreens.forEach(screen => {
        const paths = analyzer.findPathsToScreen(screen.id);
        if (paths.length > 0) {
          console.log(`    To ${screen.id}:`);
          paths.forEach(p => {
            console.log(`      - ${p.flow}: ${p.path.join(" → ")}`);
          });
        } else {
          console.log(chalk.red(`    No paths to ${screen.id}`));
        }
      });
    }
  }
  
  if (options.showPatterns) {
    console.log(chalk.cyan("\n🔍 Pattern Detection:"));
    const patterns = analyzer.detectPatterns();
    patterns.forEach(p => {
      console.log(`  ${p.type}: ${p.description}`);
      if (p.suggestion) {
        console.log(chalk.yellow(`    → ${p.suggestion}`));
      }
    });
  }
}

async function debugReachability(
  analyzer: DebugAnalyzer,
  results: CheckResult[],
  options: DebugOptions
) {
  console.log(chalk.yellow("🛤️ REACHABILITY CHECK ANALYSIS\n"));
  
  console.log(chalk.cyan("What this check validates:"));
  console.log("  1. Success screens must be reachable from flow entry points");
  console.log("  2. Success screens should be reachable within configured max steps (default: 3)");
  console.log("  3. Flows should not have unreachable screens\n");
  
  const analysis = analyzer.analyzeReachability(options.flow);
  
  for (const [flowId, info] of analysis.flows) {
    const hasIssue = results.some(r => r.ref?.includes(`flow:${flowId}`));
    const icon = hasIssue ? "❌" : "✅";
    
    console.log(`\n${icon} Flow: ${chalk.bold(info.name)} (${flowId})`);
    console.log(`  Entry: ${info.entryStep}`);
    
    if (info.successScreens.length > 0) {
      console.log(chalk.cyan(`  Success screens (${info.successScreens.length}):`));
      info.successScreens.forEach(s => {
        const reachable = s.minDepth !== Infinity;
        const withinLimit = s.minDepth <= 3;
        let status = "";
        
        if (!reachable) {
          status = chalk.red("UNREACHABLE");
        } else if (!withinLimit) {
          status = chalk.yellow(`TOO DEEP (${s.minDepth} steps)`);
        } else {
          status = chalk.green(`OK (${s.minDepth} steps)`);
        }
        
        console.log(`    - ${s.screenId}: ${status}`);
        
        if (options.showPaths && reachable) {
          const paths = analyzer.findPathsInFlow(flowId, info.entryStep, s.screenId);
          if (paths.length > 0) {
            console.log(chalk.gray(`      Path: ${paths[0].join(" → ")}`));
          }
        }
      });
    } else {
      console.log(chalk.gray("  No success screens"));
    }
    
    if (info.unreachableSteps.length > 0) {
      console.log(chalk.red(`  ⚠️ Unreachable steps (${info.unreachableSteps.length}):`));
      info.unreachableSteps.forEach(stepId => {
        const step = info.allSteps.find(s => s.id === stepId);
        console.log(`    - ${stepId} (screen: ${step?.screenId || "none"})`);
      });
      
      console.log(chalk.yellow("  Possible fixes:"));
      console.log("    1. Add transitions from existing steps");
      console.log("    2. Check for broken next references");
      console.log("    3. Verify entryStepId is correct");
    }
    
    if (options.verbose) {
      console.log(chalk.cyan("  Flow graph:"));
      analyzer.visualizeFlowGraph(flowId);
    }
  }
}

async function debugRelations(
  analyzer: DebugAnalyzer,
  results: CheckResult[],
  options: DebugOptions
) {
  console.log(chalk.yellow("🔗 RELATIONS CHECK ANALYSIS\n"));
  
  console.log(chalk.cyan("What this check validates:"));
  console.log("  1. All relation targets must exist");
  console.log("  2. Relation kinds must be valid (1:1, 1:many, many:1, many:many)");
  console.log("  3. No circular dependencies\n");
  
  const analysis = analyzer.analyzeRelations(options.entity);
  
  for (const [entityId, info] of analysis.entities) {
    const hasIssue = results.some(r => r.ref?.includes(`entity:${entityId}`));
    const icon = hasIssue ? "❌" : "✅";
    
    console.log(`\n${icon} Entity: ${chalk.bold(info.name)} (${entityId})`);
    
    if (info.relations.length > 0) {
      console.log(chalk.cyan("  Relations:"));
      info.relations.forEach(r => {
        const targetExists = analysis.entities.has(r.to);
        const validKind = ["1:1", "1:many", "many:1", "many:many"].includes(r.kind);
        
        let status = [];
        if (!targetExists) status.push(chalk.red("target missing"));
        if (!validKind) status.push(chalk.red(`invalid kind: ${r.kind}`));
        if (r.circular) status.push(chalk.yellow("circular"));
        
        const statusStr = status.length > 0 ? ` [${status.join(", ")}]` : chalk.green(" ✓");
        
        console.log(`    - ${r.id}: ${r.kind} → ${r.to}${statusStr}`);
        
        if (!targetExists && options.verbose) {
          const similar = analyzer.findSimilarEntity(r.to);
          if (similar) {
            console.log(chalk.yellow(`      Did you mean: ${similar}?`));
          }
        }
      });
    } else {
      console.log(chalk.gray("  No relations"));
    }
    
    if (info.incomingRelations.length > 0) {
      console.log(chalk.cyan("  Referenced by:"));
      info.incomingRelations.forEach(r => {
        console.log(`    - ${r.from} (${r.kind})`);
      });
    }
  }
  
  if (options.showRelations) {
    console.log(chalk.cyan("\n🗺️ Relationship Graph:"));
    analyzer.visualizeRelationshipGraph();
  }
  
  // Check for orphaned entities
  const orphaned = analyzer.findOrphanedEntities();
  if (orphaned.length > 0) {
    console.log(chalk.yellow("\n⚠️ Orphaned entities (no relations):"));
    orphaned.forEach(e => console.log(`  - ${e}`));
  }
}

async function debugHonestReads(
  analyzer: DebugAnalyzer,
  results: CheckResult[],
  options: DebugOptions
) {
  console.log(chalk.yellow("📖 HONEST READS CHECK ANALYSIS\n"));
  
  console.log(chalk.cyan("What this check validates:"));
  console.log("  1. Screens displaying entity data must declare reads");
  console.log("  2. Read declarations must match actual data usage");
  console.log("  3. No undeclared data access\n");
  
  const analysis = analyzer.analyzeHonestReads(options.screen);
  
  for (const [screenId, info] of analysis.screens) {
    const hasIssue = results.some(r => r.ref?.includes(`screen:${screenId}`));
    const icon = hasIssue ? "❌" : "✅";
    
    console.log(`\n${icon} Screen: ${chalk.bold(screenId)}`);
    console.log(`  Type: ${info.type}`);
    
    if (info.displays.length > 0) {
      console.log(chalk.cyan("  Displays:"));
      info.displays.forEach(d => {
        console.log(`    - ${d.entityId} (${d.displayType})`);
      });
    }
    
    if (info.reads.length > 0) {
      console.log(chalk.green("  ✓ Declared reads:"));
      info.reads.forEach(r => {
        console.log(`    - ${r.entity} (${r.fields ? r.fields.join(", ") : "all fields"})`);
      });
    } else if (info.displays.length > 0) {
      console.log(chalk.red("  ✗ No reads declared but has displays"));
      console.log(chalk.yellow("  Should add:"));
      info.displays.forEach(d => {
        console.log(`    { "entity": "${d.entityId}", "fields": [...] }`);
      });
    }
    
    // Check for mismatches
    const displayedEntities = new Set(info.displays.map(d => d.entityId));
    const readEntities = new Set(info.reads.map(r => r.entity));
    
    const undeclared = [...displayedEntities].filter(e => !readEntities.has(e));
    const unused = [...readEntities].filter(e => !displayedEntities.has(e));
    
    if (undeclared.length > 0) {
      console.log(chalk.red("  ⚠️ Undeclared reads:"));
      undeclared.forEach(e => console.log(`    - ${e}`));
    }
    
    if (unused.length > 0) {
      console.log(chalk.yellow("  ⚠️ Unused reads:"));
      unused.forEach(e => console.log(`    - ${e}`));
    }
  }
  
  if (options.verbose) {
    console.log(chalk.cyan("\n📊 Data Flow Analysis:"));
    const dataFlow = analyzer.analyzeDataFlow();
    dataFlow.forEach(flow => {
      console.log(`  ${flow.entity}:`);
      console.log(`    Read by: ${flow.readers.join(", ") || "none"}`);
      console.log(`    Written by: ${flow.writers.join(", ") || "none"}`);
    });
  }
}

async function debugUIStates(
  analyzer: DebugAnalyzer,
  results: CheckResult[],
  options: DebugOptions
) {
  console.log(chalk.yellow("🎨 UI STATES CHECK ANALYSIS\n"));
  
  console.log(chalk.cyan("What this check validates:"));
  console.log("  1. Screens with data should declare loading states");
  console.log("  2. Screens with lists should declare empty states");
  console.log("  3. Screens with forms/data should declare error states\n");
  
  const analysis = analyzer.analyzeUIStates(options.screen);
  
  for (const [screenId, info] of analysis.screens) {
    const hasIssue = results.some(r => r.ref?.includes(`screen:${screenId}`));
    const icon = hasIssue ? "❌" : "✅";
    
    console.log(`\n${icon} Screen: ${chalk.bold(screenId)}`);
    console.log(`  Type: ${info.type}`);
    
    // Show what states are needed
    const needed = [];
    if (info.hasData) needed.push("loading");
    if (info.hasList) needed.push("empty");
    if (info.hasData || info.hasForms) needed.push("error");
    
    if (needed.length > 0) {
      console.log(chalk.cyan("  Required states:"));
      needed.forEach(state => {
        const has = info.states.includes(state);
        const icon = has ? chalk.green("✓") : chalk.red("✗");
        console.log(`    ${icon} ${state}`);
      });
    }
    
    if (info.states.length > 0) {
      console.log(chalk.cyan("  Declared states:"));
      info.states.forEach(s => console.log(`    - ${s}`));
    }
    
    // Show why states are needed
    if (options.verbose) {
      console.log(chalk.gray("  Reasoning:"));
      if (info.hasData) {
        console.log(`    - Has data (${info.dataSource}): needs loading state`);
      }
      if (info.hasList) {
        console.log(`    - Has list display: needs empty state`);
      }
      if (info.hasForms) {
        console.log(`    - Has forms: needs error state`);
      }
    }
  }
  
  // Show patterns
  if (options.showPatterns) {
    console.log(chalk.cyan("\n🎯 Common Patterns:"));
    const patterns = analyzer.detectUIStatePatterns();
    patterns.forEach(p => {
      console.log(`  ${p.pattern}: ${p.screens.join(", ")}`);
      if (p.suggestion) {
        console.log(chalk.yellow(`    → ${p.suggestion}`));
      }
    });
  }
}

async function debugStateMachines(
  analyzer: DebugAnalyzer,
  results: CheckResult[],
  options: DebugOptions
) {
  console.log(chalk.yellow("⚙️ STATE MACHINES CHECK ANALYSIS\n"));
  
  console.log(chalk.cyan("What this check validates:"));
  console.log("  1. State transitions are valid");
  console.log("  2. Terminal states are properly marked");
  console.log("  3. No unreachable states");
  console.log("  4. No invalid state references\n");
  
  const analysis = analyzer.analyzeStateMachines();
  
  for (const [entityId, info] of analysis.machines) {
    const hasIssue = results.some(r => r.ref?.includes(`entity:${entityId}`));
    const icon = hasIssue ? "❌" : "✅";
    
    console.log(`\n${icon} Entity: ${chalk.bold(entityId)}`);
    
    if (info.states.length > 0) {
      console.log(chalk.cyan("  States:"));
      info.states.forEach(s => {
        const terminal = s.terminal ? chalk.gray(" [terminal]") : "";
        console.log(`    - ${s.id}${terminal}`);
        
        if (s.transitions.length > 0 && options.verbose) {
          s.transitions.forEach(t => {
            console.log(`      → ${t.to} (${t.condition || "always"})`);
          });
        }
      });
      
      // Check for issues
      const unreachable = analyzer.findUnreachableStates(entityId);
      if (unreachable.length > 0) {
        console.log(chalk.red("  ⚠️ Unreachable states:"));
        unreachable.forEach(s => console.log(`    - ${s}`));
      }
      
      const invalid = analyzer.findInvalidTransitions(entityId);
      if (invalid.length > 0) {
        console.log(chalk.red("  ⚠️ Invalid transitions:"));
        invalid.forEach(t => console.log(`    - ${t.from} → ${t.to} (state '${t.to}' doesn't exist)`));
      }
    } else {
      console.log(chalk.gray("  No state machine defined"));
    }
    
    if (options.verbose) {
      console.log(chalk.cyan("  State graph:"));
      analyzer.visualizeStateMachine(entityId);
    }
  }
}

async function debugGeneric(
  analyzer: DebugAnalyzer,
  results: CheckResult[],
  options: DebugOptions
) {
  console.log(chalk.cyan("Check Results:\n"));
  
  const passed = results.filter(r => r.status === "pass");
  const failed = results.filter(r => r.status === "fail");
  
  if (failed.length > 0) {
    console.log(chalk.red(`❌ ${failed.length} issue(s) found:\n`));
    failed.forEach(r => {
      console.log(chalk.red(`  • ${r.message}`));
      if (r.ref) {
        console.log(chalk.gray(`    Reference: ${r.ref}`));
      }
      if (r.details && options.verbose) {
        console.log(chalk.gray(`    Details: ${JSON.stringify(r.details, null, 2)}`));
      }
    });
  }
  
  if (passed.length > 0) {
    console.log(chalk.green(`\n✅ ${passed.length} check(s) passed`));
    if (options.verbose) {
      passed.forEach(r => {
        console.log(chalk.green(`  • ${r.message}`));
      });
    }
  }
}

function showDebugSummary(results: CheckResult[]) {
  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const errors = results.filter(r => r.level === "error").length;
  const warnings = results.filter(r => r.level === "warning").length;
  
  console.log(chalk.cyan("\n📊 Summary:"));
  console.log(`  Total checks: ${results.length}`);
  console.log(`  Passed: ${chalk.green(passed)}`);
  console.log(`  Failed: ${chalk.red(failed)}`);
  
  if (failed > 0) {
    console.log(`    - Errors: ${chalk.red(errors)}`);
    console.log(`    - Warnings: ${chalk.yellow(warnings)}`);
  }
  
  console.log(chalk.gray("\n💡 Tips:"));
  console.log("  • Use --verbose for detailed output");
  console.log("  • Use --show-paths to see flow paths");
  console.log("  • Use --show-patterns to detect common issues");
  console.log("  • Use --entity=<name> to focus on specific entity");
  console.log("  • Use --all to show everything");
}