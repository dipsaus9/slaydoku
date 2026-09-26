import { describe, expect, it } from 'vitest'
import { DEMO_VICTIM_CELLS, demoScene } from '../../../content/demo/scene.ts'
import type { Scene } from '../../model/index.ts'
import { ladderCheck } from '../../solvable/ladder.ts'
import { precision } from '../../solvable/precision.ts'
import { assessTier } from '../../solvable/tiers.ts'
import { sceneForSeed } from '../scale/measure.ts'
import { expandClue } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { castGenders } from './format.ts'
import { LADDER_TIER_IDS, generateLadder } from './generate.ts'
import type { LadderTierId } from './generate.ts'
import { expectGood, ok } from './testing.fixture.ts'

/** The first of eight seeds from `from` that gives a puzzle; throws with the last reason when none does. */
function firstOk(scene: Scene, tier: LadderTierId, from: number, cell: { row: number; col: number }) {
  let last = ''
  for (let seed = from; seed < from + 8; seed++) {
    const outcome = generateLadder(scene, tier, seed, { victimCell: cell, genders: castGenders(scene.width) })
    if (outcome.ok) return outcome
    last = outcome.message
  }
  throw new Error(`${tier} seeds ${from}-${from + 7}: ${last}`)
}

const key = (cell: { row: number; col: number }) => `r${cell.row + 1}c${cell.col + 1}`

