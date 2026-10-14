/* ===========================================================
   SAAGAR — shared app engine
   sagardahal123.com.np
   Chrome (header/footer/menu), BS calendar, helpers, toast.
   =========================================================== */
(function () {
  'use strict';

  var BODY = document.body;
  var ROOT = BODY.getAttribute('data-root') || '';
  if (ROOT && ROOT.charAt(ROOT.length - 1) !== '/') ROOT += '/';
  function href(p) { return ROOT + p; }

  var NAV = (function () {
    var I = (typeof ICONS !== 'undefined' && ICONS) ? ICONS : null;
    function svg(key, extra, size) {
      if (I) return I.render(key, extra, size);
      return '';
    }
    return [
      { id: 'home', label: 'Home', url: 'index.html', icon: svg('home') },
      { id: 'tools', label: 'Tools', url: 'tools.html', icon: svg('tools') },
      { id: 'games', label: 'Games', url: 'games.html', icon: svg('games') },
      { id: 'skills', label: 'Skills', url: 'skills.html', icon: svg('skills') },
      { id: 'law', label: 'Laws', url: 'law.html', icon: svg('law') }
    ];
  })();
  var PRIMARY = ['home', 'tools', 'games'];

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k]); }
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- header ---------- */
  function buildHeader() {
    var host = document.getElementById('hdr');
    if (!host) return;
    var active = BODY.getAttribute('data-page') || '';
    var hd = el('div', { class: 'hd' });
    var inn = el('div', { class: 'hd-in' });

    var a = el('a', { href: href('index.html'), 'aria-label': 'SAAGAR home' });
    a.appendChild(el('img', { class: 'hd-logo', src: href('assets/saagar-logo.png'), alt: 'SAAGAR' }));
    inn.appendChild(a);

    inn.appendChild(el('div', { class: 'hd-brand' }, 'SAAGAR<small>SAGARDAHAL123.COM.NP</small>'));

    var nav = el('nav', { class: 'hd-nav', 'aria-label': 'Main' });
    NAV.forEach(function (it) {
      var cls = [];
      if (it.id === active) cls.push('on');
      if (PRIMARY.indexOf(it.id) === -1) cls.push('sec');
      nav.appendChild(el('a', { href: href(it.url), class: cls.join(' ') }, it.label));
    });
    inn.appendChild(nav);

    var burger = el('button', { class: 'hd-burger', type: 'button', 'aria-label': 'All sections', 'aria-expanded': 'false' }, '☰');
    inn.appendChild(burger);

    var sheet = el('div', { class: 'hd-sheet' });
    var inner = el('div', { class: 'hd-sheet-in' });
    NAV.forEach(function (it) {
      var l = el('a', { href: href(it.url), class: it.id === active ? 'on' : '' },
        '<span class="em">' + it.icon + '</span>' + esc(it.label));
      inner.appendChild(l);
    });
    sheet.appendChild(inner);
    hd.appendChild(inn);
    hd.appendChild(sheet);
    host.replaceWith(hd);

    burger.onclick = function () {
      var open = sheet.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? '✕' : '☰';
    };
  }

  /* ---------- footer ---------- */
  function buildFooter() {
    var host = document.getElementById('ftr');
    if (!host) return;
    var ft = el('footer', { class: 'ft' });
    var inn = el('div', { class: 'ft-in' });
    inn.appendChild(el('div', { class: 'ft-sig' }, 'by Sagar<small>SAGAR DAHAL · SAGARDAHAL123.COM.NP</small>'));
    var links = el('div', { class: 'ft-links' });
    var I = (typeof ICONS !== 'undefined' && ICONS) ? ICONS : null;
    function svg(key, extra, size) { return I ? I.render(key, extra, size) : ''; }
    NAV.concat([
      { label: 'About', url: 'about.html' },
      { label: 'Contact', url: 'contact.html' },
      { label: 'Community rules', url: 'rules.html' },
      { label: 'Report a problem', url: 'report.html' },
      { label: 'Terms', url: 'terms.html' },
      { label: 'Privacy', url: 'privacy.html', icon: svg('privacy') },
      { label: 'Email', url: 'mailto:dahalsaagar8@gmail.com', ext: true, icon: svg('mail') },
      { label: 'Facebook', url: 'https://www.facebook.com/saagar.dahal.50', ext: true, icon: svg('social') }
    ]).forEach(function (p) {
      var link = el('a', p.ext ? { href: p.url, target: '_blank', rel: 'noopener' } : { href: href(p.url) }, p.label);
      if (p.icon) { var ic = el('span', { class: 'ft-ic' }, p.icon); link.insertBefore(ic, link.firstChild); }
      links.appendChild(link);
    });
    inn.appendChild(links);
    inn.appendChild(el('div', { class: 'ft-note' }, '© 2026 SAAGAR · free for everyone · runs in your browser'));
    ft.appendChild(inn);
    host.replaceWith(ft);
  }

  /* ---------- toast ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg, isErr) {
    if (!toastEl) { toastEl = el('div', { id: 'toast' }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.className = isErr ? 'show err' : 'show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = ''; }, 2400);
  }

  /* ---------- BS <-> AD calendar ---------- */
  var NEP_MONTHS = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
                    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
  var NEP_MONTHS_NE = ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
                       'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'];
  var NEP_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function bsMonths(y) {
    if (typeof window.BS_DATA !== 'string' || typeof y !== 'number') return null;
    var s = window.BS_START_YEAR, i = (y - s) * 12;
    if (i < 0 || i + 12 > window.BS_DATA.length) return null;
    var a = [];
    for (var k = 0; k < 12; k++) a.push(parseInt(window.BS_DATA.substr((i + k) * 3, 3), 10));
    return a;
  }
  function bsYearDays(y) { var m = bsMonths(y); return m ? m.reduce(function (a, b) { return a + b; }, 0) : null; }
  function bsRange() {
    if (typeof window.BS_DATA !== 'string') return [2080, 2090];
    return [window.BS_START_YEAR, window.BS_START_YEAR + window.BS_YEARS - 1];
  }

  var ANCHOR_UTC = Date.UTC(1943, 3, 14);   /* BS 2000-01-01 */
  var DAY = 86400000;

  function bsToAd(by, bm, bd) {
    var range = bsRange();
    if (by < range[0] || by > range[1] || bm < 1 || bm > 12) return null;
    var days = 0;
    for (var y = range[0]; y < by; y++) { var n = bsYearDays(y); if (n === null) return null; days += n; }
    var mm = bsMonths(by);
    if (!mm || bd < 1 || bd > mm[bm - 1]) return null;
    for (var m = 1; m < bm; m++) days += mm[m - 1];
    days += bd - 1;
    return new Date(ANCHOR_UTC + days * DAY);
  }
  function adToBs(dt) {
    var range = bsRange();
    var t = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
    var days = Math.floor((t - ANCHOR_UTC) / DAY);
    if (days < 0) return null;
    var y = range[0], n;
    while (true) {
      n = bsYearDays(y);
      if (n === null) return null;
      if (days < n) break;
      days -= n; y++;
      if (y > range[1]) return null;
    }
    var mm = bsMonths(y), m = 1;
    while (days >= mm[m - 1]) { days -= mm[m - 1]; m++; }
    return { year: y, month: m, day: days + 1 };
  }
  function todayBs() { return adToBs(new Date()); }
  function neDigits(v) {
    var map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(v).replace(/[0-9]/g, function (d) { return map[+d]; });
  }
  function bsLabel(bs, nepaliDigits) {
    if (!bs) return '—';
    return (nepaliDigits ? neDigits(bs.day) : bs.day) + ' ' +
           (nepaliDigits ? NEP_MONTHS_NE[bs.month - 1] : NEP_MONTHS[bs.month - 1]) + ' ' +
           (nepaliDigits ? neDigits(bs.year) : bs.year);
  }
  function adLabel(dt) {
    var mo = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
              'August', 'September', 'October', 'November', 'December'];
    var d = new Date(dt);
    return d.getUTCDate() + ' ' + mo[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  function isoUtc(dt) { return new Date(dt).toISOString().slice(0, 10); }

  /* ---------- storage ---------- */
  function store(key, val) {
    try {
      if (val === undefined) { var r = localStorage.getItem('saagar.' + key); return r === null ? null : JSON.parse(r); }
      localStorage.setItem('saagar.' + key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* ---------- misc ---------- */
  function copy(text, label) {
    function ok() { toast(label || 'Copied'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
    function fallback() {
      var t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.left = '-9999px';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); ok(); } catch (e) { toast('Copy failed', true); }
      document.body.removeChild(t);
    }
  }
  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }
  function dataUrlToBlob(durl) {
    var parts = durl.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; }
  function niceDate(dt) {
    var mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return dt.getDate() + ' ' + mo[dt.getMonth()] + ' ' + dt.getFullYear();
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (n) { n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.07 });
    Array.prototype.forEach.call(items, function (n, i) {
      n.style.transitionDelay = (i % 4) * 60 + 'ms';
      io.observe(n);
    });
  }

  function boot() { buildHeader(); buildFooter(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.SAAGAR = {
    root: ROOT, href: href, toast: toast, el: el, esc: esc, pick: pick,
    bs: {
      months: bsMonths, yearDays: bsYearDays, range: bsRange,
      bsToAd: bsToAd, adToBs: adToBs, today: todayBs,
      neDigits: neDigits, bsLabel: bsLabel, adLabel: adLabel, iso: isoUtc,
      MONTHS: NEP_MONTHS, MONTHS_NE: NEP_MONTHS_NE, DAYS: NEP_DAYS
    },
    store: store, copy: copy, downloadBlob: downloadBlob, dataUrlToBlob: dataUrlToBlob,
    pad: pad, niceDate: niceDate
  };
})();
