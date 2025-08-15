import fs from 'node:fs';

function setDeep(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

if (process.argv.length < 5) {
  console.error('Usage: node tools/json-set.mjs <file> <dot.path> <jsonValue>');
  process.exit(1);
}
const [,, file, dotPath, raw] = process.argv;
const json = JSON.parse(fs.readFileSync(file, 'utf8'));
const value = JSON.parse(raw);
setDeep(json, dotPath, value);
fs.writeFileSync(file, JSON.stringify(json, null, 2));
console.log(`Set ${dotPath} in ${file}`);
