import { z } from 'zod';
import { spawn } from 'child_process';
import type { Command, Args, Ctx } from './types.js';

// Wrapper function to call CLI commands via spawn
const runCliCommand = (cmd: string, args: string[], ctx: Ctx): Promise<number> => {
  return new Promise((resolve) => {
    const child = spawn('uxcg', [cmd, ...args], {
      cwd: ctx.cwd,
      shell: true
    });

    child.stdout?.on('data', (data) => {
      ctx.onLog(data.toString().trim());
    });

    child.stderr?.on('data', (data) => {
      ctx.onLog(`Error: ${data.toString().trim()}`);
    });

    child.on('exit', (code) => {
      resolve(code ?? 1);
    });

    if (ctx.signal) {
      ctx.signal.addEventListener('abort', () => {
        child.kill();
      });
    }
  });
};

// Convert flags object to CLI args array
const flagsToArgs = (flags: Record<string, any>): string[] => {
  const args: string[] = [];
  for (const [key, value] of Object.entries(flags)) {
    if (value === true) {
      args.push(`--${key}`);
    } else if (value !== false && value !== undefined && value !== null) {
      args.push(`--${key}`);
      if (Array.isArray(value)) {
        args.push(value.join(','));
      } else {
        args.push(String(value));
      }
    }
  }
  return args;
};

const wrap = (cmdName: string) => 
  async (args: Args, ctx: Ctx) => ({ 
    code: await runCliCommand(cmdName, flagsToArgs(args), ctx) 
  });

export const commands: Command[] = [
  {
    id: 'help',
    title: 'Help (list commands)',
    category: 'Settings',
    flagsSchema: z.object({}),
    run: async (_args, ctx) => {
      const list = [
        'Available commands:',
        '/inventory - Build runtime inventory from codebase',
        '/audit --level basic|enhanced|strict - Run UX checks',
        '/export --format svg|csv|json|junit|all - Export artifacts',
        '/diagrams --types er,flow - Generate diagrams',
        '/init - Initialize new project',
        '/init-existing - Wire into existing project',
        '/watch - Watch mode with auto-run',
        '/agent - Connect to FlowLock cloud',
        '/settings - Open settings view'
      ];
      list.forEach(l => ctx.onLog(l));
      return { code: 0 };
    }
  },
  {
    id: 'inventory',
    title: 'Inventory (scan project)',
    category: 'Inventory',
    summary: 'Detect DB/API/UI inventory from runtime & codebase',
    flagsSchema: z.object({ 
      scope: z.string().default('all'),
      out: z.string().optional(),
      'db-only': z.boolean().optional(),
      'api-only': z.boolean().optional(),
      'ui-only': z.boolean().optional()
    }),
    run: wrap('inventory')
  },
  {
    id: 'audit',
    title: 'Audit (run checks)',
    category: 'Audit',
    flagsSchema: z.object({
      only: z.string().optional(), 
      skip: z.string().optional(),
      level: z.enum(['basic','enhanced','strict']).default('enhanced'),
      fix: z.boolean().optional(),
      inventory: z.boolean().optional(),
      json: z.boolean().optional(),
      quiet: z.boolean().optional()
    }),
    run: wrap('audit')
  },
  {
    id: 'export',
    title: 'Export artifacts (svg,csv,junit,json)',
    category: 'Export',
    flagsSchema: z.object({ 
      format: z.string().default('all') 
    }),
    run: async (args, ctx) => {
      const format = args.format || 'all';
      return { code: await runCliCommand('export', [format], ctx) };
    }
  },
  {
    id: 'diagrams',
    title: 'Generate diagrams (Mermaid -> SVG)',
    category: 'Diagrams',
    flagsSchema: z.object({ 
      types: z.string().default('er,flow') 
    }),
    run: wrap('diagrams')
  },
  { 
    id: 'init', 
    title: 'Init new project', 
    category: 'Init', 
    flagsSchema: z.object({}), 
    run: wrap('init') 
  },
  { 
    id: 'init-existing', 
    title: 'Init existing project', 
    category: 'Init', 
    flagsSchema: z.object({
      'skip-scripts': z.boolean().optional(),
      'skip-commands': z.boolean().optional()
    }), 
    run: wrap('init-existing') 
  },
  { 
    id: 'watch', 
    title: 'Watch & re-run on changes', 
    category: 'Watch', 
    flagsSchema: z.object({
      cloud: z.boolean().optional(),
      cloudUrl: z.string().optional(),
      projectId: z.string().optional()
    }), 
    run: wrap('watch') 
  },
  { 
    id: 'agent', 
    title: 'Agent (connect to SaaS)', 
    category: 'Agent', 
    flagsSchema: z.object({}), 
    run: wrap('agent') 
  },
  { 
    id: 'settings', 
    title: 'Open Settings view', 
    category: 'Settings', 
    flagsSchema: z.object({}), 
    run: async (_a, ctx) => { 
      ctx.onLog('Settings view is accessible in the TUI interface'); 
      return { code: 0 }; 
    } 
  },
];