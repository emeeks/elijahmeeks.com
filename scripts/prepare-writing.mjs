import {readFile,writeFile,mkdir,readdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as cheerio from 'cheerio';
import MarkdownIt from 'markdown-it';
import {fetchCached,pool} from './collect-writing.mjs';
const md=new MarkdownIt({html:true});
const cache='.cache/writing';
await mkdir('site/writing',{recursive:true});await mkdir('dist/images/writing',{recursive:true});
const entries=[],excluded=[],unresolved=[],assets=new Map();
const digest=s=>createHash('sha256').update(s).digest('hex');
const plain=s=>cheerio.load(s).text().replace(/\s+/g,' ').trim();
const key=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const date=s=>s&&!isNaN(Date.parse(s))?new Date(s).toISOString().slice(0,10):'';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allowed=new Set('p h2 h3 h4 h5 h6 ul ol li blockquote pre code strong em b i a img figure figcaption hr br table thead tbody tfoot tr td th dl dt dd sup sub s small del ins span div time'.split(' '));
function absolute(value,source){try{return new URL(value.trim(),source).href;}catch{return '';}}
function normalize(html,record){
  const $=cheerio.load(html,null,false);
  $('script,style,noscript,form,button,input,select,textarea,svg,link,meta,.sharedaddy,.postArticle-readMore,.js-postShareWidget,img.progressiveMedia-thumbnail').remove();
  $('iframe,object,embed').each((_,e)=>{const href=absolute($(e).attr('src')||$(e).attr('data')||'',record.source);$(e).replaceWith(href?`<p><a href="${esc(href)}">View original embedded media</a></p>`:'');record.embeddedMedia=true;});
  $('h1').each((_,e)=>{if(key($(e).text())===key(record.title))$(e).remove();else e.tagName='h2';});
  const first=$('h2,h3').first();if(key(first.text())===key(record.title))first.remove();
  $('*').each((_,e)=>{
    const el=$(e);if(!allowed.has(e.tagName)){el.replaceWith(el.contents());return;}
    if(e.tagName==='img'){
      const src=el.attr('data-src')||el.attr('src');if(!src?.trim()){el.remove();return;}el.attr('src',src);
    }
    for(const attr of Object.keys(e.attribs||{}))if(!['href','src','alt','title','id','colspan','rowspan','scope','start','datetime'].includes(attr))el.removeAttr(attr);
    if(el.attr('href')){
      const raw=el.attr('href');const href=raw.startsWith('#')?raw:absolute(raw,record.source);
      if(!/^(https?:|mailto:|#)/i.test(href))el.removeAttr('href');else el.attr('href',href);
    }
    if(e.tagName==='img'){
      const src=absolute(el.attr('src')||'',record.source);
      if(!/^https?:/.test(src)||/medium\.com\/_\/stat|counters\.gigya|tracking|gravatar|doubleclick/.test(src)){el.remove();return;}
      if(!assets.has(src))assets.set(src,{source:src,archive:record.archive||'',articles:[]});
      assets.get(src).articles.push(record.id);
      el.attr('src',src).attr('alt',el.attr('alt')||el.attr('title')||'Figure from the original article');
    }
  });
  $('p').each((_,e)=>{if(!$(e).text().trim()&&!$(e).find('img,br').length)$(e).remove();});
  const paragraphs=$('p').toArray().map(e=>$(e).text().replace(/\s+/g,' ').trim()).filter(p=>p.length>55&&!/Continue reading|originally appeared/.test(p));
  record.description=record.description||((paragraphs[0]||$.text().trim()).slice(0,240).replace(/\s+\S*$/,'')+'…');
  record.body=$.html();record.contentHash=digest(record.body);return record;
}
const dhs=JSON.parse(await readFile(`${cache}/dhs-results.json`,'utf8'));
const seen=new Set();
for(const r of dhs){
  if(r.errors){unresolved.push(r);continue;}
  const $=cheerio.load(await readFile(`${cache}/${r.cache}`,'utf8'));
  const classes=$('body').attr('class')||'';
  const identity=classes.match(/(?:postid|page-id)-(\d+)/)?.[1]||key(r.title);
  if(seen.has(identity)){excluded.push({source:r.source,reason:'Alternate URL for the same WordPress post/page'});continue;}seen.add(identity);
  if(['about','tools','project-gallery','digital-humanities-at-stanford','dhstanford-gallery'].includes(r.slug)){excluded.push({source:r.source,reason:'Site biography or navigation/resource index, not an individual piece of writing'});continue;}
  if(r.author&&!r.author.includes('Elijah Meeks')){excluded.push({source:r.source,reason:`Other author: ${r.author}`});continue;}
  const record={id:`dhs-${r.slug}`,title:r.title,date:date(r.date),author:r.author||'Elijah Meeks',venue:'Digital Humanities Specialist',source:r.source,archive:r.archive,kind:classes.includes('single')?'Essay':'Research page',format:'full',recoveredFrom:'Internet Archive Wayback Machine'};
  entries.push(normalize($('.entry-content, .node .content').first().html()||'',record));
}
const stanford=JSON.parse(await readFile(`${cache}/stanford-matches.json`,'utf8'));
for(const r of stanford){
  const text=await readFile(`${cache}/stanford-${r.path.split('/').pop()}`,'utf8');
  const front=text.match(/^---\n([\s\S]*?)\n---/)[1];
  const slug=r.path.split('/').pop().slice(0,-3);
  const title=front.match(/^title:\s*["']?(.+?)["']?$/m)[1];
  const record={id:`stanford-${slug}`,title,date:front.match(/^date:\s*(\S+)/m)?.[1]||'',author:'Elijah Meeks',venue:'Digital Humanities @ Stanford',source:`https://digitalhumanities.stanford.edu/${slug}/`,sourceCode:`https://github.com/dh-stanford/dh-stanford.github.io/blob/main/${r.path}`,kind:'Essay',format:'full',recoveredFrom:'Stanford public source repository'};
  const body=text.replace(/^---\n[\s\S]*?\n---/,'');
  entries.push(normalize(md.render(body),record));
}
const medium=JSON.parse(await readFile(`${cache}/medium-results.json`,'utf8'));
// The author's personal blog is independently linked by their Goodreads profile.
let personal=[];try{personal=JSON.parse(await readFile(`${cache}/sevenlions-results.json`,'utf8'));}catch{}
const personalTitles=new Set();
for(const r of personal){
 if(r.error){if(!/wp-login|xmlrpc/.test(r.source))unresolved.push(r);continue;}
 const $=cheerio.load(await readFile(`${cache}/${r.cache}`,'utf8'));
 const metadata=$('.post small').text();
 const published=metadata.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}/)?.[0]?.replace(/(\d)(st|nd|rd|th)/,'$1');
 const slug=new URL(r.source).pathname.split('/').filter(Boolean).pop();
 const record={id:`sevenlions-${slug}`,title:r.title,date:date(published||r.date),author:'Elijah Meeks',venue:'SevenLions',source:r.source,archive:r.archive,kind:'Personal writing',format:'full',recoveredFrom:'Internet Archive; authorship corroborated by Goodreads author profile'};
 const content=$('.entry-content,.post .entry,.post .post-content,.post .content').first();content.find('.postmetadata,.feedback').remove();
 entries.push(normalize(content.html()||'',record));personalTitles.add(key(r.title));
}
let goodreads=[];try{goodreads=JSON.parse(await readFile(`${cache}/goodreads-index.json`,'utf8'));}catch{}
for(const r of goodreads){
 if(personalTitles.has(key(r.title)))continue;
 const slug=new URL(r.syndicatedSource).pathname.split('/').filter(Boolean).pop();
 const record={id:`sevenlions-${slug}`,title:r.title,date:date(r.date),author:'Elijah Meeks',venue:'SevenLions',source:r.source||r.syndicatedSource,syndicatedSource:r.syndicatedSource,kind:'Personal writing',format:r.full?'full':'link',recoveredFrom:'Public Goodreads author blog'};
 normalize(r.body||r.preview,record);if(!r.full){delete record.body;record.source=r.syndicatedSource;record.note='Only an index excerpt was recovered.';}
 entries.push(record);personalTitles.add(key(r.title));
}
const feeds=JSON.parse(await readFile(`${cache}/medium-feed-entries.json`,'utf8'));
const feedMap=new Map(feeds.map(r=>[r.id,r]));
const nightingaleIds=new Set(feeds.filter(r=>/\/(?:nightingale|data-visualization-society)\//.test(r.source)).map(r=>r.id));
nightingaleIds.add('824c5dc84967');
const mediumSeen=new Set();
for(const r of medium){
  if(r.errors){excluded.push({source:r.source,reason:'Unrecoverable article or short response; checked against historical feed'});continue;}
  const $=cheerio.load(await readFile(`${cache}/${r.cache}`,'utf8'));
  if(!$('h1,.graf--title').length){excluded.push({source:r.source,reason:'Medium conversation response, not an essay'});continue;}
  mediumSeen.add(r.id);
  const feed=feedMap.get(r.id);
  let content=$('.postArticle-content').first();
  if(!content.length){const sections=$('article section').toArray().sort((a,b)=>$(b).text().length-$(a).text().length);content=sections.length?$(sections[0]):$('article').first();}
  let body=content.html()||'';
  if(feed?.body&&plain(feed.body).length>plain(body).length*.8)body=feed.body;
  // Keep member-only previews as links; do not label an excerpt as a full essay.
  const partial=/Member.only story/i.test(content.text())&&plain(body).length<2500;
  const isNightingale=nightingaleIds.has(r.id);
  const source=isNightingale?`https://medium.com/nightingale/${(feed?.source||r.source).split('/').pop()}`:(feed?.source||r.canonical||r.source);
  const record={id:`medium-${r.id}`,title:plain(r.title),date:feed?.date||date(r.date),author:r.author||'Elijah Meeks',venue:isNightingale?'Nightingale':source.includes('/noteableio/')?'Noteable on Medium':source.includes('/confluent/')?'Confluent on Medium':source.includes('blog.nteract.io')?'nteract':source.includes('towardsdatascience')?'Towards Data Science':'Medium',source,archive:r.archive,kind:'Essay',format:isNightingale||partial?'link':'full',recoveredFrom:'Internet Archive and public author RSS'};
  normalize(body,record);
  if(record.format==='link'){delete record.body;if(partial)record.note='Only a member-only preview was publicly recoverable.';}
  entries.push(record);
}
for(const feed of feeds){
  if(mediumSeen.has(feed.id))continue;
  if(plain(feed.body).split(/\s+/).length<200&&!nightingaleIds.has(feed.id)){excluded.push({source:feed.source,reason:'Short Medium response, not an essay'});continue;}
  const ng=nightingaleIds.has(feed.id);
  const source=ng?feed.source.replace('/data-visualization-society/','/nightingale/'):feed.source;
  const record={id:`medium-${feed.id}`,title:feed.title,date:feed.date,author:feed.author,venue:ng?'Nightingale':source.includes('/noteableio/')?'Noteable on Medium':source.includes('/confluent/')?'Confluent on Medium':source.includes('blog.nteract.io')?'nteract':source.includes('towardsdatascience')?'Towards Data Science':'Medium',source,archive:feed.archive,kind:'Essay',format:ng?'link':'full',recoveredFrom:'Public author RSS / historical RSS snapshot'};
  normalize(feed.body,record);if(ng)delete record.body;entries.push(record);
}
const blurbs={
  'behind-the-scenes-semiotic-3-with-real-time-streaming-data':'How AI collaboration and a focus on real-time data shaped the third major version of Semiotic.',
  'fourth-wave-democratization':'With Amanda Makulec: how a shared visual language and more accessible tools can broaden participation in data visualization.',
  'fourth-wave-a-changing-world':'With Amanda Makulec: the expanding public role of charts, and what comes after the third wave of data visualization.',
  'this-map-helps-fascists':'An argument about map projections, political framing, and why the apparent size of a country is a misleading guide to its importance.',
  '7537f62f1452':'Exploring the branching structure of a Twitter choose-your-own-adventure through a network visualization of Beyoncé’s assistant’s choices.',
  '68c83084cb1a':'An exploration of how visualization and distant reading can reveal structures and meanings that conventional reading may miss.',
  '73d1dee66e9f':'Why members embraced personalized data badges, and what a playful Easter-egg variation reveals about identity and visual encoding.',
  'd13d42ab0bec':'With Amy Cesal and Mollie Pettit: the founding vision for a professional community spanning data, visualization, and society.',
  '516ed0826f3a':'Introducing Nightingale as the journal of the Data Visualization Society and explaining the publication’s name and ambitions.',
  '334d3523073f':'An introduction to findings from the 2019 annual survey of the data visualization community.',
  'd97685856ec':'A reflection on the year data visualization reached broader audiences and became a more visible part of public life.',
  '4f2d5c841d47':'Funnels as both a visualization technique and an online experience, with a focus on the tension between precision and accuracy.',
  '824c5dc84967':'The Tapestry keynote essay on the convergence of visualization tools, audiences, and modes of expression.',
  'ba7ad96102d6':'Romanian translation of the founding introduction to the Data Visualization Society.',
  '9100c1536919':'Spanish translation of the founding introduction to the Data Visualization Society.'
};
for(const r of JSON.parse(await readFile(`${cache}/nightingale-index.json`,'utf8'))){
  const slug=r.url.split('/').filter(Boolean).pop();
  entries.push({id:`nightingale-${slug}`,title:r.title,date:r.date,author:r.author.replace(/^by\s+/,''),venue:'Nightingale',source:r.url,kind:'Essay',format:'link',description:blurbs[slug],recoveredFrom:'Publisher author archive and article metadata'});
}
for(const r of entries.filter(r=>r.venue==='Nightingale')){
  const id=r.id.replace('medium-','');r.description=blurbs[id]||r.description;
  if(id==='d13d42ab0bec')r.author='Elijah Meeks, Amy Cesal & Mollie Pettit';
}
// Journal author index includes revised and coauthored scholarly versions.
const journal=[
  ['1-1/conversations/digital-humanities-as-thunderdome-by-elijah-meeks','Digital Humanities as Thunderdome','Elijah Meeks','2012','A revised journal version of the essay on tools, interpretive authority, and the relationship between humanists and software developers.'],
  ['1-3/modeling-networks-and-scholarship-with-orbis-by-elijah-meeks-and-karl-grossner','Modeling Networks and Scholarship with ORBIS','Elijah Meeks & Karl Grossner','2012','How ORBIS models function as scholarly arguments, teaching resources, and interactive publications.'],
  ['1-3/orbis-an-interactive-scholarly-work-on-the-roman-world-by-elijah-meeks-and-karl-grossner','ORBIS: An Interactive Scholarly Work on the Roman World','Elijah Meeks & Karl Grossner','2012','Introducing ORBIS as a hybrid of historical archive, transportation model, visualization tool, and scholarly argument.'],
  ['2-1/dh-contribution-to-topic-modeling','The Digital Humanities Contribution to Topic Modeling','Elijah Meeks & Scott B. Weingart','2013','An introduction to the interpretive and methodological contributions of humanities scholarship to topic modeling.']
];
for(const [path,title,author,year,description] of journal){
 const source=`https://journalofdigitalhumanities.org/${path}/`;
 const record={id:`journal-${path.split('/').pop()}`,title,date:year,author,venue:'Journal of Digital Humanities',source,kind:'Journal article',format:'link',description,recoveredFrom:'Journal author index and article byline'};
 try{
  const $=cheerio.load(await fetchCached(source));
  const content=$('.entry-content, .post-content, #article').first();
  if(content.length&&content.text().length>300){content.find('.author-bio,.author-description,.about-author').remove();content.children('h4').first().remove();record.format='full';normalize(content.html(),record);record.license='Creative Commons Attribution 3.0 Unported';record.licenseUrl='https://creativecommons.org/licenses/by/3.0/';}
 }catch(e){unresolved.push({source,reason:e.message});}
 entries.push(record);
}
// Recover the original four-part Gestalt series from the author's public pages.
for(let i=1;i<=4;i++){
 const source=`https://emeeks.github.io/gestaltdataviz/section${i}.html`;
 try{const $=cheerio.load(await fetchCached(source));const title=$('#subtitle').text().trim()||$('h1').first().text().trim();const content=$('.container, #container').first();
 if(!title||!content.length)throw Error('Unexpected article structure');
 content.find('nav,header,footer,.navbar,script,style').remove();
 const record={id:`gestalt-${i}`,title:`Gestalt Data Visualization, Part ${i}: ${title}`,date:'',author:'Elijah Meeks',venue:'Gestalt Data Visualization',source,kind:'Essay',format:'full',embeddedMedia:true,recoveredFrom:'Author GitHub Pages'};entries.push(normalize(content.html(),record));
 }catch(e){unresolved.push({source,reason:e.message});}
}
const unique=new Map();for(const r of entries){if(!unique.has(r.id)||r.body?.length>unique.get(r.id).body?.length)unique.set(r.id,r);}
const final=[...unique.values()];
const assetResults=[];
const fullIds=new Set(final.filter(r=>r.body).map(r=>r.id));
const relevantAssets=[...assets.values()].filter(a=>a.articles.some(id=>fullIds.has(id)));
console.log('Writing entries',final.length,'full text',final.filter(r=>r.body).length,'figures to recover',relevantAssets.length);
let prior=[];try{prior=JSON.parse(await readFile(`${cache}/assets.json`,'utf8'));}catch{}
const previous=new Map(prior.filter(a=>a.local).map(a=>[a.source,a]));
await pool(relevantAssets,5,async asset=>{
 if(previous.has(asset.source)){try{await access(`dist/${previous.get(asset.source).local}`);assetResults.push({...asset,...previous.get(asset.source)});return;}catch{}}
 const stamp=asset.archive.match(/\/web\/(\d+)/)?.[1]||'20241029000000';
 const archived=`https://web.archive.org/web/${stamp}id_/${asset.source}`;
 const choices=(asset.source.includes('dhs.stanford.edu')||asset.source.includes('sevenlions.org'))?[archived]:[asset.source,archived];
 for(const url of choices){try{
   const res=await fetch(url,{signal:AbortSignal.timeout(30000)});const type=res.headers.get('content-type')||'';
   if(!res.ok||!type.startsWith('image/'))throw Error(`HTTP ${res.status}, ${type}`);
   const bytes=Buffer.from(await res.arrayBuffer());if(bytes.length>25*1024*1024)throw Error('Image exceeds 25 MiB');
   const ext=type.includes('jpeg')?'jpg':type.includes('gif')?'gif':type.includes('webp')?'webp':type.includes('svg')?'svg':'png';
   const local=`images/writing/${digest(asset.source).slice(0,24)}.${ext}`;
   await writeFile(`dist/${local}`,bytes);assetResults.push({...asset,local,retrievedFrom:url,sha256:digest(bytes)});return;
 }catch(e){asset.error=e.message;}}
 assetResults.push({...asset,archived});
});
await writeFile(`${cache}/assets.json`,JSON.stringify(assetResults,null,2));
const assetMap=new Map(assetResults.map(a=>[a.source,a]));
const urlKey=url=>{const u=new URL(url);return u.host.replace(/^www\./,'').toLowerCase()+u.pathname.replace(/\/$/,'');};
const pathMap=new Map();for(const r of final.filter(r=>r.body))for(const url of [r.source,...dhs.filter(d=>`dhs-${d.slug}`===r.id).map(d=>d.source)])pathMap.set(urlKey(url),r.id);
for(const r of final.filter(r=>r.body)){
 const $=cheerio.load(r.body,null,false);
 $('img').each((_,e)=>{const img=$(e);const a=assetMap.get(img.attr('src'));if(a?.local)img.attr('src',`../${a.local}`).attr('loading','lazy');else{r.missingFigures=(r.missingFigures||0)+1;img.replaceWith(`<figure class="missing-figure"><p>${esc(img.attr('alt')||'Original figure')}</p><a href="${esc(a?.archived||img.attr('src'))}">View figure at its original source ↗</a></figure>`);}});
 $('a[href]').each((_,e)=>{const el=$(e),href=el.attr('href');if(href.startsWith('#')||href.startsWith('mailto:'))return;try{const u=new URL(href);const id=pathMap.get(urlKey(href));if(id)el.attr('href',`${id}.html${u.hash}`);else if(u.hostname==='dhs.stanford.edu'||u.hostname.endsWith('sevenlions.org'))el.attr('href',`https://web.archive.org/web/${r.archive?.match(/\/web\/(\d+)/)?.[1]||'20241029000000'}/${href}`);}catch{}});
 r.body=$.html();
}
await writeFile('site/writing/entries.json',JSON.stringify(final,null,2)+'\n');
await writeFile('site/writing/recovery.json',JSON.stringify({recoveredAt:new Date().toISOString(),sources:{dhs:'Wayback CDX index, 719 distinct indexed URLs',stanford:'Public dh-stanford/dh-stanford.github.io source; all 144 top-level Markdown files checked',medium:'Individual-page CDX index, historical RSS captures, and current author feed',nightingale:'Publisher author archive; current and former Medium publication',journal:'Journal author archive',sevenlions:'Wayback CDX index, cross-checked against the Goodreads author blog'},entries:final.length,fullText:final.filter(r=>r.body).length,linkEntries:final.filter(r=>!r.body).length,figuresRecovered:assetResults.filter(a=>a.local).length,figuresUnavailable:assetResults.filter(a=>!a.local),excluded,unresolved,limits:['This inventory covers the enumerated public indexes and snapshots, not a guaranteed complete bibliography.','Medium responses are excluded from the reading collection. Member-only previews are never labeled as full text.','Old interactive embeds are retained as links; third-party scripts are removed.','Journal revisions, translations, and republished versions retain separate provenance.']},null,2)+'\n');
console.log('Prepared writing collection. Figures recovered',assetResults.filter(a=>a.local).length,'unavailable',assetResults.filter(a=>!a.local).length);
