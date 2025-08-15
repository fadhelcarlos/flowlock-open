import type { UXSpec } from 'flowlock-uxspec';

export function generateScreensCSV(spec: UXSpec): string {
  const headers = ['ID', 'Name', 'Type', 'Entity', 'Forms Count', 'Reads Count', 'Used In Flows'];
  const rows: string[][] = [headers];
  
  for (const screen of spec.screens) {
    const usedInFlows = spec.flows
      .filter(f => f.steps.some(s => s.screenId === screen.id))
      .map(f => f.name)
      .join('; ');
    
    rows.push([
      screen.id,
      screen.name,
      screen.type,
      screen.entityId || '',
      (screen.forms?.length || 0).toString(),
      (screen.reads?.length || 0).toString(),
      usedInFlows,
    ]);
  }
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');
}