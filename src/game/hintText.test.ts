import { describe, expect, it } from 'vitest'
import { at, puzzle } from './fixture.ts'
import { cellsText, focusHint, stepHint } from './hintText.ts'
import { nextStep } from './hints.ts'
import { initialState } from './reducer.ts'

/**
 * `hintText.ts` directly, in Dutch (locale 'nl', SLAY-3.3). `src/game/hints.test.ts` already pins
 * this file's English output (through `getHint`/`hintPath`, both locale-locked to 'en' since
 * `src/game/hints.ts` is not in this story's References); this file calls `focusHint`/`stepHint`
 * themselves with `locale: 'nl'` so the Dutch branch gets the same coverage.
 */

describe('cellsText: Dutch', () => {
  it('names a square, shares a row or column, and spells scattered squares out', () => {
    expect(cellsText([{ row: 2, col: 3 }], 'nl')).toBe('rij 3, kolom 4')
    expect(cellsText([{ row: 2, col: 3 }, { row: 2, col: 4 }], 'nl')).toBe('rij 3, kolom 4 en 5')
    expect(cellsText([at.A, at.B, at.C], 'nl')).toBe('rij 2, kolom 3; rij 3, kolom 4 en rij 4, kolom 2')
  })
})

describe('focusHint: Dutch', () => {
  const state = initialState({ autoXOnPlace: true, preventXOnBlocked: true, showTimer: true })
  const next = nextStep(puzzle, state)

  it('a placement reads as card and person, then the square, then the reasoning and an explicit instruction', () => {
    if (!next?.focus) throw new Error('expected a focus')
    expect(focusHint(puzzle, next, next.focus, 1, 'nl').text).toBe(
      'Lees C\'s kaartje: "C stond naast een raam." Met alle kaartjes samen kan C alleen nog op een vakje staan.',
    )
    expect(focusHint(puzzle, next, next.focus, 2, 'nl').text).toBe('Kijk naar rij 3, kolom 4. C moet daar staan.')
    const h3 = focusHint(puzzle, next, next.focus, 3, 'nl')
    if (h3.level !== 3) throw new Error('level')
    expect(h3.text).toBe('C\'s kaartje zegt: "C stond naast een raam." Alle kaartjes samen laten maar één vakje over voor C: rij 3, kolom 4. Zet C op rij 3, kolom 4.')
    expect(h3.instruction).toBe('Zet C op rij 3, kolom 4.')
  })

  it('locale defaults to English: focusHint with no locale argument is unaffected', () => {
    if (!next?.focus) throw new Error('expected a focus')
    expect(focusHint(puzzle, next, next.focus, 1).text).toBe(
      'Read C\'s card: "C stood next to a window." With all the cards together, C can only stand on one square.',
    )
  })
})

describe('stepHint: Dutch', () => {
  const victimised: typeof puzzle = {
    ...puzzle,
    people: puzzle.people.map((p) => (p.kind === 'victim' ? { ...p, label: 'het slachtoffer' } : p)),
  }
  const step = {
    index: 1,
    technique: 'clue',
    level: 1,
    explanation: 'Het slachtoffer is in de Keuken. Dat is de dader. Het slachtoffer kan niet naast het slachtoffer staan.',
    people: ['V'],
    cells: [at.V],
    placed: { personId: 'V', cell: at.V },
    eliminated: [],
  }

  it('the solver-step explanation passes through unchanged, with the placement sentence and instruction in Dutch', () => {
    const h1 = stepHint(victimised, { step, placement: step.placed }, 1, 'nl')
    expect(h1.text).toBe('Kijk naar het slachtoffer in de Woonkamer.')
    const h2 = stepHint(victimised, { step, placement: step.placed }, 2, 'nl')
    expect(h2.text).toBe('Kijk naar rij 1, kolom 1. Het slachtoffer moet daar staan.')
    const h3 = stepHint(victimised, { step, placement: step.placed }, 3, 'nl')
    if (h3.level !== 3) throw new Error('level')
    expect(h3.explanation).toBe('Het slachtoffer is in de Keuken. Dat is de dader. Het slachtoffer kan niet naast het slachtoffer staan.')
    expect(h3.instruction).toBe('Zet het slachtoffer op rij 1, kolom 1.')
    expect(h3.text).toBe(`${h3.explanation} ${h3.instruction}`)
  })

  it('the victim label starts a sentence with a capital in Dutch too', () => {
    const sentenceStart = /(^|[.!?]\s+)het slachtoffer\b/
    for (const level of [1, 2, 3] as const) {
      const h = stepHint(victimised, { step, placement: step.placed }, level, 'nl')
      expect(h.text, `level ${level}`).not.toMatch(sentenceStart)
    }
  })
})
