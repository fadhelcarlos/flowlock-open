import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { satisfies } from 'semver';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

const nodeVersion = process.versions.node;
const pnpmVersion = execSync('pnpm -v').toString().trim();

let ok = true;
if (!satisfies(nodeVersion, pkg.engines.node)) {
  console.error(`Node.js ${nodeVersion} does not satisfy required range ${pkg.engines.node}`);
  ok = false;
}
if (!satisfies(pnpmVersion, pkg.engines.pnpm)) {
  console.error(`pnpm ${pnpmVersion} does not satisfy required range ${pkg.engines.pnpm}`);
  ok = false;
}
if (!ok) {
  process.exit(1);
} else {
  console.log(`Node.js ${nodeVersion} and pnpm ${pnpmVersion} satisfy engines`);
}

