# === FILE: packages/cli-tui/package.json ===
{
  "name": "@flowlock/cli",
  "version": "1.0.0",
  "private": false,
  "type": "module",
  "bin": {
    "flowlock": "dist/bin/flowlock.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "chokidar": "^4.0.3",
    "enquirer": "^2.4.1",
    "execa": "^9.3.0",
    "fuse.js": "^7.0.0",
    "ink": "^5.0.1",
    "ink-select-input": "^6.0.0",
    "ink-text-input": "^6.0.0",
    "marked": "^12.0.2",
    "marked-terminal": "^6.2.0",
    "open": "^10.1.0",
    "strip-ansi": "^7.1.0",
    "tree-kill": "^1.2.2",
    "zod": "^3.23.8",
    "zustand": "^4.5.5",
    "react": "^18.3.1",
    "@flowlock/cli-headless": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.5.0",
    "@types/react": "^18.3.3",
    "eslint": "^9.9.0",
    "tsup": "^8.3.0",
    "typescript": "^5.6.2",
    "vitest": "^2.0.5"
  }
}

# === FILE: packages/cli-tui/tsconfig.json ===
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "allowSyntheticDefaultImports": true
  },
  "include": ["src"]
}

# === FILE: packages/cli-tui/tsup.config.ts ===
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: {
    'index': 'src/index.tsx',
    'bin/flowlock': 'src/bin/flowlock.ts'
  },
  splitting: false,
  clean: true,
  sourcemap: true,
  dts: true,
  format: ['esm'],
  banner: { js: '#!/usr/bin/env node' },
  outDir: 'dist',
});

# === FILE: packages/cli-tui/src/bin/flowlock.ts ===
import { spawn } from 'node:child_process';
import process from 'node:process';

const isTTY = Boolean(process.stdout.isTTY && process.stdin.isTTY);
const wantsUI = isTTY && process.env.CI !== 'true' && process.argv.length <= 2 && !process.argv.includes('--no-ui');

if (wantsUI) {
  const { startTUI } = await import('../index.js');
  startTUI().catch((err: any) => {
    console.error(err);
    process.exit(1);
  });
} else {
  // Back-compat: forward args to headless CLI (uxcg)
  const child = spawn('uxcg', process.argv.slice(2), { stdio: 'inherit', shell: true });
  child.on('exit', (code) => process.exit(code ?? 1));
}

# === FILE: packages/cli-tui/src/index.tsx ===
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';

export function startTUI() {
  const instance = render(<App />);
  process.on('SIGINT', () => {
    instance.unmount();
    process.exit(0);
  });
}

# === FILE: packages/cli-tui/src/ui/App.tsx ===
import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Sidebar } from './Sidebar.js';
import { Main } from './Main.js';
import { InputBar } from './InputBar.js';
import { Palette } from './Palette.js';
import { useStore } from '../util/store.js';
import { loadSettings } from '../util/settings.js';
import { Shortcuts } from './Shortcuts.js';

export type View = 'home'|'inventory'|'audit'|'diagrams'|'export'|'agent'|'artifacts'|'settings';

export function App() {
  const [view, setView] = useState<View>('home');
  const setPaletteOpen = useStore(s => s.setPaletteOpen);
  const setSettings = useStore(s => s.setSettings);

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === 'k') setPaletteOpen(true);
    if (input === '\t') useStore.getState().cycleFocus();
  });

  useEffect(() => { (async () => setSettings(await loadSettings()))(); }, [setSettings]);

  return (
    <Box flexDirection="column" height={process.stdout.rows || 40}>
      <Shortcuts />
      <Palette />
      <Box flexGrow={1}>
        <Box width={26} borderStyle="round"><Sidebar view={view} onChange={setView} /></Box>
        <Box flexGrow={1} marginLeft={1}><Main view={view} /></Box>
      </Box>
      <InputBar />
      <Box><Text color="gray">Press Ctrl+K for palette • Type /help for commands</Text></Box>
    </Box>
  );
}

