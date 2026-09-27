import { describe, expect, it } from 'vitest'
import { generateTier } from '../engine/generator/tiers/index.ts'
import type { TierId } from '../engine/generator/tiers/index.ts'
import { DEMO_VICTIM_CELLS, demoScene } from '../content/demo/scene.ts'
import { demoPuzzle } from '../content/demo/puzzle.ts'
import { combinedGenderLadder, combinedLadder } from '../engine/solvable/testing.fixture.ts'
import { auditClues, auditHints, walkHints } from './index.ts'

/** The demo puzzle was made for the easy tier (see src/content/demo/puzzle.ts). */
const LEVEL_TIERS: Record<string, TierId> = { demo: 'easy' }
const demoLevels = [{ id: 'demo', puzzle: demoPuzzle }]

describe('the audit works for any puzzle', () => {
  for (const level of demoLevels) {
    it(`level ${level.id}: the hints and the clue cards are good`, () => {
      const tier = LEVEL_TIERS[level.id] as TierId
      expect(auditHints(level.puzzle)).toEqual([])
      expect(auditClues(level.puzzle, tier)).toEqual([])
    })
  }

  for (const [name, puzzle] of [['a combined card with a gender part', combinedGenderLadder], ['a combined card of two structural facts', combinedLadder]] as const) {
    it(`${name}: the hints explain the two parts and the audit accepts them`, () => {
      expect(auditHints(puzzle)).toEqual([])
      expect(auditClues(puzzle, 'hard')).toEqual([])
      const walk = walkHints(puzzle)
      expect(walk.solved).toBe(true)
      const explained = walk.steps.map((s) => s.level3.text).filter((text) => text.includes('has two parts: "'))
      expect(explained.length).toBeGreaterThan(0)
      for (const text of explained) expect(text).toContain('Both parts must be true.')
    })
  }

  it('a freshly generated puzzle is audited with the same functions', () => {
    const puzzle = generateTier(demoScene, { seed: 5, tier: 'very-easy', victimCell: DEMO_VICTIM_CELLS[0]! })
    expect(auditHints(puzzle)).toEqual([])
    expect(auditClues(puzzle, 'very-easy')).toEqual([])
  })
})
