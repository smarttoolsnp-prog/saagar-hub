/* ===========================================================
   SAAGAR — online rooms (WebRTC via PeerJS)
   Host-authoritative model: host runs the game, guests send moves.
   Works on any static host: signaling uses the free PeerJS cloud.
   =========================================================== */
(function () {
  'use strict';

  var PREFIX = 'sgr1-';              /* peer-id namespace */
  var CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; /* no confusing 0/O/1/I */
  var CONNECT_TIMEOUT = 14000;

  function randomCode(n) {
    n = n || 4;
    var s = '';
    for (var i = 0; i < n; i++) s += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    return s;
  }

  function peerAvailable() {
    return typeof window.Peer === 'function';
  }

  /* ------------------------------------------------------------------
     Room object
     ------------------------------------------------------------------ */
  function Room(gameKey, opts) {
    this.gameKey = gameKey;
    this.opts = opts || {};
    this.isHost = false;
    this.code = '';
    this.peer = null;
    this.conns = [];          /* all open data connections (host: many, guest: 1) */
    this.hostConn = null;     /* guest side: connection to host */
    this.closed = false;
    this.ready = false;
  }

  Room.prototype._emit = function (name, a, b) {
    var fn = this.opts[name];
    if (typeof fn === 'function') { try { fn(a, b); } catch (e) { console.error(e); } }
  };

  Room.prototype._status = function (text, kind) { this._emit('onStatus', text, kind); };

  /* send to everyone */
  Room.prototype.send = function (obj) {
    var msg = JSON.stringify(obj);
    this.conns.forEach(function (c) {
      try { if (c && c.open) c.send(msg); } catch (e) { }
    });
  };

  /* send to a specific connection */
  Room.prototype.sendTo = function (conn, obj) {
    try { if (conn && conn.open) conn.send(JSON.stringify(obj)); } catch (e) { }
  };

  Room.prototype.playerCount = function () { return this.conns.filter(function (c) { return c.open; }).length; };

  Room.prototype.close = function (silent) {
    if (this.closed) return;
    this.closed = true;
    this.ready = false;
    try { this.conns.forEach(function (c) { try { c.close(); } catch (e) { } }); } catch (e) { }
    try { if (this.peer) { this.peer.destroy(); } } catch (e) { }
    this.conns = []; this.hostConn = null; this.peer = null;
    if (!silent) this._status('Left the room', 'idle');
    this._emit('onLeave');
  };

  function attachConn(room, conn, isHostSide) {
    conn.on('open', function () {
      room.conns.push(conn);
      if (isHostSide) {
        room.sendTo(conn, { t: 'welcome', host: true, code: room.code });
      }
      room.ready = true;
      room._status(isHostSide ? 'Player joined — starting!' : 'Connected!', 'ok');
      room._emit('onJoin', conn, room.playerCount());
    });
    conn.on('data', function (raw) {
      var msg;
      try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
      if (!msg || typeof msg.t !== 'string') return;
      room._emit('onData', msg, conn);
    });
    conn.on('close', function () {
      room.conns = room.conns.filter(function (c) { return c !== conn; });
      room._status('Player disconnected', 'err');
      room._emit('onPeerLeave', conn, room.playerCount());
    });
    conn.on('error', function (e) {
      room._emit('onError', e && e.message ? e.message : 'Connection error');
    });
  }

  /* ------------------------------------------------------------------
     Host a room
     ------------------------------------------------------------------ */
  function host(gameKey, opts) {
    opts = opts || {};
    if (!peerAvailable()) {
      opts.onError && opts.onError('Online play needs the connection library (assets/peerjs.min.js).');
      return null;
    }
    var room = new Room(gameKey, opts);
    room.isHost = true;

    function attempt(code, tries) {
      if (room.closed) return;
      code = code || randomCode(4);
      var id = PREFIX + gameKey + '-' + code + '-h';
      room._status('Creating room ' + code + '…', 'busy');
      var peer = new Peer(id, { debug: 0 });
      var settled = false;

      peer.on('open', function () {
        settled = true;
        room.peer = peer;
        room.code = code;
        room._status('Room ' + code + ' is open — share the code', 'ok');
        room._emit('onReady', code);
      });

      peer.on('connection', function (conn) { attachConn(room, conn, true); });

      peer.on('error', function (e) {
        var type = e && e.type;
        if (type === 'unavailable-id' && !settled && tries > 0) {
          try { peer.destroy(); } catch (x) { }
          attempt(randomCode(4), tries - 1);
          return;
        }
        if (type === 'peer-unavailable') return; /* a guest dropped; not fatal */
        if (room.closed) return;
        room._status('Room error: ' + (e && e.message ? e.message : type), 'err');
        room._emit('onError', e && e.message ? e.message : 'Room error');
      });

      peer.on('disconnected', function () {
        if (room.closed) return;
        room._status('Reconnecting…', 'busy');
        try { peer.reconnect(); } catch (e) { }
      });
    }

    attempt(opts.code, 4);
    return room;
  }

  /* ------------------------------------------------------------------
     Join a room by code
     ------------------------------------------------------------------ */
  function join(gameKey, code, opts) {
    opts = opts || {};
    if (!peerAvailable()) {
      opts.onError && opts.onError('Online play needs the connection library (assets/peerjs.min.js).');
      return null;
    }
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 3) {
      opts.onError && opts.onError('Enter the 4-letter room code.');
      return null;
    }
    var room = new Room(gameKey, opts);
    room.isHost = false;
    room.code = code;

    var peer = new Peer(null, { debug: 0 });
    room.peer = peer;
    var done = false;
    var timer;

    room._status('Looking for room ' + code + '…', 'busy');

    peer.on('open', function () {
      var conn = peer.connect(PREFIX + gameKey + '-' + code + '-h', { reliable: true, serialization: 'json' });
      room.hostConn = conn;
      conn.on('open', function () {
        done = true; clearTimeout(timer);
        room.conns.push(conn);
        room.ready = true;
        room._status('Connected to room ' + code, 'ok');
        room._emit('onReady', code);
        room._emit('onJoin', conn, 2);
      });
      conn.on('data', function (raw) {
        var msg;
        try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
        if (!msg || typeof msg.t !== 'string') return;
        room._emit('onData', msg, conn);
      });
      conn.on('close', function () {
        if (room.closed) return;
        room._status('Host closed the room', 'err');
        room._emit('onPeerLeave', conn, 0);
      });
      conn.on('error', function () {
        room._emit('onError', 'Connection failed');
      });
    });

    timer = setTimeout(function () {
      if (done || room.closed) return;
      room._status('No room found with that code', 'err');
      room._emit('onError', 'Room "' + code + '" not found. Check the code and try again.');
      room.close(true);
    }, CONNECT_TIMEOUT);

    peer.on('error', function (e) {
      var type = e && e.type;
      if (room.closed) return;
      if (type === 'peer-unavailable') {
        clearTimeout(timer);
        room._status('Room not found', 'err');
        room._emit('onError', 'Room "' + code + '" not found. Check the code with your friend.');
        room.close(true);
        return;
      }
      room._emit('onError', e && e.message ? e.message : 'Connection error');
    });

    return room;
  }

  window.SAAGAR_NET = {
    host: host, join: join, randomCode: randomCode, available: peerAvailable
  };
})();
