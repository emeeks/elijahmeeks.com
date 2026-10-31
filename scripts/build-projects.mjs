import {cp,mkdir,readFile,writeFile,rm,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';

export async function buildProjects(){
 const source=resolve(process.env.ARCHER_BUILD_DIRECTORY || 'site/projects/archer');
 let info;
 try {
  info=JSON.parse(await readFile(join(source,'build-info.json'),'utf8'));
 } catch {
  throw new Error(`Missing current Archer build at ${source}. Run npm run sync:archer, or set ARCHER_BUILD_DIRECTORY to a tested build directory.`);
 }
 if(info.basePath!=='/archer' || !info.commit || !Array.isArray(info.routes))throw new Error('Archer build metadata must describe a current /archer build.');
 for(const route of info.routes){
  if(!route.startsWith('/archer/') || route.includes('..'))throw new Error(`Invalid Archer route: ${route}`);
  await access(join(source,route.slice('/archer/'.length),'index.html'));
 }
 await rm('dist/archer',{recursive:true,force:true});
 await cp(source,'dist/archer',{recursive:true});
 await cp('site/projects/wars','dist/wars',{recursive:true});
 // Preserve bookmarks produced by the old application, which omitted /archer.
 for(const route of info.routes){
  if(!/^\/archer\/(episode|season|character)\//.test(route))continue;
  const legacy=`dist${route.replace(/^\/archer/,'').replace(/\/$/,'')}`;
  const target=route.replace(/\/$/,'')+'/';
  const redirect=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="https://elijahmeeks.com${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>Opening Archer</title><script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script></head><body><a href="${target}">Continue to Archer</a></body></html>`;
  await mkdir(legacy,{recursive:true});await writeFile(`${legacy}/index.html`,redirect);
 }
 console.log(`Published Archer source ${info.commit.slice(0,12)}, ${info.routes.length} direct routes, and Wars.`);
}
