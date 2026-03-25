// Generates PNG icon files with a "CIQ" monogram for the Chrome extension.
// Run from the extension/ directory: node generate-icons.mjs

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePNG(size, pixels) {
  // pixels is a size x size array of [r,g,b,a]
  const rowLen = 1 + size * 4;
  const raw = Buffer.alloc(size * rowLen);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const off = y * rowLen + 1 + x * 4;
      const [r, g, b, a] = pixels[y][x];
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", deflateSync(raw)),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

// 5x7 pixel font for uppercase letters we need
const FONT = {
  C: [
    "01110",
    "10001",
    "10000",
    "10000",
    "10000",
    "10001",
    "01110",
  ],
  I: [
    "11111",
    "00100",
    "00100",
    "00100",
    "00100",
    "00100",
    "11111",
  ],
  Q: [
    "01110",
    "10001",
    "10001",
    "10001",
    "10101",
    "10010",
    "01101",
  ],
};

function renderIcon(size) {
  // Create pixel grid
  const pixels = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => [37, 99, 235, 255]) // blue bg
  );

  // Add rounded corners
  const radius = Math.max(2, Math.round(size * 0.18));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Check corners
      const corners = [
        [0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]
      ];
      for (const [cx, cy] of corners) {
        const dx = Math.abs(x - (cx === 0 ? radius : size - 1 - radius));
        const dy = Math.abs(y - (cy === 0 ? radius : size - 1 - radius));
        const inCornerRegion =
          (cx === 0 ? x < radius : x > size - 1 - radius) &&
          (cy === 0 ? y < radius : y > size - 1 - radius);
        if (inCornerRegion && Math.sqrt(dx * dx + dy * dy) > radius) {
          pixels[y][x] = [0, 0, 0, 0]; // transparent
        }
      }
    }
  }

  // Draw "CIQ" text
  const letters = ["C", "I", "Q"];
  const charW = 5;
  const charH = 7;
  const gap = 1;
  const totalTextW = letters.length * charW + (letters.length - 1) * gap;
  const totalTextH = charH;

  // Scale factor
  const scale = Math.max(1, Math.floor(size / (totalTextW + 4)));
  const scaledW = totalTextW * scale;
  const scaledH = totalTextH * scale;

  const startX = Math.floor((size - scaledW) / 2);
  const startY = Math.floor((size - scaledH) / 2);

  for (let li = 0; li < letters.length; li++) {
    const glyph = FONT[letters[li]];
    const letterX = startX + li * (charW + gap) * scale;

    for (let gy = 0; gy < charH; gy++) {
      for (let gx = 0; gx < charW; gx++) {
        if (glyph[gy][gx] === "1") {
          // Fill scaled pixel block
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = letterX + gx * scale + sx;
              const py = startY + gy * scale + sy;
              if (px >= 0 && px < size && py >= 0 && py < size && pixels[py][px][3] > 0) {
                pixels[py][px] = [255, 255, 255, 255]; // white text
              }
            }
          }
        }
      }
    }
  }

  return pixels;
}

mkdirSync("icons", { recursive: true });

for (const size of [16, 48, 128]) {
  const pixels = renderIcon(size);
  const png = makePNG(size, pixels);
  writeFileSync(`icons/icon${size}.png`, png);
  console.log(`Written: icons/icon${size}.png (${size}x${size})`);
}
