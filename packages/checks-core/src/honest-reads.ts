import type { FlowlockCheck, CheckResult } from 'flowlock-plugin-sdk';
import type { UXSpec } from 'flowlock-uxspec';
import { ErrorCodes } from 'flowlock-shared';
import { getEntityId } from './utils/entity-utils';

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
            const entityId = getEntityId(form);
            if (entityId) {
              for (const field of form.fields) {
                flowFields.add(`${entityId}.${field.fieldId}`);
                capturedFields.set(flow.id, flowFields);
              }
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
          // Find screens that capture this field to suggest
          const capturingScreens: string[] = [];
          for (const flow of spec.flows) {
            for (const step of flow.steps) {
              const stepScreen = spec.screens.find(s => s.id === step.screenId);
              if (stepScreen?.forms) {
                for (const form of stepScreen.forms) {
                  const formEntityId = getEntityId(form);
                  if (formEntityId === entityId && 
                      form.fields.some(f => f.fieldId === fieldId)) {
                    capturingScreens.push(stepScreen.name || stepScreen.id);
                  }
                }
              }
            }
          }
          
          results.push({
            id: `honest_reads_${screen.id}_${read}`,
            level: 'error',
            status: 'fail',
            message: `Screen '${screen.name}' reads field '${read}' which is not captured in the same flow`,
            ref: `screen:${screen.id},field:${read}`,
            details: {
              code: ErrorCodes.SCREEN_INVALID_READ,
              expected: 'Field should be captured before reading, marked as derived, or marked as external',
              actual: `Field '${read}' is being read without proper provenance`,
              location: `Screen: ${screen.name} (${screen.id})`,
              suggestion: capturingScreens.length > 0
                ? `Field is captured in: ${capturingScreens.join(', ')}. Ensure this screen comes after capture in the flow.`
                : `Either:\n  1. Add a form to capture '${fieldId}' before this screen\n  2. Mark field as derived: \"derived\": true, \"provenance\": \"calculation description\"\n  3. Mark field as external: \"external\": true, \"source\": \"api/endpoint\"`,
              documentation: 'https://flowlock.dev/docs/screens#field-provenance',
              context: {
                fieldPath: read,
                screenFlows: screenFlows.map(f => f.name || f.id),
                capturedInFlows: Array.from(capturedFields.entries())
                  .filter(([_, fields]) => fields.has(read))
                  .map(([flowId]) => flowId)
              }
            }
          });
        } else if (isDerived && !hasProvenance) {
          results.push({
            id: `honest_reads_${screen.id}_${read}_provenance`,
            level: 'warning',
            status: 'fail',
            message: `Derived field '${read}' lacks provenance information`,
            ref: `entity:${entityId},field:${fieldId}`,
            details: {
              code: ErrorCodes.VALIDATION_MISSING_FIELD,
              expected: 'Derived fields must include provenance information',
              actual: `Field '${read}' is marked as derived but has no provenance`,
              location: `Entity: ${entityId}, Field: ${fieldId}`,
              suggestion: `Add provenance to the field definition:\n{\n  \"id\": \"${fieldId}\",\n  \"derived\": true,\n  \"provenance\": \"Calculated from [source fields] using [calculation method]\"\n}`,
              documentation: 'https://flowlock.dev/docs/entities#derived-fields',
              context: {
                entity: entityId,
                field: fieldId,
                usedInScreens: [screen.name || screen.id]
              }
            }
          });
        } else if (isExternal && !hasSource) {
          results.push({
            id: `honest_reads_${screen.id}_${read}_source`,
            level: 'warning',
            status: 'fail',
            message: `External field '${read}' lacks source declaration`,
            ref: `entity:${entityId},field:${fieldId}`,
            details: {
              code: ErrorCodes.VALIDATION_MISSING_FIELD,
              expected: 'External fields must declare their data source',
              actual: `Field '${read}' is marked as external but has no source`,
              location: `Entity: ${entityId}, Field: ${fieldId}`,
              suggestion: `Add source to the field definition:\n{\n  \"id\": \"${fieldId}\",\n  \"external\": true,\n  \"source\": \"api/endpoint-path\" // or \"service:ServiceName\"\n}`,
              documentation: 'https://flowlock.dev/docs/entities#external-fields',
              context: {
                entity: entityId,
                field: fieldId,
                usedInScreens: [screen.name || screen.id]
              }
            }
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