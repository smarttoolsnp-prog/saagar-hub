/* ===========================================================
   SAAGAR — shared game lobby
   Gives every game: Solo, vs Bot (3 levels), Create room, Join room.
   Host-authoritative. Guests send inputs; host broadcasts state.

   Room flow is MANUAL: the creator picks 2–4 seats, invites friends,
   and presses Start themselves. Seats nobody joined stay OFF/empty —
   the game never auto-starts and never invents a player.
   =========================================================== */
(function () {
  'use strict';

  var SEAT_COLORS = ['#e0342b', '#1f9d4d', '#e0a72b', '#2f6df6'];
  var SEAT_NAMES = ['Red', 'Green', 'Yellow', 'Blue'];

  /* ---- make sure the chat module is present (no per-game setup needed) ---- */
  var SELF = document.currentScript && document.currentScript.src;
  var ASSETS = SELF ? SELF.replace(/[?#].*$/, '').replace(/[^/]*$/, '') : '../assets/';
  function ensureChat(done) {
    if (window.SAAGAR_CHAT) { if (done) done(); return; }
    if (document.getElementById('saagarChatLib')) {
      var t0 = setInterval(function () {
        if (window.SAAGAR_CHAT) { clearInterval(t0); if (done) done(); }
      }, 60);
      return;
    }
    var s = document.createElement('script');
    s.id = 'saagarChatLib';
    s.src = ASSETS + 'chat.js';
    s.onload = function () { if (done) done(); };
    document.head.appendChild(s);
  }

  /* ---- lazy-load the background fx module (toggleable table scene) ---- */
  function ensureBgfx() {
    if (window.SAAGAR_BGFX) return;
    var s = document.createElement('script');
    s.src = ASSETS + 'bgfx.js';
    document.head.appendChild(s);
  }

  /* ---- lazy-load the QR library (vendored, no CDN) ---- */
  function ensureQR(done) {
    if (window.qrcode) { done(true); return; }
    if (document.getElementById('saagarQRLib')) {
      var t = setInterval(function () {
        if (window.qrcode) { clearInterval(t); done(true); }
      }, 60);
      return;
    }
    var s = document.createElement('script');
    s.id = 'saagarQRLib';
    s.src = ASSETS + 'qrcode.js';
    s.onload = function () { done(!!window.qrcode); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }

  /* shareable link that drops your friend straight into the room */
  function inviteUrl(code) {
    var base = location.origin + location.pathname;
    return base + '?room=' + encodeURIComponent(code);
  }

  function myName() {
    try {
      if (window.SAAGAR && window.SAAGAR.store) {
        var v = window.SAAGAR.store('nick');
        if (v) return String(v).slice(0, 14);
      }
    } catch (e) { }
    return '';
  }

  var LOBBY_CSS =
    '.invite-box{display:flex;flex-direction:column;align-items:center;gap:12px;}' +
    '.invite-code{font-size:44px;font-weight:900;letter-spacing:11px;padding-left:11px;color:#fff;' +
    'background:linear-gradient(135deg,#4c1d95,#1e3a8a);border-radius:16px;padding:6px 18px 6px 28px;' +
    'box-shadow:0 14px 34px rgba(76,29,149,.35);}' +
    '.invite-link{display:flex;gap:8px;width:100%;max-width:460px;}' +
    '.invite-link input{flex:1;min-width:0;padding:11px 13px;border:1.5px solid var(--line);border-radius:11px;' +
    'background:var(--bg-2);font-size:12.5px;font-weight:700;color:var(--navy-2);}' +
    '.invite-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}' +
    '.invite-qr{background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px;' +
    'box-shadow:var(--sh);width:168px;height:168px;display:grid;place-items:center;}' +
    '.invite-qr svg{width:100%;height:100%;display:block;}' +
    '.invite-qr .muted{font-size:11px;line-height:1.4;text-align:center;}' +
    '.seatpick{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;margin:2px 0;}' +
    '.seatpick .btn{padding:8px 15px;font-size:13px;}' +
    '.seatpick .btn.on{background:var(--navy);color:#fff;border-color:var(--navy);box-shadow:0 6px 16px rgba(45,85,120,.28);}' +
    '.roster{display:flex;flex-direction:column;gap:7px;width:100%;max-width:460px;}' +
    '.roster .r{display:flex;align-items:center;gap:10px;background:var(--bg-2);border:1px solid var(--line);' +
    'border-radius:12px;padding:9px 13px;font-size:13.5px;font-weight:800;color:var(--navy-2);}' +
    '.roster .r .seaticon{width:11px;height:11px;border-radius:50%;flex:0 0 auto;box-shadow:0 0 0 1px rgba(0,0,0,.12) inset;}' +
    '.roster .r .who{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.roster .r .tag{font-size:10px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;' +
    'background:rgba(19,108,54,.12);color:#136c36;border-radius:99px;padding:3px 9px;}' +
    '.roster .r.off{opacity:.62;border-style:dashed;}' +
    '.roster .r.off .seaticon{background:#c4cbdb !important;}' +
    '.roster .r.off .tag{background:rgba(0,0,0,.07);color:var(--dim);}' +
    '@media(max-width:560px){.invite-code{font-size:36px;letter-spacing:8px;}}';

  function ensureLobbyCSS() {
    if (document.getElementById('saagarLobbyCSS')) return;
    var st = document.createElement('style');
    st.id = 'saagarLobbyCSS';
    st.textContent = LOBBY_CSS;
    document.head.appendChild(st);
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(cls, label) {
    var b = el('button', 'btn ' + (cls || ''), label);
    b.type = 'button';
    return b;
  }

  /**
   * cfg = {
   *   key: 'tictactoe',
   *   seatChoices: [2,3,4],         // seats the creator may pick (default 2,3,4)
   *   onSolo(opts),                 // opts = { bot: null|'easy'|'medium'|'hard' }
   *   onHostReady(room, opts),      // you are host; opts = {seats, seat, players:[...]}
   *   onGuestReady(room, opts),     // you are guest; wait for host state
   *   onMessage(msg, room, isHost, senderSeat),
   *   onPeerLeave(room, isHost, seat),
   *   labels: { solo, bot, create, join }
   * }
   */
  function create(cfg) {
    var root = cfg.root || null;
    var room = null;
    var current = 'menu';

    /* host-side room state */
    var seatCount = 2;
    var guestSeats = [];      /* index j -> {conn,name} | null  (seat = j+1) */
    var hostArea = null;
    var waitMsg = null;       /* last roster message received as a guest */
    var guestSeat = 0;

    var panel = el('div', 'card');
    var head = el('h2', null, cfg.title || 'Play');
    panel.appendChild(head);
    var body = el('div');
    panel.appendChild(body);

    ensureBgfx();

    if (root) { root.innerHTML = ''; root.appendChild(panel); }

    function status(text, kind) {
      var s = document.getElementById('netStatus');
      if (!s) {
        s = el('div', 'muted');
        s.id = 'netStatus';
        s.style.marginTop = '10px';
        panel.appendChild(s);
      }
      s.textContent = text || '';
      s.style.color = kind === 'err' ? '#a11f1f' : (kind === 'ok' ? '#136c36' : '');
    }

    function clear() { body.innerHTML = ''; hostArea = null; }

    function teardown() {
      if (room) { try { room.close(true); } catch (e) { } room = null; }
      if (window.SAAGAR_CHAT) window.SAAGAR_CHAT.detach();
      if (window.SAAGAR_VOICE) { try { window.SAAGAR_VOICE.detach(); } catch (e) { } }
      guestSeats = [];
      waitMsg = null;
    }

    function openChat(isHost) {
      ensureChat(function () {
        if (!room) return;
        window.SAAGAR_CHAT.attach(room, isHost, { title: cfg.title || '' });
      });
    }

    /* ---------------- menu ---------------- */
    function menu() {
      current = 'menu';
      teardown();
      clear();
      status('');
      var grid = el('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = '1fr 1fr';
      grid.style.gap = '12px';

      /* solo */
      var soloBox = el('div');
      soloBox.style.display = 'flex';
      soloBox.style.flexDirection = 'column';
      soloBox.style.gap = '8px';
      soloBox.appendChild(el('div', 'badge', 'SOLO'));
      var bSolo = btn('block', cfg.labels && cfg.labels.solo || '▶  Play solo');
      bSolo.onclick = function () { startSolo(null); };
      soloBox.appendChild(bSolo);

      /* bot */
      var botBox = el('div');
      botBox.style.display = 'flex';
      botBox.style.flexDirection = 'column';
      botBox.style.gap = '8px';
      botBox.appendChild(el('div', 'badge bot', 'VS COMPUTER'));
      var diff = el('select');
      diff.innerHTML = '<option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option>';
      botBox.appendChild(diff);
      var bBot = btn('soft block', cfg.labels && cfg.labels.bot || '🤖  Play vs Bot');
      bBot.onclick = function () { startSolo(diff.value); };
      botBox.appendChild(bBot);

      /* create room */
      var crate = el('div');
      crate.style.display = 'flex';
      crate.style.flexDirection = 'column';
      crate.style.gap = '8px';
      crate.appendChild(el('div', 'badge room', 'ONLINE ROOM'));
      var bCreate = btn('block', cfg.labels && cfg.labels.create || '＋  Create room');
      bCreate.onclick = function () { doHost(); };
      crate.appendChild(bCreate);

      /* join room */
      var jbox = el('div');
      jbox.style.display = 'flex';
      jbox.style.flexDirection = 'column';
      jbox.style.gap = '8px';
      jbox.appendChild(el('div', 'badge', 'JOIN FRIEND'));
      var inp = el('input');
      inp.type = 'text';
      inp.placeholder = 'ROOM CODE';
      inp.maxLength = 4;
      inp.style.textTransform = 'uppercase';
      inp.style.letterSpacing = '4px';
      inp.style.fontWeight = '800';
      inp.style.textAlign = 'center';
      jbox.appendChild(inp);
      var bJoin = btn('soft block', cfg.labels && cfg.labels.join || '🔗  Join');
      bJoin.onclick = function () { doJoin(inp.value); };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') doJoin(inp.value); });
      jbox.appendChild(bJoin);

      grid.appendChild(soloBox); grid.appendChild(botBox);
      grid.appendChild(crate); grid.appendChild(jbox);
      if (window.matchMedia && window.matchMedia('(max-width:620px)').matches) {
        grid.style.gridTemplateColumns = '1fr';
      }
      body.appendChild(grid);
      body.appendChild(el('p', 'muted', 'Online rooms give you a shareable invite link and a QR code — your friend taps it and lands straight in your room. The creator chooses the seats and starts when ready.'));
    }

    /* ---------------- start solo / vs bot ---------------- */
    function startSolo(bot) {
      current = 'solo';
      clear();
      status(bot ? 'Playing vs computer (' + bot + ')' : 'Solo game');
      cfg.onSolo({ bot: bot || null });
    }

    /* ---------------- host ---------------- */
    function seatChoices() {
      var c = cfg.seatChoices && cfg.seatChoices.length ? cfg.seatChoices : [2, 3, 4];
      return c.slice().sort(function (a, b) { return a - b; });
    }

    function ensureGuestSlots() {
      var want = seatCount - 1;
      while (guestSeats.length < want) guestSeats.push(null);
      if (guestSeats.length > want) {
        for (var i = want; i < guestSeats.length; i++) {
          if (guestSeats[i]) {
            try { room && room.sendTo(guestSeats[i].conn, { t: 'full' }); } catch (e) { }
          }
        }
        guestSeats.length = want;
      }
    }

    function findGuest(conn) {
      for (var j = 0; j < guestSeats.length; j++) {
        if (guestSeats[j] && guestSeats[j].conn === conn) return guestSeats[j];
      }
      return null;
    }

    function members() {
      var list = [{ seat: 0, name: 'You', host: true }];
      for (var j = 0; j < guestSeats.length; j++) {
        if (guestSeats[j]) list.push({ seat: j + 1, name: guestSeats[j].name || ('Player ' + (j + 2)), host: false });
      }
      return list;
    }
    function occupiedSeats() {
      return members().map(function (m) { return m.seat; });
    }

    function syncRoster() {
      if (!room) return;
      var list = members(), occ = occupiedSeats();
      var chosen = seatChoices();
      if (chosen.indexOf(seatCount) === -1) seatCount = chosen[0];
      for (var j = 0; j < guestSeats.length; j++) {
        if (!guestSeats[j]) continue;
        room.sendTo(guestSeats[j].conn, { t: 'roster', seats: seatCount, seat: j + 1, members: list, players: occ });
      }
      renderHostWait();
    }

    function renderHostWait() {
      if (!hostArea) return;
      hostArea.innerHTML = '';

      var pick = el('div', 'seatpick');
      pick.appendChild(el('span', 'muted', 'Seats:'));
      seatChoices().forEach(function (n) {
        var b = btn('soft sm' + (n === seatCount ? ' on' : ''), String(n));
        b.onclick = function () {
          if (n === seatCount) return;
          seatCount = n;
          ensureGuestSlots();
          syncRoster();
        };
        pick.appendChild(b);
      });
      hostArea.appendChild(pick);

      var list = el('div', 'roster');
      for (var i = 0; i < seatCount; i++) {
        var g = i === 0 ? null : guestSeats[i - 1];
        var filled = i === 0 || !!g;
        var r = el('div', 'r' + (filled ? '' : ' off'));
        var dot = el('span', 'seaticon');
        dot.style.background = SEAT_COLORS[i];
        r.appendChild(dot);
        r.appendChild(el('span', 'who', i === 0 ? 'You (host)' : (g ? (g.name || ('Player ' + (i + 1))) : 'Open seat — waiting…')));
        r.appendChild(el('span', 'tag', filled ? 'ready' : 'off'));
        list.appendChild(r);
      }
      hostArea.appendChild(list);

      var occ = occupiedSeats();
      var start = btn('block', '▶  Start game');
      var canStart = occ.length >= 2;
      start.disabled = !canStart;
      if (!canStart) { start.style.opacity = '.45'; start.style.cursor = 'not-allowed'; }
      start.onclick = startNow;
      hostArea.appendChild(start);
      hostArea.appendChild(el('p', 'muted', canStart
        ? 'Seats without a player will stay off. Press Start when everyone is in.'
        : 'Waiting for at least one friend to join…'));
    }

    function doHost() {
      if (!window.SAAGAR_NET || !window.SAAGAR_NET.available()) {
        status('Online play library not loaded.', 'err');
        return;
      }
      current = 'host';
      seatCount = seatChoices()[0];
      guestSeats = [];
      ensureGuestSlots();
      clear();
      status('Creating room…');
      room = window.SAAGAR_NET.host(cfg.key, {
        onStatus: status,
        onReady: function (code) {
          clear();
          ensureLobbyCSS();
          var link = inviteUrl(code);
          var box = el('div', 'invite-box');
          box.appendChild(el('p', 'muted', 'Send this link to a friend — they land straight in your room:'));
          box.appendChild(el('div', 'invite-code', code));

          var row = el('div', 'invite-link');
          var inp = el('input');
          inp.type = 'text';
          inp.readOnly = true;
          inp.value = link;
          inp.setAttribute('aria-label', 'Invite link');
          inp.onclick = function () { this.select(); };
          var cp = btn('soft sm', 'Copy link');
          cp.style.flex = '0 0 auto';
          cp.onclick = function () { window.SAAGAR.copy(link, 'Invite link copied'); };
          row.appendChild(inp); row.appendChild(cp);
          box.appendChild(row);

          var acts = el('div', 'invite-acts');
          var share = btn('soft sm', '📤 Share');
          share.onclick = function () {
            var text = 'Join my game on SAAGAR — room ' + code;
            if (navigator.share) {
              navigator.share({ title: 'SAAGAR game room ' + code, text: text, url: link })
                .catch(function () { });
            } else {
              window.SAAGAR.copy(text + ' — ' + link, 'Invite copied');
            }
          };
          var cpCode = btn('ghost sm', 'Copy code');
          cpCode.onclick = function () { window.SAAGAR.copy(code, 'Room code copied'); };
          var cancel = btn('ghost sm', 'Cancel');
          cancel.onclick = menu;
          acts.appendChild(share); acts.appendChild(cpCode); acts.appendChild(cancel);
          box.appendChild(acts);

          var qrBox = el('div', 'invite-qr', '<span class="muted">Making QR…</span>');
          box.appendChild(qrBox);
          box.appendChild(el('p', 'muted', 'Or scan the QR with a phone. The game starts only when you press Start.'));

          body.appendChild(box);

          hostArea = el('div');
          hostArea.style.display = 'flex';
          hostArea.style.flexDirection = 'column';
          hostArea.style.gap = '12px';
          hostArea.style.alignItems = 'center';
          hostArea.style.marginTop = '6px';
          body.appendChild(hostArea);
          renderHostWait();

          ensureQR(function (ok) {
            if (!ok) { qrBox.innerHTML = '<span class="muted">QR unavailable — use the link above.</span>'; return; }
            try {
              var q = window.qrcode(0, 'M');
              q.addData(link);
              q.make();
              qrBox.innerHTML = q.createSvgTag({ cellSize: 5, margin: 4, scalable: true });
            } catch (e) {
              qrBox.innerHTML = '<span class="muted">Use the link above.</span>';
            }
          });
        },
        onJoin: function (conn) {
          if (current !== 'host') return;          /* room already playing */
          var free = -1;
          for (var j = 0; j < guestSeats.length; j++) { if (!guestSeats[j]) { free = j; break; } }
          if (free === -1) { room.sendTo(conn, { t: 'full' }); return; }
          conn.__seat = free + 1;
          conn.__vfrom = conn.peer;      /* voice relay: original sender id */
          guestSeats[free] = { conn: conn, name: '' };
          if (window.SAAGAR_CHAT) window.SAAGAR_CHAT.note('A player joined');
          syncRoster();
        },
        onData: function (msg, conn) {
          if (msg.t === 'chat') {
            /* host relays guest chat to everybody, including other guests */
            try { room.send(msg); } catch (e) { }
            if (window.SAAGAR_CHAT) window.SAAGAR_CHAT.receive(msg);
            return;
          }
          if (msg.t === 'voice') {
            /* voice-call control (join/leave): apply locally, relay to every seat */
            msg.from = (conn && conn.__vfrom) || msg.from || '';
            try { if (window.SAAGAR_VOICE) window.SAAGAR_VOICE.onControl(msg, conn); } catch (e) { }
            try { room.send(msg); } catch (e) { }
            return;
          }
          if (msg.t === 'who') {
            var g = findGuest(conn);
            if (g && typeof msg.name === 'string' && msg.name.trim()) {
              g.name = msg.name.trim().slice(0, 14);
              syncRoster();
            }
            return;
          }
          if (msg.t === 'roster-req') { syncRoster(); return; }
          var seat = conn && conn.__seat ? conn.__seat : -1;
          cfg.onMessage(msg, room, true, seat);
        },
        onPeerLeave: function (conn) {
          var seat = -1;
          for (var j = 0; j < guestSeats.length; j++) {
            if (guestSeats[j] && guestSeats[j].conn === conn) { seat = j + 1; guestSeats[j] = null; break; }
          }
          if (window.SAAGAR_CHAT) window.SAAGAR_CHAT.note('A player left the room');
          if (current === 'playing') cfg.onPeerLeave && cfg.onPeerLeave(room, true, seat);
          else { syncRoster(); status('A player left the room', 'err'); }
        },
        onError: function (m) { status(m, 'err'); }
      });
      /* games that need private per-seat payloads (card games) can address a seat */
      if (room) room.sendToSeat = function (seat, obj) {
        if (seat === 0) return;
        var g = guestSeats[seat - 1];
        if (g && g.conn) room.sendTo(g.conn, obj);
      };
    }

    function startNow() {
      if (!room) return;
      var occ = occupiedSeats();
      if (occ.length < 2) { status('Wait for at least one friend to join before starting.', 'err'); return; }
      var opts = { seats: seatCount, seat: 0, players: occ, code: room.code };
      for (var j = 0; j < guestSeats.length; j++) {
        if (!guestSeats[j]) continue;
        try { room.sendTo(guestSeats[j].conn, { t: 'start', seats: seatCount, seat: j + 1, players: occ, code: room.code }); } catch (e) { }
      }
      current = 'playing';
      clear();
      openChat(true);
      if (window.SAAGAR_VOICE) { try { window.SAAGAR_VOICE.attach(room); } catch (e) { } }
      cfg.onHostReady(room, opts);
    }

    /* ---------------- join ---------------- */
    function doJoin(code) {
      if (!window.SAAGAR_NET || !window.SAAGAR_NET.available()) {
        status('Online play library not loaded.', 'err');
        return;
      }
      current = 'join';
      clear();
      status('Connecting…');
      room = window.SAAGAR_NET.join(cfg.key, code, {
        onStatus: status,
        onReady: function () {
          current = 'wait';
          guestSeat = 0;
          clear();
          ensureLobbyCSS();
          body.appendChild(el('p', 'muted', 'Connected to room ' + room.code + '. Waiting for the host to start…'));
          try { room.send({ t: 'who', name: myName() }); } catch (e) { }
          try { room.send({ t: 'roster-req' }); } catch (e) { }
        },
        onData: function (msg) {
          if (msg.t === 'chat') {
            if (window.SAAGAR_CHAT) window.SAAGAR_CHAT.receive(msg);
            return;
          }
          if (msg.t === 'voice' && window.SAAGAR_VOICE) { try { window.SAAGAR_VOICE.onControl(msg, room.hostConn); } catch (e) { } return; }
          if (msg.t === 'roster') { guestSeat = msg.seat; renderGuestWait(msg); return; }
          if (msg.t === 'full') { status('This room is full — ask the host for a bigger seat count.', 'err'); return; }
          if (msg.t === 'start') {
            current = 'playing';
            clear();
            guestSeat = msg.seat;
            openChat(false);
            if (window.SAAGAR_VOICE) { try { window.SAAGAR_VOICE.attach(room); } catch (e) { } }
            cfg.onGuestReady(room, { seats: msg.seats, seat: msg.seat, players: msg.players, code: msg.code });
            return;
          }
          cfg.onMessage(msg, room, false, -1);
        },
        onPeerLeave: function () {
          if (current === 'playing') cfg.onPeerLeave && cfg.onPeerLeave(room, false, 0);
        },
        onError: function (m) {
          status(m, 'err');
          var back = btn('soft sm mt', '← Back');
          back.onclick = menu;
          body.appendChild(back);
        }
      });
    }

    function renderGuestWait(msg) {
      if (current === 'playing') return;
      clear();
      ensureLobbyCSS();
      var box = el('div', 'invite-box');
      box.appendChild(el('p', 'muted', 'You are in room ' + (room ? room.code : '') + '. The host starts the game.'));
      var list = el('div', 'roster');
      var bySeat = {};
      msg.members.forEach(function (m) { bySeat[m.seat] = m; });
      for (var i = 0; i < msg.seats; i++) {
        var m = bySeat[i];
        var r = el('div', 'r' + (m ? '' : ' off'));
        var dot = el('span', 'seaticon');
        dot.style.background = m ? SEAT_COLORS[i] : '#c4cbdb';
        r.appendChild(dot);
        var who;
        if (!m) who = 'Open seat — waiting…';
        else if (m.host) who = 'Host';
        else if (m.seat === msg.seat) who = 'You' + (m.name ? ' (' + m.name + ')' : '');
        else who = m.name || ('Player ' + (m.seat + 1));
        r.appendChild(el('span', 'who', who));
        r.appendChild(el('span', 'tag', m ? 'ready' : 'off'));
        list.appendChild(r);
      }
      box.appendChild(list);
      box.appendChild(el('p', 'muted', 'You are seat ' + (msg.seat + 1) + ' — ' + SEAT_NAMES[msg.seat] + '.'));
      body.appendChild(box);
    }

    menu();

    /* ---------- coming in from an invite link: ?room=CODE ---------- */
    (function autoJoin() {
      if (cfg.autoJoin === false) return;
      var wanted = '';
      try {
        var m = location.search.match(/[?&]room=([A-Za-z0-9]{3,8})/);
        if (m) wanted = m[1].toUpperCase();
      } catch (e) { }
      if (!wanted) return;
      try {
        history.replaceState(null, '', location.pathname + location.hash);
      } catch (e) { }
      setTimeout(function () { doJoin(wanted); }, 120);
    })();

    return {
      status: status,
      menu: menu,
      inviteUrl: inviteUrl,
      room: function () { return room; },
      seat: function () { return guestSeat; },
      destroy: function () { teardown(); }
    };
  }

  window.SAAGAR_LOBBY = { create: create, el: el, btn: btn, SEAT_COLORS: SEAT_COLORS, SEAT_NAMES: SEAT_NAMES };
})();
