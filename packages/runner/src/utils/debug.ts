import type { UXSpec, Flow, FlowStep } from "flowlock-uxspec";
import chalk from "chalk";

export interface DebugOptions {
  entity?: string;
  screen?: string;
  flow?: string;
  verbose?: boolean;
  showPaths?: boolean;
  showPatterns?: boolean;
  showRelations?: boolean;
  all?: boolean;
}

interface EntityAnalysis {
  name: string;
  createForms: Array<{ screenId: string; formId: string }>;
  detailScreens: Array<{ id: string; matchedBy: string }>;
  relations: Array<{ id: string; to: string; kind: string; circular?: boolean }>;
  incomingRelations: Array<{ from: string; kind: string }>;
}

interface FlowAnalysis {
  name: string;
  entryStep: string;
  successScreens: Array<{ screenId: string; minDepth: number }>;
  unreachableSteps: string[];
  allSteps: FlowStep[];
}

interface ScreenAnalysis {
  type: string;
  displays: Array<{ entityId: string; displayType: string }>;
  reads: Array<{ entity: string; fields?: string[] }>;
  states: string[];
  hasData: boolean;
  hasList: boolean;
  hasForms: boolean;
  dataSource?: string;
}

interface StateMachineAnalysis {
  states: Array<{
    id: string;
    terminal: boolean;
    transitions: Array<{ to: string; condition?: string }>;
  }>;
}

export class DebugAnalyzer {
  constructor(
    private spec: UXSpec,
    _options: DebugOptions = {}
  ) {}

  analyzeCreatable(entityFilter?: string): {
    entities: Map<string, EntityAnalysis>;
  } {
    const entities = new Map<string, EntityAnalysis>();
    
    for (const entity of this.spec.entities) {
      if (entityFilter && entity.id !== entityFilter && entity.name !== entityFilter) {
        continue;
      }
      
      const analysis: EntityAnalysis = {
        name: entity.name,
        createForms: [],
        detailScreens: [],
        relations: [],
        incomingRelations: []
      };
      
      // Find create forms
      for (const screen of this.spec.screens) {
        if (screen.forms) {
          for (const form of screen.forms) {
            if (form.type === "create" && form.entityId === entity.id) {
              analysis.createForms.push({
                screenId: screen.id,
                formId: form.id
              });
            }
          }
        }
      }
      
      // Find detail screens
      for (const screen of this.spec.screens) {
        if (screen.type === "detail") {
          // Check entity field
          if ((screen as any).entity === entity.id) {
            analysis.detailScreens.push({
              id: screen.id,
              matchedBy: "entity field"
            });
          }
          // Check entityId field
          else if ((screen as any).entityId === entity.id) {
            analysis.detailScreens.push({
              id: screen.id,
              matchedBy: "entityId field"
            });
          }
          // Check ID pattern
          else if (new RegExp(`^${entity.id}[-_]?detail$`, "i").test(screen.id)) {
            analysis.detailScreens.push({
              id: screen.id,
              matchedBy: "ID pattern"
            });
          }
        }
      }
      
      // Analyze relations
      const relations = (entity as any).relations || [];
      for (const relation of relations) {
        analysis.relations.push({
          id: relation.id,
          to: relation.to,
          kind: relation.kind
        });
      }
      
      entities.set(entity.id, analysis);
    }
    
    // Find incoming relations
    for (const entity of this.spec.entities) {
      const relations = (entity as any).relations || [];
      for (const relation of relations) {
        const target = entities.get(relation.to);
        if (target) {
          target.incomingRelations.push({
            from: entity.id,
            kind: relation.kind
          });
        }
      }
    }
    
    return { entities };
  }

