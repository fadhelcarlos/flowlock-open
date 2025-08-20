/**
 * Utility functions for handling entity/entityId field normalization
 * Supports backward compatibility with both naming conventions
 */

/**
 * Gets the entity ID from an object that may have either 'entity' or 'entityId' field
 * Prefers 'entity' if both are present (simpler naming convention)
 */
export function getEntityId(obj: any): string | undefined {
  // Prefer 'entity' as it's simpler
  if (obj?.entity) return obj.entity;
  if (obj?.entityId) return obj.entityId;
  return undefined;
}

/**
 * Checks if an object has an entity reference (either 'entity' or 'entityId')
 */
export function hasEntityReference(obj: any): boolean {
  return !!(obj?.entity || obj?.entityId);
}

/**
 * Normalizes entity field name to preferred convention
 * Returns 'entity' for consistency
 */
export function normalizeEntityFieldName(): 'entity' {
  return 'entity';
}

/**
 * Creates an entity reference object with the preferred field name
 */
export function createEntityReference(entityId: string): { entity: string } {
  return { entity: entityId };
}

/**
 * Gets all entity IDs from a collection, handling both field names
 */
export function getEntityIds(items: any[]): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => getEntityId(item))
    .filter((id): id is string => id !== undefined);
}

/**
 * Finds items with a specific entity ID, handling both field names
 */
export function findByEntityId<T extends any>(items: T[], entityId: string): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => getEntityId(item) === entityId);
}