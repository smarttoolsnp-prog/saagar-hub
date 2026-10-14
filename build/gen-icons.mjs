#!/usr/bin/env node
/* Generates the PWA icons (192, 512, maskable 512) with a tiny PNG encoder —
   no image libraries needed. Clay-style violet rounded square with five white
   dice pips (games + tools in one mark). */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/* ---------- PNG writing ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;                       /* filter: none */
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- drawing ---------- */
function roundRectSDF(x, y, w, h, r, px, py) {
  const dx = Math.max(Math.abs(px - (x + w / 2)) - (w / 2 - r), 0);
  const dy = Math.max(Math.abs(py - (y + h / 2)) - (h / 2 - r), 0);
  return Math.sqrt(dx * dx + dy * dy) - r;
}
function draw(size, opts) {
  const { maskable } = opts;
  const px = Buffer.alloc(size * size * 4);
  const pad = maskable ? 0 : Math.round(size * 0.055);
  const r = maskable ? 0 : Math.round(size * 0.26);
  const cx = size / 2, cy = size / 2;
  const pipR = size * 0.062;
  const pipGap = size * 0.155;
  const pips = [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]];
  const inset = maskable ? size * 0.20 : 0;   /* keep pips inside the safe zone */

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let R, G, B, A;

      const d = roundRectSDF(pad, pad, size - pad * 2, size - pad * 2, r, x + 0.5, y + 0.5);
      const cover = Math.max(0, Math.min(1, 0.5 - d));
      /* violet → indigo diagonal gradient, lightened at top-left (clay look) */
      const t = (x / size) * 0.55 + (y / size) * 0.45;
      R = Math.round(139 + (63 - 139) * t);
      G = Math.round(92 + (32 - 92) * t);
      B = Math.round(246 + (166 - 246) * t);
      const gloss = Math.max(0, 1 - Math.hypot(x - size * 0.34, y - size * 0.28) / (size * 0.42)) * 46;
      R = Math.min(255, R + gloss); G = Math.min(255, G + gloss); B = Math.min(255, B + gloss);
      A = Math.round(255 * cover);

      /* pips */
      for (const [gx, gy] of pips) {
        const pxc = cx + gx * pipGap, pyc = cy + gy * pipGap;
        const dd = Math.hypot(x + 0.5 - pxc, y + 0.5 - pyc) - pipR - inset * 0.55;
        const pc = Math.max(0, Math.min(1, 0.5 - dd));
        if (pc > 0) { R = Math.round(R * (1 - pc) + 255 * pc); G = Math.round(G * (1 - pc) + 255 * pc); B = Math.round(B * (1 - pc) + 255 * pc); }
      }

      px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = A;
    }
  }
  return png(size, size, px);
}

writeFileSync(join(ROOT, 'assets/icon-192.png'), draw(192, { maskable: false }));
writeFileSync(join(ROOT, 'assets/icon-512.png'), draw(512, { maskable: false }));
writeFileSync(join(ROOT, 'assets/icon-maskable-512.png'), draw(512, { maskable: true }));
console.log('icons written: assets/icon-192.png, assets/icon-512.png, assets/icon-maskable-512.png');
