/* ===========================================================
   SAAGAR site audit — static checks over every page.
   Run:  node build/audit.mjs
   =========================================================== */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SKIP_DIRS = new Set(['.git', '.wrangler', 'node_modules', 'build']);

const problems = [];
const note = (file, level, msg) => problems.push({ file, level, msg });

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const all = walk(ROOT);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

/* ---------------------------------------------------------------
   1. per-page checks
   --------------------------------------------------------------- */
const linked = new Set();          /* every local path referenced by any page */
const idIndex = new Map();         /* file -> Set(ids) */

for (const f of htmlFiles) {
  const r = rel(f);
  const src = fs.readFileSync(f, 'utf8');
  const dir = path.dirname(f);

  /* --- metadata --- */
  if (!/<title>[^<]{3,}<\/title>/i.test(src)) note(r, 'warn', 'no <title>');
  if (!/name="viewport"/i.test(src)) note(r, 'error', 'no viewport meta');
  if (!/name="description"/i.test(src)) note(r, 'warn', 'no meta description');
  if (!/rel="icon"/i.test(src)) note(r, 'warn', 'no favicon link');

  /* --- shared shell --- */
  const isPartial = /<body[^>]*data-page="(home|games|tools)?"/.test(src) && /id="hdr"/.test(src);
  if (/<body/.test(src) && !/id="hdr"/.test(src)) note(r, 'error', 'missing <div id="hdr">');
  if (/<body/.test(src) && !/id="ftr"/.test(src)) note(r, 'error', 'missing <div id="ftr">');
  if (/<body/.test(src) && !/assets\/app\.js/.test(src)) note(r, 'error', 'missing assets/app.js');
  if (/<body/.test(src) && !/assets\/site\.css/.test(src)) note(r, 'error', 'missing assets/site.css');
  void isPartial;

  /* strip script + style bodies so JS string concatenation is not mistaken for markup */
  const markupOnly = src
    .replace(/<script[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style[\s\S]*?<\/style>/gi, '<style></style>');

  /* --- duplicate ids --- */
  const ids = new Set();
  const dupes = new Set();
  for (const m of markupOnly.matchAll(/\sid="([^"]+)"/g)) {
    if (ids.has(m[1])) dupes.add(m[1]);
    ids.add(m[1]);
  }
  idIndex.set(r, ids);
  if (dupes.size) note(r, 'error', 'duplicate id(s): ' + [...dupes].join(', '));

  /* --- local links & assets --- */
  for (const m of markupOnly.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const v = m[1].trim();
    if (!v || /^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(v)) continue;
    const clean = v.split('#')[0].split('?')[0];
    if (!clean) continue;
    linked.add(clean.startsWith('/') ? clean.slice(1) : path.relative(ROOT, path.join(dir, clean)).split(path.sep).join('/'));
    const target = clean.startsWith('/') ? path.join(ROOT, clean.slice(1)) : path.join(dir, clean);
    if (!exists(target)) note(r, 'error', 'broken reference → ' + v);
  }

  /* --- inline script syntax --- */
  let i = 0;
  for (const m of src.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type=["']application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
    i++;
    try { new Function(m[1]); } catch (e) { note(r, 'error', `inline script #${i} syntax: ${e.message}`); }
  }

  /* --- a11y / best practice --- */
  for (const m of markupOnly.matchAll(/<a\b[^>]*>/gi)) {
    const tag = m[0];
    const href = (tag.match(/href="([^"]*)"/) || [])[1];
    if (href === undefined) note(r, 'warn', '<a> without href: ' + tag.slice(0, 60));
    else if (href === '#' || href === '') note(r, 'warn', 'placeholder link: ' + tag.slice(0, 70));
    if (/target="_blank"/.test(tag) && !/rel="[^"]*noopener/.test(tag)) {
      note(r, 'warn', 'target=_blank without rel=noopener');
    }
  }
  if (/<img(?![^>]*\balt=)[^>]*>/i.test(markupOnly)) note(r, 'warn', '<img> without alt');
  if (/console\.log\(/.test(src)) note(r, 'info', 'leftover console.log');
  if (/smarttools-nepal/.test(src)) note(r, 'error', 'references smarttools-nepal');
  if (/lorem ipsum/i.test(src)) note(r, 'error', 'placeholder lorem ipsum text');
  if (/\bTODO\b|\bFIXME\b/.test(src)) note(r, 'info', 'TODO/FIXME marker');
  if (/<h1/.test(markupOnly) && (markupOnly.match(/<h1/g) || []).length > 1) note(r, 'warn', 'more than one <h1>');

  /* --- heavy pages --- */
  const kb = Math.round(src.length / 1024);
  if (kb > 120) note(r, 'info', kb + ' KB of HTML');

  /* pages that still carry their own big style block look off-brand */
  const ownStyle = (src.match(/<style>[\s\S]*?<\/style>/i) || [''])[0].length;
  if (ownStyle > 3500) note(r, 'info', `large inline <style> (${Math.round(ownStyle / 1024)} KB)`);

  /* external links worth checking by hand */
}

/* ---------------------------------------------------------------
   1b. local data files used by the content pages
   --------------------------------------------------------------- */
const DATA = [];
const dataOk = [];
for (const [d, key, shape] of DATA) {
  const p = path.join(ROOT, d);
  if (!exists(p)) { note(d, 'error', 'missing data file'); continue; }
  const txt = fs.readFileSync(p, 'utf8');
  const win = {};
  try { new Function('window', txt)(win); }
  catch (e) { note(d, 'error', 'will not evaluate: ' + e.message); continue; }
  const arr = win[key];
  if (!Array.isArray(arr)) { note(d, 'error', `does not set ${key} to an array`); continue; }
  if (arr.length < 999) note(d, 'error', `only ${arr.length} entries — needs 999+`);
  let bad = 0;
  for (const it of arr) {
    if (shape === 'string' && (typeof it !== 'string' || !it.trim())) bad++;
    if (shape === 'pair' && (!Array.isArray(it) || it.length < 2 || !String(it[0] || '').trim() || !String(it[1] || '').trim())) bad++;
  }
  if (bad) note(d, 'error', bad + ' malformed entries');
  dataOk.push(`${key.replace('SAAGAR_DATA_', '').toLowerCase()}=${arr.length}`);
}
if (dataOk.length) console.log('data: ' + dataOk.join('  '));

/* ---------------------------------------------------------------
   1c. every page that shows data must load it
   --------------------------------------------------------------- */
const DATA_PAGES = {};
for (const [page, key] of Object.entries(DATA_PAGES)) {
  const t = fs.readFileSync(path.join(ROOT, page), 'utf8');
  if (!t.includes(`assets/data/${key}.js`)) note(page, 'error', `does not load assets/data/${key}.js`);
  for (const k of Object.keys(DATA_PAGES).map((p2) => DATA_PAGES[p2])) {
    if (k !== key && t.includes(`assets/data/${k}.js`)) note(page, 'warn', `also loads unrelated data/${k}.js`);
  }
}

/* ---------------------------------------------------------------
   2. catalog ↔ disk
   --------------------------------------------------------------- */
const catalog = fs.readFileSync(path.join(ROOT, 'assets/catalog.js'), 'utf8');
const catFiles = new Set();
const slugs = new Set();
const catEntries = 0;
void catEntries;
for (const m of catalog.matchAll(/slug:\s*'([^']+)',\s*file:\s*'([^']+)'/g)) {
  if (slugs.has(m[1])) note('assets/catalog.js', 'error', 'duplicate slug: ' + m[1]);
  if (catFiles.has(m[2])) note('assets/catalog.js', 'error', 'duplicate file: ' + m[2]);
  slugs.add(m[1]);
  catFiles.add(m[2]);
  if (!exists(path.join(ROOT, m[2]))) note('assets/catalog.js', 'error', `catalog points at missing file: ${m[2]}`);
}
if (!catFiles.size) note('assets/catalog.js', 'error', 'catalog parsed as empty — check the format');

/* tools.html / games.html build their lists from the catalog, so make sure
   they actually include it, otherwise the directory renders empty */
for (const dirPage of ['tools.html', 'games.html']) {
  const t = fs.readFileSync(path.join(ROOT, dirPage), 'utf8');
  if (!/assets\/catalog\.js/.test(t)) note(dirPage, 'error', 'does not load assets/catalog.js');
}

/* every tool/game page should be listed in the catalog */
for (const f of htmlFiles) {
  const r = rel(f);
  if (!/^(tools|games)\//.test(r)) continue;
  if (!catFiles.has(r) && !linked.has(r)) note(r, 'warn', 'page not linked from the catalog or any page');
}

/* ---------------------------------------------------------------
   3. orphan assets
   --------------------------------------------------------------- */
for (const f of all) {
  const r = rel(f);
  if (/\.(png|jpe?g|svg|webp|ico)$/i.test(r) && !linked.has(r) && !/saagar-logo/.test(r)) {
    note(r, 'info', 'image never referenced');
  }
}

/* ---------------------------------------------------------------
   4. report
   --------------------------------------------------------------- */
const order = { error: 0, warn: 1, info: 2 };
problems.sort((a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file));

const counts = { error: 0, warn: 0, info: 0 };
for (const p of problems) counts[p.level]++;

const icon = { error: '✖', warn: '▲', info: '·' };
let current = null;
for (const p of problems) {
  if (p.file !== current) { console.log('\n' + p.file); current = p.file; }
  console.log('   ' + icon[p.level] + ' ' + p.msg);
}

console.log('\n' + '─'.repeat(52));
console.log(`pages: ${htmlFiles.length}   files: ${all.length}`);
console.log(`errors: ${counts.error}   warnings: ${counts.warn}   notes: ${counts.info}`);
if (!counts.error) console.log('no blocking errors.');
process.exitCode = counts.error ? 1 : 0;
