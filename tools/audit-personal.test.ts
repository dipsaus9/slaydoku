/// <reference types="node" />
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { RULES, auditTree, denyRules, formatHits, jpegMetadata, pngMetadata, printableStrings, scanBinary, scanText } from './audit-personal.ts'

/*
 * The deny-list is base64 in audit-personal.ts, so this file does not spell a term out either: every sample below is derived
 * from the decoded rule it has to trigger.
 */
const decode = (text: string): string => Buffer.from(text, 'base64').toString('utf8')

/** A string the rule matches: its regex source without anchors and optional parts. */
const sampleFor = (encoded: string): string =>
  decode(encoded).replaceAll('\\b', '').replaceAll('[ _-]?', '').replace('[a-z0-9._-]+', 'x').replaceAll('?', '').replaceAll('\\', '')

const dirs: string[] = []
const tree = (files: Record<string, string | Uint8Array>): string => {
  const root = mkdtempSync(join(tmpdir(), 'audit-personal-'))
  dirs.push(root)
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(root, name, '..'), { recursive: true })
    writeFileSync(join(root, name), content)
  }
  return root
}
afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop()!, { recursive: true, force: true })
})

/** A minimal PNG: signature, IHDR, optional extra chunk, IEND (checksums are not read by the audit). */
function png(extra?: { type: string; data: string }): Uint8Array {
  const chunk = (type: string, data: Uint8Array): number[] => [
    ...new Uint8Array(new Uint32Array([data.length]).buffer).reverse(),
    ...Buffer.from(type, 'latin1'),
    ...data,
    0, 0, 0, 0,
  ]
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk('IHDR', new Uint8Array(13)),
    ...(extra ? chunk(extra.type, Buffer.from(extra.data, 'latin1')) : []),
    ...chunk('IEND', new Uint8Array(0)),
  ])
}

describe('the deny-list', () => {
  it('has rules, none of them stored in the clear', () => {
    expect(RULES.length).toBeGreaterThan(20)
    for (const [id, encoded] of RULES) {
      expect(encoded, id).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
      expect(decode(encoded).length, id).toBeGreaterThan(2)
    }
  })

  it.each(RULES.map(([id, encoded]) => [id, sampleFor(encoded)] as const))('%s: a text with its term is a hit, upper case too', (id, sample) => {
    for (const text of [`before ${sample} after`, `BEFORE ${sample.toUpperCase()} AFTER`]) {
      expect(scanText('a.txt', text).map((hit) => hit.rule), text).toContain(id)
    }
  })

  it('respects word boundaries for the short words', () => {
    for (const clean of ['a problem with robust code', 'differences and references', 'the joshua tree', 'candy is sweet']) {
      expect(scanText('a.txt', clean), clean).toEqual([])
    }
  })

  it('reports file and line', () => {
    const term = sampleFor(RULES[0]![1])
    const hits = scanText('src/a.ts', `fine\nalso fine\nhas ${term} in it`)
    expect(hits).toHaveLength(1)
    expect(formatHits(hits)[0]).toMatch(/^src\/a\.ts:3: \[[^\]]+\] .*/)
  })
})

describe('e-mail addresses', () => {
  // Built at run time: an address written out here would be a hit of this very repository.
  const address = (local: string, domain: string): string => [local, domain].join('@')

  it('fails on an address, but not on a noreply one', () => {
    expect(scanText('a.md', `write to ${address('someone', 'example.org')} please`).map((hit) => hit.rule)).toEqual(['email'])
    const allowed = [address('noreply', 'example.org'), address('no-reply', 'example.org'), address('12345+noreply', 'users.noreply.github.com')]
    expect(scanText('a.md', `from ${allowed.join(' and ')}`)).toEqual([])
  })
})

