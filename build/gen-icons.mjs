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

/* ---------- social preview card (1200x630) ----------
   Blocky wordmark drawn from a tiny 5x7 bitmap font, so no font files and no
   image library are needed. Used for og:image / twitter:image. */
const FONT = {
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};
function drawText(px, W, H, text, x0, y0, scale, rgb) {
  let x = x0;
  for (const raw of text.toUpperCase()) {
    const glyph = FONT[raw] || FONT[' '];
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] !== '1') continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px_ = x + gx * scale + sx, py_ = y0 + gy * scale + sy;
            if (px_ < 0 || py_ < 0 || px_ >= W || py_ >= H) continue;
            const i = (py_ * W + px_) * 4;
            px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = 255;
          }
        }
      }
    }
    x += 6 * scale;
  }
  return x;
}
function ogCard() {
  const W = 1200, H = 630;
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const t = (x / W) * 0.55 + (y / H) * 0.45;
      let R = Math.round(36 + (57 - 36) * t);
      let G = Math.round(28 + (47 - 28) * t);
      let B = Math.round(88 + (140 - 88) * t);
      const glow = Math.max(0, 1 - Math.hypot(x - W * 0.78, y - H * 0.2) / (W * 0.5)) * 60;
      px[i] = Math.min(255, R + glow); px[i + 1] = Math.min(255, G + glow * 0.8); px[i + 2] = Math.min(255, B + glow); px[i + 3] = 255;
    }
  }
  /* dice pips mark */
  const cx = 1010, cy = 470, pipR = 26, gap = 74;
  const pips = [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]];
  for (const [gx, gy] of pips) {
    const pcx = cx + gx * gap, pcy = cy + gy * gap;
    for (let y = -pipR - 6; y <= pipR + 6; y++) {
      for (let x = -pipR - 6; x <= pipR + 6; x++) {
        const d = Math.hypot(x, y);
        if (d > pipR) continue;
        const X = pcx + x, Y = pcy + y;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const i = (Y * W + X) * 4;
        px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 255;
      }
    }
  }
  drawText(px, W, H, 'SAAGAR', 84, 200, 14, [255, 235, 160]);
  drawText(px, W, H, 'GAMES TOOLS SKILLS LAWS', 88, 330, 4, [201, 191, 239]);
  drawText(px, W, H, 'SAGARDAHAL123.COM.NP', 88, 400, 4, [165, 180, 252]);
  return png(W, H, px);
}

writeFileSync(join(ROOT, 'assets/icon-192.png'), draw(192, { maskable: false }));
writeFileSync(join(ROOT, 'assets/icon-512.png'), draw(512, { maskable: false }));
writeFileSync(join(ROOT, 'assets/icon-maskable-512.png'), draw(512, { maskable: true }));
writeFileSync(join(ROOT, 'assets/og.png'), ogCard());
console.log('icons written: assets/icon-192.png, assets/icon-512.png, assets/icon-maskable-512.png, assets/og.png');
