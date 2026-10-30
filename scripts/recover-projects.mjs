// One-time recovery from the former origin. Normal builds use checked-in files.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir,cp,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import * as cheerio from 'cheerio';
const run=promisify(execFile),root='site/projects';
const records=[],queue=[],seen=new Set();
await mkdir(root,{recursive:true});
function add(path){path=new URL(path,'https://elijahmeeks.com').pathname;if(!/^\/(archer|wars)\//.test(path)||seen.has(path))return;seen.add(path);queue.push(path);}
async function recover(path,target=path.replace(/^\//,'')){
 const out=`${root}/${target.endsWith('/')?target+'index.html':target}`;
 let bytes;
 try{bytes=await readFile(out);}catch{
  const result=await run('curl',['--max-time','30','--fail','--silent','--show-error','--resolve','elijahmeeks.com:443:162.241.24.62',`https://elijahmeeks.com${path}`],{encoding:'buffer',maxBuffer:30*1024*1024});bytes=result.stdout;
  await mkdir(dirname(out),{recursive:true});await writeFile(out,bytes);
 }
 records.push({source:`https://elijahmeeks.com${path}`,file:out.replace(`${root}/`,''),sha256:createHash('sha256').update(bytes).digest('hex')});
 return bytes.toString('utf8');
}
for(const project of ['archer','wars']){
 const html=await recover(`/${project}/`);const $=cheerio.load(html);
 $('script[src],link[href]').each((_,e)=>{const raw=$(e).attr('src')||$(e).attr('href');const u=new URL(raw,`https://elijahmeeks.com/${project}/`);if(u.hostname==='elijahmeeks.com')add(u.pathname);});
 for(const match of html.matchAll(/d3\.(?:csv|json|text)\("([^"]+)"/g))add(new URL(match[1],`https://elijahmeeks.com/${project}/`).pathname);
}
let done=0;
// Each batch may discover further JS/media/font dependencies.
while(queue.length){
 const batch=queue.splice(0,6);
 await Promise.all(batch.map(async path=>{
  const text=await recover(path);
  if(path.endsWith('.js'))for(const match of text.matchAll(/archer\/static\/media\/[^"'\s]+/g))add('/'+match[0]);
  if(path.endsWith('.css'))for(const match of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)){
   if(!match[1].startsWith('data:'))add(new URL(match[1],`https://elijahmeeks.com${path}`).pathname);
  }
  done++;if(done%20===0)console.log('Recovered project files',done);
 }));
}
let warCard=false;
try{await recover('/networkviz/images/war_card.png','wars/war_card.png');warCard=true;}
catch{console.log('Original Wars social thumbnail is unavailable; removing its obsolete reference.');}
// The local Archer repository retains the complete original GIF corpus.
const assets=resolve('../archervisualization/assets');await access(assets);
await cp(assets,`${root}/archer/assets`,{recursive:true});
const archer=cheerio.load(await readFile(`${root}/archer/index.html`,'utf8'));
archer('script[src],link[href]').each((_,e)=>{
 const el=archer(e),attr=el.attr('src')?'src':'href';const raw=el.attr(attr);
 if(raw&&!/^https?:|^\/\//.test(raw))el.attr(attr,new URL(raw,'https://elijahmeeks.com/archer/').pathname);
});
archer('meta[content*="archervisualization-assets"]').attr('content','https://elijahmeeks.com/archer/assets/btt_twitter.png');
await writeFile(`${root}/archer/index.html`,archer.html());
const bundlePath=`${root}/archer/static/js/main.9640d98f.js`;
let bundle=await readFile(bundlePath,'utf8');
bundle=bundle.replaceAll('https://elijahmeeks.com/archer/assets/','/archer/assets/');
await writeFile(bundlePath,bundle);
const wars=cheerio.load(await readFile(`${root}/wars/index.html`,'utf8'));
wars('head').append('<meta name="viewport" content="width=device-width, initial-scale=1">');
if(warCard)wars('meta[name="twitter:image:src"]').attr('content','https://elijahmeeks.com/wars/war_card.png');
else wars('meta[name="twitter:image:src"]').remove();
wars('script').each((_,e)=>{if(wars(e).text().includes('_setAccount'))wars(e).remove();});
wars('a[href="http://elijahmeeks.com/"]').attr('href','https://elijahmeeks.com/');
await writeFile(`${root}/wars/index.html`,wars.html());
const episodes=[...bundle.matchAll(/archer\/static\/media\/([\w-]+)\.[a-f\d]+\.txt/g)].map(m=>m[1]);
const fixed=[...bundle.matchAll(/path:\s*"(\/archer\/[^"*:]+)"/g)].map(m=>m[1]);
const general=await readFile('../archervisualization/src/constants/general.js','utf8');
const characters=[...general.match(/characterImageHash\s*=\s*\{([\s\S]*?)\n\}/)[1].matchAll(/^\s*(\w+):/gm)].map(m=>m[1]);
const routes=[...new Set([...fixed,...episodes.map(e=>`/archer/episode/${e}`),...Array.from({length:8},(_,i)=>`/archer/season/${i+1}`),...characters.map(c=>`/archer/character/${c}`)])];
await writeFile(`${root}/manifest.json`,JSON.stringify({recoveredAt:new Date().toISOString(),origin:'Bluehost origin 162.241.24.62, accessed with the original hostname',archerAssets:'emeeks/archervisualization assets directory; source commit b716670cc137e96c552c022ac172f6704eb1b863',routes,files:records,changes:['Preserved the original deployed Archer application and episode data.','Changed GIF URLs to use the restored /archer/assets directory.','Made Archer entry asset URLs absolute so deep links work.',warCard?'Added a viewport declaration and restored social image for Wars.':'Added a viewport declaration and removed the unavailable Wars social thumbnail reference.','Removed the retired Universal Analytics tracker from Wars.']},null,2)+'\n');
console.log(`Recovered ${records.length} project files, GIF corpus, and ${routes.length} Archer routes.`);
