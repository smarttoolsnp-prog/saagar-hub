#!/usr/bin/env node
/* Injects the Google AdSense loader into the <head> of every HTML page.
   Idempotent: pages that already contain adsbygoogle are left untouched. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CLIENT = 'ca-pub-9617852445804852';
const SNIPPET =
  '<!-- Google AdSense -->\n' +
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}"\n` +
  '     crossorigin="anonymous"></script>\n';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === '.wrangler' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

let changed = 0, skipped = 0;
for (const file of walk(ROOT)) {
  const html = readFileSync(file, 'utf8');
  if (html.includes('adsbygoogle')) { skipped++; continue; }
  const idx = html.search(/<\/head>/i);
  if (idx === -1) { console.log('NO </head>: ' + relative(ROOT, file)); continue; }
  const next = html.slice(0, idx) + SNIPPET + html.slice(idx);
  writeFileSync(file, next);
  changed++;
}
console.log(`AdSense injected: ${changed} page(s), already present: ${skipped}`);
