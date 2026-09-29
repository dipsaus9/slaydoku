import { describe, expect, it } from 'vitest'
import { renderClue } from '../engine/clues/index.ts'
import type { CatalogClue } from '../engine/clues/index.ts'
import type { DailyResult } from '../game/daily/results.ts'
import { RESULT_TIERS } from '../game/daily/results.ts'
import { readSchedule } from '../schedule/schedule.testing.ts'
import { DAILY_EN } from '../ui/daily/strings.ts'
import { cardSvg } from './card.ts'
import { cardDescription, emojiStrip, emojiText, stripCells } from './emoji.ts'
import { TIER_LABELS, dateLabel, formatDuration, hintsLabel, sizeLabel, tierLabel } from './format.ts'
import { SITE_URL, siteLabel } from './site.ts'
import { CARD_SIZES, shareMetaOf } from './types.ts'

const { days } = readSchedule()
const result = (over: Partial<DailyResult> = {}): DailyResult => ({ n: 43, date: '2026-11-23', tier: 'medium', fp: 'fp', elapsedMs: 252_000, hints: 2, wrongChecks: 0, murdererId: 'p1', ...over })
const meta = { tier: 'medium', size: 9, siteUrl: 'https://slaydoku.vercel.app' } as const

describe('labels and formats', () => {
  it('labels every difficulty like the start screen and covers every tier', () => {
    expect(TIER_LABELS).toEqual(DAILY_EN.tier)
    expect(Object.keys(TIER_LABELS)).toEqual([...RESULT_TIERS])
  })

  it('formats time as mm:ss and h:mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(999)).toBe('00:00')
    expect(formatDuration(252_000)).toBe('04:12')
    expect(formatDuration(59 * 60_000 + 59_999)).toBe('59:59')
    expect(formatDuration(3_600_000)).toBe('1:00:00')
    expect(formatDuration(3_723_000)).toBe('1:02:03')
    expect(formatDuration(-5)).toBe('00:00')
    expect(formatDuration(Number.NaN)).toBe('00:00')
  })

  it('words the hints', () => {
    expect(hintsLabel(0)).toBe('no hints')
    expect(hintsLabel(1)).toBe('1 hint')
    expect(hintsLabel(2)).toBe('2 hints')
    expect(hintsLabel(12)).toBe('12 hints')
    expect(hintsLabel(-3)).toBe('no hints')
    expect(sizeLabel(9)).toBe('9x9')
  })

  it('words the hints and the date in Dutch', () => {
    expect(hintsLabel(0, 'nl')).toBe('geen hints')
    expect(hintsLabel(1, 'nl')).toBe('1 hint')
    expect(hintsLabel(2, 'nl')).toBe('2 hints')
    expect(tierLabel('very-easy', 'nl')).toBe('Heel makkelijk')
    expect(tierLabel('hard', 'nl')).toBe('Moeilijk')
    expect(dateLabel('2026-10-15', 'nl')).toBe('donderdag 15 oktober 2026')
    expect(dateLabel('2026-10-15')).toBe('Thursday 15 October 2026')
  })
})

