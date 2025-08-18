import type { UXSpec } from 'flowlock-uxspec';

export function generateScreensCSV(spec: UXSpec): string {
  // Enhanced headers including new fields
  const headers = [
    'ID', 'Name', 'Type', 'Entity',
    'Routes', 'Roles', 'UI States',
    'Forms', 'Cards', 'Lists', 'CTAs',
    'Reads', 'Used In Flows'
  ];
  const rows: string[][] = [headers];
  
  for (const screen of spec.screens) {
    // Find which flows use this screen
    const usedInFlows = spec.flows
      .filter(f => f.steps.some(s => 
        s.screenId === screen.id || (s as any).screen === screen.id
      ))
      .map(f => f.name)
      .join('; ');
    
    // Extract routes
    const routes = (screen as any).routes?.join('; ') || '';
    
    // Extract roles (from screen.roles or infer from flows)
    let roles = (screen as any).roles?.join('; ') || '';
    if (!roles) {
      const flowRoles = spec.flows
        .filter(f => f.steps.some(s => 
          s.screenId === screen.id || (s as any).screen === screen.id
        ))
        .flatMap(f => (f as any).role ? [(f as any).role] : f.roles || []);
      roles = [...new Set(flowRoles)].join('; ');
    }
    
    // UI States
    const uiStates = (screen as any).uiStates?.join('; ') || 
                     (screen as any).states?.join('; ') || '';
    
    // Forms with details
    const forms = screen.forms?.map(f => {
      const writes = (f as any).writes;
      const formStr = `${f.id}[${f.type || 'form'}]`;
      return writes ? `${formStr}(${writes.join(',')})` : formStr;
    }).join('; ') || '';
    
    // Cards with reads
    const cards = (screen as any).cards?.map((c: any) => {
      const title = c.title ? `:${c.title}` : '';
      const reads = c.reads?.length ? `(${c.reads.join(',')})` : '';
      return `${c.id}${title}${reads}`;
    }).join('; ') || '';
    
    // Lists with configuration
    const lists = (screen as any).lists?.map((l: any) => {
      const config = [];
      if (l.sortable) config.push('S');
      if (l.filterable) config.push('F');
      if (l.paginated) config.push('P');
      const configStr = config.length ? `[${config.join('')}]` : '';
      const reads = l.reads?.length ? `(${l.reads.join(',')})` : '';
      return `${l.id}${configStr}${reads}`;
    }).join('; ') || '';
    
    // CTAs with navigation
    const ctas = (screen as any).ctas?.map((c: any) => {
      const typeStr = c.type ? `[${c.type}]` : '';
      return `${c.label || c.id}→${c.to}${typeStr}`;
    }).join('; ') || '';
    
    // Reads
    const reads = screen.reads?.join('; ') || '';
    
    rows.push([
      screen.id,
      screen.name,
      screen.type,
      screen.entityId || '',
      routes,
      roles,
      uiStates,
      forms,
      cards,
      lists,
      ctas,
      reads,
      usedInFlows,
    ]);
  }
  
  // Properly escape CSV cells
  return rows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const escaped = cell.replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',')
  ).join('\\n');
}

export function generateEntitiesCSV(spec: UXSpec): string {
  const headers = [
    'Entity ID', 'Entity Name',
    'Field ID', 'Field Name', 'Type',
    'Required', 'Derived', 'External',
    'Enum Values', 'Min', 'Max',
    'Relations'
  ];
  const rows: string[][] = [headers];
  
  for (const entity of spec.entities) {
    // Get relations for this entity
    const relations = (entity as any).relations?.map((r: any) => 
      `${r.id}→${r.to}[${r.kind}]`
    ).join('; ') || '';
    
    for (const field of entity.fields) {
      const enumValues = (field as any).enum?.join('|') || '';
      const min = (field as any).min?.toString() || '';
      const max = (field as any).max?.toString() || '';
      
      rows.push([
        entity.id,
        entity.name,
        field.id,
        field.name,
        field.type,
        field.required ? 'Yes' : 'No',
        field.derived ? 'Yes' : 'No',
        field.external ? 'Yes' : 'No',
        enumValues,
        min,
        max,
        relations,
      ]);
    }
  }
  
  return rows.map(row => 
    row.map(cell => {
      const escaped = cell.replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',')
  ).join('\\n');
}

export function generateFlowsCSV(spec: UXSpec): string {
  const headers = [
    'Flow ID', 'Flow Name',
    'Role', 'JTBD',
    'Entry Step', 'Total Steps',
    'Success Screen', 'Success Message',
    'Screens Used', 'Writes', 'Reads'
  ];
  const rows: string[][] = [headers];
  
  for (const flow of spec.flows) {
    const role = (flow as any).role || flow.roles?.join('; ') || '';
    const jtbd = (flow as any).jtbd || '';
    const success = (flow as any).success;
    const successScreen = success?.screen || '';
    const successMessage = success?.message || '';
    
    // Collect all screens, writes, and reads from steps
    const screens = new Set<string>();
    const writes = new Set<string>();
    const reads = new Set<string>();
    
    for (const step of flow.steps) {
      const screenId = step.screenId || (step as any).screen;
      if (screenId) screens.add(screenId);
      
      const stepWrites = (step as any).writes;
      if (stepWrites) stepWrites.forEach((w: string) => writes.add(w));
      
      const stepReads = (step as any).reads;
      if (stepReads) stepReads.forEach((r: string) => reads.add(r));
    }
    
    rows.push([
      flow.id,
      flow.name,
      role,
      jtbd,
      flow.entryStepId,
      flow.steps.length.toString(),
      successScreen,
      successMessage,
      Array.from(screens).join('; '),
      Array.from(writes).join('; '),
      Array.from(reads).join('; '),
    ]);
  }
  
  return rows.map(row => 
    row.map(cell => {
      const escaped = cell.replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',')
  ).join('\\n');
}

export function generateJTBDCSV(spec: UXSpec): string {
  const headers = ['Role', 'Tasks', 'Description', 'Related Flows'];
  const rows: string[][] = [headers];
  
  const jtbdList = (spec as any).jtbd || [];
  
  for (const jtbd of jtbdList) {
    // Find flows related to this JTBD
    const relatedFlows = spec.flows
      .filter(f => 
        (f as any).jtbd === jtbd.role || 
        (f as any).role === jtbd.role ||
        f.roles?.includes(jtbd.role)
      )
      .map(f => f.name)
      .join('; ');
    
    rows.push([
      jtbd.role,
      jtbd.tasks?.join('; ') || '',
      jtbd.description || '',
      relatedFlows,
    ]);
  }
  
  if (rows.length === 1) {
    // No JTBD defined, return empty
    return '';
  }
  
  return rows.map(row => 
    row.map(cell => {
      const escaped = cell.replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',')
  ).join('\\n');
}