  analyzeReachability(flowFilter?: string): {
    flows: Map<string, FlowAnalysis>;
  } {
    const flows = new Map<string, FlowAnalysis>();
    
    for (const flow of this.spec.flows) {
      if (flowFilter && flow.id !== flowFilter && flow.name !== flowFilter) {
        continue;
      }
      
      const analysis: FlowAnalysis = {
        name: flow.name,
        entryStep: flow.entryStepId,
        successScreens: [],
        unreachableSteps: [],
        allSteps: flow.steps
      };
      
      // Find success screens
      for (const step of flow.steps) {
        const screen = this.spec.screens.find(s => s.id === step.screenId);
        if (screen?.type === "success") {
          const minDepth = this.findMinDepth(flow, flow.entryStepId, step.screenId || step.screen || '');
          analysis.successScreens.push({
            screenId: step.screenId || step.screen || '',
            minDepth
          });
        }
      }
      
      // Find unreachable steps
      const reachable = this.findReachableSteps(flow, flow.entryStepId);
      analysis.unreachableSteps = flow.steps
        .filter(s => !reachable.has(s.id))
        .map(s => s.id);
      
      flows.set(flow.id, analysis);
    }
    
    return { flows };
  }

  analyzeRelations(entityFilter?: string): {
    entities: Map<string, EntityAnalysis>;
  } {
    const analysis = this.analyzeCreatable(entityFilter);
    
    // Check for circular relations
    for (const [entityId, info] of analysis.entities) {
      for (const relation of info.relations) {
        const targetEntity = analysis.entities.get(relation.to);
        if (targetEntity) {
          const hasReverse = targetEntity.relations.some(
            r => r.to === entityId && r.id === relation.id
          );
          if (hasReverse) {
            relation.circular = true;
          }
        }
      }
    }
    
    return analysis;
  }

  analyzeHonestReads(screenFilter?: string): {
    screens: Map<string, ScreenAnalysis>;
  } {
    const screens = new Map<string, ScreenAnalysis>();
    
    for (const screen of this.spec.screens) {
      if (screenFilter && screen.id !== screenFilter) {
        continue;
      }
      
      const analysis: ScreenAnalysis = {
        type: screen.type || "unknown",
        displays: [],
        reads: [],
        states: (screen as any).uiStates || [],
        hasData: false,
        hasList: false,
        hasForms: false
      };
      
      // Find displays (commented out as displays property doesn't exist on Screen)
      // if ((screen as any).displays) {
      //   for (const display of (screen as any).displays) {
      //     analysis.displays.push({
      //       entityId: display.entityId,
      //       displayType: display.type
      //     });
      //     analysis.hasData = true;
      //     if (display.type === "list" || display.type === "grid") {
      //       analysis.hasList = true;
      //     }
      //   }
      // }
      
      // Find reads
      if ((screen as any).reads) {
        analysis.reads = (screen as any).reads;
        analysis.hasData = true;
      }
      
      // Check for forms
      if (screen.forms && screen.forms.length > 0) {
        analysis.hasForms = true;
        analysis.hasData = true;
      }
      
      if (analysis.hasData) {
        analysis.dataSource = analysis.displays.length > 0 ? "displays" : 
                            analysis.reads.length > 0 ? "reads" : "forms";
      }
      
      screens.set(screen.id, analysis);
    }
    
    return { screens };
  }

  analyzeUIStates(screenFilter?: string): {
    screens: Map<string, ScreenAnalysis>;
  } {
    return this.analyzeHonestReads(screenFilter);
  }

  analyzeStateMachines(): {
    machines: Map<string, StateMachineAnalysis>;
  } {
    const machines = new Map<string, StateMachineAnalysis>();
    
    for (const entity of this.spec.entities) {
      const states = (entity as any).states || [];
      if (states.length > 0) {
        const analysis: StateMachineAnalysis = {
          states: states.map((s: any) => ({
            id: s.id,
            terminal: s.terminal || false,
            transitions: s.transitions || []
          }))
        };
        machines.set(entity.id, analysis);
      }
    }
    
    return { machines };
  }

