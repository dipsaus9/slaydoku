import { expect } from 'vitest'
import { auditObjectNames } from '../../clues/objectNames.ts'
import { isRelationalClue, isStructuralClue } from '../../clues/index.ts'
import { serializePuzzle, validateSolution } from '../../model/index.ts'
import type { Cell, Scene } from '../../model/index.ts'
import { verifyPuzzle } from '../../solver/index.ts'
import { SOLVABLE_TIERS, assessTier } from '../../solvable/tiers.ts'
import { auditClues, auditHints } from '../../../validation/index.ts'
import { generateLadder } from './generate.ts'
import { castGenders, withCastLabels } from './format.ts'
import type { LadderReport, LadderTierId } from './generate.ts'

/** A generated puzzle (the people have the cast genders, so gender cards may be drawn), or a thrown error naming the seed. */
export const ok = (scene: Scene, tier: LadderTierId, seed: number, victimCell?: Cell): LadderReport => {
  const outcome = generateLadder(scene, tier, seed, { victimCell, genders: castGenders(scene.width) })
  if (!outcome.ok) throw new Error(`${tier} seed ${seed}: ${outcome.message}`)
  return outcome
}

/** Everything the story promises about one generated puzzle. */
export function expectGood(report: LadderReport, tier: LadderTierId, victimCell?: Cell): void {
  const { puzzle } = report
  // The oracle of CAD-8.2: the ladder of the requested tier (one run, also the one in the report), and the tier the puzzle is on.
  const assessed = assessTier(puzzle)
  expect(assessed.meets[tier]).toBe(true)
  expect(assessed.tier).toBe(tier)
  expect(report.ladder.ok).toBe(true)
  expect(report.ladder.maxCards).toBe(SOLVABLE_TIERS.find((t) => t.id === tier)!.maxCards)
  expect(report.assessed).toBe(tier)
  // One solution, equal to the planted one, and the rules hold.
  const verified = verifyPuzzle(serializePuzzle(puzzle))
  expect(verified.problems).toEqual([])
  expect(verified.ok).toBe(true)
  expect(validateSolution(puzzle).ok).toBe(true)
  // Every clue names what is drawn (CAD-8.1), and the hints and cards read well (CAD-5.4, CAD-5.5; judged with the cast names, as the pack does).
  expect(auditObjectNames(puzzle)).toEqual([])
  const dressed = withCastLabels(puzzle)
  expect(auditHints(dressed)).toEqual([])
  expect(auditClues(dressed, tier)).toEqual([])
  if (victimCell) expect(puzzle.solution.find((p) => p.personId === 'V')?.cell).toEqual(victimCell)
  expectPathIsSound(report)
}

/** The solving path: everybody once, the victim last, every step's cards are about that person, referents earlier. */
export function expectPathIsSound(report: LadderReport): void {
  const { puzzle, steps, order } = report
  expect(order).toHaveLength(puzzle.people.length)
  expect(new Set(order).size).toBe(puzzle.people.length)
  expect(order.at(-1)).toBe('V')
  expect(steps.map((s) => s.personId)).toEqual(order)
  const position = new Map(order.map((id, i) => [id, i]))
  const used = new Set<number>()
  for (const step of steps) {
    const at = puzzle.solution.find((p) => p.personId === step.personId)!.cell
    expect(step.cell).toEqual(at)
    for (const i of step.clues) {
      used.add(i)
      const clue = puzzle.clues[i]!
      expect(clue.personId).toBe(step.personId)
      const other = (clue.args as { otherId?: string } | undefined)?.otherId
      // Person-referencing cards only refer to people placed earlier in the ladder.
      if (other !== undefined) expect(position.get(other)!).toBeLessThan(position.get(step.personId)!)
    }
  }
  // Every card belongs to a step: no stray cards.
  expect([...used].sort((a, b) => a - b)).toEqual(puzzle.clues.map((_, i) => i))
  for (const clue of puzzle.clues) {
    expect(isStructuralClue(clue) || isRelationalClue(clue)).toBe(true)
    const other = (clue.args as { otherId?: string } | undefined)?.otherId
    if (other !== undefined) expect(position.get(other)!).toBeLessThan(position.get(clue.personId)!)
  }
}

