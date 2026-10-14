/* Removes intro paragraphs from <section class="phero"> on every page and
   unifies <meta name="theme-color">. Run: node build/strip-intros.mjs */
import fs from 'node:fs';
import path from 'node:path';

const roots = ['.', 'tools', 'games'];
const files = [];
for (const r of roots) {
  for (const f of fs.readdirSync(r)) {
    if (f.endsWith('.html')) files.push(r === '.' ? f : path.join(r, f));
  }
}

let touched = 0, pRemoved = 0;
for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const before = html;

  html = html.replace(/<section[^>]*class="[^"]*phero[^"]*"[^>]*>([\s\S]*?)<\/section>/g, (m, inner) => {
    const cleaned = inner.replace(/<p\b[\s\S]*?<\/p>\s*/g, () => { pRemoved++; return ''; });
    return m.replace(inner, cleaned);
  });

  html = html.replace(/<meta name="theme-color" content="[^"]*">/g, '<meta name="theme-color" content="#1e1b4b">');

  if (html !== before) { fs.writeFileSync(f, html); touched++; }
}
console.log(`files changed: ${touched}   intro paragraphs removed: ${pRemoved}`);
