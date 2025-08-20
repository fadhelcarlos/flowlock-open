/**
 * Shared validation utilities for FlowLock system
 */

import { ValidationError } from './errors';

export function validateRequiredField(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`Required field '${fieldName}' is missing`);
  }
}

export function validateArrayField(value: any, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`Field '${fieldName}' must be an array`);
  }
}

export function validateObjectField(value: any, fieldName: string): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`Field '${fieldName}' must be an object`);
  }
}

export function validateEnum<T>(value: T, validValues: readonly T[], fieldName: string): void {
  if (!validValues.includes(value)) {
    throw new ValidationError(
      `Invalid value for '${fieldName}': ${value}. Must be one of: ${validValues.join(', ')}`
    );
  }
}

export function validatePath(path: string, fieldName: string): void {
  if (!path || typeof path !== 'string') {
    throw new ValidationError(`Field '${fieldName}' must be a non-empty string path`);
  }
  if (path.includes('..')) {
    throw new ValidationError(`Field '${fieldName}' contains invalid path traversal`);
  }
}

export function validateUrl(url: string, fieldName: string): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError(`Field '${fieldName}' must be a valid URL`);
  }
}