describe('auditTree', () => {
  it('passes a clean tree and counts its files', () => {
    const root = tree({ 'src/a.ts': 'export const a = 1\n', 'README.md': '# Hello\n' })
    expect(auditTree(root)).toEqual({ files: 2, hits: [] })
  })

  it('fails on a hit in any file and lists file:line', () => {
    const term = sampleFor(RULES[1]![1])
    const root = tree({ 'src/a.ts': 'ok\n', 'docs/notes.md': `# Notes\n\nfor ${term}\n` })
    const { hits } = auditTree(root)
    expect(formatHits(hits)).toEqual([expect.stringMatching(/^docs\/notes\.md:3: \[/)])
  })

  it('checks file names', () => {
    const root = tree({ [`docs/${sampleFor(RULES[2]![1])}.md`]: 'clean text' })
    expect(auditTree(root).hits.map((hit) => hit.rule).join()).toContain('(file name)')
  })

  it('scans dot-directories and dot-files, .git excepted', () => {
    const term = sampleFor(RULES[0]![1])
    const root = tree({ '.claude/settings.json': `{"note": "${term}"}`, '.github/workflows/ci.yml': `# ${term}`, '.env.example': `X=${term}`, '.git/config': term, 'src/a.ts': 'ok' })
    expect(auditTree(root).hits.map((hit) => hit.file).sort()).toEqual(['.claude/settings.json', '.env.example', '.github/workflows/ci.yml'])
  })

  it('skips node_modules, dist, .git and reports', () => {
    const term = sampleFor(RULES[0]![1])
    const root = tree({ 'node_modules/x/index.js': term, 'dist/a.js': term, '.git/config': term, 'reports/r.md': term, 'src/a.ts': 'ok' })
    expect(auditTree(root)).toEqual({ files: 1, hits: [] })
  })

  it('exits non-zero from the command line on a hit, zero on a clean tree', () => {
    const script = resolve(import.meta.dirname, 'audit-personal.ts')
    const dirty = tree({ 'a.txt': `has ${sampleFor(RULES[0]![1])}` })
    const bad = spawnSync('bun', [script, dirty], { encoding: 'utf8' })
    expect(bad.status).toBe(1)
    expect(bad.stderr).toMatch(/a\.txt:1: \[/)
    const good = spawnSync('bun', [script, tree({ 'a.txt': 'fine' })], { encoding: 'utf8' })
    expect(good.status).toBe(0)
    expect(good.stdout).toContain('0 hits')
  }, 30_000)

  it('finds no hit in this repository, its own deny-list included', () => {
    const { hits } = auditTree(resolve(import.meta.dirname, '..'))
    expect(formatHits(hits)).toEqual([])
  }, 60_000)
})

describe('binary files', () => {
  it('reads the printable strings of a binary', () => {
    expect(printableStrings(Uint8Array.from([0, 65, 66, 67, 68, 69, 0, 70, 71, 0]))).toEqual(['ABCDE'])
  })

  it('finds a term inside a binary, and none in a clean one', () => {
    const term = sampleFor(RULES[0]![1])
    const dirty = Uint8Array.from([0, 1, 2, ...Buffer.from(`meta ${term} meta`), 0, 3])
    expect(scanBinary('a.bin', dirty).map((hit) => hit.rule)).toContain(RULES[0]![0])
    expect(scanBinary('a.bin', Uint8Array.from([0, 1, 2, 3, 4, 5, ...Buffer.from('nothing here'), 0]))).toEqual([])
  })

  it('fails a PNG with a text or EXIF chunk, passes a plain one', () => {
    expect(pngMetadata(png())).toEqual([])
    expect(scanBinary('a.png', png())).toEqual([])
    expect(pngMetadata(png({ type: 'tEXt', data: 'Author\0someone' }))).toEqual(['tEXt'])
    expect(scanBinary('a.png', png({ type: 'eXIf', data: 'II*\0' })).map((hit) => hit.rule)).toEqual(['image-metadata'])
  })

  it('fails a JPEG with an EXIF segment, and metadata markers in any binary', () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0xff, 0xda])
    expect(jpegMetadata(jpeg)).toEqual(['APP1 (EXIF or XMP)'])
    expect(scanBinary('a.jpg', jpeg).map((hit) => hit.rule)).toContain('image-metadata')
    const xmp = Uint8Array.from([0, 0, ...Buffer.from('<x:xmpmeta xmlns:x="adobe:ns:meta/">'), 0])
    expect(scanBinary('a.webp', xmp).map((hit) => hit.rule)).toContain('image-metadata')
  })

  it('does not decode unknown file names as text: a binary by extension is scanned as strings', () => {
    const term = sampleFor(RULES[0]![1])
    const root = tree({ 'pic.png': Uint8Array.from([...png(), ...Buffer.from(`\0${term}\0`)]) })
    expect(auditTree(root).hits.length).toBeGreaterThan(0)
  })
})

describe('denyRules', () => {
  it('decodes every rule to a case-insensitive regular expression', () => {
    for (const { id, pattern } of denyRules()) {
      expect(pattern.flags, id).toBe('i')
    }
  })
})