  findPathsToScreen(screenId: string): Array<{
    flow: string;
    path: string[];
  }> {
    const paths = [];
    
    for (const flow of this.spec.flows) {
      const screenSteps = flow.steps.filter(s => s.screenId === screenId);
      
      for (const targetStep of screenSteps) {
        const path = this.findPath(flow, flow.entryStepId, targetStep.id);
        if (path.length > 0) {
          paths.push({
            flow: flow.name,
            path: path.map(stepId => {
              const step = flow.steps.find(s => s.id === stepId);
              return (step as any)?.name || stepId;
            })
          });
        }
      }
    }
    
    return paths;
  }

  findPathsInFlow(flowId: string, fromStep: string, toScreen: string): string[][] {
    const flow = this.spec.flows.find(f => f.id === flowId);
    if (!flow) return [];
    
    const targetSteps = flow.steps.filter(s => s.screenId === toScreen);
    const paths = [];
    
    for (const target of targetSteps) {
      const path = this.findPath(flow, fromStep, target.id);
      if (path.length > 0) {
        paths.push(path.map(id => {
          const step = flow.steps.find(s => s.id === id);
          return (step as any)?.name || id;
        }));
      }
    }
    
    return paths;
  }

  detectPatterns(): Array<{
    type: string;
    description: string;
    suggestion?: string;
  }> {
    const patterns = [];
    
    // Check for missing detail screens pattern
    const entitiesWithCreate = new Set<string>();
    const entitiesWithDetail = new Set<string>();
    
    for (const screen of this.spec.screens) {
      if (screen.forms) {
        for (const form of screen.forms) {
          if (form.type === "create") {
            entitiesWithCreate.add(form.entityId);
          }
        }
      }
      if (screen.type === "detail") {
        const entityId = (screen as any).entity || (screen as any).entityId;
        if (entityId) {
          entitiesWithDetail.add(entityId);
        }
      }
    }
    
    const missingDetail = [...entitiesWithCreate].filter(e => !entitiesWithDetail.has(e));
    if (missingDetail.length > 0) {
      patterns.push({
        type: "Missing Detail Pattern",
        description: `${missingDetail.length} entities have create forms but no detail screens`,
        suggestion: `Add detail screens for: ${missingDetail.join(", ")}`
      });
    }
    
    // Check for unreachable screens pattern
    const allScreensInFlows = new Set<string>();
    for (const flow of this.spec.flows) {
      const reachable = this.findReachableScreens(flow);
      reachable.forEach(s => allScreensInFlows.add(s));
    }
    
    const unreachableScreens = this.spec.screens
      .filter(s => !allScreensInFlows.has(s.id))
      .map(s => s.id);
    
    if (unreachableScreens.length > 0) {
      patterns.push({
        type: "Unreachable Screens",
        description: `${unreachableScreens.length} screens are not reachable in any flow`,
        suggestion: `Add these screens to flows: ${unreachableScreens.slice(0, 3).join(", ")}${unreachableScreens.length > 3 ? "..." : ""}`
      });
    }
    
    return patterns;
  }

  detectUIStatePatterns(): Array<{
    pattern: string;
    screens: string[];
    suggestion?: string;
  }> {
    const patterns = [];
    
    const screensWithData = [];
    const screensMissingLoading = [];
    const screensWithLists = [];
    const screensMissingEmpty = [];
    
    for (const screen of this.spec.screens) {
      const states = (screen as any).uiStates || [];
      const hasData = (screen as any).displays && (screen as any).displays.length > 0;
      const hasList = (screen as any).displays?.some((d: any) => d.type === "list" || d.type === "grid");
      
      if (hasData) {
        screensWithData.push(screen.id);
        if (!states.includes("loading")) {
          screensMissingLoading.push(screen.id);
        }
      }
      
      if (hasList) {
        screensWithLists.push(screen.id);
        if (!states.includes("empty")) {
          screensMissingEmpty.push(screen.id);
        }
      }
    }
    
    if (screensMissingLoading.length > 0) {
      patterns.push({
        pattern: "Missing Loading States",
        screens: screensMissingLoading,
        suggestion: "Add loading state to screens that fetch data"
      });
    }
    
    if (screensMissingEmpty.length > 0) {
      patterns.push({
        pattern: "Missing Empty States",
        screens: screensMissingEmpty,
        suggestion: "Add empty state to screens with lists"
      });
    }
    
    return patterns;
  }