describe('the site', () => {
  it('shows the host of the site url, with a localhost fallback for a build without one', () => {
    expect(siteLabel('https://slaydoku.vercel.app')).toBe('slaydoku.vercel.app')
    expect(siteLabel('http://localhost:5173/')).toBe('localhost:5173')
    expect(siteLabel('not a url/')).toBe('not a url')
    expect(SITE_URL).toMatch(/^https?:\/\//)
    expect(SITE_URL).not.toMatch(/\/$/)
  })
})

describe('the emoji strip', () => {
  it('has one square per person: blue, then a yellow per hint, then a red per wrong check', () => {
    expect(emojiStrip(result({ hints: 0, wrongChecks: 0 }), 6)).toBe('🟦🟦🟦🟦🟦🟦')
    expect(emojiStrip(result({ hints: 2, wrongChecks: 0 }), 9)).toBe('🟦🟦🟦🟦🟦🟦🟦🟨🟨')
    expect(emojiStrip(result({ hints: 1, wrongChecks: 2 }), 7)).toBe('🟦🟦🟦🟦🟨🟥🟥')
  })

  it('never has more squares than people', () => {
    expect(stripCells(result({ hints: 40, wrongChecks: 5 }), 6)).toEqual(Array(6).fill('hint'))
    expect(stripCells(result({ hints: 4, wrongChecks: 40 }), 6)).toEqual(['hint', 'hint', 'hint', 'hint', 'wrong', 'wrong'])
  })
})

describe('emojiText', () => {
  it('is four lines: number, difficulty and size; time and hints; the strip; the site', () => {
    expect(emojiText(result(), meta)).toBe('Slaydoku #43 · Medium · 9x9\n⏱ 04:12 · 💡 2 hints\n🟦🟦🟦🟦🟦🟦🟦🟨🟨\nslaydoku.vercel.app')
  })

  it('says no hints, 1 hint, and long times', () => {
    expect(emojiText(result({ hints: 0, elapsedMs: 3_723_000 }), meta).split('\n')[1]).toBe('⏱ 1:02:03 · 💡 no hints')
    expect(emojiText(result({ hints: 1 }), { ...meta, tier: 'very-easy', size: 6 }).split('\n')[0]).toBe('Slaydoku #43 · Very easy · 6x6')
  })

  it('uses the tier of the meta, so a result without one still shares', () => {
    const { tier: _tier, ...old } = result()
    expect(emojiText(old, meta)).toContain('Medium')
  })

  it('takes the site from one place', () => {
    expect(emojiText(result(), { tier: 'medium', size: 9 }).split('\n').at(-1)).toBe(siteLabel(SITE_URL))
  })

  it('is Dutch wording in Dutch, same four lines and the same no-spoilers shape', () => {
    expect(emojiText(result(), meta, 'nl')).toBe('Slaydoku #43 · Gemiddeld · 9x9\n⏱ 04:12 · 💡 2 hints\n🟦🟦🟦🟦🟦🟦🟦🟨🟨\nslaydoku.vercel.app')
    expect(emojiText(result({ hints: 0 }), meta, 'nl').split('\n')[1]).toBe('⏱ 04:12 · 💡 geen hints')
  })
})

describe('cardDescription', () => {
  it('describes the card in English and in Dutch, both with the puzzle number, date, difficulty, size, time and hints', () => {
    const en = cardDescription(result(), meta)
    const nl = cardDescription(result(), meta, 'nl')
    expect(en).toBe('Slaydoku puzzle #43 of Monday 23 November 2026, Medium, 9x9. Solved in 04:12 with 2 hints.')
    expect(nl).toBe('Slaydoku-puzzel #43 van maandag 23 november 2026, Gemiddeld, 9x9. Opgelost in 04:12 met 2 hints.')
  })
})

describe.each(['en', 'nl'] as const)('no spoilers: nothing of the puzzle but its labels (%s)', (locale) => {
  const sample = days.filter((_day, i) => i % 9 === 0)
  it('samples a spread of days', () => expect(sample.length).toBeGreaterThan(8))

  for (const day of sample) {
    it(`#${day.n} ${day.date}: no name, clue or solution cell in the text or the cards`, () => {
      const r = result({ n: day.n, date: day.date, tier: day.tier, murdererId: day.puzzle.people.find((p) => p.kind === 'suspect')!.id, hints: 1, wrongChecks: 1 })
      const m = shareMetaOf(day, 'https://slaydoku.vercel.app')
      const outputs = [emojiText(r, m, locale), cardSvg(r, m, CARD_SIZES.wide, undefined, locale), cardSvg(r, m, CARD_SIZES.square, undefined, locale)]
      const ctx = { scene: day.puzzle.scene, people: day.puzzle.people }
      const clues = (day.puzzle.clues as CatalogClue[]).map((clue) => renderClue(clue, ctx))
      expect(clues.length).toBeGreaterThan(0)
      for (const out of outputs) {
        for (const person of day.puzzle.people) {
          if (person.kind !== 'suspect') continue
          expect(out, `name ${person.label}`).not.toMatch(new RegExp(`\\b${person.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'))
        }
        for (const clue of clues) expect(out).not.toContain(clue.replace(/&/g, '&amp;'))
        expect(out).not.toContain(day.fp)
        // A solution cell in the form the app uses for cells.
        for (const s of day.puzzle.solution) expect(out).not.toContain(`r${s.cell.row + 1}c${s.cell.col + 1}`)
      }
    })
  }
})

describe('cardSvg', () => {
  /** Every tag closes in order and every entity is a known one. */
  const wellFormed = (svg: string) => {
    const doc = svg.replace(/<title[\s\S]*?<\/title>/, '')
    const stack: string[] = []
    for (const m of doc.matchAll(/<(\/?[a-zA-Z][\w-]*)[^>]*?(\/?)>/g)) {
      if (m[2]) continue
      if (m[1]!.startsWith('/')) expect(stack.pop(), m[0]).toBe(m[1]!.slice(1))
      else stack.push(m[1]!)
    }
    expect(stack).toEqual([])
    expect(svg).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/)
  }

  for (const [format, { width, height }] of Object.entries(CARD_SIZES)) {
    it(`${format}: well formed, sized ${width}x${height}, with number, date, difficulty, time and hints`, () => {
      const svg = cardSvg(result(), meta, { width, height })
      wellFormed(svg)
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
      expect(svg).toContain(`width="${width}" height="${height}"`)
      expect(svg).toContain(format === 'wide' ? 'viewBox="0 0 1200 630"' : 'viewBox="0 0 1080 1080"')
      for (const part of ['Slaydoku', 'Puzzle of 23 November', 'Monday 23 November 2026', 'Medium · 9x9', '04:12', '2 hints', 'slaydoku.vercel.app']) expect(svg).toContain(part)
      expect(svg.match(/fill="#2b7de9"/g)!.length).toBeGreaterThan(7)
      // Shapes and text only: nothing to fetch, nothing to run.
      expect(svg).not.toMatch(/<image|<script|<foreignObject|href=|url\(|@import/)
      expect([...svg.matchAll(/https?:\/\/[^"<\s]+/g)].map((m) => m[0]).filter((url) => url !== 'http://www.w3.org/2000/svg')).toEqual([])
    })
  }

  it('scales the design to any size of the same shape', () => {
    const svg = cardSvg(result(), meta, { width: 600, height: 315 })
    expect(svg).toContain('width="600" height="315" viewBox="0 0 1200 630"')
  })

  it('says no hints, shows an hour time and draws a square per person', () => {
    const svg = cardSvg(result({ hints: 0, wrongChecks: 0, elapsedMs: 3_723_000 }), { ...meta, size: 12 }, CARD_SIZES.wide)
    wellFormed(svg)
    expect(svg).toContain('No hints')
    expect(svg).toContain('1:02:03')
    expect(svg.match(/<rect x="[\d.]+" y="432"/g)?.length).toBe(12)
  })

  it('draws Dutch labels and legend when asked for Dutch', () => {
    const svg = cardSvg(result({ wrongChecks: 1 }), meta, CARD_SIZES.wide, undefined, 'nl')
    wellFormed(svg)
    for (const part of ['Slaydoku', 'Puzzel van 23 november', 'maandag 23 november 2026', 'Gemiddeld · 9x9', '04:12', '2 hints', 'geplaatst', 'hint', 'foute controle']) expect(svg).toContain(part)
  })

  it('escapes what it prints', () => {
    const svg = cardSvg(result(), { ...meta, siteUrl: 'https://a&b.example' }, CARD_SIZES.wide)
    expect(svg).toContain('a&amp;b.example')
    wellFormed(svg)
  })
})
