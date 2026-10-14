/* ===========================================================
   SAAGAR — unified inline-SVG icon set
   sagardahal123.com.np
   Use ICONS.render(key) or ICONS.h(key) in HTML/JS.
   Palette: stroke currentColor, so any coloured parent works.
   =========================================================== */

var ICONS = (function () {
  'use strict';

  /* ---- base stroke icon style ---- */
  var STROKE = {
    viewBox: '0 0 24 24',
    fill: 'none',
    'stroke': 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  };

  function svg(inner, extra, size) {
    extra = extra || {};
    size = size || 'width:22px;height:22px';
    var a = [];
    for (var k in STROKE) a.push(k + '="' + esc(STROKE[k]) + '"');
    for (var k2 in extra) a.push(k2 + '="' + esc(extra[k2]) + '"');
    return '<svg viewBox="' + STROKE.viewBox + '" ' + a.join(' ') + ' style="' + size + '">' +
           inner + '</svg>';
  }

  function esc(s) { return String(s == null ? '' : s); }

  /* ---- nav / browse / footer icons ---- */
  var set = {

    home: svg('<path d="M3 12 L11 4 L21 12 L11 20 Z"/>'),

    tools: svg(
      '<rect x="5" y="3" width="6" height="6" rx="1"/>' +
      '<rect x="13" y="3" width="6" height="6" rx="1" fill="currentColor" opacity=".3"/>' +
      '<rect x="2" y="11" width="20" height="2" rx="1"/>' +
      '<rect x="2" y="15" width="20" height="2" rx="1"/>'
    ),

    games: svg(
      '<rect x="3" y="3" width="20" height="20" rx="3"/>' +
      '<circle cx="8" cy="8" r="2.5" fill="currentColor" opacity=".45"/>' +
      '<circle cx="16" cy="16" r="2.5" fill="currentColor" opacity=".45"/>' +
      '<path d="M6 16 L18 8"/>'
    ),

    skills: svg(
      '<circle cx="12" cy="8" r="4"/>' +
      '<path d="M12 12 L12 15 L10 17 L14 17 Z"/>' +
      '<path d="M6 16 L8 16 L10 14 L12 14 M16 16 L18 16 L16 14 L14 14"/>'
    ),

    law: svg(
      '<path d="M3 6 L9 6 L12 12 L15 6 L21 6 M8 12 L8 21 M16 12 L16 21 M12 12 L12 21"/>'
    ),

    privacy: svg(
      '<path d="M12 2 C6.477 2 2 6.477 2 12 s4.477 10 10 10 10-4.477 10-10 S17.523 2 12 2 z"/>' +
      '<path d="M12 6 a6 6 0 0 0 0 12 6 6 0 0 0 0-12"/>' +
      '<circle cx="12" cy="12" r="2.5"/>'
    ),

    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7 L12 13 L21 7"/>'),

    social: svg(
      '<path d="M18 2h3a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5 z"/>' +
      '<path d="M13 18v-7a3 3 0 0 0-3-3H8m9 0h-2m3 3a3 3 0 0 0-3-3H8 M14 5a6 6 0 0 0-11.4-2.8"/>'
    ),

    /* ---- heading icon helpers (bigger, inline with titles) ---- */
    percent:  svg('<path d="M5 19 L19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    globe:    svg('<circle cx="8" cy="8" r="5.5"/><circle cx="16" cy="16" r="5.5"/><path d="M9 7 L7 9 M15 15 L17 17"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    calc:    svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5 L15 15 M15 9.5 L9.5 15"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    chart:    svg('<path d="M3 3v18 M3 9 L8 9 M3 14 L12 14 M3 19 L18 19"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    doc:     svg('<path d="M5 4 h14 l-1 16 H6 z"/><path d="M8 8 h8 M8 12 h5 M8 16 h3"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    photo:   svg('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M20 20 L14.5 14.5"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    qrcode:  svg('<rect x="5" y="5" width="13" height="13" rx="1.5"/><rect x="8" y="8" width="3" height="3"/><rect x="13" y="8" width="2.5" height="2.5"/><rect x="8" y="13" width="2.5" height="3"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    number:  svg('<path d="M4 4 h16 v16 H4 z"/><path d="M9 7 v7 M15 7 v7 M7 9 h7 M7 15 h7"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    date:    svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9 h18 M8 3 v4 M16 3 v4"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    age:     svg('<circle cx="12" cy="9" r="4"/><path d="M4 22 l3-3 2 2 3-3 3 3"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    unit:    svg('<path d="M3 7 h18"/><path d="M3 12 h18"/><path d="M3 17 h12"/><path d="M3 7 v10"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    land:    svg('<path d="M3 21 L12 7 l9 14 z"/><path d="M7 15 l4-3 4 3"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    gold:    svg('<path d="M12 3 L17 8 L17 16 L12 18 L7 16 L7 8 Z"/><path d="M12 3 L12 10 M12 14 l-3 3 3 3 M12 14 l3 3-3 3"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    blood:   svg('<circle cx="12" cy="12" r="10"/><path d="M12 8 v8 M8 12 h8"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    phone:   svg('<path d="M5 4h4l3 7-4 2-4-2V4z"/><path d="M9 18v-4a3 3 0 0 1 6 0v4"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    map:     svg('<path d="M3 7l7-4 7 4 7-4v14 l-7 4-7-4-7 4z"/><path d="M9 11h6 M9 15h6"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    ussd:    svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8 M8 12h8 M8 16h5"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    nepali:  svg('<circle cx="12" cy="12" r="9"/><path d="M9 10c0-2 1.5-3 3-3s3 1 3 3-1.5 3-3 3"/><path d="M12 16v4"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    words:   svg('<path d="M4 7h16M4 12h12M4 17h9"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    pdf:     svg('<path d="M6 3h12 l-1 17 H7 z"/><path d="M9 7h6 M9 11h4 M9 15h3"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    scan:    svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h6 M7 12h5 M7 15h4"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    ocr:     svg('<path d="M5 4h14l-1 16H6z"/><circle cx="8" cy="8" r="1.5"/><path d="M8 12h8M8 15h5"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    sign:    svg('<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M7 9c2 1 3 4 7 3"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    usd:     svg('<path d="M12 2 C6.477 2 2 6.477 2 12 s4.477 10 10 10 10-4.477 10-10 S17.523 2 12 2z"/><path d="M7 8h10 M9 12h6 M7 6l5 6-5 6"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    marks:   svg('<path d="M4 19h16"/><path d="M8 19V9M12 19V6M16 19V10"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    info:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    lightbulb:svg('<path d="M9 2h6a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-2v6l-2 1a3 3 0 0 0 2.5 4.5h7a3 3 0 0 0 3-3v-1a3 3 0 0 0-.7-1.6L19 12V9a3 3 0 0 0-3.3-2.7L15 6H9a3 3 0 0 0-3 3v1l-.7 2.4A3 3 0 0 1 5 9V6a3 3 0 0 0-3 3v2l2-1z"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    video:   svg('<path d="M5 4h3l1.5 9H5z"/><rect x="9.5" y="4" width="2.5" height="16"/><path d="M16 4h3l-1 14h-2z"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),
    email:   svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7 L12 13 L21 7"/>', {}, 'width:30px;height:30px;display:inline;vertical-align:top;margin-right:7px'),

    /* ---- game page title icons ---- */
    ludo:    svg('<rect x="2" y="2" width="20" height="20" rx="3.5"/><rect x="4" y="4" width="7" height="7" rx="1.5" fill="#ff3b5c"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="#34d399"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="#fbbf24"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="#38bdf8"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    carrom:  svg('<rect x="2" y="2" width="20" height="20" rx="3.5" fill="#c98b4e"/><circle cx="12" cy="12" r="4" fill="#e02849"/><circle cx="8" cy="8" r="1.6" fill="#fdf6ec"/><circle cx="16" cy="8" r="1.6" fill="#fdf6ec"/><circle cx="8" cy="16" r="1.6" fill="#fdf6ec"/><circle cx="16" cy="16" r="1.6" fill="#fdf6ec"/><circle cx="12" cy="6" r="1.3" fill="#e8a33d"/><circle cx="12" cy="18" r="1.3" fill="#e8a33d"/><circle cx="6" cy="12" r="1.3" fill="#e8a33d"/><circle cx="18" cy="12" r="1.3" fill="#e8a33d"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    connect4:svg('<rect x="2" y="3" width="20" height="18" rx="3" fill="#1e3a8a"/><circle cx="6.5" cy="7.5" r="2.2" fill="#fff"/><circle cx="12" cy="7.5" r="2.2" fill="#fbbf24"/><circle cx="17.5" cy="7.5" r="2.2" fill="#fff"/><circle cx="6.5" cy="12.5" r="2.2" fill="#fff"/><circle cx="12" cy="12.5" r="2.2" fill="#e02849"/><circle cx="17.5" cy="12.5" r="2.2" fill="#fff"/><circle cx="6.5" cy="17.5" r="2.2" fill="#fff"/><circle cx="12" cy="17.5" r="2.2" fill="#fff"/><circle cx="17.5" cy="17.5" r="2.2" fill="#fbbf24"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    g2048:   svg('<rect x="2" y="2" width="20" height="20" rx="3.5" fill="#bbada0"/><rect x="4" y="4" width="7" height="7" rx="1.5" fill="#f5f7fa"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="#f2b179"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="#f59563"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="#edcf61"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    guess:   svg('<rect x="3" y="2" width="18" height="20" rx="3.5" fill="#3b82f6"/><circle cx="12" cy="12" r="6.5" fill="#fff" opacity=".16"/><path d="M9.4 9.4 A2.7 2.7 0 1 1 13 12 C12.3 12.4 12 12.9 12 13.8" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="#fff"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    memory:  svg('<g transform="rotate(-9 6.5 10.5)"><rect x="2" y="4" width="9" height="13" rx="2" fill="#ff6b9d"/><circle cx="6.5" cy="10.5" r="2.1" fill="#fff" opacity=".75"/></g><g transform="rotate(9 17.5 10.5)"><rect x="13" y="4" width="9" height="13" rx="2" fill="#22d3ee"/><circle cx="17.5" cy="10.5" r="2.1" fill="#fff" opacity=".75"/></g>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    reaction:svg('<circle cx="12" cy="12" r="10" fill="#e8433c"/><path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill="#34d399"/><circle cx="12" cy="12" r="2.1" fill="#fff"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    rps:     svg('<circle cx="6.5" cy="7.5" r="4.6" fill="#b08954"/><rect x="12.5" y="3.5" width="9" height="7.5" rx="1.6" fill="#fff" stroke="#c9cfe2" stroke-width="1"/><circle cx="16.5" cy="17" r="4.6" fill="#8f9bb3"/><path d="M14.4 14.9 L18.6 19.1 M18.6 14.9 L14.4 19.1" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),
    tictactoe:svg('<rect x="2" y="2" width="20" height="20" rx="3.5" fill="#fdf8ee"/><path d="M9.3 2 L9.3 22 M14.7 2 L14.7 22 M2 9.3 L22 9.3 M2 14.7 L22 14.7" stroke="#c9a86a" stroke-width="1.3"/><path d="M4.6 4.6 L8.1 8.1 M8.1 4.6 L4.6 8.1" stroke="#e02849" stroke-width="2.1" stroke-linecap="round"/><circle cx="17.6" cy="17.6" r="2.7" stroke="#2b6cb0" stroke-width="2.1" fill="none"/><path d="M4.6 17.1 L8.1 20.6 M8.1 17.1 L4.6 20.6" stroke="#e02849" stroke-width="2.1" stroke-linecap="round" opacity=".5"/>', {color:'#312e81'}, 'width:30px;height:30px;display:inline;vertical-align:middle'),

    /* ---- search bar ---- */
    search:  svg('<circle cx="11" cy="11" r="7"/><path d="M21 21 l-4.3-4.3"/>', {}, 'width:18px;height:18px;flex-shrink:0'),
    send:    svg('<path d="M2 12 L12 2 L22 12 M12 2 a4 4 0 0 1 0 8 4 4 0 0 1 0 8"/><path d="M12 2 a4 4 0 0 0 0 8"/>', {}, 'width:18px;height:18px;flex-shrink:0'),
    close:   svg('<path d="M6 6 L18 18 M18 6 L6 18"/>', {}, 'width:14px;height:14px;flex-shrink:0'),
    micro:   svg('<path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>', {}, 'width:16px;height:16px;flex-shrink:0'),
    chevron: svg('<path d="M6 9 l6 6 6-6"/>', {}, 'width:13px;height:13px;flex-shrink:0')
  };

  function figure(key) {
    return set[key] || set.info;
  }

  return {
    icons: set,
    figure: figure,
    render: function (key, extra, size) { return figure(key); }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ICONS;
}
