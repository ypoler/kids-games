import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.concat([typeBuf, Buffer.from(data)])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, typeBuf, Buffer.from(data), crc])
}

function png(size, fill) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fill(x, y)
      const i = row + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ])
}

function icon(size) {
  const rad = size * 0.18
  return png(size, (x, y) => {
    const insideRect = x >= rad && x < size - rad && y >= rad && y < size - rad
    const corners =
      Math.hypot(x - rad, y - rad) <= rad ||
      Math.hypot(x - (size - rad), y - rad) <= rad ||
      Math.hypot(x - rad, y - (size - rad)) <= rad ||
      Math.hypot(x - (size - rad), y - (size - rad)) <= rad
    const edges = (x >= rad && x < size - rad) || (y >= rad && y < size - rad)
    if (!insideRect && !corners && !edges) return [246, 241, 232]
    const cx = size / 2
    const cy = size / 2 + size * 0.04
    const bar = size * 0.08
    const arm = size * 0.22
    const dx = Math.abs(x - cx)
    const dy = Math.abs(y - cy)
    if (Math.abs(dx - dy) < bar && dx < arm && dy < arm) return [255, 255, 255]
    return [42, 111, 151]
  })
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public')
writeFileSync(join(dir, 'pwa-192.png'), icon(192))
writeFileSync(join(dir, 'pwa-512.png'), icon(512))
writeFileSync(join(dir, 'apple-touch-icon.png'), icon(180))
console.log('wrote icons')
