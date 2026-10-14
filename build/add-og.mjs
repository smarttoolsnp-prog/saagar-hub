#!/usr/bin/env node
/* Adds Open Graph + Twitter preview metadata to every page, derived from that
   page's own <title>, meta description and canonical URL, so room links and
   shared pages get a real preview card.  Idempotent. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SITE = 'https://sagardahal123.com.np/';
const IMG = SITE + 'assets/og.png';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', '.wrangler', 'node_modules'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const attr = (html, re) => { const m = html.match(re); return m ? m[1].trim() : ''; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let changed = 0, skipped = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/');
  let html = readFileSync(file, 'utf8');
  if (html.includes('property="og:title"')) { skipped++; continue; }
  /* the 404 page should not advertise itself as shareable content */
  if (rel === '404.html') { skipped++; continue; }

  const title = attr(html, /<title>([\s\S]*?)<\/title>/i) || 'SAAGAR';
  const desc = attr(html, /<meta name="description" content="([^"]*)"/i) ||
    'Free Nepali games, everyday tools, skills guides and plain-language Nepal law explainers.';
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/i) || (SITE + rel);
  const isArticle = false;

  const tags = [
    `<meta property="og:type" content="${isArticle ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="SAAGAR">`,
    `<meta property="og:locale" content="en_NP">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${IMG}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="SAAGAR — games, tools, skills and Nepal laws">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${IMG}">`
  ].join('\n') + '\n';

  const idx = html.search(/<\/head>/i);
  if (idx === -1) { console.log('no </head>: ' + rel); continue; }
  html = html.slice(0, idx) + '<!-- social preview -->\n' + tags + html.slice(idx);
  writeFileSync(file, html);
  changed++;
}
console.log(`og/twitter tags added: ${changed} page(s), already present: ${skipped}`);
