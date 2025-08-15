import type { FlowlockCheck, CheckResult } from 'flowlock-plugin-sdk';
import type { UXSpec } from 'flowlock-uxspec';

export const creatableNeedsDetailCheck: FlowlockCheck = {
  id: 'creatable_needs_detail',
  name: 'Creatable Needs Detail Check',
  description: 'Ensures entities with create forms have detail screens and discoverable paths',
  
  run(spec: UXSpec): CheckResult[] {
    const results: CheckResult[] = [];
    const entitiesWithCreateForms = new Set<string>();
    
    for (const screen of spec.screens) {
      if (screen.forms) {
        for (const form of screen.forms) {
          if (form.type === 'create' || !form.type) {
            entitiesWithCreateForms.add(form.entityId);
          }
        }
      }
    }
    
    for (const entityId of entitiesWithCreateForms) {
      const entity = spec.entities.find(e => e.id === entityId);
      if (!entity) continue;
      
      const detailScreen = spec.screens.find(
        s => s.type === 'detail' && s.entityId === entityId
      );
      
      if (!detailScreen) {
        results.push({
          id: `creatable_needs_detail_${entityId}`,
          level: 'error',
          status: 'fail',
          message: `Entity '${entity.name}' has a create form but no detail screen`,
          ref: `entity:${entityId}`,
        });
        continue;
      }
      
      let hasDiscoverablePath = false;
      for (const flow of spec.flows) {
        const hasDetailStep = flow.steps.some(step => step.screenId === detailScreen.id);
        
        if (hasDetailStep) {
          const entryStep = flow.steps.find(s => s.id === flow.entryStepId);
          if (entryStep) {
            const visited = new Set<string>();
            const queue: { stepId: string; depth: number }[] = [
              { stepId: flow.entryStepId, depth: 0 }
            ];
            
            while (queue.length > 0) {
              const { stepId, depth } = queue.shift()!;
              if (visited.has(stepId)) continue;
              visited.add(stepId);
              
              const step = flow.steps.find(s => s.id === stepId);
              if (!step) continue;
              
              if (step.screenId === detailScreen.id) {
                hasDiscoverablePath = true;
                break;
              }
              
              if (step.next && depth < 10) {
                for (const nextStep of step.next) {
                  queue.push({ stepId: nextStep.targetStepId, depth: depth + 1 });
                }
              }
            }
            
            if (hasDiscoverablePath) break;
          }
        }
      }
      
      if (!hasDiscoverablePath) {
        results.push({
          id: `creatable_needs_detail_path_${entityId}`,
          level: 'warning',
          status: 'fail',
          message: `Detail screen for '${entity.name}' exists but has no discoverable path`,
          ref: `entity:${entityId},screen:${detailScreen.id}`,
        });
      }
    }
    
    if (results.length === 0) {
      results.push({
        id: 'creatable_needs_detail',
        level: 'info',
        status: 'pass',
        message: 'All creatable entities have detail screens with discoverable paths',
      });
    }
    
    return results;
  },
};