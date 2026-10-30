import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const errors = [];
let count = 0;
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { await check(file); continue; }
    if (!file.endsWith('.html')) continue;
    count++;
    const html = await readFile(file, 'utf8');
    if (!html.includes('name="viewport"')) errors.push(`${file}: missing viewport`);
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const target = match[1].split('#')[0].split('?')[0];
      if (!target || /^(?:https?:|mailto:|data:|\/\/)/.test(target)) continue;
      const path = target.startsWith('/')
        ? resolve('dist', '.' + decodeURIComponent(target))
        : resolve(dirname(file),decodeURIComponent(target));
      if (!path.startsWith(resolve('dist'))) { errors.push(`${file}: outside dist: ${target}`); continue; }
      try { await access(path); } catch { errors.push(`${file}: missing ${target}`); }
    }
  }
}
await check('dist');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Checked local links and assets in ${count} HTML pages.`);
