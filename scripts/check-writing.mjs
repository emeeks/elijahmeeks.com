import {readFile} from 'node:fs/promises';
import * as cheerio from 'cheerio';
const entries=JSON.parse(await readFile('site/writing/entries.json','utf8'));
const ids=new Set(),errors=[];
for(const r of entries){
 if(ids.has(r.id))errors.push(`Duplicate writing ID: ${r.id}`);ids.add(r.id);
 if(!r.title||!r.author||!r.venue||!r.source)errors.push(`${r.id}: missing attribution`);
 if(r.date&&!/^\d{4}(?:-\d{2}-\d{2})?$/.test(r.date))errors.push(`${r.id}: invalid publication date`);
 if(r.format==='full'&&!r.body)errors.push(`${r.id}: full-text entry has no body`);
 if(r.venue==='Nightingale'&&(r.body||!r.description))errors.push(`${r.id}: Nightingale entries must be blurbs and links`);
 if(!r.body)continue;
 const $=cheerio.load(r.body,null,false);
 if($('script,iframe,object,embed,form,style').length)errors.push(`${r.id}: active third-party content`);
 $('*').each((_,e)=>{for(const [name,value] of Object.entries(e.attribs||{}))if(/^on/i.test(name)||(['href','src'].includes(name)&&/^\s*(?:javascript|vbscript|data):/i.test(value)))errors.push(`${r.id}: unsafe attribute ${name}`);});
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`Verified attribution, dates, formats, and safe article HTML for ${entries.length} writing entries.`);
