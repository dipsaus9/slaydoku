import { describe, expect, it } from 'vitest'
import { demoPuzzle } from '../content/demo/puzzle.ts'
import { MAX_CROSSED_SQUARES } from './hints.ts'
import { walkHints } from './walk.ts'

/** A player who follows every hint may need this many hint requests per person: the hints must not drag. */
const REQUESTS_PER_PERSON = 1.3

describe('the hint walk of the demo puzzle', () => {
  for (const level of [{ id: 'demo', puzzle: demoPuzzle }]) {
    describe(level.id, () => {
      const { puzzle } = level
      const walk = walkHints(puzzle)

      it('solves the level from an empty board', () => {
        expect(walk.solved).toBe(true)
        expect(walk.unplaced).toBe(0)
      })

      it(`needs at most ${REQUESTS_PER_PERSON} x the number of people in hint requests`, () => {
        expect(walk.steps.length).toBeLessThanOrEqual(REQUESTS_PER_PERSON * puzzle.people.length)
      })

      it('never asks for more than 12 squares, and the first hint is not "read this card, cross out squares"', () => {
        for (const step of walk.steps) {
          expect(step.level2.cells.length).toBeLessThanOrEqual(MAX_CROSSED_SQUARES)
          expect(step.level3.cells.length).toBeLessThanOrEqual(MAX_CROSSED_SQUARES)
        }
        expect(walk.steps[0]?.next.placement).toBeDefined()
      })
    })
  }
})
