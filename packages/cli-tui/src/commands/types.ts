export type Args = Record<string, any>;

export interface Ctx {
  cwd: string;
  onLog: (line: string) => void;
  signal?: AbortSignal;
}

export interface Command {
  id: string;
  title: string;
  category: 'Inventory' | 'Audit' | 'Export' | 'Diagrams' | 'Init' | 'Agent' | 'Watch' | 'Settings';
  summary?: string;
  flagsSchema: any; // zod schema
  run: (args: Args, ctx: Ctx) => Promise<{ code: number }>; // normalized
  preview?: (args: Args, ctx: Ctx) => string;
}