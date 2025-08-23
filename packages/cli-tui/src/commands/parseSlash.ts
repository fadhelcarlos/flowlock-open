export function parseSlash(input: string): { cmd: string; flags: Record<string, any> } {
  const trimmed = input.trim().replace(/^\/+/, '');
  const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const cmd = (parts.shift() ?? '').toLowerCase();
  const flags: Record<string, any> = {};
  const quoted: Record<string, boolean> = {};
  let k: string | null = null;
  
  for (const p of parts) {
    if (p.startsWith('--')) { 
      k = p.slice(2); 
      flags[k] = true; 
    } else if (k) {
      const isQuoted = /^".*"$/.test(p);
      flags[k] = p.replace(/^"|"$/g,'');
      quoted[k] = isQuoted;
      k = null;
    }
  }

  for (const key of Object.keys(flags)) {
    const v = flags[key];
    if (typeof v === 'string') {
      if (!quoted[key] && v.includes(',')) {
        flags[key] = v.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        flags[key] = v;
      }
      if (v === 'true') flags[key] = true;
      if (v === 'false') flags[key] = false;
      const num = Number(v);
      if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(String(v))) {
        flags[key] = num;
      }
    }
  }
  
  return { cmd, flags };
}