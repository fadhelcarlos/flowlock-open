import type { UXSpec } from 'flowlock-uxspec';

export function generateERDiagram(spec: UXSpec): string {
  const lines: string[] = ['erDiagram'];
  
  // Generate entity definitions
  for (const entity of spec.entities) {
    lines.push(`    ${entity.id} {`);
    for (const field of entity.fields) {
      const type = field.type.toUpperCase();
      const required = field.required ? ' PK' : '';
      const derived = field.derived ? ' "derived"' : '';
      const external = field.external ? ' "external"' : '';
      const enumValues = (field as any).enum ? ` "${(field as any).enum.join(',')}"` : '';
      lines.push(`        ${type} ${field.id}${required}${derived}${external}${enumValues}`);
    }
    lines.push('    }');
  }
  
  // Generate relationships from entity relations
  const addedRelations = new Set<string>();
  for (const entity of spec.entities) {
    const relations = (entity as any).relations || [];
    for (const relation of relations) {
      const relKey = `${entity.id}-${relation.to}-${relation.id}`;
      if (!addedRelations.has(relKey)) {
        const relationType = relation.kind === '1:1' ? '||--||' :
                            relation.kind === '1:many' ? '||--o{' :
                            relation.kind === 'many:1' ? '}o--||' :
                            '}o--o{';
        lines.push(`    ${entity.id} ${relationType} ${relation.to} : "${relation.id}"`);
        addedRelations.add(relKey);
      }
    }
  }
  
  // Fallback: infer relationships from screens (if no explicit relations)
  if (addedRelations.size === 0) {
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
  }
  
  return lines.join('\\n');
}

export function generateFlowDiagram(spec: UXSpec): string {
  const lines: string[] = ['graph TD'];
  
  // Generate flow diagrams
  for (const flow of spec.flows) {
    const flowRole = (flow as any).role || (flow.roles ? flow.roles[0] : 'user');
    const flowJtbd = (flow as any).jtbd || '';
    const subtitle = flowJtbd ? ` [${flowRole}: ${flowJtbd}]` : ` [${flowRole}]`;
    
    lines.push(`    subgraph ${flow.id}["${flow.name}${subtitle}"]`);
    
    const entryStep = flow.steps.find(s => s.id === flow.entryStepId);
    if (entryStep) {
      const screenId = entryStep.screenId || (entryStep as any).screen;
      const screen = spec.screens.find(s => s.id === screenId);
      lines.push(`        ${entryStep.id}["${screen?.name || screenId}"]`);
      lines.push(`        Start([Start]) --> ${entryStep.id}`);
    }
    
    for (const step of flow.steps) {
      const screenId = step.screenId || (step as any).screen;
      const screen = spec.screens.find(s => s.id === screenId);
      const label = screen?.name || screenId;
      
      // Add step details
      const reads = (step as any).reads;
      const writes = (step as any).writes;
      let stepLabel = label;
      if (reads || writes) {
        const details = [];
        if (writes) details.push(`writes: ${writes.join(',')}`);
        if (reads) details.push(`reads: ${reads.join(',')}`);
        stepLabel = `${label}\\n(${details.join(', ')})`;
      }
      
      if (screen?.type === 'success') {
        lines.push(`        ${step.id}["✓ ${stepLabel}"]:::success`);
      } else if (screen?.type === 'error') {
        lines.push(`        ${step.id}["✗ ${stepLabel}"]:::error`);
      } else {
        lines.push(`        ${step.id}["${stepLabel}"]`);
      }
      
      // Handle state transitions
      const transition = (step as any).transition;
      if (transition) {
        lines.push(`        ${step.id} -.->|${transition.from}→${transition.to}| ${step.id}`);
      }
      
      if (step.next) {
        for (const next of step.next) {
          const condition = next.condition ? `|${next.condition}|` : '';
          lines.push(`        ${step.id} -->${condition} ${next.targetStepId}`);
        }
      }
    }
    
    // Show success criteria if defined
    const success = (flow as any).success;
    if (success?.screen) {
      const successStep = flow.steps.find(s => 
        (s.screenId || (s as any).screen) === success.screen
      );
      if (successStep) {
        lines.push(`        ${successStep.id} ==> End([End])`);
      }
    }
    
    lines.push('    end');
  }
  
  // Generate CTA navigation diagram if screens have CTAs
  const screensWithCtas = spec.screens.filter(s => (s as any).ctas?.length > 0);
  if (screensWithCtas.length > 0) {
    lines.push('    subgraph Navigation["Screen Navigation (CTAs)"]');
    
    for (const screen of screensWithCtas) {
      const ctas = (screen as any).ctas || [];
      for (const cta of ctas) {
        const targetScreen = spec.screens.find(s => s.id === cta.to);
        if (targetScreen) {
          const ctaLabel = cta.label || cta.id;
          const ctaType = cta.type === 'primary' ? '==>' : '-->';
          lines.push(`        ${screen.id}["${screen.name}"] ${ctaType}|${ctaLabel}| ${cta.to}["${targetScreen.name}"]`);
        }
      }
    }
    
    lines.push('    end');
  }
  
  lines.push('    classDef success fill:#90EE90');
  lines.push('    classDef error fill:#FFB6C1');
  lines.push('    classDef home fill:#87CEEB');
  
  return lines.join('\\n');
}