# === FILE: packages/cli-tui/src/ui/Sidebar.tsx ===
import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { View } from './App.js';

const items = [
  { label: 'Home', value: 'home' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Audit', value: 'audit' },
  { label: 'Diagrams', value: 'diagrams' },
  { label: 'Export', value: 'export' },
  { label: 'Agent', value: 'agent' },
  { label: 'Artifacts', value: 'artifacts' },
  { label: 'Settings', value: 'settings' }
];

export function Sidebar({ view, onChange }: { view: View; onChange: (v: View)=>void }) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color="cyanBright">FlowLock</Text>
      <SelectInput items={items} initialIndex={items.findIndex(i=>i.value===view)} onSelect={i=>onChange(i.value as View)} />
    </Box>
  );
}

# === FILE: packages/cli-tui/src/ui/Main.tsx ===
import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../util/store.js';
import { Artifacts } from './Artifacts.js';
import { SettingsView } from './Settings.js';

export function Main({ view }: { view: string }) {
  const { logs, summary } = useStore(state => ({
    logs: state.current.logs,
    summary: state.current.summary
  }));
  return (
    <Box flexDirection="column">
      {view === 'home' && <Text>Welcome. Press Ctrl+K for the palette or type /commands below.</Text>}
      {view === 'artifacts' && <Artifacts />}
      {view === 'settings' && <SettingsView />}
      {view !== 'home' && view !== 'artifacts' && view !== 'settings' && (
        <>
          <Text color="gray">View: {view}</Text>
          {summary && <Box marginY={1}><Text>{summary}</Text></Box>}
          <Box flexDirection="column" marginTop={1}>
            {logs.slice(-500).map((l, i)=>(<Text key={i}>{l}</Text>))}
          </Box>
        </>
      )}
    </Box>
  );
}

# === FILE: packages/cli-tui/src/ui/InputBar.tsx ===
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { parseSlash } from '../commands/parseSlash.js';
import { runCommandById } from '../util/runCommand.js';
import { useStore } from '../util/store.js';

export function InputBar() {
  const [value, setValue] = useState('');
  const pushLog = useStore(s=>s.pushLog);
  return (
    <Box borderStyle="round" paddingX={1}>
      <Text color="gray">› </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={async (v) => {
          if (!v.trim()) return;
          if (v.startsWith('/')) {
            const { cmd, flags } = parseSlash(v);
            await runCommandById(cmd, flags, pushLog);
          } else {
            useStore.getState().setFilter(v);
          }
          setValue('');
        }}
        placeholder='Type /inventory, /audit --level strict, "/export --format svg"'
      />
    </Box>
  );
}

# === FILE: packages/cli-tui/src/ui/Palette.tsx ===
import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Fuse from 'fuse.js';
import { commands } from '../commands/registry.js';
import { useStore } from '../util/store.js';
import { runCommandById } from '../util/runCommand.js';

const fuse = new Fuse(commands, { keys: ['id', 'title', 'category'], threshold: 0.4 });

export function Palette() {
  const paletteOpen = useStore(s=>s.paletteOpen);
  const setPaletteOpen = useStore(s=>s.setPaletteOpen);
  const [q, setQ] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  const results = q ? fuse.search(q).map(r=>r.item) : commands;

  useInput((input, key) => {
    if (!paletteOpen) return;
    if (key.escape) setPaletteOpen(false);
    if (key.downArrow) setIdx(i=>Math.min(i+1, results.length-1));
    if (key.upArrow) setIdx(i=>Math.max(i-1, 0));
    if (key.return) {
      const c = results[idx]; setPaletteOpen(false);
      void runCommandById(c.id, {}, useStore.getState().pushLog);
    }
  });

  if (!paletteOpen) return null;
  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text>Command Palette</Text>
      <TextInput value={q} onChange={setQ} placeholder="Type a command…" />
      <Box flexDirection="column" marginTop={1}>
        {results.slice(0,10).map((c,i)=>(<Text key={c.id} inverse={i===idx}>{c.title}  <Text color="gray">/{c.id}</Text></Text>))}
      </Box>
    </Box>
  );
}

