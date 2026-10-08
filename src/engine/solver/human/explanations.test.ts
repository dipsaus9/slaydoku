import { describe, expect, it } from 'vitest'
import { demoPuzzle } from '../../../content/demo/puzzle.ts'
import { generatedPuzzles } from '../../../content/generated.testing.ts'
import { VICTIM_TEXT, VICTIM_TEXT_NL } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import type { Locale } from '../../../locale/types.ts'
import type { Puzzle } from '../../model/index.ts'
import { puzzle as tutorial } from '../../../game/fixture.ts'
import { hardPuzzle, hintPath } from '../../../game/hints.fixture.ts'
import { solveHuman } from './index.ts'

/**
 * The text a player reads while solving: the level-3 hint is a solver step explanation. These
 * tests pin representative explanations per technique on the tutorial, and check the house style on every step and every hint
 * of the full solving path of the tutorial, the demo level, a hard puzzle and a generated sample.
 * (Techniques these puzzles never need are pinned in their own technique tests.)
 */

const puzzles: Record<string, Puzzle> = {
  tutorial,
  demo: demoPuzzle,
  hard: hardPuzzle(),
  ...Object.fromEntries(generatedPuzzles().filter((p) => p.size === 7 && p.tier !== 'medium').map((p) => [p.id, p.puzzle])),
}

/** The explanation of the `nth` (1-based) step of a technique, placing or not. */
function step(name: string, technique: string, nth = 1, placing = false, locale: Locale = 'en'): string {
  const p = puzzles[name] as Puzzle
  const result = solveHuman(p.scene, p.people, p.clues as CatalogClue[], { locale })
  const found = result.steps.filter((s) => s.technique === technique && (s.placed !== undefined) === placing)[nth - 1]
  if (!found) throw new Error(`${name}: no ${technique} step ${nth}`)
  return found.explanation
}

