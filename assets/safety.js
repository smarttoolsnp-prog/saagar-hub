/* ===========================================================
   SAAGAR — room safety (feature flags, age gate, chat filter,
   rate limiting) for text chat and voice rooms.

   Loaded on every page from the shell, so it is always present
   before assets/chat.js and assets/voice.js wake up.

   Public API
     SAAGAR_SAFETY.flags()               -> { chat, voice, filter, rateLimit }
     SAAGAR_SAFETY.voiceAllowed()        -> boolean (false for under-16)
     SAAGAR_SAFETY.isMinor()             -> boolean
     SAAGAR_SAFETY.ensureAge(cb)         -> asks once, then cb(minor)
     SAAGAR_SAFETY.check(text)           -> { ok, clean, why }
     SAAGAR_SAFETY.allowSend()           -> { ok, wait }
     SAAGAR_SAFETY.applyRoomFlags(o)     -> per-room overrides from the lobby

   Owner control (temporary, no deploy): add ?flags=chat:0,voice:0 to a room
   URL, or set localStorage 'saagar.flags' = {"chat":false,"voice":false}.
   =========================================================== */
(function () {
  'use strict';

  var KEY = 'saagar.';

  function store(k, v) {
    try {
      if (v === undefined) { var r = localStorage.getItem(KEY + k); return r === null ? null : JSON.parse(r); }
      localStorage.setItem(KEY + k, JSON.stringify(v));
    } catch (e) { return null; }
  }

  /* ---------- feature flags (kill switches) ---------- */
  var FLAGS = { chat: true, voice: true, filter: true, rateLimit: true };

  function loadFlags() {
    var saved = store('flags');
    if (saved && typeof saved === 'object') {
      for (var k in FLAGS) if (typeof saved[k] === 'boolean') FLAGS[k] = saved[k];
    }
    /* ?flags=chat:0,voice:0 — handy for testing without a deploy */
    try {
      var m = /[?&]flags=([^&]+)/.exec(location.search);
      if (m) {
        decodeURIComponent(m[1]).split(',').forEach(function (pair) {
          var kv = pair.split(':');
          if (kv.length === 2 && kv[0] in FLAGS) FLAGS[kv[0]] = !(kv[1] === '0' || kv[1] === 'false');
        });
      }
    } catch (e) {}
  }
  loadFlags();

  function setFlag(name, on) {
    if (!(name in FLAGS)) return false;
    FLAGS[name] = !!on;
    var saved = store('flags') || {};
    saved[name] = !!on;
    store('flags', saved);
    return true;
  }

  /* ---------- age group ---------- */
  var AGE_LABEL = { u16: 'under 16', u18: '16–17', adult: '18+' };
  /* NOTE: store(k) with no value reads; store(k, v) writes. Passing null here
     used to hit the write branch, so the age gate never saw a saved answer. */
  function ageGroup() { return store('ageGroup'); }
  function isMinor() { return ageGroup() === 'u16'; }
  function voiceAllowed() {
    if (!FLAGS.voice) return false;
    if (isMinor()) return false;          /* under 16 → voice off by default */
    return true;
  }

  function askAge(cb) {
    var done = function (g) { store('ageGroup', g); if (cb) cb(g); };
    var wrap = document.createElement('div');
    wrap.className = 'safety-age';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Age group');
    wrap.innerHTML =
      '<div class="sa-card">' +
        '<h3>Before you join a room</h3>' +
        '<p>Rooms have text chat and optional voice. Tell us your age group so we can set the right limits — it stays on your device and is never sent anywhere.</p>' +
        '<div class="sa-opts">' +
          '<button type="button" data-g="u16">Under 16</button>' +
          '<button type="button" data-g="u18">16–17</button>' +
          '<button type="button" data-g="adult">18 or older</button>' +
        '</div>' +
        '<p class="sa-note">Under 16: quick reactions only, voice off. See the <a href="rules.html">community rules</a>.</p>' +
      '</div>';
    document.body.appendChild(wrap);
    Array.prototype.forEach.call(wrap.querySelectorAll('button[data-g]'), function (b) {
      b.onclick = function () {
        var g = b.getAttribute('data-g');
        wrap.remove();
        done(g);
      };
    });
    var first = wrap.querySelector('button');
    if (first) first.focus();
  }

  function ensureAge(cb) {
    var g = ageGroup();
    if (g) { if (cb) cb(g); return g; }
    askAge(function (v) {
      if (window.SAAGAR_SOUND) window.SAAGAR_SOUND.play('tapSoft');
      if (cb) cb(v);
    });
    return null;
  }

  /* ---------- message filtering ----------
     Small curated lists — enough to catch the common cases in Nepali,
     Roman Nepali and English without turning normal words into false
     positives. Matched on word boundaries after normalisation. */
  var BAD_EN = ['fuck', 'fucking', 'fuk', 'fck', 'shit', 'bitch', 'bastard', 'asshole', 'dick',
    'pussy', 'whore', 'slut', 'rape', 'raped', 'retard', 'faggot', 'nigger', 'nigga',
    'motherfucker', 'cunt', 'wanker', 'moron', 'idiot', 'stupid'];
  var BAD_ROMAN_NP = ['murkh', 'murka', 'kutta', 'kuti', 'kukkur', 'gadha', 'harami', 'harame',
    'chhinal', 'chinaal', 'chhinal', 'randi', 'randy', 'jhatu', 'jatha', 'lado', 'loda',
    'bhosadi', 'bhosdike', 'madarchod', 'bhenchod', 'behenchod', 'chakka', 'hijada',
    'kamina', 'kamin', 'saala', 'sala', 'sali', 'gandu', 'gaand', 'chikne', 'chikni',
    'tharkee', 'tharki', 'nangaa', 'nachaine', 'bhatij'];
  var BAD_NE = ['मूर्ख', 'कुकुर', 'राँडी', 'हरामी', 'चिनाल', 'गधा', 'छिनाल', 'जाठू',
    'भोसडी', 'मादरचोद', 'भेनचोद', 'गान्डु', 'लाडो', 'थरकी', 'नांगा', 'कमिना', 'साला'];

  /* things that are banned outright for policy reasons (not just rude) */
  var BANNED_PATTERNS = [
    { re: /\b(bet|betting|satta|judi|जुवा|casino|poker\s*cash|real\s*money|deposit|withdraw|cash\s*out|top\s*up\s*chips)\b/i,
      why: 'real-money gambling' },
    { re: /\b(crypto|usdt|btc|binance|forex\s*signal|double\s*your\s*money|investment\s*scheme|loan\s*offer)\b/i,
      why: 'money schemes' },
    { re: /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|np|io|in|me|xyz|info|link)\b)/i,
      why: 'links are off in chat' },
    { re: /(?:\+977[\s-]?)?\b9[6-9]\d{8}\b|\b\d{10}\b/, why: 'phone numbers are private' },
    { re: /(?:\b\d{1,3}[-.\s]?){3,}\d{2,}\b/, why: 'long number sequences' },
    { re: /\b(whatsapp|telegram|imo|viber)\b\s*[:+=]?\s*\S+/i, why: 'contact sharing' }
  ];

  /* simple obfuscation handling: leetspeak, stretched letters, zero-width */
  function normalise(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u200b-\u200f\u2028-\u202f\ufeff]/g, '')
      .replace(/[@]/g, 'a').replace(/[4]/g, 'a').replace(/[$5]/g, 's').replace(/[1!|]/g, 'i')
      .replace(/[3]/g, 'e').replace(/[0]/g, 'o').replace(/[7]/g, 't').replace(/[8]/g, 'b')
      .replace(/(.)\1{2,}/g, '$1$1')            /* sooo → soo */
      .replace(/\s+/g, ' ')
      .trim();
  }
  function wordHit(text, list) {
    var norm = normalise(text);
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (norm.indexOf(w) === -1) continue;
      var re = new RegExp('(^|[^a-z0-9\\u0900-\\u097f])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9\\u0900-\\u097f]|$)');
      if (re.test(norm)) return w;
    }
    return null;
  }

  function mask(word) { return word.charAt(0) + new Array(Math.max(2, word.length - 1)).join('*'); }

  function check(text) {
    var raw = String(text || '');
    if (!FLAGS.filter) return { ok: true, clean: raw };
    if (!raw.trim()) return { ok: false, why: 'empty message' };

    for (var i = 0; i < BANNED_PATTERNS.length; i++) {
      var b = BANNED_PATTERNS[i];
      if (b.re.test(raw)) return { ok: false, why: b.why, clean: raw };
    }

    var hit = wordHit(raw, BAD_EN) || wordHit(raw, BAD_ROMAN_NP) || wordHit(raw, BAD_NE);
    if (hit) {
      /* keep the message but star it out — less confrontation than a block */
      var clean = raw;
      try {
        clean = raw.replace(new RegExp(hit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), mask(hit));
      } catch (e) {}
      return { ok: true, clean: clean, warned: true, why: 'bad language' };
    }
    return { ok: true, clean: raw };
  }

  /* ---------- rate limiting ---------- */
  var RULES = { perMinute: 20, perTenSeconds: 5, minGapMs: 700, repeatWindowMs: 15000 };
  var hits = [], lastText = '', lastAt = 0, repeats = 0;

  function allowSend() {
    if (!FLAGS.rateLimit) return { ok: true };
    var now = Date.now();
    hits = hits.filter(function (t) { return now - t < 60000; });
    var last10 = hits.filter(function (t) { return now - t < 10000; }).length;
    if (now - lastAt < RULES.minGapMs) return { ok: false, wait: RULES.minGapMs - (now - lastAt), why: 'slow down' };
    if (last10 >= RULES.perTenSeconds) return { ok: false, wait: 4000, why: 'too many messages at once' };
    if (hits.length >= RULES.perMinute) return { ok: false, wait: 20000, why: 'message limit for this minute' };
    return { ok: true };
  }
  function noteSent(text) {
    var now = Date.now();
    hits.push(now);
    var norm = normalise(text);
    if (norm && norm === lastText && now - lastAt < RULES.repeatWindowMs) {
      repeats++;
    } else { repeats = 0; lastText = norm; }
    lastAt = now;
    return repeats < 3;                    /* 4th identical message in a row = spam */
  }

  /* ---------- per-room overrides from the lobby ---------- */
  var roomFlags = null;
  function applyRoomFlags(o) {
    roomFlags = (o && typeof o === 'object') ? o : null;
  }
  function flag(name) {
    if (roomFlags && typeof roomFlags[name] === 'boolean') return roomFlags[name];
    return !!FLAGS[name];
  }

  /* ---------- styles ---------- */
  function css() {
    if (document.getElementById('safetyCSS')) return;
    var s = document.createElement('style');
    s.id = 'safetyCSS';
    s.textContent = [
      '.safety-age{position:fixed;inset:0;z-index:9000;background:rgba(18,12,44,.72);display:grid;place-items:center;padding:18px;}',
      '.safety-age .sa-card{background:#fff;color:#2a1f78;border-radius:26px;max-width:420px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.35);}',
      '.safety-age h3{margin:0 0 8px;font-size:19px;font-weight:900;}',
      '.safety-age p{margin:0 0 14px;font-size:13.5px;font-weight:700;color:#6b6f9c;line-height:1.55;}',
      '.safety-age .sa-opts{display:grid;gap:9px;}',
      '.safety-age .sa-opts button{font:inherit;font-weight:800;padding:14px;border:0;border-radius:999px;background:#eef0ff;color:#2a1f78;box-shadow:0 6px 16px rgba(79,70,229,.18);cursor:pointer;min-height:48px;}',
      '.safety-age .sa-opts button:first-child{background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;}',
      '.safety-age .sa-note{font-size:11.5px;margin:12px 0 0;}',
      '.chat-form.locked input,.chat-form.locked .send{opacity:.45;pointer-events:none;}',
      '.chat-locked-note{font-size:11.5px;font-weight:800;color:#fbbf24;padding:6px 2px 2px;text-align:center;}'
    ].join('');
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', css); else css();

  window.SAAGAR_SAFETY = {
    flags: function () { return { chat: flag('chat'), voice: voiceAllowed(), filter: !!FLAGS.filter, rateLimit: !!FLAGS.rateLimit }; },
    setFlag: setFlag,
    flag: flag,
    isMinor: isMinor,
    ageGroup: ageGroup,
    AGE_LABEL: AGE_LABEL,
    voiceAllowed: voiceAllowed,
    ensureAge: ensureAge,
    check: check,
    allowSend: allowSend,
    noteSent: noteSent,
    applyRoomFlags: applyRoomFlags,
    normalise: normalise,
    RULES: RULES
  };
})();