# === FILE: packages/cli-tui/src/ui/Artifacts.tsx ===
import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import open from 'open';
import { useStore } from '../util/store.js';

export function Artifacts() {
  const artifacts = useStore(s=>s.current.artifacts);
  const filter = useStore(s=>s.filter);
  const [selected, setSelected] = useState<string | null>(null);
  const list = useMemo(()=>artifacts.filter(p=>p.toLowerCase().includes(filter.toLowerCase())), [artifacts, filter]);
  const items = list.map(p=>({ label: p, value: p }));

  useInput((input, key) => {
    if (key.return && selected) { void open(selected); }
  });

  return (
    <Box flexDirection="column">
      <Text>Artifacts ({list.length}) — type to filter; Enter to open</Text>
      <SelectInput items={items} onSelect={(i)=>setSelected(i.value as string)} />
    </Box>
  );
}

# === FILE: packages/cli-tui/src/ui/Settings.tsx ===
import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../util/store.js';
import { saveSettings } from '../util/settings.js';

export function SettingsView() {
  const settings = useStore(s=>s.settings);
  const setSettings = useStore(s=>s.setSettings);
  const [theme, setTheme] = React.useState(settings?.user?.theme ?? 'dark');

  return (
    <Box flexDirection="column">
      <Text>Settings</Text>
      <Box>
        <Text>Theme (dark/light): </Text>
        <TextInput value={theme} onChange={setTheme} onSubmit={async (v)=>{
          const next = { ...(settings||{}), user: { ...(settings?.user||{}), theme: v } };
          setSettings(next);
          await saveSettings(next);
        }} />
      </Box>
      <Text color="gray">Settings persist to ~/.flowlock/state.json and ./.flowlock/state.json</Text>
    </Box>
  );
}

# === FILE: packages/cli-tui/src/ui/Shortcuts.tsx ===
import React from 'react';
import { useInput } from 'ink';
import { useStore } from '../util/store.js';

export function Shortcuts() {
  const cancel = useStore(s=>s.cancelCurrent);
  useInput((_input, key) => {
    if (key.ctrl && key.c) {
      void cancel();
    }
  });
  return null;
}

# === FILE: packages/cli-tui/src/commands/types.ts ===
export type Args = Record<string, any>;
export interface Ctx {
  cwd: string;
  onLog: (line: string) => void;
  signal?: AbortSignal;
}
export interface Command {
  id: string;
  title: string;
  category: 'Inventory'|'Audit'|'Export'|'Diagrams'|'Init'|'Agent'|'Watch'|'Settings';
  summary?: string;
  flagsSchema: any; // zod schema
  run: (args: Args, ctx: Ctx) => Promise<{ code: number }>; // normalized
  preview?: (args: Args, ctx: Ctx) => string;
}

# === FILE: packages/cli-tui/src/commands/registry.ts ===
import { z } from 'zod';
import type { Command, Args, Ctx } from './types.js';
import {
  inventoryCommand,
  auditCommand,
  exportCommand,
  diagramsCommand,
  initCommand,
  initExistingCommand,
  watchCommand,
  agentCommand
} from '@flowlock/cli-headless/commands';

const wrap = (fn: (a: Args, c: Ctx)=>Promise<number>) =>
  async (args: Args, ctx: Ctx) => ({ code: await fn(args, ctx) });

