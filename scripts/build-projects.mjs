import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function buildProjects(){
 for(const project of ['archer','wars'])await cp(`site/projects/${project}`,`dist/${project}`,{recursive:true});
 const manifest=JSON.parse(await readFile('site/projects/manifest.json','utf8'));
 let html=await readFile('site/projects/archer/index.html','utf8');
 const originalScript=html.match(/src="(\/archer\/static\/js\/[^"?]+\.js)"/)?.[1];
 if(!originalScript)throw new Error('Missing Archer application script');
 // The recovered bundle mixes root-relative links with /archer routes. Fix
 // generated badges/selectors as well as direct-entry pages at publication.
 const bundle=(await readFile(`site/projects${originalScript}`,'utf8'))
  .replace(/(["'])\/(episode|season|character)\//g,'$1/archer/$2/');
 const hash=createHash('sha256').update(bundle).digest('hex').slice(0,12);
 const script=originalScript.replace(/[^/]+$/,`main.${hash}.js`);
 await writeFile(`dist${originalScript}`,bundle);
 await writeFile(`dist${script}`,bundle);
 html=html.replaceAll(originalScript,script);
 await writeFile('dist/archer/index.html',html);
 for(const route of manifest.routes){
  const directory=`dist${route.replace(/\/$/,'')}`;
  if(directory==='dist/archer')continue;
  await mkdir(directory,{recursive:true});await writeFile(`${directory}/index.html`,html);
  // Recover bookmarks produced by the old links which omitted /archer.
  if(/^\/archer\/(episode|season)\//.test(route)){
   const legacy=`dist${route.replace(/^\/archer/,'').replace(/\/$/,'')}`;
   const target=route.replace(/\/$/,'')+'/';
   const redirect=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="https://elijahmeeks.com${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>Opening Archer</title><script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script></head><body><a href="${target}">Continue to Archer</a></body></html>`;
   await mkdir(legacy,{recursive:true});await writeFile(`${legacy}/index.html`,redirect);
  }
 }
 console.log(`Restored Archer, ${manifest.routes.length} direct routes, and Wars.`);
}
