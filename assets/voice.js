/* ===========================================================
   SAAGAR — room voice calls (WebRTC audio mesh via PeerJS)
   Reuses the room's existing PeerJS peer: audio media
   connections ride beside the game data channel — no extra
   server, no keys, no CDN. One tap: 🎙️ in the chat header.

     • host + guests, full mesh (up to 4 seats)
     • deterministic dialing: the peer with the LOWER id calls
       the higher one, so both sides never race and collide
     • mute/unmute without dropping the call
     • speaking badge on the chat button (WebAudio RMS meter)
     • everything cleans up on leave, room close, page hide

   Loaded lazily by assets/chat.js the first time the mic is
   tapped. Control messages ({t:'voice'}) are relayed by the
   host over the game data channel (assets/lobby.js).
   =========================================================== */
(function () {
  'use strict';

  var V = {
    joined: false,      /* actively in the call */
    muted: false,
    room: null,
    local: null,        /* local MediaStream */
    peers: {}           /* remotePeerId -> { call, audio, name } */
  };
  var LEVEL_MS = 250;

  function esc(s) {
    return window.SAAGAR && window.SAAGAR.esc ? window.SAAGAR.esc(s) : String(s);
  }
  function sysNote(text) {
    if (text && window.SAAGAR_CHAT && window.SAAGAR_CHAT.note) window.SAAGAR_CHAT.note(text);
  }
  function myNick() {
    return window.SAAGAR_CHAT && window.SAAGAR_CHAT.nick ? window.SAAGAR_CHAT.nick() : 'Player';
  }

  /* ---------- speaking meter (cosmetic; fails silent) ---------- */
  var AC = null, analyser = null, meterBuf = null, meterTimer = null;
  function startMeter(stream) {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      AC = new Ctx();
      var src = AC.createMediaStreamSource(stream);
      analyser = AC.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);            /* not to destination: no echo */
      meterBuf = new Float32Array(analyser.fftSize);
      meterTimer = setInterval(function () {
        if (!analyser) return;
        try { analyser.getFloatTimeDomainData(meterBuf); } catch (e) { return; }
        var sum = 0;
        for (var i = 0; i < meterBuf.length; i++) sum += meterBuf[i] * meterBuf[i];
        var rms = Math.sqrt(sum / meterBuf.length);
        badge(!!V.on && rms > 0.02);
      }, LEVEL_MS);
    } catch (e) { /* no meter is fine */ }
  }
  function stopMeter() {
    try { if (meterTimer) clearInterval(meterTimer); } catch (e) { }
    meterTimer = null; analyser = null;
    try { if (AC) AC.close(); } catch (e) { }
    AC = null;
  }

  /* ---------- one hidden <audio> per remote peer ---------- */
  function makeAudioEl(id) {
    var a = document.createElement('audio');
    a.autoplay = true;
    a.dataset.pid = id;
    a.style.display = 'none';
    document.body.appendChild(a);
    return a;
  }

  /* ---------- registry ---------- */
  function dropPeer(id) {
    var p = V.peers[id];
    if (!p) return;
    try { if (p.call) p.call.close(); } catch (e) { }
    try { if (p.audio) p.audio.srcObject = null; } catch (e) { }
    try { if (p.audio) p.audio.remove(); } catch (e) { }
    delete V.peers[id];
  }
  function dropAll() {
    Object.keys(V.peers).forEach(dropPeer);
  }
  function peerName(id) {
    try {
      var conns = (V.room && V.room.conns) || [];
      for (var i = 0; i < conns.length; i++) {
        if (conns[i] && conns[i].peer === id && conns[i].__name) return conns[i].__name;
      }
    } catch (e) { }
    return 'friend';
  }

  /* ---------- incoming media call ---------- */
  function onIncoming(call) {
    if (!V.joined || !V.local) { try { call.close(); } catch (e) { } return; }
    var id = call.peer;
    dropPeer(id);                        /* a fresh call replaces a stale one */
    call.on('stream', function (remote) {
      var p = V.peers[id] || (V.peers[id] = {});
      p.call = call;
      if (!p.audio) {
        p.audio = makeAudioEl(id);
        sysNote('🔊 Voice connected with ' + esc(p.name || peerName(id)));
      }
      p.audio.srcObject = remote;
      p.audio.play && p.audio.play().catch(function () { });
    });
    call.on('close', function () { dropPeer(id); });
    call.on('error', function () { dropPeer(id); });
    try { call.answer(V.local); } catch (e) { }
  }

  /* ---------- outgoing media call ---------- */
  function dial(id) {
    if (!V.room || !V.room.peer || !V.local) return;
    if (V.peers[id] && V.peers[id].call) return;
    try {
      var call = V.room.peer.call(id, V.local);
      if (!call) return;
      V.peers[id] = V.peers[id] || {};
      V.peers[id].call = call;
      call.on('stream', function (remote) {
        var p = V.peers[id] || (V.peers[id] = {});
        p.call = call;
        if (!p.audio) {
          p.audio = makeAudioEl(id);
          sysNote('🔊 Voice connected with ' + esc(p.name || peerName(id)));
        }
        p.audio.srcObject = remote;
        p.audio.play && p.audio.play().catch(function () { });
      });
      call.on('close', function () { dropPeer(id); });
      call.on('error', function () { dropPeer(id); });
    } catch (e) {
      sysNote('🎙️ Voice error: ' + esc(e && e.message ? e.message : 'call failed'));
    }
  }

  /* ---------- join / leave / mute ---------- */
  function joinCall() {
    if (!V.room || V.joined) return Promise.resolve(false);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      sysNote('🎙️ This browser has no microphone support.');
      return Promise.resolve(false);
    }
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    }).then(function (stream) {
      V.local = stream;
      V.joined = true;
      V.muted = false;
      V.on = true;
      startMeter(stream);
      announce({ v: 'join', name: myNick() });
      /* dial every open data peer; the lower id calls */
      peerIds().forEach(function (id) {
        if (shouldDial(V.room.peer.id, id)) dial(id);
      });
      sysNote('🎙️ You joined the voice call');
      ui(true);
      return true;
    }).catch(function (err) {
      var m = err && err.name === 'NotAllowedError' ? 'Microphone blocked — allow it in your browser settings.'
        : err && err.name === 'NotFoundError' ? 'No microphone found on this device.'
          : 'Could not open the microphone.';
      sysNote('🎙️ ' + m);
      return false;
    });
  }

  function leaveCall(silent) {
    if (!V.joined) return;
    announce({ v: 'leave' });
    try { if (V.local) V.local.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { }
    dropAll();
    stopMeter();
    V.joined = false; V.muted = false; V.local = null; V.on = false;
    badge(false);
    sysNote(silent ? '' : '🎙️ You left the voice call');
    ui(false);
  }

  function toggleMute() {
    if (!V.local) return false;
    V.muted = !V.muted;
    try {
      V.local.getAudioTracks().forEach(function (t) { t.enabled = !V.muted; });
    } catch (e) { }
    sysNote(V.muted ? '🎙️ Mic muted' : '🎙️ Mic live');
    ui(true);
    return V.muted;
  }

  /* ---------- data-channel control messages ---------- */
  function announce(obj) {
    var from = V.room && V.room.peer ? V.room.peer.id : '';
    try { if (V.room) V.room.send(Object.assign({ t: 'voice', from: from }, obj)); } catch (e) { }
  }

  function onControl(msg, conn) {
    if (!msg || msg.t !== 'voice') return;
    var fromId = msg.from || (conn && conn.peer) || '';
    if (msg.v === 'join') {
      try {
        (V.room.conns || []).forEach(function (c) {
          if (c.peer === fromId) c.__name = msg.name || c.__name || 'friend';
        });
      } catch (e) { }
      if (V.joined && fromId && shouldDial(V.room.peer.id, fromId)) dial(fromId);
    }
    if (msg.v === 'leave') dropPeer(fromId);
  }

  /* ---------- misc ---------- */
  function peerIds() {
    var ids = [];
    try {
      (V.room.conns || []).forEach(function (c) { if (c && c.open && c.peer) ids.push(c.peer); });
    } catch (e) { }
    return ids;
  }
  function shouldDial(myId, theirId) {
    return String(myId || '') < String(theirId || '');
  }
  function badge(on) {
    if (window.SAAGAR_CHAT && window.SAAGAR_CHAT.voiceBadge) window.SAAGAR_CHAT.voiceBadge(on);
  }
  function ui(inCall) {
    if (window.SAAGAR_CHAT && window.SAAGAR_CHAT.voiceState) window.SAAGAR_CHAT.voiceState(inCall, V.muted);
  }
  function hookPeer(room) {
    if (!room.peer) return false;
    if (room.peer.__voiceHooked) return true;
    room.peer.__voiceHooked = true;
    room.peer.on('call', onIncoming);
    return true;
  }
  function cleanupAudioEls() {
    var els = document.querySelectorAll('audio[data-pid]');
    for (var i = 0; i < els.length; i++) { try { els[i].remove(); } catch (e) { } }
  }

  /* ---------- speaker (local-only mute of incoming audio) ---------- */
  var spkOn = true;
  function setSpeaker(on) {
    spkOn = !!on;
    Object.keys(V.peers).forEach(function (id) {
      var a = V.peers[id] && V.peers[id].audio;
      if (a) { a.muted = !spkOn; if (spkOn && a.play) a.play().catch(function () { }); }
    });
    return spkOn;
  }
  /* apply the speaker state to any audio created later (onIncoming/dial) */
  var _makeAudioEl = makeAudioEl;
  makeAudioEl = function (id) {
    var a = _makeAudioEl(id);
    a.muted = !spkOn;
    return a;
  };

  /* ---------- public ---------- */
  window.SAAGAR_VOICE = {
    attach: function (room) {
      var old = V.room;
      if (old && old !== room) {
        /* switching rooms: tear the call down cleanly first */
        try { old.send({ t: 'voice', from: old.peer ? old.peer.id : '', v: 'leave' }); } catch (e) { }
        leaveCall(true);
        dropAll();
      }
      V.room = room || null;
      if (!room) return;
      hookPeer(room);
      var retry = setInterval(function () {
        if (!V.room || V.room !== room) { clearInterval(retry); return; }
        if (room.peer && hookPeer(room)) clearInterval(retry);
      }, 300);
      setTimeout(function () { if (V.room === room) clearInterval(retry); }, 8000);
    },
    detach: function () {
      leaveCall(true);
      dropAll();
      V.room = null;
      cleanupAudioEls();
      var t = document.querySelector('.voice-tog');
      if (t) t.remove();
    },
    toggleMic: function () {
      if (!V.joined) return joinCall();
      return Promise.resolve(toggleMute());
    },
    hangUp: function () { leaveCall(false); },
    joined: function () { return V.joined; },
    onControl: onControl,
    setSpeaker: setSpeaker,
    speakerOn: function () { return spkOn; }
  };

  /* safety: stop everything when the tab is hidden/closed mid-call */
  window.addEventListener('pagehide', function () { leaveCall(true); });
})();
