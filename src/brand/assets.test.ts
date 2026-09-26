import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const PUBLIC = join(import.meta.dirname, '../../public')
const SOURCES = join(import.meta.dirname, '.')

/** Width and height from the PNG IHDR chunk. */
function pngSize(file: string): [number, number] {
  const b = readFileSync(join(PUBLIC, file))
  expect(b.subarray(1, 4).toString('ascii')).toBe('PNG')
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

describe('brand assets', () => {
  it.each([
    ['favicon-32.png', 32, 32],
    ['icon-192.png', 192, 192],
    ['icon-512.png', 512, 512],
    ['apple-touch-icon.png', 180, 180],
    ['og-image.png', 1200, 630],
  ] as const)('%s is %ix%i', (file, w, h) => {
    expect(pngSize(file)).toEqual([w, h])
  })

  it('favicon.ico holds 16, 32 and 48px frames', () => {
    const b = readFileSync(join(PUBLIC, 'favicon.ico'))
    expect(b.readUInt16LE(2)).toBe(1)
    const count = b.readUInt16LE(4)
    const sizes = Array.from({ length: count }, (_, i) => b.readUInt8(6 + i * 16))
    expect(sizes).toEqual([16, 32, 48])
  })

  it('keeps the share image under 300 KB', () => {
    expect(statSync(join(PUBLIC, 'og-image.png')).size).toBeLessThan(300 * 1024)
  })

  it('ships the favicon SVG source unchanged and not the Vite logo', () => {
    const shipped = readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8')
    expect(shipped).toBe(readFileSync(join(SOURCES, 'favicon.svg'), 'utf8'))
    expect(shipped).not.toContain('#863bff')
  })

  it('carries only the site name and tagline in the share image source', () => {
    const svg = readFileSync(join(SOURCES, 'og-image.svg'), 'utf8')
    const text = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1])
    expect(text).toEqual(['Slaydoku', 'A new puzzle every day'])
  })
})
