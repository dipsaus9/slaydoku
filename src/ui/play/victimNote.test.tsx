import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NoteGlyph } from './BoardLayers.tsx'
import { VICTIM_TAG } from './people.ts'

const SRC = join(import.meta.dirname, '..', '..')
const GIFT = /\u{1F381}|\u{1F380}/u

function sourcesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return name === 'schedule' ? [] : sourcesUnder(p)
    return /\.(ts|tsx|css|svg)$/.test(name) ? [p] : []
  })
}

describe('the victim note (SLAY-23)', () => {
  it('is a drawn skull in the note colour with the white halo, not text', () => {
    const html = renderToStaticMarkup(
      <svg>
        <NoteGlyph x={10} y={10} fontSize={14} bold={false} color="#d6336c" tag={VICTIM_TAG} noteKey="0,0:V" />
      </svg>,
    )
    expect(html).toContain('data-victim-note="skull"')
    expect(html).toContain('fill="#d6336c"')
    expect(html).toContain('stroke="#ffffff"')
    expect(html).not.toContain('<text')
    expect(html).not.toMatch(GIFT)
  })

  it('has no gift emoji anywhere in the sources', () => {
    const offenders = sourcesUnder(SRC).filter((f) => !f.endsWith('victimNote.test.tsx') && GIFT.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})