  visualizeFlowGraph(flowId: string): void {
    const flow = this.spec.flows.find(f => f.id === flowId);
    if (!flow) return;
    
    console.log(chalk.gray("    " + flow.entryStepId + " [entry]"));
    
    const visited = new Set<string>();
    const queue = [flow.entryStepId];
    
    while (queue.length > 0) {
      const stepId = queue.shift()!;
      if (visited.has(stepId)) continue;
      visited.add(stepId);
      
      const step = flow.steps.find(s => s.id === stepId);
      if (!step) continue;
      
      if (step.next) {
        for (const next of step.next) {
          const label = next.condition || "";
          console.log(chalk.gray(`    ${stepId} → ${next.targetStepId} ${label ? `[${label}]` : ""}`));
          queue.push(next.targetStepId);
        }
      }
    }
  }

  visualizeRelationshipGraph(): void {
    for (const entity of this.spec.entities) {
      const relations = (entity as any).relations || [];
      if (relations.length > 0) {
        console.log(`  ${entity.id}:`);
        for (const rel of relations) {
          console.log(`    → ${rel.to} (${rel.kind})`);
        }
      }
    }
  }

  visualizeStateMachine(entityId: string): void {
    const entity = this.spec.entities.find(e => e.id === entityId);
    if (!entity) return;
    
    const states = (entity as any).states || [];
    if (states.length === 0) return;
    
    for (const state of states) {
      const terminal = state.terminal ? " [terminal]" : "";
      console.log(chalk.gray(`    ${state.id}${terminal}`));
      
      if (state.transitions) {
        for (const trans of state.transitions) {
          const condition = trans.condition ? ` [${trans.condition}]` : "";
          console.log(chalk.gray(`      → ${trans.to}${condition}`));
        }
      }
    }
  }

  findSimilarEntity(name: string): string | undefined {
    const entities = this.spec.entities.map(e => e.id);
    const lowerName = name.toLowerCase();
    
    // Exact case-insensitive match
    const exact = entities.find(e => e.toLowerCase() === lowerName);
    if (exact) return exact;
    
    // Partial match
    const partial = entities.find(e => 
      e.toLowerCase().includes(lowerName) || 
      lowerName.includes(e.toLowerCase())
    );
    if (partial) return partial;
    
    // Levenshtein distance
    const closest = entities
      .map(e => ({ entity: e, distance: this.levenshtein(name, e) }))
      .sort((a, b) => a.distance - b.distance)[0];
    
    if (closest && closest.distance <= 3) {
      return closest.entity;
    }
    
    return undefined;
  }

  findOrphanedEntities(): string[] {
    const hasRelations = new Set<string>();
    
    for (const entity of this.spec.entities) {
      const relations = (entity as any).relations || [];
      if (relations.length > 0) {
        hasRelations.add(entity.id);
        relations.forEach((r: any) => hasRelations.add(r.to));
      }
    }
    
    return this.spec.entities
      .filter(e => !hasRelations.has(e.id))
      .map(e => e.id);
  }

  findUnreachableStates(entityId: string): string[] {
    const entity = this.spec.entities.find(e => e.id === entityId);
    if (!entity) return [];
    
    const states = (entity as any).states || [];
    if (states.length === 0) return [];
    
    const reachable = new Set<string>();
    const queue = [states[0].id]; // Assuming first state is initial
    
    while (queue.length > 0) {
      const stateId = queue.shift()!;
      if (reachable.has(stateId)) continue;
      reachable.add(stateId);
      
      const state = states.find((s: any) => s.id === stateId);
      if (state?.transitions) {
        for (const trans of state.transitions) {
          queue.push(trans.to);
        }
      }
    }
    
    return states
      .map((s: any) => s.id)
      .filter((id: string) => !reachable.has(id));
  }

