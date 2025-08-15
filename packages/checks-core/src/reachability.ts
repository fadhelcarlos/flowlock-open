import type { FlowlockCheck, CheckResult } from 'flowlock-plugin-sdk';
import type { UXSpec } from 'flowlock-uxspec';

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
        if (screen?.type === 'success') {
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
          results.push({
            id: `reachability_${flow.id}_${successScreenId}_unreachable`,
            level: 'error',
            status: 'fail',
            message: `Success screen '${successScreenId}' is unreachable in flow '${flow.name}'`,
            ref: `flow:${flow.id},screen:${successScreenId}`,
          });
        } else if (minDepth > maxSteps) {
          results.push({
            id: `reachability_${flow.id}_${successScreenId}_deep`,
            level: 'warning',
            status: 'fail',
            message: `Success screen '${successScreenId}' requires ${minDepth} steps (max: ${maxSteps}) in flow '${flow.name}'`,
            ref: `flow:${flow.id},screen:${successScreenId},depth:${minDepth}`,
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