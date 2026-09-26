import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../model/index.ts'
import { serializePuzzle } from '../model/index.ts'
import { tutorialPuzzle } from '../model/tutorial.fixture.ts'
import { formatReport, verifyPuzzle } from './verify.ts'

const clues: Puzzle['clues'] = [
  { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'V', type: 'aloneWithMurderer', args: {} },
]
const good: Puzzle = { ...tutorialPuzzle, clues }
const verify = (puzzle: Puzzle) => verifyPuzzle(serializePuzzle(puzzle))

describe('verifyPuzzle', () => {
  it('accepts a unique puzzle and names the murderer', () => {
    expect(verify(good)).toEqual({
      loaded: true,
      problems: [],
      rulesValid: true,
      solutionCount: 1,
      murderer: 'A',
      matchesStored: true,
      ok: true,
    })
  })

  it('flags a contradictory clue as 0 solutions', () => {
    const report = verify({
      ...good,
      clues: [...clues, { personId: 'A', type: 'inRoom', args: { roomId: 'bedroom' } }],
    })
    expect(report.solutionCount).toBe(0)
    expect(report.ok).toBe(false)
    expect(report.problems.join('\n')).toContain('does not satisfy')
  })

  it('flags clues that contradict each other', () => {
    // B on the bed (bedroom) and B in the living room cannot both hold.
    const report = verify({
      ...good,
      clues: [...clues, { personId: 'B', type: 'inRoom', args: { roomId: 'living' } }],
    })
    expect(report.solutionCount).toBe(0)
    expect(report.ok).toBe(false)
  })

  it('flags a missing clue as several solutions', () => {
    const report = verify({ ...good, clues: clues.slice(1) })
    expect(report.solutionCount).toBe(2)
    expect(report.matchesStored).toBeNull()
    expect(report.ok).toBe(false)
    expect(report.problems.join('\n')).toContain('not unique')
  })

  it('reports a stored solution that breaks the rules', () => {
    const solution = good.solution.map((p) =>
      p.personId === 'V' ? { ...p, cell: { row: 1, col: 0 } } : p,
    )
    const report = verify({ ...good, solution })
    expect(report.rulesValid).toBe(false)
    expect(report.ok).toBe(false)
  })

  it('reports malformed clue parameters without solving', () => {
    const report = verify({
      ...good,
      clues: [{ personId: 'A', type: 'onObject', args: { objectType: 'nope' } }],
    })
    expect(report.loaded).toBe(true)
    expect(report.ok).toBe(false)
    expect(report.problems[0]).toContain('clues[0]')
  })

  it('reports an unknown clue type', () => {
    const report = verify({ ...good, clues: [{ personId: 'A', type: 'levitating' }] })
    expect(report.ok).toBe(false)
    expect(report.problems[0]).toContain('Unknown clue type')
  })

  it('reports invalid JSON and schema problems', () => {
    expect(verifyPuzzle('{ nope').loaded).toBe(false)
    const report = verifyPuzzle(JSON.stringify({ scene: {} }))
    expect(report.loaded).toBe(false)
    expect(report.problems.length).toBeGreaterThan(0)
  })
})

describe('formatReport', () => {
  it('prints rules, solution count and murderer', () => {
    const text = formatReport(verify(good), 'tutorial.json')
    expect(text).toContain('Puzzle: tutorial.json')
    expect(text).toContain('Valid rules: yes')
    expect(text).toContain('Solutions: 1')
    expect(text).toContain('Murderer: A')
    expect(text).toContain('Result: OK')
  })

  it('marks ambiguous puzzles with a plus', () => {
    const text = formatReport(verify({ ...good, clues: [] }), 'x.json')
    expect(text).toContain('Solutions: 2+ (not unique)')
    expect(text).toContain('Result: FAILED')
  })

  it('lists load problems', () => {
    expect(formatReport(verifyPuzzle('{'), 'bad.json')).toContain('Loaded: no')
  })
})
