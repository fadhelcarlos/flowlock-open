import { describe, it, expect } from 'vitest';
import { parseSlash } from '../src/commands/parseSlash';

describe('parseSlash', () => {
  it('parses simple command', () => {
    const r = parseSlash('/audit --level strict');
    expect(r.cmd).toBe('audit');
    expect(r.flags.level).toBe('strict');
  });
  
  it('parses comma lists', () => {
    const r = parseSlash('/export --format svg,csv');
    expect(r.flags.format).toEqual(['svg','csv']);
  });
  
  it('handles quoted values', () => {
    const r = parseSlash('/inventory --scope "ui,api"');
    expect(r.flags.scope).toBe('ui,api');
  });
  
  it('handles boolean flags', () => {
    const r = parseSlash('/audit --fix --quiet');
    expect(r.flags.fix).toBe(true);
    expect(r.flags.quiet).toBe(true);
  });
  
  it('handles numeric values', () => {
    const r = parseSlash('/test --count 42 --ratio 3.14');
    expect(r.flags.count).toBe(42);
    expect(r.flags.ratio).toBe(3.14);
  });
});