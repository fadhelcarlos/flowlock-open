import type { UXSpec } from 'flowlock-uxspec';

/**
 * Validates entity relations are properly defined and referenced
 */
export function checkRelations(spec: UXSpec): any[] {
  const results: any[] = [];
  const entities = spec.entities || [];
  const entityIds = new Set(entities.map(e => e.id));
  
  for (const entity of entities) {
    const relations = (entity as any).relations || [];
    
    for (const relation of relations) {
      // Check that target entity exists
      if (!entityIds.has(relation.to)) {
        results.push({
          id: `relation_invalid_target_${entity.id}_${relation.id}`,
          level: 'error',
          status: 'fail',
          message: `Entity '${entity.name}' has relation '${relation.id}' to non-existent entity '${relation.to}'`,
          ref: `entity:${entity.id},relation:${relation.id}`,
        });
      }
      
      // Check for circular references
      const targetEntity = entities.find(e => e.id === relation.to);
      if (targetEntity) {
        const targetRelations = (targetEntity as any).relations || [];
        const hasCircular = targetRelations.some((r: any) => 
          r.to === entity.id && r.id === relation.id
        );
        
        if (hasCircular && entity.id !== relation.to) {
          results.push({
            id: `relation_circular_${entity.id}_${relation.id}`,
            level: 'warning',
            status: 'fail',
            message: `Potential circular relation between '${entity.name}' and '${targetEntity.name}'`,
            ref: `entity:${entity.id},relation:${relation.id}`,
          });
        }
      }
      
      // Validate relation kind
      if (!['1:1', '1:many', 'many:1', 'many:many'].includes(relation.kind)) {
        results.push({
          id: `relation_invalid_kind_${entity.id}_${relation.id}`,
          level: 'error',
          status: 'fail',
          message: `Invalid relation kind '${relation.kind}' in entity '${entity.name}'`,
          ref: `entity:${entity.id},relation:${relation.id}`,
        });
      }
    }
  }
  
  if (results.length === 0) {
    results.push({
      id: 'relations',
      level: 'info',
      status: 'pass',
      message: 'All entity relations are properly defined',
    });
  }
  
  return results;
}
