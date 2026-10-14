/* ===========================================================
   SAAGAR — daily challenge
   One short challenge a day: 5 mixed questions (Nepal GK + logic),
   the same for everyone that day, resetting at midnight Nepal time
   (UTC+5:45). Wordle-style shareable result, streaks, XP, badges.

   Everything here is client-side and optional: no account, no
   network call, no personal data leaves the device.
   =========================================================== */
(function () {
  'use strict';

  var NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;   /* UTC+5:45 */
  var KEY = 'saagar.';
  var XP_PER_CORRECT = 10, XP_PER_PERFECT = 25, XP_PER_LEVEL = 100;

  function store(k, v) {
    try {
      if (v === undefined) { var r = localStorage.getItem(KEY + k); return r === null ? null : JSON.parse(r); }
      localStorage.setItem(KEY + k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function sound(n, o) { if (window.SAAGAR_SOUND) window.SAAGAR_SOUND.play(n, o); }

  /* ---------- day key in Nepal time ---------- */
  function nepalDayKey(d) {
    var t = (d ? new Date(d) : new Date()).getTime() + NEPAL_OFFSET_MS;
    var nd = new Date(t);
    return nd.getUTCFullYear() + '-' + String(nd.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(nd.getUTCDate()).padStart(2, '0');
  }
  function msToNepalMidnight() {
    var t = Date.now() + NEPAL_OFFSET_MS;
    var nd = new Date(t);
    var nextMidnightUtc = Date.UTC(nd.getUTCFullYear(), nd.getUTCMonth(), nd.getUTCDate() + 1);
    return nextMidnightUtc - t;
  }

  /* ---------- question bank ----------
     catalog: 'gk' (verifiable Nepal facts) | 'logic' (self-contained puzzles) */
  var BANK = [
    { c: 'gk', q: 'What is the capital city of Nepal?', a: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar'], k: 0, e: 'Kathmandu is the capital and the largest city of Nepal.' },
    { c: 'gk', q: 'Which mountain is the highest in the world and lies on Nepal\u2019s northern border?', a: ['Mount Everest (Sagarmatha)', 'Kanchenjunga', 'Annapurna', 'Manaslu'], k: 0, e: 'Sagarmatha / Everest is 8,848.86 m and sits on the Nepal\u2013China border.' },
    { c: 'gk', q: 'What is Nepal\u2019s national flower?', a: ['Rhododendron (Lali Gurans)', 'Lotus', 'Sunflower', 'Marigold'], k: 0, e: 'Lali Gurans (rhododendron) is the national flower.' },
    { c: 'gk', q: 'What is Nepal\u2019s national bird?', a: ['Danphe (Himalayan monal)', 'Peacock', 'Himalayan griffon', 'Kalij pheasant'], k: 0, e: 'The Danphe (Himalayan monal) is the national bird.' },
    { c: 'gk', q: 'How many provinces does Nepal have?', a: ['7', '5', '9', '14'], k: 0, e: 'Nepal has 7 provinces and 77 districts.' },
    { c: 'gk', q: 'How many districts does Nepal have?', a: ['77', '75', '81', '70'], k: 0, e: 'Nepal has 77 districts across 7 provinces.' },
    { c: 'gk', q: 'Which city is called the "City of Lakes"?', a: ['Pokhara', 'Kathmandu', 'Janakpur', 'Nepalgunj'], k: 0, e: 'Pokhara is known as the City of Lakes (Phewa, Begnas and more).' },
    { c: 'gk', q: 'Lumbini, in Rupandehi district, is best known as:', a: ['The birthplace of Buddha', 'Nepal\u2019s oldest university', 'A major seaport', 'The highest hill station'], k: 0, e: 'Lumbini is the birthplace of Siddhartha Gautama (Buddha).' },
    { c: 'gk', q: 'What is Nepal\u2019s national sport?', a: ['Volleyball', 'Football', 'Cricket', 'Kabaddi'], k: 0, e: 'Volleyball is recognised as the national sport of Nepal.' },
    { c: 'gk', q: 'Which is the largest lake in Nepal?', a: ['Rara Lake', 'Phewa Lake', 'Tilicho Lake', 'Shey Phoksundo'], k: 0, e: 'Rara Lake in Mugu is the largest lake in Nepal.' },
    { c: 'gk', q: 'What is Nepal\u2019s time zone offset from UTC?', a: ['+5:45', '+5:00', '+6:00', '+5:30'], k: 0, e: 'Nepal uses UTC+5:45, one of the few 45-minute offsets in the world.' },
    { c: 'gk', q: 'The first month of the Bikram Sambat calendar is:', a: ['Baisakh', 'Chaitra', 'Magh', 'Ashwin'], k: 0, e: 'The Bikram Sambat year begins in Baisakh (mid-April).' },
    { c: 'gk', q: 'Sagarmatha National Park is in which district?', a: ['Solukhumbu', 'Taplejung', 'Dolpa', 'Rasuwa'], k: 0, e: 'Sagarmatha National Park covers Solukhumbu district.' },
    { c: 'gk', q: 'Which river is the longest inside Nepal?', a: ['Karnali', 'Koshi', 'Gandaki', 'Bagmati'], k: 0, e: 'The Karnali is the longest river flowing within Nepal.' },
    { c: 'gk', q: 'Which country borders Nepal to the south?', a: ['India', 'China', 'Bhutan', 'Bangladesh'], k: 0, e: 'Nepal borders India to the south, east and west, and China to the north.' },
    { c: 'gk', q: 'What is the national animal of Nepal?', a: ['Cow', 'Tiger', 'Elephant', 'Snow leopard'], k: 0, e: 'The cow is Nepal\u2019s national animal.' },
    { c: 'gk', q: 'Nepal\u2019s parliament is called the:', a: ['Federal Parliament (Sansad)', 'National Assembly only', 'Panchayat', 'Darbar Sabha'], k: 0, e: 'Nepal has a bicameral Federal Parliament: House of Representatives and National Assembly.' },
    { c: 'gk', q: 'Approximately how large is Nepal in area?', a: ['147,516 km\u00B2', '90,000 km\u00B2', '300,000 km\u00B2', '56,827 km\u00B2'], k: 0, e: 'Nepal covers about 147,516 square kilometres.' },
    { c: 'gk', q: 'Who reached the summit of Everest first, in 1953?', a: ['Tenzing Norgay and Edmund Hillary', 'Junko Tabei and Ang Tshering', 'Reinhold Messner and Peter Habeler', 'Apa Sherpa and Ed Viesturs'], k: 0, e: 'Tenzing Norgay Sherpa and Edmund Hillary reached the summit on 29 May 1953.' },
    { c: 'gk', q: 'Annapurna, Dhaulagiri and Machhapuchhre are all types of:', a: ['Mountains', 'Rivers', 'Lakes', 'National parks'], k: 0, e: 'They are all Himalayan peaks in Nepal.' },

    { c: 'logic', q: 'If 3 machines make 3 toys in 3 minutes, how long do 100 machines take to make 100 toys?', a: ['3 minutes', '100 minutes', '33 minutes', '1 minute'], k: 0, e: 'Each machine makes one toy in 3 minutes regardless of how many machines there are.' },
    { c: 'logic', q: 'What comes next: 2, 6, 12, 20, 30, ?', a: ['42', '40', '44', '36'], k: 0, e: 'Differences grow by 2: +4, +6, +8, +10, +12 \u2192 42.' },
    { c: 'logic', q: 'Which one does not belong: 8, 27, 64, 100?', a: ['100', '8', '27', '64'], k: 0, e: '8, 27 and 64 are perfect cubes (2\u00B3, 3\u00B3, 4\u00B3); 100 is not.' },
    { c: 'logic', q: 'A book costs Rs 100 plus half its price. What is its price?', a: ['Rs 200', 'Rs 150', 'Rs 250', 'Rs 300'], k: 0, e: 'Let x = 100 + x/2, so x/2 = 100 and x = 200.' },
    { c: 'logic', q: 'How many times do a clock\u2019s hour and minute hands overlap in 12 hours?', a: ['11', '12', '10', '24'], k: 0, e: 'They overlap 11 times in 12 hours (once every 65.45 minutes).' },
    { c: 'logic', q: 'Today is Wednesday. What day is it 100 days later?', a: ['Friday', 'Monday', 'Saturday', 'Thursday'], k: 0, e: '100 \u00F7 7 leaves a remainder of 2, so Wednesday + 2 = Friday.' },
    { c: 'logic', q: 'You have 3 identical coins and one is lighter. Using a balance scale, the minimum weighings to find it is:', a: ['1', '2', '3', '4'], k: 0, e: 'Weigh one against one; if they balance, the third is the light one.' },
    { c: 'logic', q: 'Which number continues the pattern: 1, 4, 9, 16, 25, ?', a: ['36', '30', '49', '32'], k: 0, e: 'These are squares: 1\u00B2, 2\u00B2, 3\u00B2 \u2026 next is 6\u00B2 = 36.' },
    { c: 'logic', q: 'A farmer has 17 sheep. All but 9 run away. How many are left?', a: ['9', '8', '17', '0'], k: 0, e: '"All but 9" means 9 stayed.' },
    { c: 'logic', q: 'If you fold a square paper in half twice, how many equal parts do you get?', a: ['4', '2', '8', '3'], k: 0, e: 'Each fold doubles the parts: 2 then 4.' }
  ];

  /* ---------- deterministic pick for a day ---------- */
  function seedFrom(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var s = seed || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function pickQuestions(dayKey) {
    var r = rng(seedFrom(dayKey));
    var gk = BANK.filter(function (x) { return x.c === 'gk'; });
    var logic = BANK.filter(function (x) { return x.c === 'logic'; });
    function take(arr, n) {
      var copy = arr.slice();
      var out = [];
      while (out.length < n && copy.length) out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
      return out;
    }
    /* 3 Nepal GK + 2 logic, mixed together */
    var chosen = take(gk, 3).concat(take(logic, 2));
    /* shuffle options order deterministically, then the questions */
    chosen.forEach(function (item) {
      var opts = item.a.map(function (t, i) { return { t: t, correct: i === item.k }; });
      for (var i = opts.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1));
        var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
      }
      item._opts = opts;
      item._answer = opts.findIndex(function (o) { return o.correct; });
    });
    for (var i = chosen.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = chosen[i]; chosen[i] = chosen[j]; chosen[j] = t;
    }
    return chosen;
  }

  /* ---------- progress ---------- */
  function progress() {
    return store('progress') || { xp: 0, streak: 0, best: 0, plays: 0, perfect: 0, badges: [], last: null, days: {} };
  }
  function saveProgress(p) { store('progress', p); }
  function level(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
  function badgesFor(p) {
    var out = [];
    if (p.plays >= 1) out.push({ id: 'first', label: 'First step', icon: '🌱' });
    if (p.streak >= 3) out.push({ id: 'streak3', label: '3-day streak', icon: '🔥' });
    if (p.streak >= 7) out.push({ id: 'streak7', label: 'Week streak', icon: '⚡' });
    if (p.streak >= 30) out.push({ id: 'streak30', label: 'Month streak', icon: '🏆' });
    if (p.perfect >= 1) out.push({ id: 'perfect', label: 'Perfect day', icon: '💎' });
    if (p.perfect >= 10) out.push({ id: 'perfect10', label: '10 perfect days', icon: '👑' });
    if (level(p.xp) >= 5) out.push({ id: 'lvl5', label: 'Level 5', icon: '🎖️' });
    return out;
  }

  /* ---------- share ---------- */
  function gridFor(day) {
    var marks = day && day.marks ? day.marks : [];
    return marks.map(function (m) { return m ? '🟩' : '🟥'; }).join('');
  }
  function shareText(day, p) {
    return 'SAAGAR daily challenge ' + day.date + '\n' +
      gridFor(day) + ' ' + day.score + '/' + day.total + '\n' +
      '🔥 streak ' + p.streak + ' · ⭐ ' + p.xp + ' XP (level ' + level(p.xp) + ')\n' +
      'Play: https://sagardahal123.com.np/daily.html';
  }
  function shareCard(day, p, cb) {
    var W = 1080, H = 1080;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    /* clay background */
    var grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#241c58'); grad.addColorStop(0.55, '#2e2570'); grad.addColorStop(1, '#392f8c');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(124,58,237,.22)';
    g.beginPath(); g.arc(W * 0.85, H * 0.12, 260, 0, 7); g.fill();
    g.fillStyle = 'rgba(34,211,238,.14)';
    g.beginPath(); g.arc(W * 0.1, H * 0.9, 240, 0, 7); g.fill();

    /* mascot (drawn with primitives — keeps the canvas untainted for export) */
    function mascot(cx, cy, s) {
      g.save();
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.beginPath(); g.ellipse(cx, cy + s * 1.02, s * 0.72, s * 0.14, 0, 0, 7); g.fill();
      var bg = g.createRadialGradient(cx - s * 0.3, cy - s * 0.4, s * 0.1, cx, cy, s * 1.3);
      bg.addColorStop(0, '#c4b5fd'); bg.addColorStop(0.6, '#8b5cf6'); bg.addColorStop(1, '#6d28d9');
      g.fillStyle = bg;
      var rr = s * 0.55;
      var x = cx - s, y = cy - s, w = s * 2, h = s * 2;
      g.beginPath();
      g.moveTo(x + rr, y);
      g.arcTo(x + w, y, x + w, y + h, rr);
      g.arcTo(x + w, y + h, x, y + h, rr);
      g.arcTo(x, y + h, x, y, rr);
      g.arcTo(x, y, x + w, y, rr);
      g.closePath(); g.fill();
      /* face */
      g.fillStyle = '#221a5c';
      g.beginPath();
      var fr = s * 0.42, fx = cx - s * 0.7, fy = cy - s * 0.35, fw = s * 1.4, fh = s * 1.0;
      g.moveTo(fx + fr, fy);
      g.arcTo(fx + fw, fy, fx + fw, fy + fh, fr);
      g.arcTo(fx + fw, fy + fh, fx, fy + fh, fr);
      g.arcTo(fx, fy + fh, fx, fy, fr);
      g.arcTo(fx, fy, fx + fw, fy, fr);
      g.closePath(); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(cx - s * 0.34, cy - s * 0.12, s * 0.17, 0, 7); g.fill();
      g.beginPath(); g.arc(cx + s * 0.34, cy - s * 0.12, s * 0.17, 0, 7); g.fill();
      g.fillStyle = '#221a5c';
      g.beginPath(); g.arc(cx - s * 0.32, cy - s * 0.08, s * 0.08, 0, 7); g.fill();
      g.beginPath(); g.arc(cx + s * 0.36, cy - s * 0.08, s * 0.08, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = s * 0.1; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - s * 0.2, cy + s * 0.36); g.quadraticCurveTo(cx, cy + s * 0.6, cx + s * 0.22, cy + s * 0.36); g.stroke();
      g.restore();
    }
    mascot(W * 0.84, H * 0.8, 78);

    /* text */
    g.textAlign = 'left';
    g.fillStyle = '#f6f2ff';
    g.font = '900 62px Nunito, system-ui, sans-serif';
    g.fillText('SAAGAR', 84, 150);
    g.fillStyle = '#c9bfef';
    g.font = '800 30px Nunito, system-ui, sans-serif';
    g.fillText('Daily challenge', 86, 196);
    g.fillStyle = '#f6f2ff';
    g.font = '900 150px Nunito, system-ui, sans-serif';
    g.fillText(day.score + '/' + day.total, 80, 400);
    /* result grid — drawn as shapes, not emoji: emoji fonts are missing or
       monochrome on some phones, which would break the card */
    var marks = day.marks || [], gx = 84, gy = 470, cell = 68, gap = 16;
    marks.forEach(function (m, i) {
      var x = gx + i * (cell + gap);
      g.fillStyle = m ? '#22c55e' : '#ef4444';
      g.beginPath();
      var rr = 16, w = cell, h = cell;
      g.moveTo(x + rr, gy);
      g.arcTo(x + w, gy, x + w, gy + h, rr);
      g.arcTo(x + w, gy + h, x, gy + h, rr);
      g.arcTo(x, gy + h, x, gy, rr);
      g.arcTo(x, gy, x + w, gy, rr);
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.beginPath(); g.ellipse(x + w * 0.34, gy + h * 0.28, w * 0.2, h * 0.14, -0.5, 0, 7); g.fill();
    });
    g.fillStyle = '#fbbf24';
    g.font = '900 44px Nunito, system-ui, sans-serif';
    g.fillText('🔥 ' + p.streak + '-day streak', 84, 620);
    g.fillStyle = '#a5b4fc';
    g.font = '800 34px Nunito, system-ui, sans-serif';
    g.fillText('⭐ ' + p.xp + ' XP · level ' + level(p.xp), 84, 676);
    g.fillStyle = 'rgba(255,255,255,.72)';
    g.font = '800 30px Nunito, system-ui, sans-serif';
    g.fillText('sagardahal123.com.np/daily.html', 84, H - 72);
    g.fillStyle = '#c4b5fd';
    g.font = '800 28px Nunito, system-ui, sans-serif';
    g.fillText(day.date, 84, H - 120);
    cb(cv);
  }

  /* ---------- rendering ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function mascot(pose, size) {
    return (window.SAAGAR_MASCOT) ? window.SAAGAR_MASCOT.html(pose, size) : '';
  }

  function render(root) {
    if (!root) return;
    var today = nepalDayKey();
    var p = progress();
    var questions = pickQuestions(today);
    var prev = (p.days && p.days[today]) || null;

    root.innerHTML = '';
    var wrap = el('div', 'daily-wrap');

    /* progress strip */
    var strip = el('div', 'daily-strip');
    strip.appendChild(el('div', 'stat', '<b>' + p.streak + '</b><span>day streak 🔥</span>'));
    strip.appendChild(el('div', 'stat', '<b>' + p.xp + '</b><span>XP ⭐</span>'));
    strip.appendChild(el('div', 'stat', '<b>' + level(p.xp) + '</b><span>level</span>'));
    strip.appendChild(el('div', 'stat', '<b>' + (p.best || 0) + '</b><span>best score</span>'));
    wrap.appendChild(strip);

    /* countdown */
    var clock = el('p', 'daily-clock');
    wrap.appendChild(clock);
    function tick() {
      var ms = msToNepalMidnight();
      var h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      clock.textContent = 'New challenge in ' + h + 'h ' + m + 'm ' + s + 's (midnight Nepal time)';
    }
    tick();
    var iv = setInterval(tick, 1000);
    window.addEventListener('beforeunload', function () { clearInterval(iv); });

    /* the card */
    var card = el('div', 'daily-card');
    var qIndex = 0, marks = [], locked = prev && prev.done;

    function header() {
      var h = el('div', 'daily-head');
      h.appendChild(el('div', 'daily-day', esc(today)));
      h.appendChild(el('div', 'daily-qnum', 'Question <b>' + Math.min(qIndex + 1, questions.length) + '</b> of ' + questions.length));
      var bar = el('div', 'daily-bar');
      var fill = el('i');
      fill.style.width = ((locked ? questions.length : qIndex) / questions.length * 100) + '%';
      bar.appendChild(fill);
      h.appendChild(bar);
      return h;
    }
    function drawQuestion() {
      card.innerHTML = '';
      if (locked) { drawResult(); return; }
      card.appendChild(header());
      var item = questions[qIndex];
      card.appendChild(el('h3', 'daily-q', esc(item.q)));
      var opts = el('div', 'daily-opts');
      item._opts.forEach(function (o, i) {
        var b = el('button', 'daily-opt' + (o.correct ? ' is-correct' : ''), esc(o.t));
        b.type = 'button';
        b.onclick = function () { answer(i === item._answer, b, item); };
        opts.appendChild(b);
      });
      card.appendChild(opts);
      if (window.SAAGAR_SOUND) sound('tapSoft');
    }
    function answer(ok, btn, item) {
      var all = card.querySelectorAll('.daily-opt');
      Array.prototype.forEach.call(all, function (b) { b.disabled = true; });
      if (ok) { sound('coin'); btn.classList.add('picked'); }
      else { sound('error'); btn.classList.add('picked'); card.querySelectorAll('.is-correct').forEach(function (b) { b.classList.add('reveal'); }); }
      marks.push(!!ok);
      var note = el('p', 'daily-why', (ok ? '✅ Correct. ' : '❌ ' + (window.__saagarDailyShowAnswer === false ? '' : '')) + esc(item.e));
      card.appendChild(note);
      var next = el('button', 'btn daily-next', qIndex + 1 < questions.length ? 'Next question →' : 'See my result →');
      next.type = 'button';
      next.onclick = function () {
        qIndex++;
        if (qIndex < questions.length) drawQuestion(); else finish();
      };
      card.appendChild(next);
      next.focus();
    }
    function finish() {
      var score = marks.filter(Boolean).length;
      var total = questions.length;
      var toNepalYesterday = null;
      /* streak: yesterday (Nepal) or today */
      var y = nepalDayKey(new Date(Date.now() - 86400000));
      var continueStreak = (p.last === y || p.last === today);
      var newStreak = continueStreak ? (p.last === today ? p.streak : (p.streak || 0) + 1) : 1;
      var gained = score * XP_PER_CORRECT + (score === total ? XP_PER_PERFECT : 0);
      p.xp = (p.xp || 0) + gained;
      p.plays = (p.plays || 0) + 1;
      p.streak = newStreak;
      p.best = Math.max(p.best || 0, score);
      if (score === total) p.perfect = (p.perfect || 0) + 1;
      p.last = today;
      p.days = p.days || {};
      p.days[today] = { done: true, score: score, total: total, marks: marks.slice(), at: Date.now() };
      p.badges = badgesFor(p).map(function (b) { return b.id; });
      saveProgress(p);
      locked = true;
      sound(score === total ? 'win' : (score >= 3 ? 'streak' : 'lose'), { big: score === total });
      drawResult(gained);
    }
    function drawResult(gained) {
      var day = (p.days && p.days[today]) || { score: marks.filter(Boolean).length, total: questions.length, marks: marks, date: today };
      day.date = today;
      card.innerHTML = '';
      card.appendChild(header());
      var big = el('div', 'daily-score', '<b>' + day.score + '/' + day.total + '</b>');
      card.appendChild(big);
      card.appendChild(el('div', 'daily-grid', gridFor(day).split('').join(' ')));
      if (gained) card.appendChild(el('p', 'daily-gain', '+' + gained + ' XP · 🔥 ' + p.streak + '-day streak' + (p.streak >= 3 ? ' — keep it alive!' : '')));
      else card.appendChild(el('p', 'daily-gain', '🔥 ' + p.streak + '-day streak · ⭐ ' + p.xp + ' XP (level ' + level(p.xp) + ')'));

      var why = el('details', 'daily-review');
      why.appendChild(el('summary', null, 'Review the answers'));
      questions.forEach(function (item, i) {
        var ok = marks[i] !== undefined ? marks[i] : (day.marks ? day.marks[i] : false);
        why.appendChild(el('p', 'daily-why', (ok ? '✅ ' : '❌ ') + '<b>' + esc(item.q) + '</b><br>' + esc(item.e)));
      });
      card.appendChild(why);

      var row = el('div', 'daily-actions');
      var copy = el('button', 'btn', '📋 Copy result');
      copy.type = 'button';
      copy.onclick = function () {
        var txt = shareText(day, p);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
        else {
          var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(t);
        }
        if (window.SAAGAR && window.SAAGAR.toast) window.SAAGAR.toast('Result copied — paste it anywhere');
      };
      var share = el('button', 'btn', '📤 Share');
      share.type = 'button';
      share.onclick = function () {
        var txt = shareText(day, p);
        if (navigator.share) navigator.share({ title: 'SAAGAR daily challenge', text: txt, url: 'https://sagardahal123.com.np/daily.html' }).catch(function () {});
        else copy.click();
      };
      var png = el('button', 'btn', '🖼️ Share card');
      png.type = 'button';
      png.onclick = function () {
        shareCard(day, p, function (cv) {
          var url = cv.toDataURL('image/png');
          var a = document.createElement('a');
          a.href = url; a.download = 'saagar-daily-' + today + '.png';
          document.body.appendChild(a); a.click(); a.remove();
          if (window.SAAGAR && window.SAAGAR.toast) window.SAAGAR.toast('Card saved (1080×1080)');
        });
      };
      row.appendChild(copy); row.appendChild(share); row.appendChild(png);
      card.appendChild(row);

      /* badges */
      var bl = el('div', 'daily-badges');
      badgesFor(p).forEach(function (b) {
        bl.appendChild(el('span', 'badge', b.icon + ' ' + b.label));
      });
      if (!bl.children.length) bl.appendChild(el('span', 'badge dim', 'Play to earn your first badge 🌱'));
      card.appendChild(bl);

      var invite = el('p', 'daily-invite');
      invite.innerHTML = mascot('cheer', 84) +
        '<span>Challenge a friend — send them this page and compare your grid. ' +
        '<a href="games.html">Or play a game together in a room →</a></span>';
      card.appendChild(invite);
    }

    wrap.appendChild(card);
    root.appendChild(wrap);
    drawQuestion();
  }

  window.SAAGAR_DAILY = {
    render: render,
    dayKey: nepalDayKey,
    progress: progress,
    shareCard: shareCard,
    pick: pickQuestions,
    BANK: BANK
  };

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('daily');
    if (root) render(root);
  });
  if (document.readyState !== 'loading') {
    var root2 = document.getElementById('daily');
    if (root2) render(root2);
  }
})();
