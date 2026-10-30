import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import MarkdownIt from 'markdown-it';
import { buildWriting } from './build-writing.mjs';
const require = createRequire(import.meta.url);
const md = new MarkdownIt({ html: true, linkify: true });
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const projects = require('../src/js/constants/project-list.js');
const essays = require('../src/js/constants/essay-list.js');
const repos = require('../src/js/constants/repo-list.js');
const recoveredWriting = JSON.parse(await readFile('site/writing/entries.json', 'utf8'));
function recoveredLink(href) {
  try {
    const u = new URL(href);
    const match = recoveredWriting.find(r => r.body && (r.source.replace(/^https?:/, '').replace(/\/$/, '') === href.replace(/^https?:/, '').replace(/\/$/, '') || (u.hostname === 'dhs.stanford.edu' && r.id === `dhs-${decodeURIComponent(u.pathname.split('/').filter(Boolean).pop())}`)));
    return match ? `writing/${match.id}.html` : href;
  } catch { return href; }
}
await mkdir('dist', { recursive: true });
const urls = [];
function shell(title, body, prefix = '', path = '', description = 'Tools, writing, and explorations in data visualization, networks, and the digital humanities by Elijah Meeks.') {
  urls.push(path);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="https://elijahmeeks.com/${path}"><meta property="og:type" content="${(path.startsWith('archive/') || path.startsWith('writing/')) ? 'article' : 'website'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://elijahmeeks.com/${path}"><meta property="og:image" content="https://elijahmeeks.com/images/full/orbis.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${prefix}favicon.ico"><link rel="stylesheet" href="${prefix}style.css"></head><body><a class="skip" href="#main">Skip to content</a><div class="wrap"><header class="topbar"><a class="wordmark" href="${prefix || './'}">elijah meeks<span>.</span></a><nav aria-label="Main navigation"><a href="${prefix}index.html#work">Work</a><a href="${prefix}writing.html">Writing</a><a href="${prefix}index.html#about">About</a><a href="${prefix}index.html#contact">Contact ↗</a></nav></header><main id="main">${body}</main><footer class="footer"><span>Elijah Meeks · Data visualization & rhetoric</span><span>Information wants to be free, but also elegant.</span><a href="${prefix}archive.html">Archive ↗</a></footer></div>${path === '' ? '<script src="legacy-links.js"></script>' : ''}</body></html>`;
}
// An abstract illustration of network structure, not a quantitative chart.
const nodes = Array.from({ length: 62 }, (_, i) => {
  const angle = i * 2.39996;
  const radius = 25 + Math.sqrt(i / 61) * 170;
  return { x: 230 + Math.cos(angle) * radius, y: 230 + Math.sin(angle) * radius * .92, r: i % 13 === 0 ? 9 : i % 5 === 0 ? 5 : 3 };
});
const edges = nodes.flatMap((n, i) => nodes.slice(i + 1).filter(m => Math.hypot(m.x-n.x,m.y-n.y) < 84).map(m => `<path d="M${n.x},${n.y}L${m.x},${m.y}"/>`)).join('');
const network = `<svg viewBox="0 0 460 460" role="img" aria-label="Abstract network illustration of interconnected ideas"><circle cx="230" cy="230" r="205" fill="none" stroke="#d0d2c5" stroke-dasharray="2 7"/><g stroke="#79866b" stroke-opacity=".38" stroke-width=".7">${edges}</g>${nodes.map((n,i) => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${i%13===0?'#a83a24':i%5===0?'#465b41':'#f4f2ea'}" stroke="${i%13===0?'#a83a24':'#657458'}" stroke-width="1.2"/>`).join('')}<text x="15" y="35" fill="#656b5f" font-family="monospace" font-size="9">FIG. 01</text><path d="M230 8v12M230 440v12M8 230h12M440 230h12" stroke="#656b5f"/></svg>`;
const chart = `<svg viewBox="0 0 500 280" role="img" aria-label="Illustrative layered curves and data points"><g stroke="#8da28a" stroke-opacity=".22">${[50,100,150,200,250].map(y=>`<path d="M20 ${y}H480"/>`).join('')}</g>${['#a6b99a','#d8bd8b','#e5e8dc'].map((color,k)=>`<path d="M20 ${220-k*30}C90 ${250-k*30} 90 ${80+k*18} 160 ${130-k*30}S240 ${240-k*25} 300 ${130-k*18}S400 ${180-k*60} 480 ${40+k*30}" fill="none" stroke="${color}" stroke-width="${k===1?3:2}"/>`).join('')}<g fill="#e5e8dc">${[50,90,130,170,210,250,290,330,370,410,450].map((x,i)=>`<circle cx="${x}" cy="${110+Math.sin(i*1.7)*65}" r="3"/>`).join('')}</g><text x="20" y="278" fill="#b7c6b1" font-family="monospace" font-size="10" letter-spacing="3">SEMIOTIC / THE SHAPE OF DATA</text></svg>`;
let home = await readFile('site/home.html','utf8');
home = home.replace('{{NETWORK}}',network).replace('{{CHART}}',chart);
await writeFile('dist/index.html',shell('Elijah Meeks — Data visualization & rhetoric',home));
await copyFile('site/style.css','dist/style.css');
await copyFile('site/legacy-links.js','dist/legacy-links.js');
const lists = {};
for (const category of ['blog','project','workshops']) {
  lists[category] = [];
  await mkdir(`dist/archive/${category}`, { recursive: true });
  await mkdir(`dist/content/${category}`, { recursive: true });
  const files = (await readdir(`site/content/${category}`)).filter(f => f.endsWith('.md') && !f.includes(' copy')).sort().reverse();
  for (const file of files) {
    await copyFile(`site/content/${category}/${file}`, `dist/content/${category}/${file}`);
    let source = await readFile(`site/content/${category}/${file}`,'utf8');
    const title = source.match(/^#\s+(.+)/m)?.[1] || file;
    const slug = file.slice(0,-3);
    const date = category === 'blog' ? file.slice(0,10).replaceAll('_','-') : '';
    source = source.replace(/(?:https?:\/\/elijahmeeks\.com\/)?images\//g,'../../images/');
    const body = `<article class="prose"><a class="text-link" href="../../archive.html#${category === 'project' ? 'projects' : category}">← Back to the archive</a><p class="eyebrow" style="margin-top:35px">From the original site${date ? ` / ${date}` : ''}</p><p style="font-size:13px;color:var(--muted)">This archived piece preserves its original text and historical context.</p>${md.render(source)}</article>`;
    const path = `archive/${category}/${slug}.html`;
    await writeFile(`dist/${path}`,shell(`${title} — Elijah Meeks`,body,'../../',path));
    lists[category].push({title,path,date});
  }
}
const list = items => `<ul class="archive-list">${items.map(i=>`<li><a href="${esc(i.path)}">${esc(i.title)}</a>${i.date?`<small>${i.date}</small>`:''}</li>`).join('')}</ul>`;
let archive = '<div class="archive-header"><p class="eyebrow">Notes, experiments & earlier work</p><h1>The archive.</h1><p>Writing and projects from the original site, preserved with their historical context.</p><p><a href="#blog">Articles</a> · <a href="#projects">Projects</a> · <a href="#essays">Essays</a> · <a href="#code">Code</a> · <a href="#workshops">Workshops</a></p></div>';
archive += '<p><a class="text-link" href="writing.html">Browse the complete writing collection →</a></p>';
for (const [id,title,items] of [['blog','Articles',lists.blog],['projects','Projects',lists.project],['essays','Essays',essays.map(e=>({title:e.label,path:recoveredLink(e.link.replace('http://emeeks.github.io','https://emeeks.github.io'))}))],['code','Code & experiments',repos.flatMap(g=>g.repos.map(r=>({title:r.label,path:r.link})))],['workshops','Past workshops',lists.workshops]]) archive += `<section class="section" id="${id}"><h2>${title}</h2>${list(items)}</section>`;
await writeFile('dist/archive.html',shell('Archive — Elijah Meeks',archive,'','archive.html'));
await writeFile('dist/404.html',shell('Page not found — Elijah Meeks','<div class="archive-header"><p class="eyebrow">404</p><h1>A missing connection.</h1><p>This page could not be found. Visit the <a href="https://elijahmeeks.com/">homepage</a> or explore the <a href="https://elijahmeeks.com/archive.html">archive</a>.</p></div>','','404.html'));
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.filter(p=>p!=='404.html').map(p=>`<url><loc>https://elijahmeeks.com/${esc(p)}</loc></url>`).join('')}</urlset>`);
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: https://elijahmeeks.com/sitemap.xml\n');
await buildWriting(shell);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.filter(p=>p!=='404.html').map(p=>`<url><loc>https://elijahmeeks.com/${esc(p)}</loc></url>`).join('')}</urlset>`);
await writeFile('dist/.nojekyll','');
console.log(`Built homepage, archive, and ${Object.values(lists).flat().length} historical articles.`);
