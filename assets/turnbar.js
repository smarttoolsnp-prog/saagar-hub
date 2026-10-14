/* ===========================================================
   SAAGAR — turn timer (turnbar)
   A slim countdown pill fixed at the top of the screen while a
   human player is on the clock. Games call:

     SAAGAR_TURN.arm({ secs: 30, onSkip: fn })  — start / restart
     SAAGAR_TURN.stop()                         — cancel

   When the countdown ends, onSkip fires ONCE (turn skipped).
   The bar never blocks touches (pointer-events:none).
   =========================================================== */
(function () {
  'use strict';

  var bar = null, fill = null, txt = null;
  var deadline = 0, total = 30, iv = null, skip = null, gen = 0;

  function build() {
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'saagar-turnbar';
    fill = document.createElement('i');
    txt = document.createElement('span');
    bar.appendChild(fill);
    bar.appendChild(txt);
    document.body.appendChild(bar);
  }

  function paint() {
    var leftMs = deadline - Date.now();
    var left = Math.max(0, Math.ceil(leftMs / 1000));
    txt.textContent = '\u23F1 ' + left + 's';
    fill.style.setProperty('--w', Math.max(0, Math.min(100, (leftMs / (total * 1000)) * 100)) + '%');
    bar.classList.toggle('low', left <= 10);
  }

  function arm(opts) {
    opts = opts || {};
    build();
    /* your-turn ding (sound engine is optional — games work without it) */
    if (window.SAAGAR_SOUND) window.SAAGAR_SOUND.play('turn');
    gen++;
    var my = gen;
    total = opts.secs > 0 ? opts.secs : 30;
    skip = typeof opts.onSkip === 'function' ? opts.onSkip : null;
    deadline = Date.now() + total * 1000;
    bar.classList.add('on');
    paint();
    if (iv) clearInterval(iv);
    iv = setInterval(function () {
      if (my !== gen) return;
      paint();
      if (Date.now() >= deadline) {
        var fn = skip;          /* capture BEFORE stop() clears it */
        stop();
        if (fn) fn();
      }
    }, 250);
  }

  function stop() {
    gen++;
    skip = null;
    if (iv) { clearInterval(iv); iv = null; }
    if (bar) bar.classList.remove('on');
  }

  window.SAAGAR_TURN = { arm: arm, stop: stop };
})();
