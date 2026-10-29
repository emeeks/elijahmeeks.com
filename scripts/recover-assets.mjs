// One-time recovery of public assets omitted from the original repository.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const paths = new Set(['images/full/fish.png']);
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(path);
    else if (/\.(md|html|css)$/.test(path)) {
      const text = await readFile(path, 'utf8');
      for (const match of text.matchAll(/images\/[\w/.-]+\.(?:png|jpg|jpeg|gif)/g)) paths.add(match[0]);
    }
  }
}
await walk('dist');
for (const item of require('../src/js/constants/project-list.js')) paths.add(`images/thumbs/${item.image}`);
for (const group of require('../src/js/constants/repo-list.js')) for (const item of group.repos) paths.add(`images/full/${item.image}`);
const queue = [...paths];
let failures = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const path = queue.shift();
    try {
      const response = await fetch(`https://elijahmeeks.com/${path}`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`HTTP ${response.status}`);
      await mkdir(dirname(`dist/${path}`), { recursive: true });
      await writeFile(`dist/${path}`, Buffer.from(await response.arrayBuffer()));
      console.log(`Recovered ${path}`);
    } catch (error) { failures++; console.error(`${path}: ${error.message}`); }
  }
}));
console.log(`${paths.size - failures}/${paths.size} assets recovered`);
if (failures) process.exitCode = 1;
