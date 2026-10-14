/* ===========================================================
   SAAGAR — settings, language switch, lite mode, PWA hookup
   Loaded after assets/app.js on every page.

   Prefs (localStorage, all optional):
     saagar.theme  light | dark | auto      (default auto)
     saagar.font   1 | 1.15 | 1.3           (default 1)
     saagar.lite   true | false             (default: auto-detect)
     saagar.lang   en | ne                  (default en)

   Nothing here touches game logic, RNG, bot AI or tool maths.
   =========================================================== */
(function () {
  'use strict';

  var HTML = document.documentElement;
  var KEY = 'saagar.';
  function get(k, d) {
    try { var v = localStorage.getItem(KEY + k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- low-end / data-saver detection ---------- */
  function autoLite() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType || ''))) return true;
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2) return true;
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) return true;
    return false;
  }
  function motionOff() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- language ---------- */
  var DICT = {
    en: {
      home: 'Home', tools: 'Tools', games: 'Games', skills: 'Skills', laws: 'Laws', daily: 'Daily',
      dailyLong: 'Daily challenge',
      play: 'Play now', chat: 'chat in room', privacy: 'Privacy', contact: 'Contact',
      about: 'About', terms: 'Terms', rules: 'Community rules', report: 'Report a problem',
      more: 'Settings', theme: 'Theme', font: 'Text size', lite: 'Lite mode', lang: 'Language',
      themeAuto: 'Auto', themeLight: 'Light', themeDark: 'Dark',
      fontS: 'A', fontM: 'A', fontL: 'A',
      liteOn: 'On', liteOff: 'Off',
      footNote: '© 2026 SAAGAR · free for everyone · runs in your browser',
      langName: 'English'
    },
    ne: {
      home: 'गृहपृष्ठ', tools: 'औजार', games: 'खेल', skills: 'सीप', laws: 'कानुन', daily: 'दैनिक',
      dailyLong: 'दैनिक चुनौती',
      play: 'अहिले खेल्नुहोस्', chat: 'कोठामा कुराकानी', privacy: 'गोपनीयता', contact: 'सम्पर्क',
      about: 'बारेमा', terms: 'सर्तहरू', rules: 'समुदायका नियम', report: 'समस्या पठाउनुहोस्',
      more: 'सेटिङ', theme: 'रङ', font: 'अक्षर आकार', lite: 'लाइट मोड', lang: 'भाषा',
      themeAuto: 'स्वतः', themeLight: 'उज्यालो', themeDark: 'अँध्यारो',
      fontS: 'A', fontM: 'A', fontL: 'A',
      liteOn: 'अन', liteOff: 'अफ',
      footNote: '© २०२६ SAAGAR · सबैका लागि निःशुल्क · ब्राउजरमै चल्छ',
      langName: 'नेपाली'
    }
  };
  function t(key) {
    var lang = state.lang;
    return (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
  }

  var state = {
    theme: get('theme', 'auto'),
    font: get('font', 1),
    lite: get('lite', null),
    lang: get('lang', 'en')
  };
  if (state.lite === null) { state.lite = autoLite(); set('lite', state.lite); }

  /* ---------- apply ---------- */
  function applyTheme() {
    var mode = state.theme;
    if (mode === 'auto') {
      mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    HTML.setAttribute('data-theme', mode);
  }
  function apply() {
    applyTheme();
    HTML.setAttribute('data-font', String(state.font));
    HTML.classList.toggle('lite', !!state.lite);
    HTML.setAttribute('lang', state.lang === 'ne' ? 'ne' : 'en');
    HTML.setAttribute('data-lang', state.lang);
    translate();
  }

  /* ---------- translate shared chrome (nav, buttons, footer) ---------- */
  function translate() {
    var lang = state.lang;
    var pairs = [
      ['.hd-nav a', { 'Home': 'home', 'Tools': 'tools', 'Games': 'games', 'Daily': 'daily', 'Daily challenge': 'dailyLong', 'Skills': 'skills', 'Laws': 'laws' }],
      ['.hd-sheet-in > a', { 'Home': 'home', 'Tools': 'tools', 'Games': 'games', 'Daily': 'daily', 'Daily challenge': 'dailyLong', 'Skills': 'skills', 'Laws': 'laws' }],
      ['.ft-links a', { 'Privacy': 'privacy', 'Contact': 'contact', 'About': 'about', 'Terms': 'terms', 'Community rules': 'rules', 'Report a problem': 'report', 'Report': 'report', 'Home': 'home', 'Tools': 'tools', 'Games': 'games', 'Daily challenge': 'dailyLong', 'Daily': 'daily', 'Skills': 'skills', 'Laws': 'laws' }],
      ['.gcard .play', { 'Play now →': 'play', 'Play now': 'play' }],
      ['.gcard .online', { '💬 chat in room': 'chat' }]
    ];
    pairs.forEach(function (pair) {
      var nodes = document.querySelectorAll(pair[0]);
      Array.prototype.forEach.call(nodes, function (n) {
        var raw = (n.getAttribute('data-i18n-plain') || n.textContent).trim();
        var emoji = '';
        if (pair[0].indexOf('online') > -1) { emoji = '💬 '; raw = raw.replace('💬', '').trim(); }
        var key = pair[1][raw];
        if (!key) return;
        if (!n.hasAttribute('data-i18n-plain')) n.setAttribute('data-i18n-plain', raw);
        n.textContent = (lang === 'ne' ? emoji : emoji) + t(key);
      });
    });
    var foot = document.querySelector('.ft-note');
    if (foot) foot.textContent = t('footNote');
  }

  /* ---------- settings UI inside the burger sheet ---------- */
  function row(labelKey, controls) {
    var wrap = document.createElement('div');
    wrap.className = 'set-row';
    var lab = document.createElement('span');
    lab.className = 'set-lab';
    lab.textContent = t(labelKey);
    wrap.appendChild(lab);
    var box = document.createElement('div');
    box.className = 'set-ctl';
    controls.forEach(function (c) { box.appendChild(c); });
    wrap.appendChild(box);
    return wrap;
  }
  function pill(text, on, handler, title) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'set-pill' + (on ? ' on' : '');
    b.textContent = text;
    if (title) b.title = title;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.onclick = handler;
    return b;
  }
  var ui = {};

  function buildUI() {
    var sheet = document.querySelector('.hd-sheet-in');
    if (!sheet || sheet.querySelector('.hd-settings')) return;
    var box = document.createElement('div');
    box.className = 'hd-settings';

    var head = document.createElement('div');
    head.className = 'set-head';
    head.textContent = t('more');
    box.appendChild(head);

    var grp;

    /* theme */
    grp = [
      pill(t('themeAuto'), state.theme === 'auto', function () { state.theme = 'auto'; set('theme', 'auto'); apply(); draw(); }),
      pill(t('themeLight'), state.theme === 'light', function () { state.theme = 'light'; set('theme', 'light'); apply(); draw(); }),
      pill(t('themeDark'), state.theme === 'dark', function () { state.theme = 'dark'; set('theme', 'dark'); apply(); draw(); })
    ];
    ui.theme = grp;
    box.appendChild(row('theme', grp));

    /* font size */
    grp = [
      pill(t('fontS'), state.font == 1, function () { state.font = 1; set('font', 1); apply(); draw(); }, 'Normal'),
      pill(t('fontM'), state.font == 1.15, function () { state.font = 1.15; set('font', 1.15); apply(); draw(); }, 'Large'),
      pill(t('fontL'), state.font == 1.3, function () { state.font = 1.3; set('font', 1.3); apply(); draw(); }, 'Largest')
    ];
    grp[0].classList.add('f-s'); grp[1].classList.add('f-m'); grp[2].classList.add('f-l');
    ui.font = grp;
    box.appendChild(row('font', grp));

    /* lite mode */
    grp = [
      pill(t('liteOff'), !state.lite, function () { state.lite = false; set('lite', false); apply(); draw(); }),
      pill(t('liteOn'), !!state.lite, function () { state.lite = true; set('lite', true); apply(); draw(); })
    ];
    ui.lite = grp;
    box.appendChild(row('lite', grp));

    /* language */
    grp = [
      pill('English', state.lang === 'en', function () { state.lang = 'en'; set('lang', 'en'); apply(); draw(); }),
      pill('नेपाली', state.lang === 'ne', function () { state.lang = 'ne'; set('lang', 'ne'); apply(); draw(); })
    ];
    ui.lang = grp;
    box.appendChild(row('lang', grp));

    sheet.appendChild(box);
    var hint = document.createElement('a');
    hint.className = 'set-home';
    hint.href = (window.SAAGAR && window.SAAGAR.href) ? window.SAAGAR.href('report.html') : 'report.html';
    hint.textContent = t('report');
    hint.setAttribute('data-set-report', '1');
    box.appendChild(hint);
  }

  function draw() {
    function sync(grp, onIdx) {
      if (!grp) return;
      grp.forEach(function (b, i) {
        b.classList.toggle('on', i === onIdx);
        b.setAttribute('aria-pressed', i === onIdx ? 'true' : 'false');
      });
    }
    sync(ui.theme, state.theme === 'auto' ? 0 : (state.theme === 'light' ? 1 : 2));
    sync(ui.font, state.font == 1 ? 0 : (state.font == 1.15 ? 1 : 2));
    sync(ui.lite, state.lite ? 1 : 0);
    sync(ui.lang, state.lang === 'ne' ? 1 : 0);
    var s = document.querySelector('.hd-settings .set-head'); if (s) s.textContent = t('more');
    var rows = document.querySelectorAll('.hd-settings .set-lab');
    var names = ['theme', 'font', 'lite', 'lang'];
    Array.prototype.forEach.call(rows, function (n, i) { if (names[i]) n.textContent = t(names[i]); });
    var rep = document.querySelector('.hd-settings .set-home');
    if (rep) rep.textContent = t('report');
    var buttons = document.querySelectorAll('.hd-settings .set-row');
    Array.prototype.forEach.call(buttons, function (n, i) {
      var pills = n.querySelectorAll('.set-pill');
      if (i === 0) { pills[0].textContent = t('themeAuto'); pills[1].textContent = t('themeLight'); pills[2].textContent = t('themeDark'); }
      if (i === 2) { pills[0].textContent = t('liteOff'); pills[1].textContent = t('liteOn'); }
    });
  }

  /* ---------- PWA: install prompt ---------- */
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvt = e;
    buildInstallRow();
  });
  window.addEventListener('appinstalled', function () {
    installEvt = null;
    var row = document.querySelector('.install-row');
    if (row) row.remove();
  });

  function buildInstallRow() {
    var settings = document.querySelector('.hd-settings');
    if (!settings || settings.querySelector('.install-row')) return;
    var row = document.createElement('div');
    row.className = 'set-row install-row';
    var lab = document.createElement('span');
    lab.className = 'set-lab';
    lab.textContent = state.lang === 'ne' ? 'एप' : 'App';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'set-pill';
    btn.textContent = state.lang === 'ne' ? 'इन्स्टल गर्नुहोस्' : 'Install';
    btn.onclick = function () {
      if (!installEvt) return;
      installEvt.prompt();
      installEvt.userChoice.then(function () { installEvt = null; });
    };
    row.appendChild(lab); row.appendChild(btn);
    settings.appendChild(row);
  }

  /* ---------- PWA: service worker ---------- */
  function pwa() {
    var link = document.createElement('link');
    link.rel = 'manifest';
    link.href = (window.SAAGAR && window.SAAGAR.href) ? window.SAAGAR.href('manifest.webmanifest') : 'manifest.webmanifest';
    document.head.appendChild(link);
    var theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#7c3aed';
    document.head.appendChild(theme);
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register((window.SAAGAR && window.SAAGAR.root ? window.SAAGAR.root : '') + 'sw.js').catch(function () {});
      });
    }
  }

  function boot() {
    apply();
    buildUI();
    draw();
    pwa();
    /* follow the OS theme while in auto */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', function () { if (state.theme === 'auto') applyTheme(); });
    }
    /* keep page content translated after other scripts inject UI */
    setTimeout(translate, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  /* public API for pages that want to opt in */
  window.SAAGAR_SETTINGS = {
    get: function (k) { return state[k]; },
    t: t,
    setLang: function (l) { state.lang = l; set('lang', l); apply(); draw(); },
    setTheme: function (v) { state.theme = v; set('theme', v); apply(); draw(); },
    setLite: function (v) { state.lite = !!v; set('lite', !!v); apply(); draw(); },
    apply: apply,
    mascot: function (pose, size) {
      return (window.SAAGAR_MASCOT) ? window.SAAGAR_MASCOT.html(pose, size) : '';
    },
    lite: function () { return !!state.lite; },
    motionOff: motionOff
  };
})();