export const commands: Command[] = [
  {
    id: 'help',
    title: 'Help (list commands)',
    category: 'Settings',
    flagsSchema: z.object({}),
    run: async (_args, ctx) => {
      const list = [
        'Available commands:',
        '/inventory',
        '/audit --level basic|enhanced|strict',
        '/export --format svg|csv|json|junit|all',
        '/diagrams --types er,flow',
        '/init', '/init-existing', '/watch', '/agent', '/settings'
      ];
      list.forEach(l => ctx.onLog(l));
      return { code: 0 } as any;
    }
  },
  {
    id: 'inventory',
    title: 'Inventory (scan project)',
    category: 'Inventory',
    summary: 'Detect DB/API/UI inventory from runtime & codebase',
    flagsSchema: z.object({ scope: z.string().default('all') }),
    run: wrap(inventoryCommand)
  },
  {
    id: 'audit',
    title: 'Audit (run checks)',
    category: 'Audit',
    flagsSchema: z.object({
      only: z.string().optional(), skip: z.string().optional(),
      level: z.enum(['basic','enhanced','strict']).default('enhanced')
    }),
    run: wrap(auditCommand)
  },
  {
    id: 'export',
    title: 'Export artifacts (svg,csv,junit,json)',
    category: 'Export',
    flagsSchema: z.object({ format: z.string().default('all') }),
    run: wrap(exportCommand)
  },
  {
    id: 'diagrams',
    title: 'Generate diagrams (Mermaid -> SVG)',
    category: 'Diagrams',
    flagsSchema: z.object({ types: z.string().default('er,flow') }),
    run: wrap(diagramsCommand)
  },
  { id: 'init', title: 'Init new project', category: 'Init', flagsSchema: z.object({}), run: wrap(initCommand) },
  { id: 'init-existing', title: 'Init existing project', category: 'Init', flagsSchema: z.object({}), run: wrap(initExistingCommand) },
  { id: 'watch', title: 'Watch & re-run on changes', category: 'Watch', flagsSchema: z.object({}), run: wrap(watchCommand) },
  { id: 'agent', title: 'Agent (connect to SaaS)', category: 'Agent', flagsSchema: z.object({}), run: wrap(agentCommand) },
  { id: 'settings', title: 'Open Settings view', category: 'Settings', flagsSchema: z.object({}), run: async (_a, ctx)=>{ ctx.onLog('Open Settings view'); return { code: 0 } as any; } },
];

# === FILE: packages/cli-tui/src/commands/parseSlash.ts ===
export function parseSlash(input: string): { cmd: string; flags: Record<string, any> } {
  const trimmed = input.trim().replace(/^\/+/, '');
  const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const cmd = (parts.shift() ?? '').toLowerCase();
  const flags: Record<string, any> = {};
  let k: string | null = null;
  for (const p of parts) {
    if (p.startsWith('--')) { k = p.slice(2); flags[k] = true; }
    else if (k) { flags[k] = p.replace(/^"|"$/g,''); k = null; }
  }
  for (const key of Object.keys(flags)) {
    const v = flags[key];
    if (typeof v === 'string' && v.includes(',')) flags[key] = v.split(',').map(s => s.trim()).filter(Boolean);
    if (v === 'true') flags[key] = true;
    if (v === 'false') flags[key] = false;
    const num = Number(v); if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(String(v))) flags[key] = num;
  }
  return { cmd, flags };
}

# === FILE: packages/cli-tui/src/util/store.ts ===
import { create } from 'zustand';
import type { Settings } from './settings.js';

interface Job { id: string; cmd: string; args: any; status: 'idle'|'running'|'done'|'error'; code?: number; }
interface Current { logs: string[]; artifacts: string[]; summary?: string; }
interface StoreState {
  paletteOpen: boolean;
  current: Current;
  history: Job[];
  filter: string;
  settings?: Settings;
  setSettings: (s: Settings)=>void;
  setPaletteOpen: (v: boolean)=>void;
  pushLog: (line: string)=>void;
  addArtifacts: (paths: string[])=>void;
  setFilter: (q: string)=>void;
  cycleFocus: ()=>void;
  cancelCurrent: ()=>Promise<void>;
}
export const useStore = create<StoreState>((set,get)=>({
  paletteOpen: false,
  current: { logs: [], artifacts: [] },
  history: [],
  filter: '',
  setSettings: (s)=>set({ settings: s }),
  setPaletteOpen: (v)=>set({ paletteOpen: v }),
  pushLog: (line)=>set(s=>({ current: { ...s.current, logs: [...s.current.logs, line] }})),
  addArtifacts: (paths)=>set(s=>({ current: { ...s.current, artifacts: [...new Set([...s.current.artifacts, ...paths])] }})),
  setFilter: (q)=>set({ filter: q }),
  cycleFocus: ()=>{},
  cancelCurrent: async ()=>{ /* hook up to AbortController in runCommandById if desired */ }
}));

