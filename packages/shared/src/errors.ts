/**
 * Centralized error handling patterns for FlowLock system
 */

export class FlowlockError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'FlowlockError';
  }
}

export class InventoryError extends FlowlockError {
  constructor(message: string, details?: any) {
    super(message, 'INVENTORY_ERROR', details);
    this.name = 'InventoryError';
  }
}

export class ValidationError extends FlowlockError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends FlowlockError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class DeterminismError extends FlowlockError {
  constructor(message: string, details?: any) {
    super(message, 'DETERMINISM_ERROR', details);
    this.name = 'DeterminismError';
  }
}

export function isFlowlockError(error: unknown): error is FlowlockError {
  return error instanceof FlowlockError;
}

export function formatError(error: unknown): string {
  if (isFlowlockError(error)) {
    return `[${error.code}] ${error.message}${error.details ? ` - Details: ${JSON.stringify(error.details)}` : ''}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}