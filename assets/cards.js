/* ===========================================================
   SAAGAR — playing cards
   Real SVG card faces (proper pip layouts, court panels, a
   designed back) with a true 3-D flip. Shared by every card game.
   Card object: { r: 2..14, s: 0..3 }  suits ♠ ♥ ♦ ♣
   =========================================================== */
(function () {
  'use strict';

  var SUITS = ['\u2660', '\u2665', '\u2666', '\u2663'];
  var LETTER = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

  /* ---- suit silhouettes, drawn in a 0..100 box ---- */
  var SUIT_INNER = [
    /* spade */
    '<path d="M50 4 C50 4 13 37 13 60 C13 74 22 83 32 83 C40 83 46 79 49 73 C49 81 46 90 38 99 L62 99 C54 90 51 81 51 73 C54 79 60 83 68 83 C78 83 87 74 87 60 C87 37 50 4 50 4 Z"/>',
    /* heart */
    '<path d="M50 91 C21 68 8 51 8 34 C8 18 20 8 33 8 C42 8 48 13 50 20 C52 13 58 8 67 8 C80 8 92 18 92 34 C92 51 79 68 50 91 Z"/>',
    /* diamond */
    '<path d="M50 5 L90 50 L50 95 L10 50 Z"/>',
    /* club */
    '<g><circle cx="50" cy="27" r="21"/><circle cx="25" cy="64" r="21"/><circle cx="75" cy="64" r="21"/>' +
    '<path d="M44 64 L44 91 L34 99 L66 99 L56 91 L56 64 Z"/></g>'
  ];

  function isRed(c) { return c && (c.s === 1 || c.s === 2); }
  function rankChar(r) { return LETTER[r] || String(r); }

  /* ---- pip positions on a 120 x 168 card ---- */
  var PIPS = {
    1: [[60, 84]],
    2: [[60, 64], [60, 104]],
    3: [[60, 56], [60, 84], [60, 112]],
    4: [[41, 58], [79, 58], [41, 110], [79, 110]],
    5: [[41, 58], [79, 58], [60, 84], [41, 110], [79, 110]],
    6: [[41, 56], [79, 56], [41, 84], [79, 84], [41, 112], [79, 112]],
    7: [[41, 56], [79, 56], [60, 70], [41, 84], [79, 84], [41, 112], [79, 112]],
    8: [[41, 56], [79, 56], [60, 70], [41, 84], [79, 84], [60, 98], [41, 112], [79, 112]],
    9: [[41, 52], [79, 52], [41, 73], [79, 73], [60, 84], [41, 95], [79, 95], [41, 116], [79, 116]],
    10: [[41, 52], [79, 52], [60, 63], [41, 74], [79, 74], [41, 94], [79, 94], [60, 105], [41, 116], [79, 116]]
  };

  function suitGlyph(s, x, y, size, cls) {
    return '<svg x="' + x + '" y="' + y + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 100 100" class="' + (cls || 'sg') + '">' + SUIT_INNER[s] + '</svg>';
  }

  /* ---- shared defs, injected once per page ---- */
  var DEFS =
    '<defs>' +
    '<linearGradient id="sgGold" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#fff6d3"/><stop offset=".45" stop-color="#e9c974"/>' +
    '<stop offset=".7" stop-color="#a8801f"/><stop offset="1" stop-color="#f3dda0"/></linearGradient>' +
    '<linearGradient id="sgFace" x1="0" y1="0" x2=".3" y2="1">' +
    '<stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#fbfaf6"/><stop offset="1" stop-color="#eeeae0"/></linearGradient>' +
    '<linearGradient id="sgCourt" x1="0" y1="0" x2=".2" y2="1">' +
    '<stop offset="0" stop-color="#fdfbf5"/><stop offset="1" stop-color="#e7ddc7"/></linearGradient>' +
    '<linearGradient id="sgBackBase" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#233060"/><stop offset=".5" stop-color="#131c3d"/><stop offset="1" stop-color="#0a1024"/></linearGradient>' +
    '<radialGradient id="sgMedal" cx=".35" cy=".28" r=".85">' +
    '<stop offset="0" stop-color="#3a4880"/><stop offset="1" stop-color="#101832"/></radialGradient>' +
    '<radialGradient id="sgAceGlow" cx=".5" cy=".5" r=".5">' +
    '<stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="sgSheen" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>' +
    '<stop offset=".58" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>' +
    '<pattern id="sgBackPat" width="11" height="11" patternUnits="userSpaceOnUse">' +
    '<path d="M5.5 0.6 L10.4 5.5 L5.5 10.4 L0.6 5.5 Z" fill="none" stroke="#3d4b80" stroke-width=".85"/>' +
    '<circle cx="5.5" cy="5.5" r=".85" fill="#4a5a94" opacity=".7"/></pattern>' +
    '</defs>';

  var CSS =
    '.pcard{--cw:78px;width:var(--cw);aspect-ratio:5/7;flex:0 0 auto;position:relative;' +
    'perspective:900px;transition:transform .25s cubic-bezier(.2,.8,.3,1);}' +
    '.pcard.sm{--cw:58px}.pcard.lg{--cw:104px}.pcard.xl{--cw:126px}' +
    '.pcard .pc-in{position:absolute;inset:0;transform-style:preserve-3d;' +
    'transition:transform .6s cubic-bezier(.35,.05,.2,1);}' +
    '.pcard.down .pc-in{transform:rotateY(180deg);}' +
    '.pcard .pc-f,.pcard .pc-b{position:absolute;inset:0;border-radius:calc(var(--cw) * .085);' +
    'overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;}' +
    '.pcard .pc-b{transform:rotateY(180deg);}' +
    '.pcard .pc-f{background:linear-gradient(160deg,#fff,#f1eee6);color:#20222b;' +
    'box-shadow:0 7px 16px rgba(0,0,0,.42), inset 0 0 0 1px rgba(20,20,30,.16);}' +
    '.pcard.red .pc-f{color:#d3172a;}' +
    '.pcard .pc-b{box-shadow:0 7px 16px rgba(0,0,0,.46), inset 0 0 0 1px rgba(255,255,255,.14);}' +
    '.pcard svg{display:block;width:100%;height:100%;}' +
    '.pcard .sg,.pcard .pip{filter:drop-shadow(0 1px .6px rgba(0,0,0,.22));}' +
    '.pcard .pc-f::after{content:"";position:absolute;inset:0;pointer-events:none;' +
    'background:linear-gradient(150deg,rgba(255,255,255,.5),rgba(255,255,255,0) 46%);}' +
    '.pcard.lift:hover{transform:translateY(-9px) rotateX(7deg) rotateZ(-1.2deg) scale(1.03);z-index:3;}' +
    '.pcard.hl{box-shadow:0 0 0 3px #ffd85e, 0 10px 22px rgba(0,0,0,.5);border-radius:calc(var(--cw) * .085);}' +
    '.pcard.dimz{filter:grayscale(.65) brightness(.72);}' +
    '.pcard.deal{animation:pcDeal .5s cubic-bezier(.2,.85,.25,1) backwards;}' +
    '@keyframes pcDeal{from{transform:translate(0,-90px) rotate(-13deg) scale(.82);opacity:0;}}' +
    '.pcard.slide{animation:pcSlide .42s cubic-bezier(.2,.85,.25,1) backwards;}' +
    '@keyframes pcSlide{from{transform:translateX(-60px) translateY(26px) rotate(-18deg) scale(.86);opacity:0;}}' +
    /* ---- felt table ---- */
    '.ptable{position:relative;border-radius:26px;padding:20px 16px 18px;color:#f3f7f2;overflow:hidden;' +
    'background:radial-gradient(120% 90% at 50% 8%,#1f7f52 0,#0f5c39 42%,#073c25 78%,#052c1b 100%);' +
    'box-shadow:0 26px 60px rgba(0,0,0,.5), inset 0 0 90px rgba(0,0,0,.45);' +
    'border:11px solid transparent;border-image:linear-gradient(150deg,#7d5228,#4b2f14 40%,#2d1b0a) 1;}' +
    '.ptable::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;' +
    'background:radial-gradient(60% 45% at 50% 42%,rgba(255,255,255,.14),transparent 70%),' +
    'repeating-linear-gradient(45deg,rgba(255,255,255,.03) 0 3px,transparent 3px 6px);}' +
    '.ptable::after{content:"";position:absolute;inset:8px;border-radius:18px;pointer-events:none;' +
    'box-shadow:inset 0 0 0 1.5px rgba(233,201,116,.42), inset 0 0 60px rgba(0,0,0,.35);}' +
    /* ---- chips ---- */
    '.schips{display:flex;align-items:flex-end;gap:9px;justify-content:center;}' +
    '.sstack{position:relative;width:34px;height:calc(34px + (var(--n, 1) - 1) * 7px);}' +
    '.schip{position:absolute;left:0;width:34px;height:34px;border-radius:50%;' +
    'background:repeating-conic-gradient(#fff 0 11deg,var(--c,#c81e2c) 11deg 22deg), radial-gradient(circle at 38% 30%,rgba(255,255,255,.7),rgba(255,255,255,0) 62%);' +
    'box-shadow:inset 0 0 0 5px var(--c,#c81e2c), inset 0 0 0 6.6px rgba(255,255,255,.92), 0 3px 7px rgba(0,0,0,.45);}' +
    '.schip::after{content:"";position:absolute;inset:9px;border-radius:50%;background:var(--c,#c81e2c);' +
    'box-shadow:inset 0 1px 3px rgba(255,255,255,.5), inset 0 -2px 4px rgba(0,0,0,.35);}' +
    '.schips i{font-style:normal;font-size:12.5px;font-weight:900;letter-spacing:.3px;color:#fff;' +
    'padding-bottom:6px;text-shadow:0 1px 3px rgba(0,0,0,.6);}';

  function ensureCSS() {
    if (document.getElementById('saagarCardsCSS')) return;
    var st = document.createElement('style');
    st.id = 'saagarCardsCSS';
    st.textContent = CSS;
    document.head.appendChild(st);
    var host = document.createElement('div');
    host.id = 'saagarCardsDefs';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML = '<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">' + DEFS + '</svg>';
    document.body.appendChild(host);
  }

  /* ---- face ---- */
  function faceSVG(c) {
    if (!c) return '';
    var r = c.r, s = c.s;
    var out = '<svg viewBox="0 0 120 168" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="120" height="168" fill="url(#sgFace)"/>' +
      '<rect x="3.2" y="3.2" width="113.6" height="161.6" rx="5" fill="none" stroke="currentColor" stroke-width=".7" opacity=".22"/>';

    /* corner index marks (top-left + mirrored bottom-right) */
    var mark = '<text x="18" y="30" text-anchor="middle" font-size="20" font-weight="800" ' +
      'font-family="Georgia,\'Times New Roman\',serif" fill="currentColor">' + rankChar(r) + '</text>' +
      suitGlyph(s, 11, 35, 15);
    out += mark + '<g transform="rotate(180 60 84)">' + mark + '</g>';

    if (r >= 11 && r <= 13) {
      /* court card — a panelled figure, mirrored below */
      var panel = '<g>' +
        '<rect x="33" y="32" width="54" height="54" rx="6" fill="url(#sgCourt)" stroke="rgba(60,50,30,.35)" stroke-width=".8"/>' +
        '<rect x="35.5" y="34.5" width="49" height="49" rx="4.5" fill="none" stroke="url(#sgGold)" stroke-width="1.1" opacity=".85"/>' +
        '<text x="60" y="63" text-anchor="middle" font-size="27" font-weight="700" ' +
        'font-family="Georgia,\'Times New Roman\',serif" fill="currentColor">' + rankChar(r) + '</text>' +
        suitGlyph(s, 52, 66, 16) +
        '<circle cx="39" cy="38" r="1.7" fill="url(#sgGold)"/><circle cx="81" cy="38" r="1.7" fill="url(#sgGold)"/>' +
        '</g>';
      out += panel + '<g transform="rotate(180 60 84)">' + panel + '</g>';
    } else if (r === 14) {
      /* ace — one big suit over a soft glow */
      out += '<circle cx="60" cy="84" r="40" fill="url(#sgAceGlow)" opacity=".55"/>' +
        suitGlyph(s, 26, 50, 68);
    } else {
      var sz = r >= 9 ? 17 : (r >= 6 ? 19 : 21);
      (PIPS[r] || []).forEach(function (p) {
        out += suitGlyph(s, p[0] - sz / 2, p[1] - sz / 2, sz, 'sg pip');
      });
    }
    out += '<rect width="120" height="168" fill="url(#sgSheen)" opacity=".35" pointer-events="none"/>';
    return out + '</svg>';
  }

  var BACK = '<svg viewBox="0 0 120 168" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="120" height="168" fill="url(#sgBackBase)"/>' +
    '<rect width="120" height="168" fill="url(#sgBackPat)" opacity=".9"/>' +
    '<rect x="5.5" y="5.5" width="109" height="157" rx="7" fill="none" stroke="url(#sgGold)" stroke-width="1.7" opacity=".95"/>' +
    '<rect x="10.8" y="10.8" width="98.4" height="146.4" rx="4.5" fill="none" stroke="url(#sgGold)" stroke-width=".7" opacity=".55"/>' +
    '<ellipse cx="60" cy="84" rx="31" ry="31" fill="url(#sgMedal)" stroke="url(#sgGold)" stroke-width="1.3"/>' +
    '<ellipse cx="60" cy="84" rx="26" ry="26" fill="none" stroke="url(#sgGold)" stroke-width=".5" opacity=".5"/>' +
    '<text x="60" y="97" text-anchor="middle" font-size="34" font-weight="700" ' +
    'font-family="Georgia,\'Times New Roman\',serif" fill="url(#sgGold)">S</text>' +
    '<text x="60" y="134" text-anchor="middle" font-size="8" letter-spacing="3.4" font-weight="700" ' +
    'fill="#e9c974" opacity=".85">SAAGAR</text>' +
    '</svg>';

  /* ---- element builders ---- */
  function card(c, opts) {
    ensureCSS();
    opts = opts || {};
    var d = document.createElement('div');
    d.className = 'pcard' + (opts.size ? ' ' + opts.size : '') +
      (c && isRed(c) && !opts.down ? ' red' : '') +
      (opts.down ? ' down' : '') + (opts.cls ? ' ' + opts.cls : '');
    var inn = document.createElement('div'); inn.className = 'pc-in';
    var f = document.createElement('div'); f.className = 'pc-f';
    f.innerHTML = faceSVG(c || { r: 14, s: 0 });
    var b = document.createElement('div'); b.className = 'pc-b';
    b.innerHTML = BACK;
    inn.appendChild(f); inn.appendChild(b);
    d.appendChild(inn);
    if (c) d.setAttribute('data-card', rankChar(c.r) + SUITS[c.s]);
    applyClasses(d, c, opts.down);
    return d;
  }

  function applyClasses(d, c, down) {
    if (!d) return;
    var extra = '';
    if (d.className.indexOf('lift') > -1) extra = ' lift';
    if (d.className.indexOf('hl') > -1) extra = extra + ' hl';
    if (d.className.indexOf('deal') > -1) extra = extra + ' deal';
    if (d.className.indexOf('slide') > -1) extra = extra + ' slide';
    var size = (d.className.match(/\b(sm|lg|xl)\b/) || [''])[0];
    d.className = 'pcard' + (size ? ' ' + size : '') + (c && isRed(c) && !down ? ' red' : '') +
      (down ? ' down' : '') + extra;
  }

  /* flip an existing card to a new value */
  function set(d, c, down) {
    if (!d) return;
    var f = d.querySelector('.pc-f');
    if (f) f.innerHTML = faceSVG(c || { r: 14, s: 0 });
    if (c) d.setAttribute('data-card', rankChar(c.r) + SUITS[c.s]);
    applyClasses(d, c, down);
  }

  function reveal(d, c) { set(d, c, false); }

  function back(opts) {
    opts = opts || {};
    return card(null, { size: opts.size, cls: (opts.cls || '') + ' down' });
  }

  /* ---- poker chips (Rs 10,000-scale economy: big denominations first) ---- */
  var DEN = [
    { v: 1000, c: '#7c3aed' }, { v: 500, c: '#b45309' }, { v: 100, c: '#c9a227' },
    { v: 25, c: '#1d7a45' }, { v: 5, c: '#1e4fd8' }, { v: 1, c: '#c81e2c' }
  ];

  function chips(amount, opts) {
    ensureCSS();
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'schips' + (opts.cls ? ' ' + opts.cls : '');
    var left = Math.max(0, Math.round(amount || 0));
    var shown = 0;
    DEN.forEach(function (d2) {
      if (shown >= 3 || left < d2.v) return;
      var n = Math.min(5, Math.floor(left / d2.v));
      left -= n * d2.v;
      var stack = document.createElement('div');
      stack.className = 'sstack';
      stack.style.setProperty('--n', n);
      for (var i = 0; i < n; i++) {
        var ch = document.createElement('div');
        ch.className = 'schip';
        ch.style.setProperty('--c', d2.c);
        ch.style.bottom = (i * 7) + 'px';
        stack.appendChild(ch);
      }
      wrap.appendChild(stack);
      shown++;
    });
    if (!shown) {
      var st0 = document.createElement('div');
      st0.className = 'sstack';
      st0.style.setProperty('--n', 1);
      var ch2 = document.createElement('div');
      ch2.className = 'schip';
      ch2.style.setProperty('--c', '#8a8f9c');
      st0.appendChild(ch2);
      wrap.appendChild(st0);
    }
    if (opts.label !== false) {
      var lab = document.createElement('i');
      lab.textContent = '\u20B9' + (amount || 0);
      wrap.appendChild(lab);
    }
    return wrap;
  }

  window.SAAGAR_CARDS = {
    suits: SUITS, card: card, back: back, set: set, reveal: reveal,
    chips: chips, isRed: isRed, rankChar: rankChar, ensureCSS: ensureCSS
  };
})();
