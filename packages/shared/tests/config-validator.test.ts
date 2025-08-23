import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { validateFlowlockConfig } from '../src/config-validator';
import { ValidationError } from '../src/errors';

describe('config validator path/url validation', () => {
  it('canonicalizes schemaFiles and specUrl', () => {
    const cfg = {
      projectName: 'demo',
      inventory: {
        db: { schemaFiles: ['./schemas/schema.prisma'] },
        api: { specUrl: 'http://example.com/spec.yaml' }
      }
    };

    const validated = validateFlowlockConfig(cfg);
    expect(validated.inventory!.db!.schemaFiles![0]).toBe(
      path.resolve('./schemas/schema.prisma')
    );
    expect(validated.inventory!.api!.specUrl).toBe('http://example.com/spec.yaml');
  });

  it('rejects path traversal', () => {
    const cfg = {
      projectName: 'demo',
      inventory: { db: { schemaFiles: ['../secret.sql'] } }
    };
    try {
      validateFlowlockConfig(cfg);
      throw new Error('should have thrown');
    } catch (err) {
      const v = err as ValidationError;
      expect(v.details).toMatchInlineSnapshot(`
        {
          "field": "inventory.db.schemaFiles",
          "reason": "path-traversal",
          "suggestion": "Remove ../ from inventory.db.schemaFiles",
        }
      `);
    }
  });

  it('rejects malformed URLs', () => {
    const cfg = {
      projectName: 'demo',
      inventory: { api: { specUrl: 'ht!tp://bad url' } }
    };
    try {
      validateFlowlockConfig(cfg);
      throw new Error('should have thrown');
    } catch (err) {
      const v = err as ValidationError;
      expect(v.details).toMatchInlineSnapshot(`
        {
          "field": "inventory.api.specUrl",
          "reason": "invalid-url",
          "suggestion": "Provide a valid URL for inventory.api.specUrl",
        }
      `);
    }
  });
});
