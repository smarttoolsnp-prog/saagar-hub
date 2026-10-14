#!/usr/bin/env node
/* Rebuilds sitemap.xml from the real page set.
   Excludes: 404.html (error page) and any page carrying noindex. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BASE = 'https://sagardahal123.com.np/';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', '.wrangler', 'node_modules'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const rank = (rel) => {
  if (rel === 'index.html') return ['1.0', 'weekly'];
  if (['games.html', 'tools.html', 'skills.html', 'law.html'].includes(rel)) return ['0.9', 'weekly'];
  if (rel.startsWith('games/')) return ['0.8', 'monthly'];
  if (rel.startsWith('tools/')) return ['0.7', 'monthly'];
  if (['about.html', 'contact.html', 'rules.html', 'report.html'].includes(rel)) return ['0.4', 'monthly'];
  return ['0.3', 'monthly'];
};

const urls = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === '404.html') continue;
  const html = readFileSync(file, 'utf8');
  if (/name="robots"[^>]*content="[^"]*noindex/i.test(html)) continue;
  const [priority, changefreq] = rank(rel);
  urls.push({ loc: BASE + rel, changefreq, priority });
}
urls.sort((a, b) => (a.loc === BASE + 'index.html' ? -1 : b.loc === BASE + 'index.html' ? 1 : 0));

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n') +
  '\n</urlset>\n';
writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml written with ${urls.length} URLs`);
