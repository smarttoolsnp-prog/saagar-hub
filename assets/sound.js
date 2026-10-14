/* ===========================================================
   SAAGAR — sound engine (one file, Web Audio API, no audio files)
   sagardahal123.com.np

   Tune everything from SOUND_CONFIG below. Nothing here touches
   game logic, RNG or bot AI — games just call:
       SAAGAR_SOUND.play('dice')
       SAAGAR_SOUND.play('win', { big: true })

   Audio unlocks on the first tap/click/key (browser autoplay rule).
   Mute, volume and haptics are user settings; sounds duck to 40%
   while voice chat is active.
   =========================================================== */
(function () {
  'use strict';

  /* --------------------------- config --------------------------- */
  var SOUND_CONFIG = {
    master: 0.55,        /* overall gain */
    duckLevel: 0.4,      /* gain multiplier while voice chat is active */
    maxVoices: 6,        /* simultaneous one-shots */
    haptics: false,      /* optional vibration on supported phones */
    uiTapCooldown: 40,   /* ms — stops tap-pop spam */
    enabledDefault: true,
    volumeDefault: 0.6
  };
  /* -------------------------------------------------------------- */

  var ctx = null, master = null, muted = false, volume = SOUND_CONFIG.volumeDefault;
  var ducked = false, unlocked = false, lastTap = 0, voices = 0;
  var KEY = 'saagar.sound.', store;

  function pref(k, d) {
    try { var v = localStorage.getItem(KEY + k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function setPref(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }
  store = pref('set', null);

  function env() {
    if (!ctx) return null;
    var base = SOUND_CONFIG.master * volume * (ducked ? SOUND_CONFIG.duckLevel : 1);
    return { ctx: ctx, out: master, gain: Math.max(0.0001, base) };
  }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended' && c.resume) c.resume();
    unlocked = true;
  }

  /* ---------- tiny synth helpers ---------- */
  function tone(e, when, freq, dur, type, gain, glideTo) {
    var o = e.ctx.createOscillator(), g = e.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, e.ctx.currentTime + when);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), e.ctx.currentTime + when + dur);
    g.gain.setValueAtTime(0.0001, e.ctx.currentTime + when);
    g.gain.exponentialRampToValueAtTime(gain * e.gain, e.ctx.currentTime + when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, e.ctx.currentTime + when + dur);
    o.connect(g); g.connect(e.out);
    o.start(e.ctx.currentTime + when);
    o.stop(e.ctx.currentTime + when + dur + 0.02);
  }
  function noise(e, when, dur, gain, freq, q, type) {
    var n = e.ctx.createBufferSource();
    var len = Math.max(1, Math.floor(e.ctx.sampleRate * dur));
    var buf = e.ctx.createBuffer(1, len, e.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    n.buffer = buf;
    var f = e.ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq || 1200;
    f.Q.value = q || 1.1;
    var g = e.ctx.createGain();
    g.gain.value = gain * e.gain;
    n.connect(f); f.connect(g); g.connect(e.out);
    n.start(e.ctx.currentTime + when);
  }
  function buzz(e, ms) {
    if (!SOUND_CONFIG.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (err) {}
  }

  /* ---------- the sound map ---------- */
  var MAP = {
    /* UI */
    uiTap: function (e) { tone(e, 0, 620, 0.045, 'triangle', 0.5, 400); },
    tapSoft: function (e) { tone(e, 0, 380, 0.04, 'sine', 0.35); },
    turn: function (e) { tone(e, 0, 880, 0.09, 'triangle', 0.45); tone(e, 0.09, 1320, 0.16, 'triangle', 0.35); },
    error: function (e) { tone(e, 0, 200, 0.16, 'square', 0.4, 120); tone(e, 0.13, 150, 0.2, 'square', 0.3, 90); buzz(28); },
    coin: function (e) { tone(e, 0, 1180, 0.07, 'square', 0.28); tone(e, 0.05, 1560, 0.12, 'triangle', 0.22); },

    /* dice: rapid ticks slowing into a wooden thud */
    dice: function (e) {
      var t = 0, gap = 0.045;
      for (var i = 0; i < 12; i++) { noise(e, t, 0.02, 0.32, 2400 - i * 60, 2.2, 'highpass'); t += gap; gap *= 1.12; }
    },
    diceLand: function (e) { noise(e, 0, 0.11, 0.6, 420, 0.9, 'lowpass'); tone(e, 0, 150, 0.16, 'triangle', 0.5, 90); buzz(18); },

    /* board movement */
    hop: function (e, i) { tone(e, 0, 520 + (i || 0) * 42, 0.085, 'triangle', 0.42, 660 + (i || 0) * 42); },
    capture: function (e) { noise(e, 0, 0.22, 0.4, 900, 1.4, 'bandpass'); tone(e, 0.05, 700, 0.22, 'sine', 0.35, 260); buzz(30); },
    home: function (e) { [0, 0.1, 0.2, 0.34].forEach(function (t, i) { tone(e, t, 660 * Math.pow(1.19, i), 0.22, 'triangle', 0.4); }); },

    /* snakes & ladders */
    ladder: function (e) { [0, 0.09, 0.18, 0.28, 0.4].forEach(function (t, i) { tone(e, t, 520 * Math.pow(1.26, i), 0.24, 'sine', 0.38); }); },
    snake: function (e) { tone(e, 0, 1100, 0.5, 'sine', 0.32, 190); noise(e, 0.02, 0.5, 0.18, 700, 1.0, 'bandpass'); },

    /* carrom */
    carromFlick: function (e) { noise(e, 0, 0.05, 0.5, 1800, 1.6, 'highpass'); },
    coinTik: function (e) { tone(e, 0, 1500, 0.05, 'square', 0.26); },
    rimTok: function (e) { tone(e, 0, 900, 0.06, 'square', 0.3, 700); },
    pocket: function (e) { tone(e, 0, 420, 0.18, 'sine', 0.4, 150); tone(e, 0.12, 260, 0.12, 'sine', 0.25, 120); },
    queen: function (e) { [0, 0.12, 0.24].forEach(function (t, i) { tone(e, t, 880 * Math.pow(1.33, i), 0.3, 'triangle', 0.36); }); },

    /* cards & chips */
    cardFlip: function (e) { noise(e, 0, 0.14, 0.42, 2600, 0.9, 'highpass'); tone(e, 0.02, 380, 0.08, 'triangle', 0.2, 620); },
    chipClink: function (e) { tone(e, 0, 2100, 0.045, 'triangle', 0.24); tone(e, 0.03, 1600, 0.07, 'triangle', 0.18); },
    potCascade: function (e) { for (var i = 0; i < 7; i++) tone(e, i * 0.055, 1400 + i * 130, 0.07, 'triangle', 0.22); },

    /* other games */
    checker: function (e) { tone(e, 0, 300, 0.06, 'square', 0.34, 220); },
    drop4: function (e) { tone(e, 0, 700, 0.06, 'triangle', 0.26, 500); tone(e, 0.28, 180, 0.16, 'sine', 0.45, 120); },
    pencil: function (e) { noise(e, 0, 0.06, 0.35, 3200, 1.2, 'highpass'); },
    rpsThump: function (e, i) { tone(e, 0, 200 + (i || 0) * 30, 0.12, 'sine', 0.42, 150); },
    blip: function (e, i) { tone(e, 0, 640 + Math.min(8, i || 0) * 55, 0.05, 'square', 0.28); },

    /* outcomes */
    win: function (e, o) {
      var notes = (o && o.big) ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
      notes.forEach(function (f, i) { tone(e, i * 0.11, f, 0.32, 'triangle', 0.44); });
      tone(e, notes.length * 0.11, notes[notes.length - 1] * 2, 0.4, 'sine', 0.2);
      buzz(45);
    },
    lose: function (e) { [440, 392, 330].forEach(function (f, i) { tone(e, i * 0.14, f, 0.3, 'sine', 0.34); }); },
    streak: function (e) { [660, 880, 1100].forEach(function (f, i) { tone(e, i * 0.08, f, 0.2, 'triangle', 0.34); }); }
  };

  /* ---------- public API ---------- */
  function play(name, opts) {
    if (muted || !SOUND_CONFIG.enabledDefault) return;
    if (!pref('on', true)) return;
    var fn = MAP[name];
    if (!fn) return;
    var c = ensure();
    if (!c) return;
    if (!unlocked) return;                      /* stays silent until the first tap */
    if (voices >= SOUND_CONFIG.maxVoices) return;
    var e = env();
    if (!e) return;
    voices++;
    try { fn(e, opts || {}); } catch (err) {}
    setTimeout(function () { voices = Math.max(0, voices - 1); }, 700);
  }

  function setMuted(v) {
    muted = !!v;
    setPref('muted', muted);
    syncUI();
    if (!muted) play('tapSoft');
  }
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, Number(v)));
    setPref('volume', volume);
    syncUI();
  }
  function duck(on, why) {
    ducked = !!on;
    var bar = document.querySelector('.sound-note');
    if (bar) bar.textContent = ducked ? (why || 'Voice is on — sounds are quieter') : '';
  }
  function isOn() { return !muted && pref('on', true) !== false; }

  /* ---------- UI: mute toggle in the settings panel ---------- */
  function syncUI() {
    var b = document.querySelector('.sound-toggle');
    if (b) {
      b.textContent = isOn() ? '🔊' : '🔇';
      b.setAttribute('aria-pressed', isOn() ? 'true' : 'false');
      b.title = isOn() ? 'Sound on' : 'Sound muted';
    }
    var s = document.querySelector('.sound-vol');
    if (s) s.value = String(volume);
  }
  function buildUI() {
    var sheet = document.querySelector('.hd-sheet-in');
    if (!sheet || sheet.querySelector('.sound-row')) return;
    var row = document.createElement('div');
    row.className = 'set-row sound-row';
    var lab = document.createElement('span');
    lab.className = 'set-lab';
    lab.textContent = (document.documentElement.getAttribute('data-lang') === 'ne') ? 'आवाज' : 'Sound';
    var ctl = document.createElement('div');
    ctl.className = 'set-ctl';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'set-pill sound-toggle';
    btn.onclick = function () { setMuted(isOn()); };
    var vol = document.createElement('input');
    vol.type = 'range';
    vol.min = '0'; vol.max = '1'; vol.step = '0.1';
    vol.className = 'sound-vol';
    vol.setAttribute('aria-label', 'Volume');
    vol.value = String(volume);
    vol.oninput = function () { setVolume(vol.value); if (isOn()) play('uiTap'); };
    ctl.appendChild(btn); ctl.appendChild(vol);
    row.appendChild(lab); row.appendChild(ctl);
    var settings = sheet.querySelector('.hd-settings');
    if (settings) settings.appendChild(row); else sheet.appendChild(row);
    var note = document.createElement('p');
    note.className = 'sound-note';
    note.style.cssText = 'font-size:11.5px;color:#a5b4fc;margin:2px 0 0';
    row.after(note);
    syncUI();
  }

  /* ---------- unlock + global UI taps ---------- */
  function firstGesture() {
    unlock();
    document.removeEventListener('pointerdown', firstGesture, true);
    document.removeEventListener('keydown', firstGesture, true);
  }
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('keydown', firstGesture, true);

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    while (t && t !== document.body) {
      if (t.tagName === 'BUTTON' || t.classList.contains('btn') ||
          t.classList.contains('play') || t.classList.contains('set-pill') ||
          t.classList.contains('dpad')) {
        var now = Date.now();
        if (now - lastTap > SOUND_CONFIG.uiTapCooldown) { lastTap = now; play('uiTap'); }
        return;
      }
      t = t.parentNode;
    }
  }, true);

  muted = !!pref('muted', false);
  volume = pref('volume', SOUND_CONFIG.volumeDefault);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI); else buildUI();
  document.addEventListener('click', function () { setTimeout(buildUI, 60); }, true);

  window.SAAGAR_SOUND = {
    CONFIG: SOUND_CONFIG,
    play: play,
    on: isOn,
    mute: setMuted,
    volume: setVolume,
    duck: duck,
    unlock: unlock,
    haptics: function (v) { SOUND_CONFIG.haptics = !!v; },
    MAP: Object.keys(MAP)
  };
})();