describe('generateLadder', () => {
  it('is deterministic per scene, tier and seed', { timeout: 60_000 }, () => {
    for (const tier of LADDER_TIER_IDS) {
      const a = ok(sceneForSeed(7, 3), tier, 3)
      const b = ok(sceneForSeed(7, 3), tier, 3)
      expect(b.puzzle).toEqual(a.puzzle)
      expect(b.order).toEqual(a.order)
      expect(b.steps).toEqual(a.steps)
      expect(ok(sceneForSeed(7, 3), tier, 4).puzzle).not.toEqual(a.puzzle)
    }
  })

  describe('the gift cells of the demo house', () => {
    const houses: { name: string; scene: Scene; cells: readonly { row: number; col: number }[]; hopeless: string[]; rareEasy?: string[] }[] = [
      // Very easy needs one card per placement, and a card that covers a square of the gift's row or column never
      // gets smaller (the gift is placed last): a scene can have gift cells for which no such path exists; list them as `hopeless`.
      { name: 'demo house', scene: demoScene, cells: DEMO_VICTIM_CELLS, hopeless: [] },
    ]
    for (const { name, scene, cells, hopeless, rareEasy = [] } of houses) {
      it.each(LADDER_TIER_IDS)(`${name}: pins the gift on every gift cell (%s)`, { timeout: 120_000 }, (tier) => {
        cells.forEach((cell, i) => {
          if (tier === 'very-easy' && hopeless.includes(key(cell))) {
            expect(generateLadder(scene, tier, 1, { victimCell: cell })).toMatchObject({ ok: false, reason: 'attempts' })
            return
          }
          if (tier === 'easy' && rareEasy.includes(key(cell))) return
          // The caps make some seeds hopeless on a tight scene: the first seed of eight that works.
          expectGood(firstOk(scene, tier, 10 + i, cell), tier, cell)
        })
      })
    }
  })

  it('hides the order of the path: cards are shuffled and ids are not in placement order', () => {
    const report = ok(sceneForSeed(9, 2), 'easy', 2)
    const holders = report.puzzle.clues.map((c) => c.personId)
    expect(holders).not.toEqual(report.order.filter((id) => holders.includes(id)))
  })

  it('very easy puzzles have at least two people placeable from their own card alone, one card per placement, no person cards', () => {
    const report = ok(sceneForSeed(9, 5), 'very-easy', 5)
    expect(precision(report.puzzle).placeableAlone.length).toBeGreaterThanOrEqual(2)
    expect(report.ladder.steps.every((s) => s.clues.length <= 1)).toBe(true)
    expect(report.puzzle.clues.every((c) => (c.args as { otherId?: string } | undefined)?.otherId === undefined)).toBe(true)
  })

  it('easy uses some two-card placements but at most a third, easy-medium more than a third, medium goes beyond two cards or names people', { timeout: 60_000 }, () => {
    const scene = sceneForSeed(9, 6)
    const easy = ok(scene, 'easy', 6)
    const twos = easy.ladder.steps.filter((s) => s.clues.length === 2).length
    expect(twos).toBeGreaterThanOrEqual(1)
    expect(twos).toBeLessThanOrEqual(3)
    const mid = ok(scene, 'easy-medium', 6)
    expect(mid.ladder.steps.filter((s) => s.clues.length === 2).length).toBeGreaterThan(3)
    expect(mid.puzzle.clues.every((c) => (c.args as { otherId?: string } | undefined)?.otherId === undefined)).toBe(true)
    const medium = ok(scene, 'medium', 6)
    expect(assessTier(medium.puzzle).meets['easy-medium']).toBe(false)
  })

  describe('the new kinds (CAD-9.4)', () => {
    const parts = (clues: readonly { type: string }[]) => clues.flatMap((c) => expandClue(c as CatalogClue).map((p) => p.type))
    const puzzles = (tier: LadderTierId, withGenders: boolean) =>
      Array.from({ length: 12 }, (_, i) => {
        const scene = sceneForSeed(9, 1 + (i % 3))
        const outcome = generateLadder(scene, tier, i + 1, { genders: withGenders ? castGenders(8) : undefined })
        if (!outcome.ok) throw new Error(`${tier} seed ${i + 1}: ${outcome.message}`)
        return outcome.puzzle
      })

    it('very easy and easy use room-edge cards, but no combined, gender or person cards', { timeout: 120_000 }, () => {
      const kinds = new Set<string>()
      for (const tier of ['very-easy', 'easy'] as const) {
        for (const puzzle of puzzles(tier, true)) for (const kind of parts(puzzle.clues)) kinds.add(kind)
      }
      expect(kinds.has('inRoomEdge')).toBe(true)
      for (const kind of ['both', 'roomHasGender', 'aloneWithGender', 'exactDistance', 'withPerson']) expect(kinds.has(kind)).toBe(false)
    })

    it('easy-medium uses combined cards whose parts name nobody; medium uses distance, gender and combined cards', { timeout: 120_000 }, () => {
      const mid = new Set<string>()
      const midCards = new Set<string>()
      for (const puzzle of puzzles('easy-medium', true)) {
        for (const kind of parts(puzzle.clues)) mid.add(kind)
        for (const clue of puzzle.clues) midCards.add(clue.type)
      }
      expect(midCards.has('both')).toBe(true)
      for (const kind of ['roomHasGender', 'aloneWithGender', 'exactDistance', 'withPerson']) expect(mid.has(kind)).toBe(false)
      const medium = new Set<string>()
      const cards = new Set<string>()
      for (const puzzle of puzzles('medium', true)) {
        for (const kind of parts(puzzle.clues)) medium.add(kind)
        for (const clue of puzzle.clues) cards.add(clue.type)
      }
      expect(cards.has('both')).toBe(true)
      expect(medium.has('exactDistance')).toBe(true)
    })

    it('draws a gender card only when the people have genders, and then only from medium up', { timeout: 180_000 }, () => {
      const genderKinds = ['roomHasGender', 'aloneWithGender']
      for (const tier of LADDER_TIER_IDS) {
        for (const puzzle of puzzles(tier, false)) expect(parts(puzzle.clues).some((k) => genderKinds.includes(k))).toBe(false)
      }
      // The people carry the genders the generator was given (the victim has none).
      const [first] = puzzles('medium', true)
      expect(first!.people.filter((p) => p.kind === 'suspect').map((p) => p.gender)).toEqual(castGenders(8))
      expect(first!.people.find((p) => p.kind === 'victim')?.gender).toBeUndefined()
      // Over enough medium puzzles the gender cards do get drawn.
      let seen = 0
      for (let seed = 1; seed <= 40 && seen === 0; seed++) {
        const outcome = generateLadder(sceneForSeed(9, 1 + (seed % 3)), 'medium', seed, { genders: castGenders(8) })
        if (outcome.ok) seen += parts(outcome.puzzle.clues).filter((k) => genderKinds.includes(k)).length
      }
      expect(seen).toBeGreaterThan(0)
    })
  })

  it('returns a failure reason instead of throwing', () => {
    const wide: Scene = { ...sceneForSeed(6, 1), width: 7 }
    expect(generateLadder(wide, 'easy', 1)).toMatchObject({ ok: false, reason: 'unsupported' })
    expect(generateLadder(sceneForSeed(6, 1), 'hard' as LadderTierId, 1)).toMatchObject({ ok: false, reason: 'unsupported' })
    expect(generateLadder(demoScene, 'easy', 1, { victimCell: { row: 0, col: 1 } })).toMatchObject({ ok: false })
    expect(generateLadder(sceneForSeed(9, 1), 'medium', 1, { budgetMs: 0 })).toMatchObject({ ok: false, reason: 'budget' })
    expect(generateLadder(sceneForSeed(9, 1), 'medium', 1, { maxAttempts: 0 })).toMatchObject({ ok: false, reason: 'attempts' })
  })

  it('accepts a puzzle that also fits an easier tier when exact is off', () => {
    const outcome = generateLadder(sceneForSeed(9, 2), 'medium', 2, { exact: false })
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(ladderCheck(outcome.puzzle).ok).toBe(true)
  })
})
