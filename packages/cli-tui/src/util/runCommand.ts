import { commands } from '../commands/registry';
import { useStore } from './store';
import { scanArtifacts } from './scanArtifacts';
import { timestamp } from './time';

export async function runCommandById(
  id: string, 
  flags: Record<string, any>, 
  pushLog?: (l: string) => void
) {
  const cmd = commands.find(c => c.id === id);
  const log = (line: string) => (pushLog ?? useStore.getState().pushLog)(
    `[${timestamp()}] ${line}`
  );
  
  if (!cmd) { 
    log(`Unknown command: ${id}`); 
    return; 
  }
  
  const controller = new AbortController();
  const ctx = {
    cwd: process.cwd(),
    onLog: (line: string) => log(line),
    signal: controller.signal
  };
  
  log(`$ /${id} ${Object.entries(flags)
    .map(([k,v]) => `--${k} ${Array.isArray(v) ? v.join(',') : v}`)
    .join(' ')}`);
  
  try {
    const { code } = await cmd.run(flags, ctx);
    log(code === 0 ? '✔ Done' : `✖ Exit code ${code}`);
  } catch (err: any) {
    log(`✖ Error: ${err?.message ?? String(err)}`);
  }
  
  const newArtifacts = await scanArtifacts();
  useStore.getState().addArtifacts(newArtifacts);
}