import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function buildWriting(shell){
  const entries=JSON.parse(await readFile('site/writing/entries.json','utf8'));
  const recovery=JSON.parse(await readFile('site/writing/recovery.json','utf8'));
  await mkdir('dist/writing',{recursive:true});
  for(const r of entries.filter(r=>r.body)){
    const path=`writing/${r.id}.html`;
    const words=r.body.replace(/<[^>]*>/g,' ').split(/\s+/).length;
    const when=r.date?`${r.date} · `:'';
    const source=`<a href="${esc(r.source)}">Original publication ↗</a>${r.archive?` · <a href="${esc(r.archive)}">Archived source ↗</a>`:''}${r.sourceCode?` · <a href="${esc(r.sourceCode)}">Stanford source ↗</a>`:''}${r.syndicatedSource?` · <a href="${esc(r.syndicatedSource)}">Preserved author blog ↗</a>`:''}${r.licenseUrl?` · <a href="${esc(r.licenseUrl)}">${esc(r.license)}</a>`:''}`;
    const body=`<article class="prose writing-prose"><a class="text-link" href="../writing.html">← All writing</a><p class="eyebrow article-meta">${esc(r.venue)} · ${when}${Math.max(1,Math.ceil(words/220))} min read</p><h1>${esc(r.title)}</h1><p class="article-author">${esc(r.author)}</p><p class="publication-note">Originally published at <a href="${esc(r.source)}">${esc(r.venue)}</a>. This edition preserves the original text and historical context.</p><div class="article-body">${r.body}</div><aside class="article-sources"><p class="eyebrow">Publication & preservation</p><p>${source}</p>${r.embeddedMedia?'<p>Interactive examples and embedded media are linked to their original sources.</p>':''}</aside><a class="text-link" href="../writing.html">← Browse more writing</a></article>`;
    await writeFile(`dist/${path}`,shell(`${r.title} — Elijah Meeks`,body,'../',path,r.description));
  }
  const original=[];
  for(const file of (await readdir('site/content/blog')).filter(f=>f.endsWith('.md')&&!f.includes(' copy')&&!f.includes('2015_06_09'))){
    const text=await readFile(`site/content/blog/${file}`,'utf8');
    original.push({id:file,title:text.match(/^#\s+(.+)/m)?.[1]||file,date:file.slice(0,10).replaceAll('_','-'),author:'Elijah Meeks',venue:'elijahmeeks.com',format:'full',local:`archive/blog/${file.slice(0,-3)}.html`,description:'From the original personal-site archive.'});
  }
  const all=[...entries,...original].sort((a,b)=>(b.date||'0000').localeCompare(a.date||'0000')||a.title.localeCompare(b.title));
  const venues=[...new Set(all.map(r=>r.venue))].sort();
  const full=all.filter(r=>r.body||r.local).length;
  const options=venues.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  const cards=all.map(r=>`<li class="writing-item" data-venue="${esc(r.venue)}" data-format="${r.body||r.local?'full':'link'}"><div class="writing-date">${esc(r.date||'Undated')}<span>${r.body||r.local?'Read here':'Read elsewhere ↗'}</span></div><div><p class="eyebrow">${esc(r.venue)}${r.kind==='Research page'?' · Research page':''}</p><h2><a href="${esc(r.local||(r.body?`writing/${r.id}.html`:r.source))}">${esc(r.title)}</a></h2><p class="writing-description">${esc(r.description)}</p>${r.author&&r.author!=='Elijah Meeks'?`<p class="writing-byline">${esc(r.author)}</p>`:''}</div></li>`).join('');
  const body=`<header class="archive-header writing-header"><p class="eyebrow">Essays, experiments & ideas</p><h1>Writing.</h1><p class="writing-intro">On data visualization, digital humanities, design, and the ways we make meaning from data.</p><p class="collection-count">${all.length} entries · ${full} available to read here · ${all.length-full} publication links</p></header><section aria-label="Browse writing"><form class="writing-filters" role="search"><label>Search the collection<input id="writing-search" type="search" placeholder="Networks, color, humanities…" autocomplete="off"></label><label>Publication<select id="writing-venue"><option value="">All publications</option>${options}</select></label><label>Availability<select id="writing-format"><option value="">All writing</option><option value="full">Read here</option><option value="link">Publication links</option></select></label></form><p id="writing-status" class="writing-status" role="status" aria-live="polite">All entries, newest first.</p><ol class="writing-list">${cards}</ol><p id="writing-empty" hidden>No writing matches these filters. Try a different term or publication.</p><div class="writing-pagination" hidden><button id="writing-prev" type="button">← Previous</button><span id="writing-page"></span><button id="writing-next" type="button">Next →</button></div><noscript><p>All entries are shown. Your browser’s Find command can search this page.</p></noscript></section><section class="section writing-books"><p class="eyebrow">Books</p><h2>D3.js in Action</h2><p>Practical guides to building interactive data visualization for the web.</p><p><a href="https://www.manning.com/books/d3js-in-action">First edition (2015)</a> · <a href="https://www.manning.com/books/d3js-in-action-second-edition">Second edition (2017)</a> · <a href="https://www.manning.com/books/d3js-in-action-third-edition">Third edition (2024), with Anne-Marie Dufour</a></p><p>Also: <a href="https://www.goodreads.com/book/show/6354603-son-of-the-great-river">Son of the Great River (2009)</a>.</p></section><script src="writing-search.js" defer></script>`;
  await writeFile('dist/writing.html',shell('Writing — Elijah Meeks',body,'','writing.html','Collected essays by Elijah Meeks on data visualization, digital humanities, design, networks, and AI.'));
  // A portable catalog and preservation record accompany the rendered collection.
  await writeFile('dist/writing/catalog.json',JSON.stringify(all.map(({body,contentHash,...r})=>r),null,2));
  await writeFile('dist/writing/recovery.json',JSON.stringify(recovery,null,2));
  await writeFile('dist/writing-search.js',await readFile('site/writing-search.js','utf8'));
  console.log(`Writing: ${all.length} entries, ${full} local texts, ${all.length-full} publication links.`);
}
