/* ===========================================================
   SAAGAR — content feed
   Search + paginate + spotlight, shared by every content page
   (philosophy, facts, jokes, GK, quotes).

   SAAGAR_FEED.mount({
     slot,            // container for the items
     bar,             // container for the search bar
     data,            // array of anything
     perPage,         // default 60
     keys,            // fn(item) -> searchable text
     render,          // fn(item, index) -> html for .fitem
     unit,            // 'philosophies' etc, for the counter
     placeholder,     // search placeholder
     spot,            // optional { box, text, src, btn } for random pick
     chip             // optional label for the shuffle button
   })
   =========================================================== */
(function () {
  'use strict';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return window.SAAGAR ? window.SAAGAR.esc(s) : String(s); }

  function mount(cfg) {
    var data = cfg.data || [];
    var per = cfg.perPage || 60;
    var shown = per;
    var query = '';
    var slot = typeof cfg.slot === 'string' ? document.querySelector(cfg.slot) : cfg.slot;
    var bar = typeof cfg.bar === 'string' ? document.querySelector(cfg.bar) : cfg.bar;
    var keys = cfg.keys || function (x) { return String(x); };
    var render = cfg.render;

    /* ---- search bar ---- */
    var cnt = null;
    if (bar) {
      bar.innerHTML = '';
      var input = el('input');
      input.type = 'search';
      input.placeholder = cfg.placeholder || 'Search…';
      input.setAttribute('aria-label', cfg.placeholder || 'Search');
      input.autocomplete = 'off';
      cnt = el('span', 'cnt', '');
      var sh = el('button', 'btn soft sm', '🎲 ' + (cfg.chip || 'Shuffle'));
      sh.type = 'button';
      sh.onclick = function () {
        query = ''; input.value = '';
        shuffle(data);
        shown = per;
        draw();
        if (slot) slot.scrollIntoView({ block: 'nearest' });
        if (window.SAAGAR) window.SAAGAR.toast('Shuffled');
      };
      bar.appendChild(input);
      bar.appendChild(sh);
      bar.appendChild(cnt);
      input.addEventListener('input', function () {
        query = this.value.trim().toLowerCase();
        shown = per;
        draw();
      });
    }

    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function filtered() {
      if (!query) return data;
      var words = query.split(/\s+/);
      return data.filter(function (it) {
        var hay = keys(it).toLowerCase();
        for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
        return true;
      });
    }

    var moreWrap = el('div', 'more');
    var moreBtn = el('button', 'btn soft', 'Load more');
    moreBtn.type = 'button';
    moreBtn.onclick = function () { shown += per; draw(); };
    moreWrap.appendChild(moreBtn);

    function draw() {
      if (!slot) return;
      var list = filtered();
      var slice = list.slice(0, shown);
      var html = '';
      for (var i = 0; i < slice.length; i++) html += render(slice[i], i);
      if (!slice.length) {
        slot.innerHTML = '<div class="empty">Nothing matches “' + esc(query) + '”.</div>';
      } else {
        slot.innerHTML = html;
      }
      if (cnt) cnt.textContent = list.length + ' ' + (cfg.unit || 'items');
      if (moreWrap.parentNode) moreWrap.parentNode.removeChild(moreWrap);
      if (list.length > slice.length) slot.parentNode.insertBefore(moreWrap, slot.nextSibling);
    }

    /* ---- spotlight ---- */
    if (cfg.spot) {
      var spot = cfg.spot;
      var box = typeof spot.box === 'string' ? document.querySelector(spot.box) : spot.box;
      var last = -1;
      function fire() {
        if (!box || !data.length) return;
        var i;
        do { i = Math.floor(Math.random() * data.length); } while (i === last && data.length > 1);
        last = i;
        var item = data[i];
        var txt = box.querySelector(spot.text);
        var src = spot.src ? box.querySelector(spot.src) : null;
        if (txt) txt.innerHTML = spot.html ? spot.html(item) : esc(spot.pick(item));
        if (src) {
          var s = spot.source(item);
          src.textContent = s || '';
          src.style.display = s ? '' : 'none';
        }
      }
      if (spot.btn) {
        var b = typeof spot.btn === 'string' ? document.querySelector(spot.btn) : spot.btn;
        if (b) b.onclick = fire;
      }
      if (spot.shuffleBtn) {
        var s2 = typeof spot.shuffleBtn === 'string' ? document.querySelector(spot.shuffleBtn) : spot.shuffleBtn;
        if (s2) s2.onclick = fire;
      }
      fire();
    }

    draw();
    return { draw: draw, data: data, shuffle: function () { shuffle(data); draw(); } };
  }

  window.SAAGAR_FEED = { mount: mount };
})();
