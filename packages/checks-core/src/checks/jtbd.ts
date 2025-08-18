import type { UXSpec } from 'flowlock-uxspec';

/**
 * Validates that all JTBD (Jobs To Be Done) are addressed by flows
 */
export function checkJTBD(spec: UXSpec): any[] {
  const results: any[] = [];
  const jtbdList = (spec as any).jtbd || [];
  const flows = spec.flows || [];
  
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
