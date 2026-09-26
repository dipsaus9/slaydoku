import { describe, expect, it } from 'vitest'
import { demoLevels } from '../../../content/levels.ts'
import { generatedPuzzles } from '../../../content/generated.testing.ts'
import { GIFT_NL } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import type { Puzzle } from '../../model/index.ts'
import { puzzle as tutorial } from '../../../game/fixture.ts'
import { hardPuzzle, hintPath } from '../../../game/hints.fixture.ts'
import { solveHuman } from './index.ts'

/**
 * The Dutch a player reads while solving: the level-3 hint is a solver step explanation. These
 * tests pin representative explanations per technique on the tutorial, and check the house style on every step and every hint
 * of the full solving path of the tutorial, the demo level, a hard puzzle and a generated sample.
 * (Techniques these puzzles never need are pinned in their own technique tests.)
 */

const puzzles: Record<string, Puzzle> = {
  tutorial,
  demo: demoLevels[0]!.puzzle,
  hard: hardPuzzle(),
  ...Object.fromEntries(generatedPuzzles().filter((p) => p.size === 7 && p.tier !== 'medium').map((p) => [p.id, p.puzzle])),
}

/** The explanation of the `nth` (1-based) step of a technique, placing or not. */
function step(name: string, technique: string, nth = 1, placing = false): string {
  const p = puzzles[name] as Puzzle
  const result = solveHuman(p.scene, p.people, p.clues as CatalogClue[])
  const found = result.steps.filter((s) => s.technique === technique && (s.placed !== undefined) === placing)[nth - 1]
  if (!found) throw new Error(`${name}: no ${technique} step ${nth}`)
  return found.explanation
}

describe('pinned explanations per technique', () => {
  it('clue: one person, and two people at once', () => {
    expect(step('tutorial', 'clue')).toBe(
      'De kaart van A zegt: "A stond naast een tafel." A kan dus niet op 10 vakjes (onder andere rij 1, kolom 1 en rij 2, kolom 2) staan.',
    )
    expect(step('hard', 'clue')).toMatch(/^De kaart van \S+ zegt: ".+" .+ (kan|kunnen) dus niet op .+ staan\.$/)
  })

  it('single-candidate: with and without an object under the square', () => {
    expect(step('tutorial', 'single-candidate', 1, true)).toBe(
      'C kan nog maar op één vakje staan: rij 3, kolom 4. Die rij en kolom zijn daarmee bezet.',
    )
    expect(step('demo', 'single-candidate', 1, true)).toMatch(/^\S+ kan nog maar op één vakje staan: rij \d+, kolom \d+(, op een \S+)?\. Die rij en kolom zijn daarmee bezet\.$/)
  })

  it('intersect: a square shared by every possible square of somebody', () => {
    expect(step('hard', 'intersect')).toMatch(/^\S+ kan alleen nog op .+ staan\. Elk van die vakjes deelt een rij of kolom met rij \d+, kolom \d+\. Als daar iemand anders zou staan, houdt \S+ niets over\. Daar kan dus niemand anders staan\.$/)
  })
})

/** Sentences of an explanation; a card quoted inside counts as part of its sentence. */
const sentencesOf = (text: string): string[] => text.split(/(?<=[.!?]["”]?)\s+(?=\S)/u)

/** The house style, as rules on every text a player can read. */
function expectHouseStyle(text: string, where: string, max = 330): void {
  expect(text, where).not.toMatch(/\br\d+k\d+\b/) // cryptic cell names
  expect(text, where).not.toMatch(/\b\p{L}+vak\b/u) // noun + "vak" compounds
  // Stray punctuation around quoted cards. The one fixed sentence of a combined card ('... en "b". Beide delen moeten kloppen.', CAD-9.3) is meant.
  expect(text.replaceAll('". Beide delen moeten kloppen.', '" Beide delen moeten kloppen.'), where).not.toMatch(/"\.|\.\./)
  expect(text.length, where).toBeLessThanOrEqual(max)
  for (const sentence of sentencesOf(text)) {
    expect(sentence, where).toMatch(/^[^\p{Ll}]/u) // every sentence starts with a capital
    // The gift is named once per sentence (a quoted card is its own text).
    const outsideCards = sentence.replace(/"[^"]*"/g, '')
    const label = GIFT_NL.noun
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

describe('level-2 hint texts', () => {
  it('a placement names the square and the person', () => {
    const path = hintPath(puzzles.demo as Puzzle)
    expect(path[0]?.level2).toMatch(/^Kijk naar rij \d+, kolom \d+\. Daar moet \S+ staan\.$/)
  })

  it('a note names the person and the few possible squares; a crossing names a few squares, else points at the lit-up ones', () => {
    const path = hintPath(hardPuzzle())
    expect(path[0]?.level2).toMatch(/^\S+ kan alleen op rij \d+, kolom \d+.* staan\. Die vakjes zijn gemarkeerd op het bord\.$/)
    for (const h of path) expect(h.level2.trim()).not.toBe('')
  })
})
