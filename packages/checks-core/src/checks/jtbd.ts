import type { UXSpec } from 'flowlock-uxspec';

/**
 * Validates that all JTBD (Jobs To Be Done) are addressed by flows
 */
export function checkJTBD(spec: UXSpec): any[] {
  const results: any[] = [];
  const flows = spec.flows || [];
  
  // Handle both old (object) and new (array) formats
  let jtbdList: any[] = [];
  const jtbdField = (spec as any).jtbd;
  
  if (Array.isArray(jtbdField)) {
    // New format: array of JTBD objects
    jtbdList = jtbdField;
  } else if (jtbdField && typeof jtbdField === 'object') {
    // Old format: convert object to array format
    jtbdList = Object.entries(jtbdField).map(([role, tasks]) => ({
      role,
      tasks: Array.isArray(tasks) ? tasks : [tasks],
    }));
  }
  
  // Check that each JTBD has at least one flow
  for (const jtbd of jtbdList) {
    const hasFlow = flows.some((f: any) => 
      f.jtbd === jtbd.role || // Direct link
      f.role === jtbd.role || // Role match
      (f.roles || []).includes(jtbd.role) // Roles array match
    );
    
    if (!hasFlow) {
      results.push({
        id: `jtbd_no_flow_${jtbd.role}`,
        level: 'warning',
        status: 'fail',
        message: `JTBD for role '${jtbd.role}' has no corresponding flows`,
        ref: `jtbd:${jtbd.role}`,
      });
    }
  }
  
  // Check that flows reference valid JTBD
  for (const flow of flows) {
    if ((flow as any).jtbd) {
      const exists = jtbdList.some((j: any) => j.role === (flow as any).jtbd);
      if (!exists) {
        results.push({
          id: `flow_invalid_jtbd_${flow.id}`,
          level: 'warning',
          status: 'fail',
          message: `Flow '${flow.name}' references non-existent JTBD '${(flow as any).jtbd}'`,
          ref: `flow:${flow.id}`,
        });
      }
    }
  }
  
  if (results.length === 0) {
    results.push({
      id: 'jtbd',
      level: 'info',
      status: 'pass',
      message: 'All JTBD are properly linked to flows',
    });
  }
  
  return results;
}
