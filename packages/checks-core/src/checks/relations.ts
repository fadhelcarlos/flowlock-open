import type { UXSpec } from 'flowlock-uxspec';
import { ErrorCodes } from 'flowlock-shared';

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
        const availableEntities = Array.from(entityIds);
        const similarEntity = availableEntities.find(e => 
          e.toLowerCase() === relation.to.toLowerCase()
        );
        
        results.push({
          id: `relation_invalid_target_${entity.id}_${relation.id}`,
          level: 'error',
          status: 'fail',
          message: `Relation '${relation.id}' references non-existent entity '${relation.to}'`,
          ref: `entity:${entity.id},relation:${relation.id}`,
          details: {
            code: ErrorCodes.VALIDATION_RELATIONSHIP_BROKEN,
            expected: `Target entity should exist in spec`,
            actual: `Entity '${relation.to}' not found`,
            location: `${entity.id}.relations[${relation.id}]`,
            suggestion: similarEntity
              ? `Did you mean '${similarEntity}'? Update relation:\n{ "id": "${relation.id}", "to": "${similarEntity}", "kind": "${relation.kind}" }`
              : `Available entities: ${availableEntities.slice(0, 5).join(", ")}${availableEntities.length > 5 ? ` (and ${availableEntities.length - 5} more)` : ""}\n\nEither:\n  1. Add missing entity to spec\n  2. Update relation to existing entity\n  3. Remove invalid relation`,
            documentation: "https://flowlock.dev/docs/entities#relations",
            context: {
              fromEntity: entity.id,
              relationId: relation.id,
              targetEntity: relation.to,
              availableEntities: availableEntities.slice(0, 10)
            }
          }
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
            message: `Circular relation detected between entities`,
            ref: `entity:${entity.id},relation:${relation.id}`,
            details: {
              code: ErrorCodes.DETERMINISM_CIRCULAR_DEPENDENCY,
              expected: `Relations should form a directed acyclic graph`,
              actual: `Circular dependency: ${entity.id} -> ${relation.to} -> ${entity.id}`,
              location: `${entity.id}.relations[${relation.id}] <-> ${targetEntity.id}.relations`,
              suggestion: `Consider:\n  1. Make one relation one-directional\n  2. Use a junction/join table for many-to-many\n  3. Restructure entities to avoid circular dependency\n\nExample fix: Remove reverse relation or change to different relation type`,
              documentation: "https://flowlock.dev/docs/entities#avoiding-circular-relations",
              context: {
                cycle: [entity.id, relation.to, entity.id],
                relationKind: relation.kind
              }
            }
          });
        }
      }
      
      // Validate relation kind
      const validKinds = ['1:1', '1:many', 'many:1', 'many:many'];
      if (!validKinds.includes(relation.kind)) {
        results.push({
          id: `relation_invalid_kind_${entity.id}_${relation.id}`,
          level: 'error',
          status: 'fail',
          message: `Invalid relation kind '${relation.kind}'`,
          ref: `entity:${entity.id},relation:${relation.id}`,
          details: {
            code: ErrorCodes.CONFIG_INVALID_VALUE,
            expected: `Valid relation kinds: ${validKinds.join(", ")}`,
            actual: `'${relation.kind}'`,
            location: `${entity.id}.relations[${relation.id}].kind`,
            suggestion: `Update relation kind to one of:\n  - "1:1" (one-to-one)\n  - "1:many" (one-to-many)\n  - "many:1" (many-to-one)\n  - "many:many" (many-to-many)\n\nExample:\n{ "id": "${relation.id}", "to": "${relation.to}", "kind": "1:many" }`,
            documentation: "https://flowlock.dev/docs/entities#relation-types",
            context: {
              entity: entity.id,
              relation: relation.id,
              invalidKind: relation.kind,
              validKinds: validKinds
            }
          }
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
