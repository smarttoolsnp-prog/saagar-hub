#!/usr/bin/env node
/* Cache busting for local assets.
   Cloudflare Pages serves /assets/* with max-age=14400 (4 hours) and that
   platform default wins over _headers, so a changed app.js/site.css can stay
   invisible to returning visitors for hours. This rewrites every local
   css/js reference in every page to carry ?v=<content hash>.

   Idempotent: re-running replaces the previous ?v=… value.
   Run before deploying (see DEPLOY.md). */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, posix, sep } from 'node:path';
import { createHash } from 'node:crypto';

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

const hashCache = new Map();
function hashOf(abs) {
  if (!existsSync(abs)) return null;
  if (!hashCache.has(abs)) {
    hashCache.set(abs, createHash('sha1').update(readFileSync(abs)).digest('hex').slice(0, 8));
  }
  return hashCache.get(abs);
}

/* match  (optionally ../)assets/whatever.js|css  with an optional ?v=… already attached */
const REF = /(["'(])((?:\.\.\/)*assets\/[A-Za-z0-9._/-]+\.(?:js|css))(\?v=[0-9a-f]+)?(["')])/g;

let pages = 0, refs = 0, missing = 0;
for (const file of walk(ROOT)) {
  const dir = dirname(file);
  let changed = false;
  const html = readFileSync(file, 'utf8');
  const next = html.replace(REF, (m, q1, ref, _old, q2) => {
    const h = hashOf(join(dir, ref.split('/').join(sep)));
    if (!h) { missing++; return m; }
    refs++;
    changed = true;
    return q1 + ref + '?v=' + h + q2;
  });
  if (changed) { writeFileSync(file, next); pages++; }
}
console.log(`cache-busting: ${refs} reference(s) across ${pages} page(s)` + (missing ? `, ${missing} unresolved` : ''));
