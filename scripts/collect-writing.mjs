// Public-source acquisition. Cached responses make recovery resumable.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
const root = '.cache/writing';
await mkdir(root, {recursive:true});
const hash = s => createHash('sha256').update(s).digest('hex').slice(0,20);
export async function fetchCached(url, name = hash(url)) {
  const path = `${root}/${name}`;
  try { return await readFile(path,'utf8'); } catch {}
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const res = await fetch(url,{signal:AbortSignal.timeout(45000)});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      if(body.includes('Rate limit reached')) throw new Error('Archive rate limit');
      await writeFile(path,body); return body;
    } catch(error) { if(attempt===2) throw error; await new Promise(r=>setTimeout(r,1500*(attempt+1))); }
  }
}
export async function pool(items, limit, fn) {
  let next=0,done=0;
  await Promise.all(Array.from({length:limit},async()=>{while(next<items.length){const item=items[next++];await fn(item);done++;if(done%20===0)console.log(`Processed ${done}/${items.length}`);}}));
}
if(process.argv.includes('--stanford')) {
  const tree=JSON.parse(await fetchCached('https://api.github.com/repos/dh-stanford/dh-stanford.github.io/git/trees/main?recursive=1','stanford-tree.json'));
  const files=tree.tree.filter(x=>/^src\/[^/]+\.md$/.test(x.path));
  const found=[];
  await pool(files,5,async item=>{
    const text=await fetchCached(`https://raw.githubusercontent.com/dh-stanford/dh-stanford.github.io/main/${encodeURI(item.path)}`,`stanford-${item.path.split('/').pop()}`);
    if(/(?:author|authors):[^\n]*(?:Elijah|[Ee]meeks|[Mm]eeks)/.test(text))found.push({path:item.path,preview:text.slice(0,650)});
  });
  await writeFile(`${root}/stanford-matches.json`,JSON.stringify(found,null,2));console.log('Stanford author matches',found.length);console.log(found.slice(0,3));
}
if(process.argv.includes('--dhs')) {
  const cdx=JSON.parse(await fetchCached('https://web.archive.org/cdx/search/cdx?url=dhs.stanford.edu%2F*&output=json&filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey','dhs-cdx-source.json')).slice(1);
  await writeFile(`${root}/dhs-cdx.json`,JSON.stringify(cdx));
  const groups=new Map();
  for(const row of cdx) {
    const url=new URL(row[2]);const path=url.pathname;
    if(url.search||/^\/$/.test(path)||/(\/feed(?:\/|$)|\/comments?(?:\/|$)|\/page\/|\/wp-|\/category\/|\/tag\/|\/author\/|\/trackback|\/\d{4}\/|\.html?$|\.php$|\/attachment\/)/.test(path))continue;
    const slug=decodeURIComponent(path.split('/').filter(Boolean).pop());
    if(!slug||['networks','dh','images','files','tools'].includes(slug)&&path.split('/').filter(Boolean).length===1)continue;
    if(!groups.has(slug))groups.set(slug,[]);groups.get(slug).push(row);
  }
  const results=[];
  console.log('DHS candidate articles/pages',groups.size);
  await pool([...groups],3,async([slug,rows])=>{
    rows.sort((a,b)=>Number(b[6])-Number(a[6]));
    const errors=[];
    for(const row of rows) {
      const archive=`https://web.archive.org/web/${row[1]}id_/${row[2]}`;
      try {
        const html=await fetchCached(archive,`dhs-${hash(slug)}.html`);
        const $=cheerio.load(html);
        const title=$('.entry-title, h1.title').first().text().trim()||$('h1').first().text().trim();
        const content=$('.entry-content, .node .content').first();
        if(!title||(!content.text().trim()&&!content.find('img').length))throw new Error('No full article found');
        results.push({slug,source:row[2],archive:archive.replace('id_/','/'),cache:`dhs-${hash(slug)}.html`,title,author:$('.author.vcard').first().text().trim(),date:$('.entry-date').first().text().trim(),length:content.text().length});
        return;
      }catch(e){errors.push(`${archive}: ${e.message}`);}
    }
    results.push({slug,source:rows[0][2],errors});
  });
  await writeFile(`${root}/dhs-results.json`,JSON.stringify(results,null,2));
  console.log('DHS recovered',results.filter(x=>!x.errors).length,'unrecovered',results.filter(x=>x.errors).length);
}
if(process.argv.includes('--nightingale')) {
  let next='https://nightingaledvs.com/author/elijah_meeks/'; const posts=new Map();
  while(next){
    const $=cheerio.load(await fetchCached(next));
    $('.c-card').each((_,e)=>{const title=$(e).find('.c-card__title').first().text().trim();const url=$(e).find('a[href]').first().attr('href');if(url&&title)posts.set(url,{url,title});});
    next=$('a.next.page-numbers').attr('href');
  }
  await pool([...posts.values()],3,async p=>{
    const $=cheerio.load(await fetchCached(p.url));
    p.title=$('h1.entry-title').first().text().trim()||p.title;
    p.date=$('time').first().attr('datetime')?.slice(0,10)||$('meta[property="article:published_time"]').attr('content')?.slice(0,10)||'';
    p.author=$('.entry-header .author, .entry-header .byline').first().text().trim();
    p.description=$('meta[property="og:description"]').attr('content')||$('meta[name="description"]').attr('content')||$('.entry-content p').first().text();
    p.text=$('.entry-content').first().text().trim().slice(0,1200);
  });
  await writeFile(`${root}/nightingale-index.json`,JSON.stringify([...posts.values()],null,2));console.log('Nightingale entries',posts.size);
}
if(process.argv.includes('--medium')) {
  const groups=JSON.parse(await readFile(`${root}/medium-groups.json`,'utf8'));
  const results=[];
  await pool(groups,3,async([id,rows])=>{
    rows.sort((a,b)=>Number(b[6])-Number(a[6]));
    const errors=[];
    for(const row of rows) {
      const archive=`https://web.archive.org/web/${row[1]}id_/${row[2]}`;
      try {
        const html=await fetchCached(archive,`medium-${id}.html`);
        const $=cheerio.load(html);
        const title=$('h1').first().text().trim()||$('meta[property="og:title"]').attr('content');
        const body=$('.postArticle-content, section[data-field="body"]').first();
        const modern=$('article').first();
        const content=body.length?body:modern;
        if(!title||!content.length||content.text().length<200)throw new Error('No recoverable article body');
        results.push({id,title,source:row[2],archive:archive.replace('id_/','/'),cache:`medium-${id}.html`,canonical:$('link[rel="canonical"]').attr('href'),date:$('meta[property="article:published_time"]').attr('content')||$('time').first().attr('datetime')||'',author:$('meta[name="author"]').attr('content')||'',selector:body.length?'.postArticle-content, section[data-field="body"]':'article',length:content.text().length});
        return;
      }catch(e){errors.push(`${archive}: ${e.message}`);}
    }
    results.push({id,source:rows[0][2],errors});
  });
  await writeFile(`${root}/medium-results.json`,JSON.stringify(results,null,2));
  console.log('Medium recovered',results.filter(x=>!x.errors).length,'unrecovered',results.filter(x=>x.errors).length);
}
if(process.argv.includes('--feeds')) {
  const query='https://web.archive.org/cdx/search/cdx?url=medium.com%2Ffeed%2F%40Elijah_Meeks&output=json&filter=statuscode:200&collapse=timestamp:6';
  const cdx=JSON.parse(process.argv.includes('--all-feeds')?await readFile(`${root}/medium-feed-all-cdx.json`,'utf8'):await fetchCached(query,'medium-feed-cdx.json')).slice(1);
  const entries=new Map();
  const add=(xml,archive)=>{
    const $=cheerio.load(xml,{xmlMode:true});
    $('item').each((_,e)=>{
      const item=$(e);const source=item.find('link').text().split('?')[0];
      const id=source.match(/-([a-f\d]{8,16})$/)?.[1];if(!id)return;
      const content=item.find('content\\:encoded').text();
      const record={id,source,title:item.find('title').text(),author:item.find('dc\\:creator').text(),date:new Date(item.find('pubDate').text()).toISOString().slice(0,10),body:content,archive};
      if(!entries.has(id)||content.length>entries.get(id).body.length)entries.set(id,record);
    });
  };
  add(await fetchCached('https://medium.com/feed/@Elijah_Meeks','medium-current-feed.xml'),'');
  console.log('Historical Medium feed snapshots',cdx.length);
  await pool(cdx,3,async row=>{
    const url=`https://web.archive.org/web/${row[1]}id_/${row[2]}`;
    try {add(await fetchCached(url),url.replace('id_/','/'));}catch(e){console.log('Feed unavailable',row[1],e.message);}
  });
  await writeFile(`${root}/medium-feed-entries.json`,JSON.stringify([...entries.values()],null,2));console.log('Medium feed unique posts',entries.size);
}
if(process.argv.includes('--sevenlions')) {
 const cdx=JSON.parse(await readFile(`${root}/sevenlions-cdx.json`,'utf8')).slice(1);
 const candidates=cdx.filter(r=>{const u=new URL(r[1]);const p=u.pathname.split('/').filter(Boolean);return !u.search&&p.length===2&&p[0]==='wp'&&!/^\d+$/.test(p[1])&&!['feed','page','about','category','tag'].includes(p[1]);});
 const results=[];
 console.log('SevenLions candidate posts',candidates.length);
 await pool(candidates,3,async row=>{
  const archive=`https://web.archive.org/web/${row[0]}id_/${row[1]}`;
  try{
   const cache=`sevenlions-${hash(row[1])}.html`;const $=cheerio.load(await fetchCached(archive,cache));
   const title=$('.entry-title,.post-title,.post h2,.post h1').first().text().trim();
   const content=$('.entry-content,.post .entry,.post .post-content,.post .content').first();
   if(!title||!content.length)throw Error('Unrecognized article structure');
   results.push({title,source:row[1],archive:archive.replace('id_/','/'),cache,date:$('time').first().attr('datetime')||$('.entry-date,.date,.postdate,.post-date').first().text().trim(),length:content.text().length});
  }catch(e){results.push({source:row[1],archive,error:e.message});}
 });
 await writeFile(`${root}/sevenlions-results.json`,JSON.stringify(results,null,2));console.log('SevenLions recovered',results.filter(r=>!r.error).length,'unresolved',results.filter(r=>r.error).length);
}
if(process.argv.includes('--goodreads')){
 const results=[];
 await pool(Array.from({length:11},(_,i)=>i+1),3,async page=>{
  const url=`https://www.goodreads.com/author/show/2881435.Elijah_Meeks/blog?page=${page}`;
  const $=cheerio.load(await fetchCached(url));
  $('.authorBlogPost').each((_,e)=>{const el=$(e);const link=el.find('h4 a').first();const title=link.text().trim();if(!title)return;
   const source=el.find('a[href*="sevenlions.org"]').filter((i,a)=>$(a).text().includes('View more')).first().attr('href');
   const record={title,source,syndicatedSource:new URL(link.attr('href'),'https://www.goodreads.com').href,date:el.text().match(/Published on\s+(.+?)(?:\n|$)/)?.[1]?.trim(),preview:el.find('.body').html()||''};
   results.push(record);
  });
 });
 const unique=[...new Map(results.map(r=>[r.syndicatedSource,r])).values()];
 const archived=JSON.parse(await readFile(`${root}/sevenlions-results.json`,'utf8'));
 const known=new Set(archived.filter(r=>!r.error).map(r=>r.title.toLowerCase().replace(/[^a-z0-9]/g,'')));
 const missing=unique.filter(r=>!known.has(r.title.toLowerCase().replace(/[^a-z0-9]/g,'')));
 await pool(missing,3,async r=>{
  try{const $=cheerio.load(await fetchCached(r.syndicatedSource));const content=$('.authorBlogPost .body').first();if(content.length){r.body=content.html();r.full=true;}}
  catch(e){r.error=e.message;}
 });
 await writeFile(`${root}/goodreads-index.json`,JSON.stringify(unique,null,2));console.log('Goodreads indexed',unique.length,'additional full posts',missing.filter(r=>r.full).length,'additional previews',missing.filter(r=>!r.full).length);
}
