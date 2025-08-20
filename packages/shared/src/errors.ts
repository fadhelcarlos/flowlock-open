/**
 * Centralized error handling patterns for FlowLock system
 */

export interface ErrorDetails {
  expected?: any;
  actual?: any;
  location?: string;
  suggestion?: string;
  documentation?: string;
  context?: Record<string, any>;
}

export class FlowlockError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: ErrorDetails
  ) {
    super(message);
    this.name = 'FlowlockError';
  }
}

// Specific error codes for better tracking
export const ErrorCodes = {
  // Inventory errors
  INVENTORY_MISSING: 'INV_001',
  INVENTORY_INVALID_SCHEMA: 'INV_002',
  INVENTORY_ENTITY_MISMATCH: 'INV_003',
  INVENTORY_FIELD_MISMATCH: 'INV_004',
  INVENTORY_API_MISMATCH: 'INV_005',
  INVENTORY_UI_READ_INVALID: 'INV_006',
  
  // Validation errors
  VALIDATION_MISSING_FIELD: 'VAL_001',
  VALIDATION_TYPE_MISMATCH: 'VAL_002',
  VALIDATION_CONSTRAINT_FAILED: 'VAL_003',
  VALIDATION_RELATIONSHIP_BROKEN: 'VAL_004',
  VALIDATION_STATE_INVALID: 'VAL_005',
  
  // Configuration errors
  CONFIG_FILE_NOT_FOUND: 'CFG_001',
  CONFIG_INVALID_FORMAT: 'CFG_002',
  CONFIG_MISSING_REQUIRED: 'CFG_003',
  CONFIG_INVALID_VALUE: 'CFG_004',
  
  // Determinism errors
  DETERMINISM_UNREACHABLE_STATE: 'DET_001',
  DETERMINISM_CIRCULAR_DEPENDENCY: 'DET_002',
  DETERMINISM_AMBIGUOUS_TRANSITION: 'DET_003',
  DETERMINISM_MISSING_HANDLER: 'DET_004',
  
  // Screen/UI errors
  SCREEN_INVALID_READ: 'SCR_001',
  SCREEN_MISSING_FORM: 'SCR_002',
  SCREEN_INVALID_TRANSITION: 'SCR_003',
  SCREEN_MISSING_CTA: 'SCR_004',
  
  // Flow errors
  FLOW_UNREACHABLE_SCREEN: 'FLW_001',
  FLOW_MISSING_ENTRY: 'FLW_002',
  FLOW_INVALID_STEP: 'FLW_003',
  FLOW_DEPTH_EXCEEDED: 'FLW_004',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export class InventoryError extends FlowlockError {
  constructor(message: string, code: ErrorCode = ErrorCodes.INVENTORY_MISSING, details?: ErrorDetails) {
    super(message, code, details);
    this.name = 'InventoryError';
  }
}

export class ValidationError extends FlowlockError {
  constructor(message: string, code: ErrorCode = ErrorCodes.VALIDATION_MISSING_FIELD, details?: ErrorDetails) {
    super(message, code, details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends FlowlockError {
  constructor(message: string, code: ErrorCode = ErrorCodes.CONFIG_FILE_NOT_FOUND, details?: ErrorDetails) {
    super(message, code, details);
    this.name = 'ConfigurationError';
  }
}

export class DeterminismError extends FlowlockError {
  constructor(message: string, code: ErrorCode = ErrorCodes.DETERMINISM_UNREACHABLE_STATE, details?: ErrorDetails) {
    super(message, code, details);
    this.name = 'DeterminismError';
  }
}

export function isFlowlockError(error: unknown): error is FlowlockError {
  return error instanceof FlowlockError;
}

export function formatError(error: unknown): string {
  if (isFlowlockError(error)) {
    let output = `[${error.code}] ${error.message}`;
    
    if (error.details) {
      const { expected, actual, location, suggestion, documentation, context } = error.details;
      
      if (location) {
        output += `\n  📍 Location: ${location}`;
      }
      
      if (expected !== undefined && actual !== undefined) {
        output += `\n  ❌ Expected: ${JSON.stringify(expected)}`;
        output += `\n  ⚠️  Actual: ${JSON.stringify(actual)}`;
      }
      
      if (suggestion) {
        output += `\n  💡 Fix: ${suggestion}`;
      }
      
      if (documentation) {
        output += `\n  📚 Docs: ${documentation}`;
      }
      
      if (context && Object.keys(context).length > 0) {
        output += `\n  🔍 Context: ${JSON.stringify(context, null, 2)}`;
      }
    }
    
    return output;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Helper function to create actionable error messages
export function createActionableError(
  code: ErrorCode,
  details: ErrorDetails & { message?: string }
): FlowlockError {
  const messages: Record<ErrorCode, (d: ErrorDetails) => string> = {
    [ErrorCodes.INVENTORY_MISSING]: () => 
      'Runtime inventory file not found. Run "npx flowlock inventory" to generate it.',
    
    [ErrorCodes.INVENTORY_INVALID_SCHEMA]: (d) => 
      `Invalid inventory schema at ${d.location}. Expected properties: db, api, ui.`,
    
    [ErrorCodes.INVENTORY_ENTITY_MISMATCH]: (d) => 
      `Entity "${d.actual}" exists in ${d.location} but not in spec. Add it to spec.entities or remove from database.`,
    
    [ErrorCodes.INVENTORY_FIELD_MISMATCH]: (d) => 
      `Field "${d.actual}" exists in ${d.location} but not in spec. Add to spec or mark as external/derived.`,
    
    [ErrorCodes.INVENTORY_API_MISMATCH]: (d) => 
      `API endpoint "${d.actual}" declared in spec but not found. Implement endpoint or update spec.`,
    
    [ErrorCodes.INVENTORY_UI_READ_INVALID]: (d) => 
      `UI reads field "${d.actual}" without provenance. Capture in a form, mark as derived/external, or remove read.`,
    
    [ErrorCodes.VALIDATION_MISSING_FIELD]: (d) => 
      `Required field "${d.expected}" is missing in ${d.location}. Add field with appropriate type.`,
    
    [ErrorCodes.VALIDATION_TYPE_MISMATCH]: (d) => 
      `Type mismatch in ${d.location}: expected ${d.expected}, got ${d.actual}. Update field type.`,
    
    [ErrorCodes.VALIDATION_CONSTRAINT_FAILED]: (d) => 
      `Constraint failed in ${d.location}: ${d.context?.constraint}. Fix: ${d.suggestion}`,
    
    [ErrorCodes.VALIDATION_RELATIONSHIP_BROKEN]: (d) => 
      `Broken relationship from ${d.location} to ${d.expected}. Ensure target exists.`,
    
    [ErrorCodes.VALIDATION_STATE_INVALID]: (d) => 
      `Invalid state "${d.actual}" in ${d.location}. Valid states: ${d.expected}`,
    
    [ErrorCodes.CONFIG_FILE_NOT_FOUND]: (d) => 
      `Config file not found at ${d.location}. Create file or update path.`,
    
    [ErrorCodes.CONFIG_INVALID_FORMAT]: (d) => 
      `Invalid config format at ${d.location}. Expected ${d.expected} format.`,
    
    [ErrorCodes.CONFIG_MISSING_REQUIRED]: (d) => 
      `Missing required config "${d.expected}" in ${d.location}. Add to configuration.`,
    
    [ErrorCodes.CONFIG_INVALID_VALUE]: (d) => 
      `Invalid config value at ${d.location}: "${d.actual}". Expected: ${d.expected}`,
    
    [ErrorCodes.DETERMINISM_UNREACHABLE_STATE]: (d) => 
      `State "${d.actual}" is unreachable from ${d.location}. Add transition or remove state.`,
    
    [ErrorCodes.DETERMINISM_CIRCULAR_DEPENDENCY]: (d) => 
      `Circular dependency detected: ${d.context?.cycle}. Break cycle by removing one dependency.`,
    
    [ErrorCodes.DETERMINISM_AMBIGUOUS_TRANSITION]: (d) => 
      `Ambiguous transition from ${d.location}: multiple paths to ${d.actual}. Add guards or merge transitions.`,
    
    [ErrorCodes.DETERMINISM_MISSING_HANDLER]: (d) => 
      `Missing handler for event "${d.expected}" in state "${d.location}". Add handler or ignore event.`,
    
    [ErrorCodes.SCREEN_INVALID_READ]: (d) => 
      `Screen "${d.location}" reads uncaptured field "${d.actual}". Capture field first or mark as external.`,
    
    [ErrorCodes.SCREEN_MISSING_FORM]: (d) => 
      `Screen "${d.location}" requires form for entity "${d.expected}". Add form configuration.`,
    
    [ErrorCodes.SCREEN_INVALID_TRANSITION]: (d) => 
      `Invalid transition from screen "${d.location}" to "${d.actual}". Check flow configuration.`,
    
    [ErrorCodes.SCREEN_MISSING_CTA]: (d) => 
      `Screen "${d.location}" missing CTA for action "${d.expected}". Add button or link.`,
    
    [ErrorCodes.FLOW_UNREACHABLE_SCREEN]: (d) => 
      `Screen "${d.actual}" unreachable in flow "${d.location}". Add step or remove screen.`,
    
    [ErrorCodes.FLOW_MISSING_ENTRY]: (d) => 
      `Flow "${d.location}" missing entry point. Set entryStepId to valid step.`,
    
    [ErrorCodes.FLOW_INVALID_STEP]: (d) => 
      `Invalid step "${d.actual}" in flow "${d.location}". Check step configuration.`,
    
    [ErrorCodes.FLOW_DEPTH_EXCEEDED]: (d) => 
      `Flow "${d.location}" exceeds max depth ${d.expected}, actual ${d.actual}. Simplify flow or increase limit.`,
  };
  
  const message = details.message || messages[code]?.(details) || 'Unknown error';
  
  // Determine error class based on code prefix
  if (code.startsWith('INV')) {
    return new InventoryError(message, code, details);
  } else if (code.startsWith('VAL')) {
    return new ValidationError(message, code, details);
  } else if (code.startsWith('CFG')) {
    return new ConfigurationError(message, code, details);
  } else if (code.startsWith('DET')) {
    return new DeterminismError(message, code, details);
  }
  
  return new FlowlockError(message, code, details);
}