  findInvalidTransitions(entityId: string): Array<{
    from: string;
    to: string;
  }> {
    const entity = this.spec.entities.find(e => e.id === entityId);
    if (!entity) return [];
    
    const states = (entity as any).states || [];
    const stateIds = new Set(states.map((s: any) => s.id));
    const invalid = [];
    
    for (const state of states) {
      if (state.transitions) {
        for (const trans of state.transitions) {
          if (!stateIds.has(trans.to)) {
            invalid.push({ from: state.id, to: trans.to });
          }
        }
      }
    }
    
    return invalid;
  }

  analyzeDataFlow(): Array<{
    entity: string;
    readers: string[];
    writers: string[];
  }> {
    const flow = new Map<string, { readers: Set<string>; writers: Set<string> }>();
    
    for (const entity of this.spec.entities) {
      flow.set(entity.id, { readers: new Set(), writers: new Set() });
    }
    
    for (const screen of this.spec.screens) {
      // Readers
      if ((screen as any).reads) {
        for (const read of (screen as any).reads) {
          const entityFlow = flow.get(read.entity);
          if (entityFlow) {
            entityFlow.readers.add(screen.id);
          }
        }
      }
      
      // Writers
      if (screen.forms) {
        for (const form of screen.forms) {
          const entityFlow = flow.get(form.entityId);
          if (entityFlow) {
            entityFlow.writers.add(screen.id);
          }
        }
      }
    }
    
    return Array.from(flow.entries()).map(([entity, data]) => ({
      entity,
      readers: Array.from(data.readers),
      writers: Array.from(data.writers)
    }));
  }

  private findMinDepth(flow: Flow, fromStep: string, toScreen: string): number {
    const visited = new Set<string>();
    const queue: Array<{ stepId: string; depth: number }> = [
      { stepId: fromStep, depth: 0 }
    ];
    
    let minDepth = Infinity;
    
    while (queue.length > 0) {
      const { stepId, depth } = queue.shift()!;
      
      if (visited.has(stepId)) continue;
      visited.add(stepId);
      
      const step = flow.steps.find(s => s.id === stepId);
      if (!step) continue;
      
      if (step.screenId === toScreen) {
        minDepth = Math.min(minDepth, depth);
        continue;
      }
      
      if (step.next && depth < 20) {
        for (const next of step.next) {
          queue.push({ stepId: next.targetStepId, depth: depth + 1 });
        }
      }
    }
    
    return minDepth;
  }

  private findReachableSteps(flow: Flow, fromStep: string): Set<string> {
    const reachable = new Set<string>();
    const queue = [fromStep];
    
    while (queue.length > 0) {
      const stepId = queue.shift()!;
      if (reachable.has(stepId)) continue;
      reachable.add(stepId);
      
      const step = flow.steps.find(s => s.id === stepId);
      if (step?.next) {
        for (const next of step.next) {
          queue.push(next.targetStepId);
        }
      }
    }
    
    return reachable;
  }

  private findReachableScreens(flow: Flow): Set<string> {
    const screens = new Set<string>();
    const reachableSteps = this.findReachableSteps(flow, flow.entryStepId);
    
    for (const stepId of reachableSteps) {
      const step = flow.steps.find(s => s.id === stepId);
      if (step?.screenId) {
        screens.add(step.screenId);
      }
    }
    
    return screens;
  }

  private findPath(flow: Flow, fromStep: string, toStep: string): string[] {
    const visited = new Set<string>();
    const queue: Array<{ stepId: string; path: string[] }> = [
      { stepId: fromStep, path: [] }
    ];
    
    while (queue.length > 0) {
      const { stepId, path } = queue.shift()!;
      
      if (visited.has(stepId)) continue;
      visited.add(stepId);
      
      const newPath = [...path, stepId];
      
      if (stepId === toStep) {
        return newPath;
      }
      
      const step = flow.steps.find(s => s.id === stepId);
      if (step?.next) {
        for (const next of step.next) {
          queue.push({ stepId: next.targetStepId, path: newPath });
        }
      }
    }
    
    return [];
  }

  private levenshtein(a: string, b: string): number {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
}