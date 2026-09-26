import { describe, expect, it } from 'vitest'
import type { CatalogClue } from '../clues/index.ts'
import { serializePuzzle } from '../model/index.ts'
import { edgeLadder } from '../solvable/testing.fixture.ts'
import { solveHuman } from './human/index.ts'
import { verifyPuzzle } from './verify.ts'

describe('the room-edge clue in the solvers (CAD-9.2)', () => {
  it('solves a hand-made puzzle to its one solution, the stored one', () => {
    expect(verifyPuzzle(serializePuzzle(edgeLadder))).toMatchObject({ ok: true, solutionCount: 1, matchesStored: true })
  })

  it('the human solver places everybody and explains the card in English', () => {
    const result = solveHuman(edgeLadder.scene, edgeLadder.people, edgeLadder.clues as CatalogClue[])
    expect(result.solved).toBe(true)
    const text = result.steps.map((s) => s.explanation).join('\n')
    expect(text).toContain('B stood in the bottom row of the East Wing.')
  })
})
