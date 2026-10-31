import {execFileSync} from 'node:child_process';
import {cp,readFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';

// Publish the compiled app, not private source or credentials, into this public repo.
const source=resolve(process.env.ARCHER_SOURCE_DIRECTORY || '../archervisualization');
const run=args=>execFileSync(args[0],args.slice(1),{cwd:source,stdio:'inherit'});
const dirty=execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:source,encoding:'utf8'}).trim();
if(dirty)throw new Error('Commit Archer source changes before exporting a release so build-info.json identifies the exact version.');
run(['npm','ci']);
run(['npm','run','check']);
run(['node','node_modules/@playwright/test/cli.js','install','chromium']);
run(['npm','run','test:e2e']);
const info=JSON.parse(await readFile(resolve(source,'build/build-info.json'),'utf8'));
if(info.basePath!=='/archer')throw new Error('Archer must be built for /archer.');
await rm('site/projects/archer',{recursive:true,force:true});
await cp(resolve(source,'build'),'site/projects/archer',{recursive:true});
console.log(`Exported tested Archer release ${info.commit}. Run npm run build && npm run check, then commit and push this repository.`);
