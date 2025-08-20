import type { FlowlockCheck, CheckResult } from 'flowlock-plugin-sdk';
import type { UXSpec } from 'flowlock-uxspec';
import { getEntityId } from './utils/entity-utils';

export const creatableNeedsDetailCheck: FlowlockCheck = {
  id: 'creatable_needs_detail',
  name: 'Creatable Needs Detail Check',
  description: 'Ensures entities with create forms have detail screens and discoverable paths',
  
  run(spec: UXSpec): CheckResult[] {
    const results: CheckResult[] = [];
    const entitiesWithCreateForms = new Set<string>();
    const verbose = process.env.FLOWLOCK_VERBOSE === 'true' || process.env.DEBUG === 'true';
    
    // Find all entities that have create forms
    for (const screen of spec.screens) {
      if (screen.forms) {
        for (const form of screen.forms) {
          if (form.type === 'create') {
            const entityId = getEntityId(form);
            if (entityId) {
              entitiesWithCreateForms.add(entityId);
              if (verbose) {
                console.log(`[DEBUG] Found create form for entity: ${entityId} in screen: ${screen.id}`);
              }
            }
          }
        }
      }
    }
    
    for (const entityId of entitiesWithCreateForms) {
      const entity = spec.entities.find(e => e.id === entityId);
      if (!entity) {
        if (verbose) {
          console.log(`[DEBUG] Entity not found: ${entityId}`);
        }
        continue;
      }
      
      // Look for detail screens with either 'entity' or 'entityId' field
      // Also check for screens with ID pattern: {entity}-detail or {entity}Detail
      const detailScreen = spec.screens.find(s => {
        // Check if it's a detail type screen
        if (s.type !== 'detail') return false;
        
        // Check if it has entity or entityId field matching
        const screenEntityId = getEntityId(s);
        if (screenEntityId === entityId) {
          if (verbose) {
            console.log(`[DEBUG] Found detail screen by entity field: ${s.id} for entity: ${entityId}`);
          }
          return true;
        }
        
        // Also check screen ID patterns like 'segment-detail' or 'segmentDetail'
        const screenIdPattern = new RegExp(`^${entityId}[-_]?detail$`, 'i');
        if (screenIdPattern.test(s.id)) {
          if (verbose) {
            console.log(`[DEBUG] Found detail screen by ID pattern: ${s.id} for entity: ${entityId}`);
          }
          return true;
        }
        
        return false;
      });
      
      if (!detailScreen) {
        results.push({
          id: `creatable_needs_detail_${entityId}`,
          level: 'error',
          status: 'fail',
          message: `Entity '${entity.name}' (${entityId}) has a create form but no detail screen. Expected a screen with type='detail' and entity='${entityId}' or entityId='${entityId}', or a screen with ID like '${entityId}-detail'`,
          ref: `entity:${entityId}`,
        });
        if (verbose) {
          console.log(`[DEBUG] No detail screen found for entity: ${entityId}`);
          console.log(`[DEBUG] Checked patterns: entity='${entityId}', entityId='${entityId}', id='${entityId}-detail'`);
        }
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
          message: `Detail screen '${detailScreen.id}' for entity '${entity.name}' exists but has no discoverable path in any flow`,
          ref: `entity:${entityId},screen:${detailScreen.id}`,
        });
        if (verbose) {
          console.log(`[DEBUG] Detail screen ${detailScreen.id} has no discoverable path in flows`);
        }
      } else if (verbose) {
        console.log(`[DEBUG] Detail screen ${detailScreen.id} has discoverable path`);
      }
    }
    
    if (results.length === 0) {
      const message = entitiesWithCreateForms.size === 0 
        ? 'No entities with create forms found'
        : `All ${entitiesWithCreateForms.size} creatable entities have detail screens with discoverable paths`;
      
      results.push({
        id: 'creatable_needs_detail',
        level: 'info',
        status: 'pass',
        message,
      });
    } else if (verbose) {
      console.log(`[DEBUG] Total issues found: ${results.length}`);
    }
    
    return results;
  },
};