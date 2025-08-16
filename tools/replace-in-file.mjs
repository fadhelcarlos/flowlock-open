import fs from 'node:fs';

if (process.argv.length < 5) {
  console.error('Usage: node tools/replace-in-file.mjs <file> <from> <to>');
  process.exit(1);
}
const [,, file, from, to] = process.argv;
const src = fs.readFileSync(file, 'utf8');
const out = src.split(from).join(to);
fs.writeFileSync(file, out);
console.log(`Replaced all occurrences of "${from}" -> "${to}" in ${file}`);
