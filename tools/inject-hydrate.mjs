import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "packages", "runner", "src", "index.ts");
let s = fs.readFileSync(file, "utf8");

const needle = "const spec = parseSpec(json);";
const hydrate = `const spec = parseSpec(json);
// Passthrough: keep non-canonical fields so checks can see them
try {
  if (Array.isArray(json?.roles)) (spec as any).roles = json.roles;
  if (json?.jtbd) (spec as any).jtbd = json.jtbd;

  const rawScreens = Array.isArray(json?.screens) ? json.screens : [];
  if (Array.isArray((spec as any).screens)) {
    for (const s of (spec as any).screens as any[]) {
      const raw = rawScreens.find((r:any) => r && r.id === s.id) || {};
      if (Array.isArray(raw.roles) && !s.roles) (s as any).roles = raw.roles;
      if (Array.isArray(raw.uiStates) && !s.uiStates) (s as any).uiStates = raw.uiStates;
    }
  }
} catch { /* no-op */ }`;

if (!s.includes(hydrate)) {
  s = s.replace(needle, hydrate);
  fs.writeFileSync(file, s, "utf8");
  console.log("Injected hydration block into runner/src/index.ts");
} else {
  console.log("Hydration block already present.");
}
