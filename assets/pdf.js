/* ===========================================================
   SAAGAR — tiny PDF writer
   Builds a real PDF file in the browser by embedding JPEG images,
   one per page, scaled to fit. No external library needed.

   Usage:
     SAAGAR_PDF.fromImages([{dataUrl, w, h}, ...], {page:'a4', margin:36})
       .then(blob => ...)
   =========================================================== */
(function () {
  'use strict';

  var PAGE_SIZES = {          /* PDF points (72 per inch) */
    a4: { w: 595.28, h: 841.89, label: 'A4' },
    a4l: { w: 841.89, h: 595.28, label: 'A4 landscape' },
    letter: { w: 612, h: 792, label: 'Letter' },
    letterl: { w: 792, h: 612, label: 'Letter landscape' }
  };

  function dataUrlToBytes(dataUrl) {
    var base64 = dataUrl.split(',')[1];
    var bin = atob(base64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  /* build the byte stream */
  function build(pages, opts) {
    opts = opts || {};
    var size = PAGE_SIZES[opts.page || 'a4'] || PAGE_SIZES.a4;
    var margin = opts.margin == null ? 36 : opts.margin;

    var chunks = [];      /* array of Uint8Array or string */
    var length = 0;
    function push(x) {
      if (typeof x === 'string') {
        var enc = new Uint8Array(x.length);
        for (var i = 0; i < x.length; i++) enc[i] = x.charCodeAt(i) & 0xff;
        chunks.push(enc); length += enc.length;
      } else {
        chunks.push(x); length += x.length;
      }
    }

    var offsets = [];
    function beginObj() { offsets.push(length); }

    push('%PDF-1.4\n');
    /* binary comment marks the file as containing binary data */
    push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

    /* 1: catalog */
    beginObj();
    push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    /* reserves object numbers: 2 = pages, then per page: page, content, image */
    var n = pages.length;
    var kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');

    beginObj();
    push('2 0 obj\n<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>\nendobj\n');

    for (var p = 0; p < n; p++) {
      var item = pages[p];
      var imgObj = 4 + p * 3;
      var pageObj = 3 + p * 3;
      var contObj = 5 + p * 3;

      /* work out the drawn size, preserving aspect */
      var availW = size.w - margin * 2;
      var availH = size.h - margin * 2;
      var scale = Math.min(availW / item.w, availH / item.h);
      var dw = item.w * scale, dh = item.h * scale;
      var dx = (size.w - dw) / 2, dy = (size.h - dh) / 2;

      /* page */
      beginObj();
      push(pageObj + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
        size.w.toFixed(2) + ' ' + size.h.toFixed(2) + '] ' +
        '/Resources << /XObject << /Im0 ' + imgObj + ' 0 R >> >> ' +
        '/Contents ' + contObj + ' 0 R >>\nendobj\n');

      /* image */
      beginObj();
      push(imgObj + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + item.w +
        ' /Height ' + item.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 ' +
        '/Filter /DCTDecode /Length ' + item.bytes.length + ' >>\nstream\n');
      push(item.bytes);
      push('\nendstream\nendobj\n');

      /* content */
      var content = 'q\n' + dw.toFixed(2) + ' 0 0 ' + dh.toFixed(2) + ' ' +
        dx.toFixed(2) + ' ' + dy.toFixed(2) + ' cm\n/Im0 Do\nQ\n';
      beginObj();
      push(contObj + ' 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream\nendobj\n');
    }

    /* cross-reference table */
    var count = 2 + n * 3 + 1;
    var xrefStart = length;
    var xref = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
    for (var o = 0; o < offsets.length; o++) {
      xref += String(offsets[o]).padStart(10, '0') + ' 00000 n \n';
    }
    push(xref);
    push('trailer\n<< /Size ' + count + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF\n');

    /* flatten */
    var out = new Uint8Array(length);
    var pos = 0;
    chunks.forEach(function (c) { out.set(c, pos); pos += c.length; });
    return new Blob([out], { type: 'application/pdf' });
  }

  function fromImages(items, opts) {
    return new Promise(function (resolve, reject) {
      try {
        var pages = items.map(function (it) {
          var bytes = it.bytes || dataUrlToBytes(it.dataUrl);
          return { bytes: bytes, w: it.w, h: it.h };
        });
        resolve(build(pages, opts));
      } catch (e) { reject(e); }
    });
  }

  /* render a canvas to a JPEG-backed page descriptor */
  function canvasPage(canvas, quality) {
    var dataUrl = canvas.toDataURL('image/jpeg', quality == null ? 0.92 : quality);
    return { dataUrl: dataUrl, w: canvas.width, h: canvas.height };
  }

  window.SAAGAR_PDF = {
    fromImages: fromImages,
    canvasPage: canvasPage,
    PAGE_SIZES: PAGE_SIZES
  };
})();
