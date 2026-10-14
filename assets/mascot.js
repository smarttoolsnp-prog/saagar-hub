/* ===========================================================
   SAAGAR — clay mascot (4 poses) + tiny helpers
   Usage:  SAAGAR_MASCOT.html('wave', 96)
           SAAGAR_MASCOT.pick('win')   -> 'cheer'
   Poses: wave | cheer | think | sad
   Inline SVG only, no external requests, no framework.
   =========================================================== */
(function () {
  'use strict';

  /* clay body shared by every pose */
  function body(eyes, mouth, arms) {
    return '' +
      '<defs>' +
        '<radialGradient id="mg" cx="35%" cy="28%" r="78%">' +
          '<stop offset="0%" stop-color="#c4b5fd"/>' +
          '<stop offset="55%" stop-color="#8b5cf6"/>' +
          '<stop offset="100%" stop-color="#6d28d9"/>' +
        '</radialGradient>' +
        '<radialGradient id="mc" cx="38%" cy="30%" r="72%">' +
          '<stop offset="0%" stop-color="#ffe9a8"/>' +
          '<stop offset="100%" stop-color="#fbbf24"/>' +
        '</radialGradient>' +
      '</defs>' +
      /* soft ground shadow */
      '<ellipse cx="60" cy="112" rx="30" ry="6" fill="#2a1f78" opacity=".16"/>' +
      /* arms */
      arms +
      /* body */
      '<rect x="22" y="30" width="76" height="76" rx="28" fill="url(#mg)"/>' +
      '<rect x="30" y="36" width="34" height="22" rx="11" fill="#fff" opacity=".28"/>' +
      /* face plate */
      '<rect x="34" y="52" width="52" height="40" rx="18" fill="#221a5c" opacity=".92"/>' +
      eyes + mouth +
      /* cheek highlights */
      '<circle cx="40" cy="84" r="5" fill="#f472b6" opacity=".55"/>' +
      '<circle cx="80" cy="84" r="5" fill="#f472b6" opacity=".55"/>';
  }

  var POSES = {
    wave: body(
      '<circle cx="51" cy="68" r="5.4" fill="#fff"/><circle cx="69" cy="68" r="5.4" fill="#fff"/>' +
      '<circle cx="51.8" cy="69.4" r="2.6" fill="#221a5c"/><circle cx="69.8" cy="69.4" r="2.6" fill="#221a5c"/>' +
      '<circle cx="52.6" cy="66.6" r="1.2" fill="#fff"/><circle cx="70.6" cy="66.6" r="1.2" fill="#fff"/>',
      '<path d="M54 82 q6 6 12 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
      '<rect x="6" y="34" width="18" height="34" rx="9" fill="url(#mg)" transform="rotate(-24 15 51)"/>' +
      '<rect x="96" y="40" width="18" height="34" rx="9" fill="url(#mg)" transform="rotate(18 105 57)"/>' +
      '<circle cx="10" cy="30" r="9" fill="url(#mc)"/>'
    ),
    cheer: body(
      '<path d="M46 66 q5 -6 10 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M64 66 q5 -6 10 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
      '<path d="M52 80 q8 9 16 0 q-8 3 -16 0z" fill="#fff"/>',
      '<rect x="2" y="20" width="18" height="34" rx="9" fill="url(#mg)" transform="rotate(-40 11 37)"/>' +
      '<rect x="100" y="20" width="18" height="34" rx="9" fill="url(#mg)" transform="rotate(40 109 37)"/>' +
      '<circle cx="4" cy="14" r="8" fill="url(#mc)"/><circle cx="116" cy="14" r="8" fill="url(#mc)"/>'
    ),
    think: body(
      '<circle cx="51" cy="70" r="5" fill="#fff"/><circle cx="69" cy="70" r="5" fill="#fff"/>' +
      '<circle cx="52" cy="70" r="2.4" fill="#221a5c"/><circle cx="70" cy="70" r="2.4" fill="#221a5c"/>' +
      '<path d="M44 60 q7 -4 13 -1" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>',
      '<path d="M54 84 h12" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
      '<rect x="8" y="44" width="18" height="32" rx="9" fill="url(#mg)" transform="rotate(10 17 60)"/>' +
      '<rect x="98" y="30" width="18" height="32" rx="9" fill="url(#mg)" transform="rotate(-52 107 46)"/>' +
      '<circle cx="112" cy="18" r="5" fill="#fbbf24" opacity=".9"/>' +
      '<circle cx="122" cy="10" r="3" fill="#fbbf24" opacity=".7"/>'
    ),
    sad: body(
      '<circle cx="51" cy="69" r="5" fill="#fff"/><circle cx="69" cy="69" r="5" fill="#fff"/>' +
      '<circle cx="51" cy="70" r="2.4" fill="#221a5c"/><circle cx="69" cy="70" r="2.4" fill="#221a5c"/>' +
      '<path d="M44 61 q7 4 13 2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M67 63 q7 -2 13 -2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>',
      '<path d="M54 88 q6 -6 12 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
      '<rect x="10" y="60" width="18" height="30" rx="9" fill="url(#mg)" opacity=".95"/>' +
      '<rect x="96" y="60" width="18" height="30" rx="9" fill="url(#mg)" opacity=".95"/>' +
      '<path d="M104 44 q6 8 0 14 q-6 -6 0 -14z" fill="#7dd3fc"/>'
    )
  };

  function html(pose, size) {
    var p = POSES[pose] || POSES.wave;
    return '<svg class="mascot mascot-' + (pose || 'wave') + '" viewBox="0 0 124 120" width="' +
      (size || 120) + '" height="' + (size || 120) + '" role="img" aria-label="SAAGAR mascot">' + p + '</svg>';
  }

  window.SAAGAR_MASCOT = {
    html: html,
    POSES: ['wave', 'cheer', 'think', 'sad'],
    /* pick the right pose for a moment */
    pick: function (moment) {
      var map = {
        hello: 'wave', empty: 'think', loading: 'think', win: 'cheer',
        'win-big': 'cheer', lose: 'sad', error: 'sad', offline: 'sad',
        hint: 'think', invite: 'wave', share: 'cheer', daily: 'think', celebrate: 'cheer'
      };
      return map[moment] || 'wave';
    }
  };
})();
