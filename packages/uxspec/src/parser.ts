import { ZodError } from 'zod';
import { UXSpecSchema, type UXSpec } from './schema';

export class ParseError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ParseError';
  }
}

export function parseSpec(json: unknown): UXSpec {
  try {
    return UXSpecSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      });
      throw new ParseError(
        `Invalid UX specification:\n${issues.join('\n')}`,
        error.issues
      );
    }
    throw new ParseError('Failed to parse UX specification', error);
  }
}