# === FILE: packages/cli-tui/src/util/runCommand.ts ===
import { commands } from '../commands/registry.js';
import { useStore } from './store.js';
import { scanArtifacts } from './scanArtifacts.js';
import { timestamp } from './time.js';

export async function runCommandById(id: string, flags: Record<string, any>, pushLog?: (l:string)=>void) {
  const cmd = commands.find(c => c.id === id);
  const log = (line: string) => (pushLog ?? useStore.getState().pushLog)(`[${timestamp()}] ${line}`);
  if (!cmd) { log(`Unknown command: ${id}`); return; }
  const controller = new AbortController();
  const ctx = {
    cwd: process.cwd(),
    onLog: (line: string) => log(line),
    signal: controller.signal
  };
  log(`$ /${id} ${Object.entries(flags).map(([k,v])=>`--${k} ${Array.isArray(v)?v.join(','):v}`).join(' ')}`);
  try {
    const { code } = await cmd.run(flags, ctx);
    log(code === 0 ? '✔ Done' : `✖ Exit code ${code}`);
  } catch (err: any) {
    log(`✖ Error: ${err?.message ?? String(err)}`);
  }
  const newArtifacts = await scanArtifacts();
  useStore.getState().addArtifacts(newArtifacts);
}

# === FILE: packages/cli-tui/src/util/scanArtifacts.ts ===
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function scanArtifacts(dir = path.resolve(process.cwd(), 'artifacts')): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries.map(e => path.join(dir, e));
  } catch {
    return [];
  }
}

# === FILE: packages/cli-tui/src/util/settings.ts ===
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

export type Settings = { user?: any; workspace?: any };

const USER_STATE = path.join(os.homedir(), '.flowlock', 'state.json');
const WS_STATE = path.join(process.cwd(), '.flowlock', 'state.json');

async function readJson(file: string) { try { return JSON.parse(await fs.readFile(file,'utf8')); } catch { return {}; } }
async function writeJson(file: string, data: any) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

export async function loadSettings() {
  return { user: await readJson(USER_STATE), workspace: await readJson(WS_STATE) } as Settings;
}
export async function saveSettings(s: Settings) {
  await writeJson(USER_STATE, s.user ?? {});
  await writeJson(WS_STATE, s.workspace ?? {});
}

# === FILE: packages/cli-tui/src/util/time.ts ===
export function timestamp(d = new Date()) {
  const pad = (n:number)=>String(n).padStart(2,'0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

# === FILE: packages/cli-tui/tests/parseSlash.test.ts ===
import { describe, it, expect } from 'vitest';
import { parseSlash } from '../src/commands/parseSlash.js';

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
});

# === FILE: packages/cli-tui/README.md ===
# @flowlock/cli — FlowLock Persistent TUI

A Claude-style, persistent terminal UI for FlowLock. Launch with `flowlock`.

- Slash commands: `/inventory`, `/audit --level enhanced`, `/export --format svg`
- Command palette: `Ctrl+K`
- Artifacts viewer: list and open generated files from `./artifacts`
- Settings: persisted to `~/.flowlock/state.json` and `./.flowlock/state.json`

## Back-compat
- Non-TTY or `CI=true` → forwards to headless `uxcg`
- `--no-ui` forces headless path

## Dev
```
pnpm i
pnpm -r build
pnpm -w --filter @flowlock/cli dev
