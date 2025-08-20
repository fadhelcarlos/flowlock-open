import type { UXSpec } from "flowlock-uxspec";
import type { CheckResult } from "flowlock-plugin-sdk";

/**
 * Validates database configuration and best practices
 */
export function checkDatabaseValidation(spec: UXSpec): CheckResult[] {
  const results: CheckResult[] = [];
  
  // Check if entities are defined
  if (!spec.entities || spec.entities.length === 0) {
    results.push({
      id: 'database_no_entities',
      level: 'warning',
      status: 'fail',
      message: 'No database entities defined in spec',
    });
    return results;
  }
  
  // Check for primary keys
  for (const entity of spec.entities) {
    const hasIdField = entity.fields?.some(f => 
      f.id === 'id' || f.id.toLowerCase().endsWith('_id') || f.id.toLowerCase().endsWith('id')
    );
    
    if (!hasIdField) {
      results.push({
        id: `database_no_primary_key_${entity.id}`,
        level: 'warning',
        status: 'fail',
        message: `Entity '${entity.name}' appears to have no primary key field`,
        ref: `entity:${entity.id}`,
      });
    }
  }
  
  // Check for relationships
  const hasRelationships = spec.entities.some(e => 
    e.fields?.some(f => f.type === 'relation' || f.type?.includes('[]'))
  );
  
  if (spec.entities.length > 1 && !hasRelationships) {
    results.push({
      id: 'database_no_relationships',
      level: 'info',
      status: 'fail',
      message: 'Multiple entities defined but no relationships detected',
    });
  }
  
  // Check for audit fields (created_at, updated_at)
  for (const entity of spec.entities) {
    const hasCreatedAt = entity.fields?.some(f => 
      f.id === 'created_at' || f.id === 'createdAt' || f.id === 'created'
    );
    const hasUpdatedAt = entity.fields?.some(f => 
      f.id === 'updated_at' || f.id === 'updatedAt' || f.id === 'modified'
    );
    
    if (!hasCreatedAt || !hasUpdatedAt) {
      results.push({
        id: `database_no_audit_fields_${entity.id}`,
        level: 'info',
        status: 'fail',
        message: `Entity '${entity.name}' missing audit fields (created_at/updated_at)`,
        ref: `entity:${entity.id}`,
      });
    }
  }
  
  // Check for proper field types
  for (const entity of spec.entities) {
    for (const field of entity.fields || []) {
      if (!field.type) {
        results.push({
          id: `database_no_field_type_${entity.id}_${field.id}`,
          level: 'warning',
          status: 'fail',
          message: `Field '${field.name}' in entity '${entity.name}' has no type specified`,
          ref: `entity:${entity.id},field:${field.id}`,
        });
      }
    }
  }
  
  if (results.length === 0) {
    results.push({
      id: 'database_validation',
      level: 'info',
      status: 'pass',
      message: 'Database structure follows best practices',
    });
  }
  
  return results;
}