/* ===========================================================
   SAAGAR — room chat (text + emoji + emoji sounds)
   Attaches to any online room created by assets/net.js.
   Auto-wired from assets/lobby.js, so every multiplayer game
   gets chat without a single line of per-game code.

   Sounds: the six regular emotional emojis play a matching
   sound when sent or received. Audio is synthesised here into
   a tiny WAV buffer — no files, no CDN, no keys. A quick bar
   on the LEFT side of the screen offers them one tap away.
   =========================================================== */
(function () {
  'use strict';

  /* this file lives in assets/ — derive our own URL so voice.js loads
     correctly from any game page (/games/x.html, /tools/x.html, …) */
  var MYDIR = (document.currentScript && document.currentScript.src
    ? document.currentScript.src.replace(/[?#].*$/, '').replace(/[^/]*$/, '')
    : 'assets/');

  /* ---- emoji sounds: 6 regular emotional ones ---- */
  var EMOJI_SOUNDS = {
    '\u{1F602}': 'laugh',  /* 😂 */
    '\u{1F923}': 'laugh',  /* 🤣 */
    '\u{1F62D}': 'cry',    /* 😭 */
    '\u{1F622}': 'cry',    /* 😢 */
    '\u{1F621}': 'angry',  /* 😡 */
    '\u{1F624}': 'angry',  /* 😤 */
    '\u{1F62F}': 'shock',  /* 😯 */
    '\u{1F631}': 'shock',  /* 😱 */
    '\u{1F914}': 'hmm',    /* 🤔 */
    '\u{1F389}': 'cheer'   /* 🎉 */
  };
  var QUICK = ['\u{1F602}', '\u{1F62D}', '\u{1F621}', '\u{1F631}', '\u{1F914}', '\u{1F389}'];
  var QUICK_LABEL = {
    laugh: '😂 laughing', cry: '😭 crying', angry: '😡 angry',
    shock: '😱 shocked', hmm: '🤔 thinking', cheer: '🎉 cheer'
  };
  var soundCache = {};

  function makeSound(kind) {
    if (soundCache[kind]) return soundCache[kind];
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var rate = 22050;
    var len = kind === 'laugh' ? 0.9 : (kind === 'cry' || kind === 'cheer') ? 1.1 : 0.55;
    var buf = new AC().createBuffer(1, Math.ceil(rate * len), rate);
    var data = buf.getChannelData(0);
    var ph = 0;
    for (var i = 0; i < data.length; i++) {
      var t = i / rate, out = 0;
      if (kind === 'laugh') {          /* ha-ha-ha: three rising bursts */
        var stp = Math.floor(t / 0.3);
        var local = t % 0.3;
        var env = Math.exp(-local * 9) * (local < 0.05 ? local / 0.05 : 1);
        ph += 2 * Math.PI * (300 + stp * 60) / rate;
        out = Math.sin(ph) * env * 0.5;
      } else if (kind === 'cry') {     /* descending wail with tremolo */
        var f = 620 - 340 * (t / 1.1);
        ph += 2 * Math.PI * (f + Math.sin(2 * Math.PI * 7 * t) * 24) / rate;
        var env2 = Math.min(1, t * 8) * Math.exp(-t * 1.6);
        out = (Math.sin(ph) * 0.42 + Math.sin(ph * 2.02) * 0.12) * env2;
      } else if (kind === 'angry') {   /* low growl */
        ph += 2 * Math.PI * 110 / rate;
        var ph2 = ph * 113 / 110;
        var env3 = Math.exp(-t * 3.4) * Math.min(1, t * 40);
        out = Math.sin(ph) * Math.sin(ph2) * env3 * 0.55;
      } else if (kind === 'shock') {   /* sharp rising sting */
        ph += 2 * Math.PI * (880 + 660 * t / 0.55) / rate;
        out = Math.sin(ph) * Math.exp(-t * 6) * 0.5;
      } else if (kind === 'hmm') {     /* rising hmm */
        ph += 2 * Math.PI * (330 + 120 * t / 0.55) / rate;
        out = Math.sin(ph) * Math.min(1, t * 10) * Math.exp(-t * 3.2) * 0.4;
      } else {                         /* cheer: quick major arpeggio */
        var notes = [523, 659, 784, 1047];
        var idx = Math.min(3, Math.floor(t / 0.27));
        ph += 2 * Math.PI * notes[idx] / rate;
        var env6 = Math.exp(-(t % 0.27) * 4) * (t < 1.08 ? 1 : Math.exp(-(t - 1.08) * 20));
        out = Math.sin(ph) * env6 * 0.4;
      }
      data[i] = Math.max(-1, Math.min(1, out));
    }
    soundCache[kind] = buf;
    return buf;
  }

  var lastPlayed = {};
  function playSound(kind) {
    if (!kind) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      var now = Date.now();
      if (lastPlayed[kind] && now - lastPlayed[kind] < 800) return;  /* throttle spam */
      lastPlayed[kind] = now;
      var ac = new AC();
      var src = ac.createBufferSource();
      var gain = ac.createGain();
      src.buffer = makeSound(kind);
      if (!src.buffer) { ac.close(); return; }
      gain.gain.value = 0.5;
      src.connect(gain); gain.connect(ac.destination);
      src.onended = function () { try { ac.close(); } catch (e) { } };
      src.start(0);
    } catch (e) { /* autoplay or missing audio — stay silent */ }
  }
  function soundForText(text) {
    var t = String(text || '');
    for (var e in EMOJI_SOUNDS) if (t.indexOf(e) > -1) return EMOJI_SOUNDS[e];
    return null;
  }

  var CATS = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹'],
    'Hands': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '💪', '🦾', '👏', '🙌', '👐', '🤲', '🫶', '🤜', '🤛', '✊', '👊', '🫰', '🫱', '🫲', '🫳'],
    'Fun': ['🔥', '✨', '⭐', '🌟', '💫', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '👑', '💎', '🚀', '⚡', '💥', '💯', '❗', '❓', '💡', '🔔', '🎯', '🎲', '🃏', '🎮', '🕹️', '🏅', '🥳', '🎵', '🎶', '📢', '🔊', '🧨', '🪄', '🌀', '💰', '💸', '🪙', '🧿', '🔮'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐢', '🐍', '🦎', '🐙', '🦑', '🦀', '🐠', '🐬', '🐳', '🦈', '🐊', '🐘', '🦏', '🦒', '🐄', '🐑', '🐖', '🐕', '🐈', '🐓', '🦃'],
    'Food': ['🍎', '🍌', '🍇', '🍉', '🍊', '🍋', '🍓', '🥝', '🥭', '🍍', '🥥', '🍅', '🥑', '🥕', '🌽', '🌶️', '🥔', '🍞', '🧀', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🍜', '🍛', '🍚', '🍩', '🍪', '🎂', '🍰', '🍫', '🍬', '🍭', '☕', '🍵', '🥤', '🧃', '🍺'],
    'Nepal & Nature': ['🇳🇵', '🏔️', '🗻', '⛰️', '🌄', '🌅', '🌊', '🌋', '🏞️', '🌳', '🌲', '🌴', '🍀', '🌺', '🌸', '🌼', '🌻', '🌙', '🌛', '☀️', '⛅', '🌤️', '🌧️', '⛈️', '❄️', '🌈', '🔥', '🌍', '🕉️', '🙏', '🛕', '🪔', '🎋', '⛺', '🧗'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💖', '💘', '💝', '✅', '❌', '⭕', '➡️', '⬅️', '⬆️', '⬇️', '🔺', '🔻', '🟢', '🔴', '🔵', '🟡', '🟣', '⚫', '⚪', '🟠', '🚩', '🏁', '⏳', '⏰', '🔒', '🔓', '📌', '📍', '♻️', '⚠️', '💤']
  };
  var ALL = [];
  for (var k in CATS) ALL = ALL.concat(CATS[k]);

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return window.SAAGAR ? window.SAAGAR.esc(s) : String(s); }
  function now() {
    var d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  var SID = Math.random().toString(36).slice(2, 10);
  var state = {
    room: null, isHost: false, open: false, unread: 0,
    nick: '', toggle: null, sheet: null, log: null, panel: null,
    input: null, pip: null, cat: 'Smileys', sndbar: null, mic: null,
    vdock: null, vmic: null, vspk: null, micMuted: false, spkOn: true
  };

  function nick() {
    if (state.nick) return state.nick;
    var saved = window.SAAGAR ? window.SAAGAR.store('nick') : null;
    state.nick = saved || ('Player' + Math.floor(Math.random() * 90 + 10));
    return state.nick;
  }
  function setNick(v) {
    v = String(v || '').trim().slice(0, 14);
    if (!v) return;
    state.nick = v;
    if (window.SAAGAR) window.SAAGAR.store('nick', v);
    if (state.sheet) {
      var b = state.sheet.querySelector('.chat-head .who');
      if (b) b.textContent = v;
    }
    sys('You are ' + v);
  }

  /* ---------- build UI ---------- */
  /* ---------- PUBG-style floating voice dock (outside the chat) ----------
     Two independent round buttons pinned above the chat toggle:
       🎙 mic    — tap: join the call / mute-unmute; hold ≥700ms: leave
       🔊 speaker— tap: mute/unmute ALL incoming voice (local only)  */
  function buildVoiceDock() {
    /* voice is off for under-16 accounts, or when the kill switch is on */
    if (voiceOff()) {
      if (state.vdock) { state.vdock.remove(); state.vdock = null; state.vmic = null; state.vspk = null; }
      return;
    }
    if (state.vdock) return;
    var dock = el('div', 'voice-dock');

    var mic = el('button', 'vdock-btn', '🎙️');
    mic.type = 'button';
    mic.setAttribute('aria-label', 'Voice: join, mute, hold to leave');
    mic.title = 'Mic — tap to join/talk, tap again to mute, hold to leave';
    mic.onclick = function () {
      loadVoice(function () {
        var V = window.SAAGAR_VOICE;
        if (!V) return;
        if (state.room) { try { V.attach(state.room); } catch (e) { } }
        if (!V.joined()) {
          mic.textContent = '…';
          V.toggleMic();
        } else if (!mic.__hold) {
          V.toggleMic();
        }
      });
    };
    mic.addEventListener('pointerdown', function () {
      mic.__hold = false;
      mic.__t = setTimeout(function () {
        mic.__hold = true;
        if (window.SAAGAR_VOICE && window.SAAGAR_VOICE.joined()) window.SAAGAR_VOICE.hangUp();
      }, 700);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      mic.addEventListener(ev, function () { clearTimeout(mic.__t); });
    });

    var spk = el('button', 'vdock-btn', '🔊');
    spk.type = 'button';
    spk.setAttribute('aria-label', 'Voice speaker on/off');
    spk.title = 'Speaker — hear your friends';
    spk.onclick = function () {
      loadVoice(function () {
        var V = window.SAAGAR_VOICE;
        if (!V) return;
        state.spkOn = !state.spkOn;
        V.setSpeaker(state.spkOn);
        paintDock();
      });
    };

    dock.appendChild(mic);
    dock.appendChild(spk);
    document.body.appendChild(dock);
    state.vdock = dock;
    state.vmic = mic;
    state.vspk = spk;
    paintDock();
  }

  function paintDock() {
    if (!state.vmic) return;
    var inCall = !!(window.SAAGAR_VOICE && window.SAAGAR_VOICE.joined());
    var muted = state.micMuted;
    var spkOn = state.spkOn !== false;
    state.vmic.textContent = !inCall ? '🎙️' : (muted ? '🔇' : '🎙️');
    state.vmic.title = !inCall ? 'Mic — tap to join the voice call'
      : muted ? 'Mic muted — tap to talk'
      : 'Mic live — tap to mute, hold to leave the call';
    state.vmic.style.background = !inCall ? 'rgba(12,18,34,.78)' : muted ? '#b3261e' : '#1e8e3e';
    state.vmic.style.borderColor = inCall && !muted ? 'rgba(255,255,255,.65)' : 'rgba(226,185,90,.55)';
    state.vspk.textContent = spkOn ? '🔊' : '🔈';
    state.vspk.title = spkOn ? 'Speaker on — tap to silence the room' : 'Speaker off — tap to hear the room';
    state.vspk.style.background = spkOn ? 'rgba(12,18,34,.78)' : 'rgba(70,20,20,.85)';
    state.vspk.style.opacity = spkOn ? '1' : '.75';
  }

  function build() {
    if (state.sheet) return;

    var toggle = el('button', 'chat-toggle', '💬');
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Room chat');
    var pip = el('span', 'chat-pip pip hidden', '0');
    toggle.appendChild(pip);
    toggle.onclick = function () { setOpen(!state.open); };
    state.toggle = toggle;
    state.pip = pip;

    var sheet = el('div', 'chat-sheet hidden');
    var chat = el('div', 'chat');

    var head = el('div', 'chat-head');
    head.innerHTML = '<span class="dot"></span><span class="who">' + esc(nick()) + '</span>' +
      '<span class="sp">ROOM CHAT</span>';
    var edit = el('button', 'chat-edit', '✏️');
    edit.type = 'button';
    edit.setAttribute('aria-label', 'Change my name');
    edit.style.cssText = 'background:transparent;border:0;font-size:14px;line-height:1;padding:2px 4px;border-radius:6px;color:#fff;';
    edit.onclick = function () {
      var v = prompt('Your name in the room', nick());
      if (v) setNick(v);
    };
    head.appendChild(edit);

    var log = el('div', 'chat-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');

    var form = el('form', 'chat-form');
    var ico = el('button', 'ico', '😊');
    ico.type = 'button';
    ico.setAttribute('aria-label', 'Emoji');
    var input = el('input');
    input.type = 'text';
    input.placeholder = 'Message…';
    input.maxLength = 200;
    input.setAttribute('aria-label', 'Chat message');
    var send = el('button', 'send', '➤');
    send.type = 'submit';
    send.setAttribute('aria-label', 'Send');
    form.appendChild(ico); form.appendChild(input); form.appendChild(send);

    var panel = el('div', 'emoji-panel');
    renderEmoji(panel);

    ico.onclick = function () {
      panel.classList.toggle('show');
      if (panel.classList.contains('show')) {
        panel.scrollTop = 0;
        input.focus({ preventScroll: true });
      }
    };
    form.onsubmit = function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      sendText(text);
      input.value = '';
      panel.classList.remove('show');
    };

    chat.appendChild(head);
    chat.appendChild(log);
    chat.appendChild(panel);
    chat.appendChild(form);
    sheet.appendChild(chat);
    document.body.appendChild(toggle);
    document.body.appendChild(sheet);

    state.sheet = sheet;
    state.log = log;
    state.input = input;
    state.panel = panel;

    buildSndbar();

    window.addEventListener('resize', function () {
      if (!state.sheet) return;
      state.sheet.style.maxHeight = (window.innerHeight - 120) + 'px';
    });
  }

  /* ---------- left-side quick emoji bar (with sounds) ---------- */
  function buildSndbar() {
    if (state.sndbar) return;
    var bar = el('div', 'sndbar');
    bar.setAttribute('aria-label', 'Quick emoji — they play a sound');
    QUICK.forEach(function (emo) {
      var b = el('button', 'sndb', emo);
      b.type = 'button';
      b.title = (QUICK_LABEL[EMOJI_SOUNDS[emo]] || 'plays a sound') + ' — tap to send';
      b.setAttribute('aria-label', b.title);
      b.onclick = function () { sendText(emo); };
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
    state.sndbar = bar;
  }

  function renderEmoji(panel) {
    panel.innerHTML = '';
    var bar = el('div', 'emoji-cats');
    bar.style.cssText = 'grid-column:1/-1;display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px;';
    Object.keys(CATS).forEach(function (c) {
      var b = el('button', state.cat === c ? 'on' : '', c);
      b.type = 'button';
      b.style.cssText = 'font-size:11px;font-weight:800;padding:4px 9px;border-radius:999px;border:1px solid #dfe2f5;background:#fff;color:var(--navy-2);';
      if (state.cat === c) b.style.cssText += 'background:var(--navy-2);color:#fff;border-color:var(--navy-2);';
      b.onclick = function () { state.cat = c; renderEmoji(panel); };
      bar.appendChild(b);
    });
    panel.appendChild(bar);
    CATS[state.cat].forEach(function (emo) {
      var b = el('button', null, emo);
      b.type = 'button';
      b.onclick = function () {
        var i = state.input.selectionStart, v = state.input.value;
        state.input.value = v.slice(0, i) + emo + v.slice(state.input.selectionEnd);
        state.input.focus();
        state.input.setSelectionRange(i + emo.length, i + emo.length);
      };
      panel.appendChild(b);
    });
  }

  /* ---------- messages ---------- */
  function bubble(m) {
    if (!state.log) return;
    var row = el('div', 'msg' + (m.me ? ' me' : (m.sys ? ' sys' : '')));
    if (m.sys) {
      row.textContent = m.text;
    } else {
      row.innerHTML = (m.me ? '' : '<span class="n">' + esc(m.from || 'Friend') + '</span>') +
        esc(m.text).replace(/\n/g, '<br>') + '<span class="t">' + esc(m.at || now()) + '</span>';
    }
    state.log.appendChild(row);
    state.log.scrollTop = state.log.scrollHeight;
  }
  function sys(text) { bubble({ sys: true, text: text }); }

  /* ---------- safety gate (assets/safety.js provides the rules) ---------- */
  function SAFE() { return window.SAAGAR_SAFETY || null; }
  function quietReactionOnly() { var S = SAFE(); return !!(S && S.isMinor()); }
  function chatOff() { var S = SAFE(); return !!(S && !S.flag('chat')); }
  function voiceOff() { var S = SAFE(); return !!(S && !S.voiceAllowed()); }

  function lockUI(reason) {
    if (!state.sheet) return;
    var form = state.sheet.querySelector('.chat-form');
    if (form && !form.classList.contains('locked')) {
      form.classList.add('locked');
      var note = el('p', 'chat-locked-note', reason);
      form.parentNode.insertBefore(note, form);
    }
  }

  function sendText(text) {
    text = String(text || '');
    var S = SAFE();

    /* chat switched off for this room or globally */
    if (chatOff()) {
      sys('Chat is off in this room right now.');
      return;
    }
    /* under-16 accounts can only use the quick-reaction row */
    if (quietReactionOnly() && !isQuickReaction(text)) {
      sys('Quick reactions only for younger players — use the emoji row.');
      return;
    }
    /* rate limiting */
    if (S) {
      var gate = S.allowSend();
      if (!gate.ok) {
        sys('Please wait a moment (' + gate.why + ').');
        return;
      }
    }
    /* filter */
    var out = text;
    if (S) {
      var res = S.check(text);
      if (!res.ok) {
        sys('That message can\u2019t be sent here (' + res.why + ').');
        if (window.SAAGAR_SOUND) window.SAAGAR_SOUND.play('error');
        return;
      }
      out = res.clean;
      if (res.warned) sys('Some words were hidden \u2014 keep it friendly (see rules.html).');
      if (!S.noteSent(out)) {
        sys('You are repeating the same message \u2014 please stop.');
        return;
      }
    }

    var msg = { t: 'chat', text: out, from: nick(), sid: SID };
    try { if (state.room) state.room.send(msg); } catch (e) { }
    bubble({ text: out, from: nick(), me: true, at: now() });
    playSound(soundForText(out));
  }

  /* quick emoji reactions are the one thing under-16 accounts may send */
  var EMOJI_ONLY = (function () {
    /* unicode property escapes need a modern browser — build it safely so an
       old browser can never throw a syntax error and break the whole file */
    try { return new RegExp('^[\\p{Extended_Pictographic}\\uFE0F\\u200D\\s]+$', 'u'); }
    catch (e) { return null; }
  })();
  function isQuickReaction(text) {
    var t = String(text || '').trim();
    if (!t) return false;
    if (QUICK.indexOf(t) > -1) return true;
    if (t.length <= 8 && EMOJI_ONLY && EMOJI_ONLY.test(t)) return true;
    if (t.length <= 8 && !EMOJI_ONLY && !/[a-z0-9\u0900-\u097f]/i.test(t)) return true;
    return false;
  }

  function setOpen(v) {
    build();
    state.open = !!v;
    state.sheet.classList.toggle('hidden', !state.open);
    state.toggle.textContent = state.open ? '✕' : '💬';
    if (!state.open) state.toggle.appendChild(state.pip);
    else { state.unread = 0; state.pip.classList.add('hidden'); state.pip.textContent = '0'; }
    state.toggle.setAttribute('aria-label', state.open ? 'Close chat' : 'Room chat');
    if (state.open) {
      state.sheet.style.maxHeight = (window.innerHeight - 120) + 'px';
      state.input.focus({ preventScroll: true });
      state.log.scrollTop = state.log.scrollHeight;
    }
  }

  /* ---------- public ---------- */
  function attach(room, isHost, opts) {
    opts = opts || {};
    detach(true);
    var S = SAFE();
    if (S) {
      S.applyRoomFlags(opts.flags || (opts.room && opts.room.flags) || null);
      /* ask the age group once, then apply the matching limits */
      S.ensureAge(function () {
        if (quietReactionOnly()) {
          lockUI('Quick reactions only (under 16) \u2014 voice is off. See rules.html');
          if (state.vdock) { state.vdock.remove(); state.vdock = null; state.vmic = null; state.vspk = null; }
        } else if (chatOff()) {
          lockUI('Chat is off in this room right now.');
        }
      });
    }
    state.room = room;
    state.isHost = !!isHost;
    state.open = false;
    state.unread = 0;
    build();
    state.sheet.classList.add('hidden');
    state.log.innerHTML = '';
    sys('Chat ready' + (opts.title ? ' · ' + opts.title : ''));
    if (chatOff()) { sys('Chat is switched off right now.'); lockUI('Chat is off in this room right now.'); }
    if (quietReactionOnly()) lockUI('Quick reactions only (under 16) \u2014 voice is off. See rules.html');
    state.toggle.classList.remove('hidden');
    if (!voiceOff()) { attachVoice(); buildVoiceDock(); }
    if (state.sndbar) state.sndbar.classList.remove('hidden');
  }

  function detach(keepSilent) {
    state.room = null;
    if (window.SAAGAR_VOICE) { try { window.SAAGAR_VOICE.detach(); } catch (e) { } }
    if (state.sheet) {
      state.sheet.remove(); state.toggle.remove();
      state.sheet = null; state.toggle = null; state.log = null; state.input = null; state.panel = null;
    }
    state.mic = null;
    if (state.vdock) { state.vdock.remove(); state.vdock = null; state.vmic = null; state.vspk = null; }
    if (state.sndbar) { state.sndbar.remove(); state.sndbar = null; }
    state.open = false; state.unread = 0;
  }

  function receive(msg) {
    if (!msg || msg.t !== 'chat') return;
    if (msg.sid && msg.sid === SID) return;   /* our own message relayed back */
    /* never trust a remote peer: filter what arrives too, and drop anything
       that breaks the rules outright */
    var S = SAFE();
    var text = String(msg.text == null ? '' : msg.text);
    if (S) {
      var res = S.check(text);
      if (!res.ok) { sys('A message was hidden (blocked: ' + res.why + ').'); return; }
      text = res.clean;
    }
    if (chatOff()) return;
    build();
    bubble({ text: text, from: msg.from || 'Friend', at: now() });
    playSound(soundForText(text));
    if (!state.open) {
      state.unread++;
      state.pip.textContent = state.unread > 9 ? '9+' : state.unread;
      state.pip.classList.remove('hidden');
    }
    if (window.SAAGAR) window.SAAGAR.toast('💬 ' + (msg.from || 'Friend') + ': ' + text.slice(0, 40));
  }

  function note(text) { bubble({ sys: true, text: text }); }

  /* ---------- voice call integration ---------- */
  function loadVoice(ready) {
    if (window.SAAGAR_VOICE) { ready && ready(); return; }
    var s = document.createElement('script');
    s.src = MYDIR + 'voice.js';
    s.onload = function () { ready && ready(); };
    s.onerror = function () { sys('Voice could not load on this connection.'); };
    document.head.appendChild(s);
  }
  /* give the voice module our room as soon as it exists (it loads lazily,
     so the lobby's attach call at game start may have been too early) */
  function attachVoice() {
    loadVoice(function () {
      if (window.SAAGAR_VOICE && state.room) {
        try { window.SAAGAR_VOICE.attach(state.room); } catch (e) { }
      }
    });
  }
  /* voice.js calls these: pulse the chat toggle while speaking, repaint the dock */
  function voiceBadge(talking) {
    if (state.toggle) state.toggle.classList.toggle('talking', !!talking);
  }
  function voiceState(inCall, muted) {
    state.micMuted = !!muted;
    if (inCall) buildVoiceDock();
    paintDock();
    if (!inCall && state.toggle) state.toggle.classList.remove('talking');
  }

  window.SAAGAR_CHAT = {
    attach: attach, detach: detach, receive: receive, note: note,
    send: sendText, open: function () { setOpen(true); },
    nick: nick, setNick: setNick, emoji: ALL, play: playSound,
    loadVoice: loadVoice, voiceBadge: voiceBadge, voiceState: voiceState, paintDock: paintDock
  };
})();
