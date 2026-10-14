/* ===========================================================
   SAAGAR — 3-D die
   A real CSS-3D cube with pips, a cast shadow and a rolling
   animation that lands on the value you ask for.
   Shared by Ludo and Snakes & Ladders.
   =========================================================== */
(function () {
  'use strict';

  /* pip positions per face, in % of the face box */
  var PIPS = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[26, 26], [50, 50], [74, 74]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]]
  };

  /* rotation that brings each face to the front */
  var FACE_ROT = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };

  var CSS =
    '.d3wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;' +
    'padding:10px 12px 20px;perspective:900px;}' +
    '.d3cube{position:relative;transform-style:preserve-3d;' +
    'transition:transform .8s cubic-bezier(.25,.7,.3,1);}' +
    '.d3cube .d3f{position:absolute;inset:0;display:grid;border-radius:16%;' +
    'background:radial-gradient(130% 130% at 26% 16%,#fffef8 0,#faf7ec 38%,#e8e2cf 78%,#cfc6ab 100%);' +
    'box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.95), inset 0 -8px 14px rgba(120,95,45,.25),' +
    'inset 0 6px 10px rgba(255,255,255,.55), inset 0 0 0 2.5px rgba(150,120,40,.16);}' +
    '.d3cube .d3f::after{content:"";position:absolute;inset:7%;border-radius:12%;' +
    'background:radial-gradient(100% 100% at 30% 20%,rgba(255,255,255,.5),rgba(255,255,255,0) 55%);pointer-events:none;}' +
    '.d3cube .d3f span{position:absolute;width:18%;height:18%;border-radius:50%;' +
    'background:radial-gradient(circle at 34% 28%,#6b7280 0,#23262e 55%,#0c0d12 100%);transform:translate(-50%,-50%);' +
    'box-shadow:inset 0 -2px 3px rgba(255,255,255,.3), 0 1px 2px rgba(0,0,0,.5);}' +
    '.d3cube .d3f span.accent{background:radial-gradient(circle at 34% 28%,#ff8a80 0,#dc2626 55%,#8f0f14 100%);' +
    'box-shadow:inset 0 -2px 3px rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.5);}' +
    '.d3cube.red .d3f span{background:radial-gradient(circle at 34% 30%,#ff7a6d,#dc2626 60%,#9c1616 100%);}' +
    '.d3cube .d3f.gold{background:radial-gradient(130% 130% at 26% 16%,#fffbe0 0,#f7e7ae 40%,#dcbe62 80%,#b9953a 100%);}' +
    '.d3cube .d3f.gold span{background:radial-gradient(circle at 34% 28%,#5c4a12 0,#2c210a 60%,#120d03 100%);}' +
    '.d3cube .d3f.gold span.accent{background:radial-gradient(circle at 34% 28%,#e2574b 0,#a3130f 60%,#5e0606 100%);}' +
    '.d3shadow{position:absolute;left:50%;bottom:2px;width:80%;height:12px;transform:translateX(-50%);' +
    'border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.45),transparent 78%);' +
    'transition:transform .3s, opacity .3s;}' +
    '.d3wrap.roll .d3shadow{animation:d3shadow .96s ease-in-out;}' +
    '@keyframes d3shadow{0%{transform:translateX(-50%) scale(.85);opacity:.6}' +
    '45%{transform:translateX(-50%) scale(.72);opacity:.3}100%{transform:translateX(-50%) scale(1);opacity:.5}}' +
    '.d3hop{transform-style:preserve-3d;}' +
    '.d3wrap.roll .d3hop{animation:d3hop .96s cubic-bezier(.3,.7,.3,1);}' +
    '@keyframes d3hop{0%{transform:translateY(0) scale(1)}18%{transform:translateY(-22px) scale(1.07)}' +
    '46%{transform:translateY(-30px) scale(1.05)}72%{transform:translateY(-9px) scale(1.01)}' +
    '88%{transform:translateY(-3px) scale(1)}100%{transform:translateY(0) scale(1)}}';

  function ensureCSS() {
    if (document.getElementById('saagarDiceCSS')) return;
    var st = document.createElement('style');
    st.id = 'saagarDiceCSS';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function faceHTML(v) {
    /* classic western die: 1 and 4 carry coloured (accent) pips */
    var accent = (v === 1 || v === 4);
    var out = '';
    (PIPS[v] || []).forEach(function (p) {
      out += '<span class="' + (accent ? 'accent' : '') + '" style="left:' + p[0] + '%;top:' + p[1] + '%"></span>';
    });
    return out;
  }

  /**
   * make(size, opts) -> { el, cube, show(v), roll(v, cb), value }
   * opts: { cls:'red'|'gold', start:1 }
   */
  function make(size, opts) {
    ensureCSS();
    opts = opts || {};
    size = size || 64;
    var half = size / 2;

    var wrap = document.createElement('div');
    wrap.className = 'd3wrap' + (opts.wrapCls ? ' ' + opts.wrapCls : '');
    wrap.style.width = (size + 24) + 'px';
    wrap.style.height = (size + 20) + 'px';

    var cube = document.createElement('div');
    cube.className = 'd3cube' + (opts.cls ? ' ' + opts.cls : '');
    cube.style.width = size + 'px';
    cube.style.height = size + 'px';

    var defs = [
      ['d3front', 'translateZ(' + half + 'px)', 1],
      ['d3back', 'rotateY(180deg) translateZ(' + half + 'px)', 6],
      ['d3right', 'rotateY(90deg) translateZ(' + half + 'px)', 3],
      ['d3left', 'rotateY(-90deg) translateZ(' + half + 'px)', 4],
      ['d3top', 'rotateX(90deg) translateZ(' + half + 'px)', 2],
      ['d3bottom', 'rotateX(-90deg) translateZ(' + half + 'px)', 5]
    ];
    defs.forEach(function (d) {
      var f = document.createElement('div');
      f.className = 'd3f ' + d[0];
      f.setAttribute('data-v', d[2]);
      f.style.transform = d[1];
      f.innerHTML = faceHTML(d[2]);
      if (opts.gold && d[2] === 6) f.classList.add('gold');
      cube.appendChild(f);
    });

    var shadow = document.createElement('div');
    shadow.className = 'd3shadow';

    var hop = document.createElement('div');
    hop.className = 'd3hop';
    hop.style.width = size + 'px';
    hop.style.height = size + 'px';
    hop.appendChild(cube);
    wrap.appendChild(hop);
    wrap.appendChild(shadow);

    var api = { el: wrap, cube: cube, hop: hop, shadow: shadow, value: opts.start || 1, rolling: false };

    api.show = function (v) {
      v = v || 1;
      api.value = v;
      var r = FACE_ROT[v] || [0, 0];
      cube.style.transition = 'transform .35s ease-out';
      cube.style.transform = 'rotateX(' + r[0] + 'deg) rotateY(' + r[1] + 'deg)';
      return api;
    };

    api.roll = function (v, cb) {
      if (api.rolling) return api;
      if (v == null) v = 1 + Math.floor(Math.random() * 6);
      api.rolling = true;
      var r = FACE_ROT[v] || [0, 0];
      var spin = 2 + Math.floor(Math.random() * 2);
      var tilt = Math.round((Math.random() * 26 - 13));
      wrap.classList.add('roll');
      cube.style.transition = 'transform .68s cubic-bezier(.2,.75,.25,1)';
      cube.style.transform = 'rotateX(' + (r[0] + 360 * spin) + 'deg) rotateY(' +
        (r[1] + 360 * (spin + 1)) + 'deg) rotateZ(' + tilt + 'deg)';
      setTimeout(function () {
        cube.style.transition = 'transform .26s cubic-bezier(.34,1.5,.5,1)';
        cube.style.transform = 'rotateX(' + r[0] + 'deg) rotateY(' + r[1] + 'deg)';
      }, 690);
      setTimeout(function () {
        api.rolling = false;
        api.value = v;
        wrap.classList.remove('roll');
        if (typeof cb === 'function') cb(v);
      }, 990);
      return api;
    };

    api.show(api.value);
    return api;
  }

  window.SAAGAR_DICE3D = { make: make, ensureCSS: ensureCSS };
})();
