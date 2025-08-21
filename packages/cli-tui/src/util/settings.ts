import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

export type Settings = { 
  user?: any; 
  workspace?: any 
};

const USER_STATE = path.join(os.homedir(), '.flowlock', 'state.json');
const WS_STATE = path.join(process.cwd(), '.flowlock', 'state.json');

async function readJson(file: string) { 
  try { 
    return JSON.parse(await fs.readFile(file, 'utf8')); 
  } catch { 
    return {}; 
  } 
}

async function writeJson(file: string, data: any) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

export async function loadSettings() {
  return { 
    user: await readJson(USER_STATE), 
    workspace: await readJson(WS_STATE) 
  } as Settings;
}

export async function saveSettings(s: Settings) {
  await writeJson(USER_STATE, s.user ?? {});
  await writeJson(WS_STATE, s.workspace ?? {});
}