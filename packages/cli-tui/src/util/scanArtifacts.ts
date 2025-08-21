import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function scanArtifacts(
  dir = path.resolve(process.cwd(), 'artifacts')
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries.map(e => path.join(dir, e));
  } catch {
    return [];
  }
}