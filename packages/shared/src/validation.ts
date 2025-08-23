/**
 * Shared validation utilities for FlowLock system
 */

import path from 'node:path';
import { ValidationError, ErrorCodes } from './errors';

export function validateRequiredField(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(
      `Required field '${fieldName}' is missing`,
      ErrorCodes.CONFIG_MISSING_REQUIRED,
      {
        field: fieldName,
        reason: 'missing',
        suggestion: `Add '${fieldName}' to configuration`
      }
    );
  }
}

export function validateArrayField(value: any, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(
      `Field '${fieldName}' must be an array`,
      ErrorCodes.CONFIG_INVALID_VALUE,
      {
        field: fieldName,
        reason: 'type',
        suggestion: `Use an array for '${fieldName}'`
      }
    );
  }
}

export function validateObjectField(value: any, fieldName: string): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(
      `Field '${fieldName}' must be an object`,
      ErrorCodes.CONFIG_INVALID_VALUE,
      {
        field: fieldName,
        reason: 'type',
        suggestion: `Use an object for '${fieldName}'`
      }
    );
  }
}

export function validateEnum<T>(value: T, validValues: readonly T[], fieldName: string): void {
  if (!validValues.includes(value)) {
    throw new ValidationError(
      `Invalid value for '${fieldName}': ${value}. Must be one of: ${validValues.join(', ')}`,
      ErrorCodes.CONFIG_INVALID_VALUE,
      {
        field: fieldName,
        reason: 'enum',
        suggestion: `Use one of: ${validValues.join(', ')}`
      }
    );
  }
}

export function validatePath(p: string, fieldName: string): string {
  if (!p || typeof p !== 'string') {
    throw new ValidationError(
      `Field '${fieldName}' must be a non-empty string path`,
      ErrorCodes.CONFIG_INVALID_VALUE,
      {
        field: fieldName,
        reason: 'empty',
        suggestion: `Provide a valid path for ${fieldName}`
      }
    );
  }
  const segments = p.split(/\\|\//);
  if (segments.includes('..')) {
    throw new ValidationError(
      `Field '${fieldName}' contains invalid path traversal`,
      ErrorCodes.CONFIG_INVALID_VALUE,
      {
        field: fieldName,
        reason: 'path-traversal',
        suggestion: `Remove ../ from ${fieldName}`
      }
    );
  }
  return path.resolve(path.normalize(p));
}

export function validateUrl(u: string, fieldName: string): string {
  try {
    const parsed = new URL(u);
    return parsed.toString();
  } catch {
    throw new ValidationError(
      `Field '${fieldName}' must be a valid URL`,
      ErrorCodes.CONFIG_INVALID_VALUE,
      {
        field: fieldName,
        reason: 'invalid-url',
        suggestion: `Provide a valid URL for ${fieldName}`
      }
    );
  }
}