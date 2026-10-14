/* ===========================================================
   SAAGAR — game background (bgfx)
   A soft, painted game-table scene behind every game. Painted
   on a canvas at load — no image files, no CDN. The 🖼 button
   (bottom-left) turns it off; the choice is remembered.
   Loaded automatically by assets/lobby.js on every game page.
   =========================================================== */
(function () {
  'use strict';

  var KEY = 'bgfx.on';
  var el = null;

  function store(k, v) {
    try {
      var s = window.SAAGAR ? window.SAAGAR.store : null;
      if (s) { s(k, v); return; }
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { }
  }

  function paint(c, w, h) {
    /* soft casino-table scene: warm gradient, radial glow, felt vignette */
    var g = c.createLinearGradient(0, 0, w * .3, h);
    g.addColorStop(0, '#2b1d4e'); g.addColorStop(.45, '#1e3a5f'); g.addColorStop(1, '#0f2540');
    c.fillStyle = g; c.fillRect(0, 0, w, h);

    var glow = c.createRadialGradient(w * .5, h * .42, 10, w * .5, h * .42, Math.max(w, h) * .6);
    glow.addColorStop(0, 'rgba(255,220,140,.32)');
    glow.addColorStop(.55, 'rgba(255,190,110,.10)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);

    /* floating soft orbs for depth */
    var orbs = [[.12, .18, 90], [.85, .22, 70], [.75, .8, 110], [.2, .85, 80]];
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];
      var og = c.createRadialGradient(w * o[0], h * o[1], 4, w * o[0], h * o[1], o[2]);
      og.addColorStop(0, 'rgba(255,255,255,.10)');
      og.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = og;
      c.beginPath(); c.arc(w * o[0], h * o[1], o[2], 0, Math.PI * 2); c.fill();
    }

    /* subtle card + dice silhouettes */
    c.save();
    c.globalAlpha = .07;
    c.translate(w * .82, h * .72); c.rotate(-.35);
    c.fillStyle = '#fff';
    c.fillRect(-40, -56, 80, 112);
    c.translate(-w * .62, h * .1); c.rotate(.6);
    c.fillRect(-36, -50, 72, 100);
    c.restore();

    /* vignette */
    var v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.55)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  }

  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'bgfx';
    var cv = document.createElement('canvas');
    cv.width = 1200; cv.height = 800;
    var c = cv.getContext('2d');
    paint(c, 1200, 800);
    cv.style.cssText = 'width:100%;height:100%;display:block;';
    el.appendChild(cv);
    el.style.opacity = '.16';
    document.body.appendChild(el);
    return el;
  }

  function apply(on) {
    var e = ensure();
    e.style.opacity = on ? '.16' : '0';
    var b = document.getElementById('saagarBgBtn');
    if (b) b.textContent = on ? '🖼️' : '🚫';
  }

  function init() {
    if (document.getElementById('saagarBgBtn')) return;
    var on = store(KEY) !== '0';               /* default ON */
    ensure();
    apply(on);
    var b = document.createElement('button');
    b.id = 'saagarBgBtn';
    b.className = 'bgbtn';
    b.type = 'button';
    b.setAttribute('aria-label', 'Toggle game background');
    b.title = 'Background on/off';
    b.textContent = on ? '🖼️' : '🚫';
    b.onclick = function () {
      on = !on;
      store(KEY, on ? '1' : '0');
      apply(on);
    };
    document.body.appendChild(b);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SAAGAR_BGFX = { ensure: ensure, apply: apply, init: init };
})();
