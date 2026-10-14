#!/usr/bin/env node
/* AdSense review prep, idempotent:
   1. add <meta name="google-adsense-account" content="ca-pub-…"> to every page
   2. remove the AdSense loader from 404.html (policy: no ads on error pages) */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CLIENT = 'ca-pub-9617852445804852';
const META = `<meta name="google-adsense-account" content="${CLIENT}">\n`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', '.wrangler', 'node_modules'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

let meta = 0, stripped = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/');
  let html = readFileSync(file, 'utf8');
  const before = html;

  /* 1. meta */
  if (!html.includes('google-adsense-account')) {
    const idx = html.search(/<\/head>/i);
    if (idx !== -1) { html = html.slice(0, idx) + META + html.slice(idx); meta++; }
  }

  /* 2. no ad loader on the error page */
  if (rel === '404.html' && html.includes('adsbygoogle')) {
    html = html.replace(
      /<!-- Google AdSense -->\n<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"]+"\n\s*crossorigin="anonymous"><\/script>\n/,
      '<!-- no AdSense on the 404 page: ads are not allowed on error pages -->\n'
    );
    stripped++;
  }

  if (html !== before) writeFileSync(file, html);
}
console.log(`adsense meta added: ${meta} page(s); loader removed from: ${stripped} page(s)`);
