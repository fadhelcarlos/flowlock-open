import type { FlowlockCheck, CheckResult } from 'flowlock-plugin-sdk';
import type { UXSpec } from 'flowlock-uxspec';
import { ErrorCodes } from 'flowlock-shared';

export interface ReachabilityConfig {
  maxSteps?: number;
}

export const reachabilityCheck: FlowlockCheck = {
  id: 'reachability',
  name: 'Reachability Check',
  description: 'Ensures success screens are reachable within configured steps',
  
  run(spec: UXSpec, config?: ReachabilityConfig): CheckResult[] {
    const results: CheckResult[] = [];
    const maxSteps = config?.maxSteps ?? 3;
    
    for (const flow of spec.flows) {
      const successScreens = new Set<string>();
      
      for (const step of flow.steps) {
        const screen = spec.screens.find(s => s.id === step.screenId);
        if (screen?.type === 'success' && step.screenId) {
          successScreens.add(step.screenId);
        }
      }
      
      for (const successScreenId of successScreens) {
        const visited = new Set<string>();
        const queue: { stepId: string; depth: number }[] = [
          { stepId: flow.entryStepId, depth: 0 }
        ];
        
        let minDepth = Infinity;
        
        while (queue.length > 0) {
          const { stepId, depth } = queue.shift()!;
          
          if (visited.has(stepId)) continue;
          visited.add(stepId);
          
          const step = flow.steps.find(s => s.id === stepId);
          if (!step) continue;
          
          if (step.screenId === successScreenId) {
            minDepth = Math.min(minDepth, depth);
            continue;
          }
          
          if (step.next && depth < 10) {
            for (const nextStep of step.next) {
              queue.push({ stepId: nextStep.targetStepId, depth: depth + 1 });
            }
          }
        }
        
        if (minDepth === Infinity) {
          // Find possible connection points
          const possibleConnections: string[] = [];
          for (const step of flow.steps) {
            if (step.next && step.next.length === 0) {
              possibleConnections.push(step.id);
            }
          }
          
          results.push({
            id: `reachability_${flow.id}_${successScreenId}_unreachable`,
            level: 'error',
            status: 'fail',
            message: `Success screen '${successScreenId}' is unreachable in flow '${flow.name}'`,
            ref: `flow:${flow.id},screen:${successScreenId}`,
            details: {
              code: ErrorCodes.FLOW_UNREACHABLE_SCREEN,
              expected: `Screen should be reachable from entry point '${flow.entryStepId}'`,
              actual: `No path found to screen '${successScreenId}'`,
              location: `Flow: ${flow.name} (${flow.id})`,
              suggestion: possibleConnections.length > 0
                ? `Add a transition from one of these steps: ${possibleConnections.join(', ')} to a step that uses screen '${successScreenId}'`
                : `Add a step with screenId '${successScreenId}' and connect it to the flow`,
              documentation: 'https://flowlock.dev/docs/flows#screen-reachability'
            }
          });
        } else if (minDepth > maxSteps) {
          // Calculate the shortest path for suggestion
          const pathSteps: string[] = [];
          let currentStepId = flow.entryStepId;
          const visited = new Set<string>();
          
          // Simple BFS to find one shortest path
          const queue: { stepId: string; path: string[] }[] = [
            { stepId: flow.entryStepId, path: [] }
          ];
          let shortestPath: string[] = [];
          
          while (queue.length > 0) {
            const { stepId, path } = queue.shift()!;
            if (visited.has(stepId)) continue;
            visited.add(stepId);
            
            const step = flow.steps.find(s => s.id === stepId);
            if (!step) continue;
            
            const newPath = [...path, stepId];
            
            if (step.screenId === successScreenId) {
              shortestPath = newPath;
              break;
            }
            
            if (step.next) {
              for (const nextStep of step.next) {
                queue.push({ stepId: nextStep.targetStepId, path: newPath });
              }
            }
          }
          
          results.push({
            id: `reachability_${flow.id}_${successScreenId}_deep`,
            level: 'warning',
            status: 'fail',
            message: `Success screen '${successScreenId}' requires ${minDepth} steps (max: ${maxSteps}) in flow '${flow.name}'`,
            ref: `flow:${flow.id},screen:${successScreenId},depth:${minDepth}`,
            details: {
              code: ErrorCodes.FLOW_DEPTH_EXCEEDED,
              expected: `Maximum ${maxSteps} steps to reach success screen`,
              actual: `${minDepth} steps required`,
              location: `Flow: ${flow.name} (${flow.id}) -> Screen: ${successScreenId}`,
              suggestion: minDepth <= maxSteps + 2
                ? `Consider removing intermediate screens or combining steps. Path: ${shortestPath.slice(0, 5).join(' -> ')}${shortestPath.length > 5 ? '...' : ''}`
                : `This flow may be too complex. Consider splitting into multiple flows or simplifying the user journey.`,
              documentation: 'https://flowlock.dev/docs/flows#optimizing-flow-depth',
              context: {
                currentPath: shortestPath.slice(0, 10),
                configuredMax: maxSteps,
                actualDepth: minDepth
              }
            }
          });
        }
      }
    }
    
    if (results.length === 0) {
      results.push({
        id: 'reachability',
        level: 'info',
        status: 'pass',
        message: `All success screens are reachable within ${maxSteps} steps`,
      });
    }
    
    return results;
  },
};