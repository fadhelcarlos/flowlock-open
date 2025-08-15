import type { UXSpec } from 'flowlock-uxspec';

export function generateERDiagram(spec: UXSpec): string {
  const lines: string[] = ['erDiagram'];
  
  for (const entity of spec.entities) {
    lines.push(`    ${entity.id} {`);
    for (const field of entity.fields) {
      const type = field.type.toUpperCase();
      const required = field.required ? ' PK' : '';
      const derived = field.derived ? ' "derived"' : '';
      const external = field.external ? ' "external"' : '';
      lines.push(`        ${type} ${field.id}${required}${derived}${external}`);
    }
    lines.push('    }');
  }
  
  const relationships = new Map<string, Set<string>>();
  for (const screen of spec.screens) {
    if (screen.entityId && screen.forms) {
      for (const form of screen.forms) {
        if (form.entityId !== screen.entityId) {
          const key = [screen.entityId, form.entityId].sort().join('||');
          if (!relationships.has(key)) {
            relationships.set(key, new Set([screen.entityId, form.entityId]));
          }
        }
      }
    }
  }
  
  for (const [_, entities] of relationships) {
    const [e1, e2] = Array.from(entities);
    lines.push(`    ${e1} ||--o{ ${e2} : "relates"`);
  }
  
  return lines.join('\\n');
}

export function generateFlowDiagram(spec: UXSpec): string {
  const lines: string[] = ['graph TD'];
  
  for (const flow of spec.flows) {
    lines.push(`    subgraph ${flow.id}["${flow.name}"]`);
    
    const entryStep = flow.steps.find(s => s.id === flow.entryStepId);
    if (entryStep) {
      const screen = spec.screens.find(s => s.id === entryStep.screenId);
      lines.push(`        ${entryStep.id}["${screen?.name || entryStep.screenId}"]`);
      lines.push(`        Start([Start]) --> ${entryStep.id}`);
    }
    
    for (const step of flow.steps) {
      const screen = spec.screens.find(s => s.id === step.screenId);
      const label = screen?.name || step.screenId;
      
      if (screen?.type === 'success') {
        lines.push(`        ${step.id}["✓ ${label}"]:::success`);
      } else if (screen?.type === 'error') {
        lines.push(`        ${step.id}["✗ ${label}"]:::error`);
      }
      
      if (step.next) {
        for (const next of step.next) {
          const condition = next.condition ? `|${next.condition}|` : '';
          lines.push(`        ${step.id} -->${condition} ${next.targetStepId}`);
        }
      }
    }
    
    lines.push('    end');
  }
  
  lines.push('    classDef success fill:#90EE90');
  lines.push('    classDef error fill:#FFB6C1');
  
  return lines.join('\\n');
}