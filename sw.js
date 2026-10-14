/* ===========================================================
   SAAGAR service worker — offline shell + runtime cache
   Strategy
     • navigations (HTML): network first, cache fallback  → fresh
       content when online, still usable on a dead connection
     • static assets: cache first, then network (stale is fine)
     • third-party (AdSense, fonts, peer/voice): never cached
   Bump CACHE when shipping a new build.
   =========================================================== */
var CACHE = 'saagar-v1';
var OFFLINE_URL = 'index.html';
var SHELL = [
  'index.html',
  'games.html',
  'tools.html',
  'skills.html',
  'law.html',
  '404.html',
  'assets/site.css',
  'assets/clay.css',
  'assets/app.js',
  'assets/settings.js',
  'assets/mascot.js',
  'assets/catalog.js',
  'assets/icons.js',
  'assets/saagar-logo.png',
  'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* addAll rejects the whole batch if one file is missing — add individually */
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function sameOrigin(url) {
  try { return new URL(url, self.location.origin).origin === self.location.origin; }
  catch (e) { return false; }
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (!sameOrigin(req.url)) return;                       /* AdSense, fonts, signalling */
  if (req.url.indexOf('/api/') !== -1) return;
  if (req.headers.get('range')) return;

  /* HTML → network first */
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  /* assets → cache first, refresh in background */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
