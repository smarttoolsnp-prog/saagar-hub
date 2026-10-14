#!/usr/bin/env node
/* Injects the shared settings engine + mascot into every HTML page.
   Idempotent. Uses the right relative path for sub-directory pages. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', '.wrangler', 'node_modules'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

let changed = 0, skipped = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const depth = rel.split(sep).length - 1;
  const up = '../'.repeat(depth);
  const tag = `<!-- SAAGAR shell: sound, settings (theme/size/lite/lang), clay mascot -->\n` +
    `<script src="${up}assets/sound.js"></script>\n` +
    `<script src="${up}assets/settings.js"></script>\n` +
    `<script src="${up}assets/mascot.js"></script>\n`;
  const html = readFileSync(file, 'utf8');
  if (html.includes('assets/settings.js')) {
    /* pages already carry the shell — slot sound.js in front of settings.js.
       The src may carry a ?v=<hash> cache-buster, so tolerate that. */
    if (html.includes('assets/sound.js')) { skipped++; continue; }
    const patched = html.replace(
      /(<script src="[^"]*assets\/settings\.js(?:\?v=[0-9a-f]+)?"><\/script>)/,
      `<script src="${up}assets/sound.js"></script>\n$1`);
    if (patched === html) { console.log('no settings.js tag found: ' + rel); continue; }
    writeFileSync(file, patched);
    changed++;
    continue;
  }
  const idx = html.search(/<\/body>/i);
  if (idx === -1) { console.log('no </body>: ' + rel); continue; }
  writeFileSync(file, html.slice(0, idx) + tag + html.slice(idx));
  changed++;
}
console.log(`shell injected: ${changed} page(s), already present: ${skipped}`);
