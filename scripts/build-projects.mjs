import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
export async function buildProjects(){
 for(const project of ['archer','wars'])await cp(`site/projects/${project}`,`dist/${project}`,{recursive:true});
 const manifest=JSON.parse(await readFile('site/projects/manifest.json','utf8'));
 const html=await readFile('site/projects/archer/index.html','utf8');
 for(const route of manifest.routes){
  const directory=`dist${route.replace(/\/$/,'')}`;
  if(directory==='dist/archer')continue;
  await mkdir(directory,{recursive:true});await writeFile(`${directory}/index.html`,html);
 }
 console.log(`Restored Archer, ${manifest.routes.length} direct routes, and Wars.`);
}