describe('pinned explanations per technique', () => {
  it('clue: one person, and two people at once', () => {
    expect(step('tutorial', 'clue')).toBe(
      "A's card says: \"A stood next to a table.\" So A cannot stand on 10 squares (among them row 1, column 1 and row 2, column 2).",
    )
    expect(step('hard', 'clue')).toMatch(/^\S+'s card says: ".+" So .+ cannot stand on .+\.$/)
  })

  it('single-candidate: with and without an object under the square', () => {
    expect(step('tutorial', 'single-candidate', 1, true)).toBe(
      'C can only stand on one square now: row 3, column 4. That row and column are taken with it.',
    )
    expect(step('demo', 'single-candidate', 1, true)).toMatch(/^\S+ can only stand on one square now: row \d+, column \d+(, on an? \S+)?\. That row and column are taken with it\.$/)
  })

  it('intersect: a square shared by every possible square of somebody', () => {
    // One shared square, or several ("row 3, column 1 and row 6, column 3": the hard fixture since SLAY-19.1 changed the generator's draws).
    expect(step('hard', 'intersect')).toMatch(/^\S+ can only stand on .+ now\. Each of those squares shares a row or column with row \d+, column \d+( and row \d+, column \d+)*\. If somebody else stood there, \S+ would have nothing left\. So nobody else can stand there\.$/)
  })
})

/** The same pins, in Dutch (locale 'nl', SLAY-3.3): `solveHuman` given `locale: 'nl'`. */
describe('pinned explanations per technique: Dutch', () => {
  it('clue: one person, and two people at once', () => {
    expect(step('tutorial', 'clue', 1, false, 'nl')).toBe(
      'A\'s kaartje zegt: "A stond naast een tafel." Dus A kan niet op 10 vakjes (waaronder rij 1, kolom 1 en rij 2, kolom 2) staan.',
    )
    expect(step('hard', 'clue', 1, false, 'nl')).toMatch(/^\S+'s kaartje zegt: ".+" Dus .+ (kan|kunnen) niet op .+ staan\.$/)
  })

  it('single-candidate: with and without an object under the square', () => {
    expect(step('tutorial', 'single-candidate', 1, true, 'nl')).toBe('C kan nu nog maar op één vakje staan: rij 3, kolom 4. Die rij en kolom zijn daarmee bezet.')
    expect(step('demo', 'single-candidate', 1, true, 'nl')).toMatch(/^\S+ kan nu nog maar op één vakje staan: rij \d+, kolom \d+(, op een? \S+)?\. Die rij en kolom zijn daarmee bezet\.$/)
  })

  it('intersect: a square shared by every possible square of somebody', () => {
    expect(step('hard', 'intersect', 1, false, 'nl')).toMatch(
      /^\S+ kan nu alleen nog op .+ staan\. Elk van die vakjes deelt een rij of kolom met .+\. Als iemand anders daar zou staan, had \S+ niets meer over\. Dus niemand anders kan daar staan\.$/,
    )
  })
})

/** Sentences of an explanation; a card quoted inside counts as part of its sentence. */
const sentencesOf = (text: string): string[] => text.split(/(?<=[.!?]["”]?)\s+(?=\S)/u)

/** The house style, as rules on every text a player can read. */
function expectHouseStyle(text: string, where: string, max = 330): void {
  expect(text, where).not.toMatch(/\br\d+[kc]\d+\b/) // cryptic cell names
  expect(text, where).not.toMatch(/\bcells?\b/i) // the player sees squares, not cells
  // Stray punctuation around quoted cards. The one fixed sentence of a combined card ('... and "b". Both parts must be true.', CAD-9.3) is meant.
  expect(text.replaceAll('". Both parts must be true.', '" Both parts must be true.'), where).not.toMatch(/"\.|\.\./)
  expect(text.length, where).toBeLessThanOrEqual(max)
  for (const sentence of sentencesOf(text)) {
    expect(sentence, where).toMatch(/^[^\p{Ll}]/u) // every sentence starts with a capital
    // The victim is named once per sentence (a quoted card is its own text).
    const outsideCards = sentence.replace(/"[^"]*"/g, '')
    const label = VICTIM_TEXT.noun
    expect(outsideCards.toLowerCase().split(label).length - 1, `${where}: ${sentence}`).toBeLessThanOrEqual(1)
  }
}

describe.each(Object.entries(puzzles))('house style on %s', (name, puzzle) => {
  it('holds for every solver step', () => {
    const result = solveHuman(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
    // The hard puzzle needs techniques beyond the basic solver: its hints are checked below, its basic steps here.
    if (name !== 'hard') expect(result.solved).toBe(true)
    result.steps.forEach((s) => expectHouseStyle(s.explanation, `${name} step ${s.index}`))
  })

  it('holds for every hint along the full solving path', () => {
    const path = hintPath(puzzle)
    expect(path.length).toBeGreaterThan(0)
    path.forEach((h, i) => {
      expectHouseStyle(h.level3, `${name} level 3 #${i + 1}`, 400) // the reason plus the instruction
      expectHouseStyle(h.level2, `${name} level 2 #${i + 1}`)
      expectHouseStyle(h.level1, `${name} level 1 #${i + 1}`)
    })
  })
})

/**
 * The house style, in Dutch (locale 'nl', SLAY-3.3): capital sentence starts, the victim named once
 * per sentence (the Dutch label this time), and every solver step short enough. Hints go through
 * `hintText.ts`'s own Dutch tests (`game/hintText.test.ts`); `hintPath` here always solves in
 * English (`game/hints.ts` is not in this story's scope), so only the solver steps are checked here.
 */
function expectDutchHouseStyle(text: string, where: string, max = 330): void {
  expect(text, where).not.toMatch(/\br\d+[kc]\d+\b/) // cryptic cell names
  expect(text.length, where).toBeLessThanOrEqual(max)
  for (const sentence of sentencesOf(text)) {
    expect(sentence, where).toMatch(/^[^\p{Ll}]/u) // every sentence starts with a capital
    const outsideCards = sentence.replace(/"[^"]*"/g, '')
    expect(outsideCards.toLowerCase().split(VICTIM_TEXT_NL.noun).length - 1, `${where}: ${sentence}`).toBeLessThanOrEqual(1)
  }
}

describe.each(Object.entries(puzzles))('house style on %s: Dutch', (name, puzzle) => {
  it('holds for every solver step', () => {
    const result = solveHuman(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[], { locale: 'nl' })
    if (name !== 'hard') expect(result.solved).toBe(true)
    result.steps.forEach((s) => expectDutchHouseStyle(s.explanation, `${name} step ${s.index} (nl)`))
  })
})

describe('level-2 hint texts', () => {
  it('a placement names the square and the person', () => {
    const path = hintPath(puzzles.demo as Puzzle)
    expect(path[0]?.level2).toMatch(/^Look at row \d+, column \d+\. \S+ must stand there\.$/)
  })

  it('a note names the person and the few possible squares; a crossing names a few squares, else points at the lit-up ones', () => {
    const path = hintPath(hardPuzzle())
    expect(path[0]?.level2).toMatch(/^\S+ can only stand on row \d+, column \d+.*\. Those squares are marked on the board\.$/)
    for (const h of path) expect(h.level2.trim()).not.toBe('')
  })
})
