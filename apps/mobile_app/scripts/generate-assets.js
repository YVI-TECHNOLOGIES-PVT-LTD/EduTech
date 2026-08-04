const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePng(width, height, color) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 4;
      rawData[pixelOffset] = color[0];     // R
      rawData[pixelOffset + 1] = color[1]; // G
      rawData[pixelOffset + 2] = color[2]; // B
      rawData[pixelOffset + 3] = color[3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let curr = n;
      for (let k = 0; k < 8; k++) {
        curr = (curr & 1) ? (0xedb88320 ^ (curr >>> 1)) : (curr >>> 1);
      }
      table[n] = curr;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(tag, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const tagBuf = Buffer.from(tag, 'ascii');
    const tagAndData = Buffer.concat([tagBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(tagAndData), 0);
    return Buffer.concat([lenBuf, tagAndData, crcBuf]);
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrBuf = Buffer.alloc(13);
  ihdrBuf.writeUInt32BE(width, 0);
  ihdrBuf.writeUInt32BE(height, 4);
  ihdrBuf[8] = 8; // bit depth
  ihdrBuf[9] = 6; // color type RGBA
  ihdrBuf[10] = 0; // compression
  ihdrBuf[11] = 0; // filter
  ihdrBuf[12] = 0; // interlace

  const ihdr = chunk('IHDR', ihdrBuf);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const outDir = path.join(__dirname, '..', 'src', 'assets', 'images');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon.png'), makePng(1024, 1024, [2, 132, 199, 255]));
fs.writeFileSync(path.join(outDir, 'adaptive-icon.png'), makePng(1024, 1024, [2, 132, 199, 255]));
fs.writeFileSync(path.join(outDir, 'splash.png'), makePng(1242, 2436, [15, 23, 42, 255]));
fs.writeFileSync(path.join(outDir, 'favicon.png'), makePng(48, 48, [2, 132, 199, 255]));

console.log('Successfully generated icon.png, adaptive-icon.png, splash.png, and favicon.png!');
