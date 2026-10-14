/* Tiny static server for local checks.
   node build/serve.mjs [port]

   Add ?probe=1 to any page URL and a small error reporter is injected as the
   first thing in <head>, exposing window.__probe = { errors: [...] }.
   _audit.html uses this to check every page without touching the real files. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.argv[2] || 4612);
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm', '.woff2': 'font/woff2'
};

const PROBE = `<script>window.__probe={errors:[]};
window.onerror=function(m,s,l){window.__probe.errors.push(String(m)+' @'+String(s).split('/').pop()+':'+l);};
window.addEventListener('unhandledrejection',function(e){window.__probe.errors.push('unhandled rejection: '+((e.reason&&e.reason.message)||e.reason));});
window.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName&&/^(IMG|SCRIPT|LINK)$/.test(t.tagName)){window.__probe.errors.push('failed to load '+t.tagName+' '+(t.getAttribute('src')||t.getAttribute('href')));}},true);
(function(){var ce=console.error;console.error=function(){window.__probe.errors.push('console.error: '+Array.prototype.join.call(arguments,' '));ce.apply(console,arguments);};})();
</script>`;

http.createServer((req, res) => {
  const [rawPath, query] = req.url.split('?');
  let p = decodeURIComponent(rawPath);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403, { 'content-type': 'text/plain' }).end('forbidden'); return; }

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 ' + p);
      return;
    }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (type.startsWith('text/html') && /(^|&)probe=1(&|$)/.test(query || '')) {
      let html = buf.toString('utf8');
      if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, (m, a) => '<head' + a + '>' + PROBE);
      else html = PROBE + html;
      buf = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log('serving ' + ROOT + ' on http://127.0.0.1:' + PORT));
