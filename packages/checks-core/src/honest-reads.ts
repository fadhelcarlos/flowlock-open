import type { FlowlockCheck, CheckResult } from 'flowlock-plugin-sdk';
import type { UXSpec } from 'flowlock-uxspec';

export const honestReadsCheck: FlowlockCheck = {
  id: 'honest_reads',
  name: 'Honest Reads Check',
  description: 'Ensures screens only read fields that are captured, derived, or external',
  
  run(spec: UXSpec): CheckResult[] {
    const results: CheckResult[] = [];
    const capturedFields = new Map<string, Set<string>>();
    
    for (const flow of spec.flows) {
      const flowFields = new Set<string>();
      
      for (const step of flow.steps) {
        const screen = spec.screens.find(s => s.id === step.screenId);
        if (!screen) continue;
        
        if (screen.forms) {
          for (const form of screen.forms) {
            for (const field of form.fields) {
              flowFields.add(`${form.entityId}.${field.fieldId}`);
              capturedFields.set(flow.id, flowFields);
            }
          }
        }
      }
    }
    
    for (const screen of spec.screens) {
      if (!screen.reads || screen.reads.length === 0) continue;
      
      const screenFlows = spec.flows.filter(f => 
        f.steps.some(s => s.screenId === screen.id)
      );
      
      for (const read of screen.reads) {
        const [entityId, fieldId] = read.split('.');
        const entity = spec.entities.find(e => e.id === entityId);
        const field = entity?.fields.find(f => f.id === fieldId);
        
        if (!field) continue;
        
        const isExternal = field.external === true;
        const isDerived = field.derived === true;
        const hasProvenance = isDerived && !!field.provenance;
        const hasSource = isExternal && !!field.source;
        
        let isCaptured = false;
        for (const flow of screenFlows) {
          const flowCaptured = capturedFields.get(flow.id);
          if (flowCaptured?.has(read)) {
            isCaptured = true;
            break;
          }
        }
        
        if (!isCaptured && !isDerived && !isExternal) {
          results.push({
            id: `honest_reads_${screen.id}_${read}`,
            level: 'error',
            status: 'fail',
            message: `Screen '${screen.name}' reads field '${read}' which is not captured in the same flow`,
            ref: `screen:${screen.id},field:${read}`,
          });
        } else if (isDerived && !hasProvenance) {
          results.push({
            id: `honest_reads_${screen.id}_${read}_provenance`,
            level: 'warning',
            status: 'fail',
            message: `Derived field '${read}' lacks provenance information`,
            ref: `entity:${entityId},field:${fieldId}`,
          });
        } else if (isExternal && !hasSource) {
          results.push({
            id: `honest_reads_${screen.id}_${read}_source`,
            level: 'warning',
            status: 'fail',
            message: `External field '${read}' lacks source declaration`,
            ref: `entity:${entityId},field:${fieldId}`,
          });
        }
      }
    }
    
    if (results.length === 0) {
      results.push({
        id: 'honest_reads',
        level: 'info',
        status: 'pass',
        message: 'All screen reads are properly captured, derived, or external',
      });
    }
    
    return results;
  },
};