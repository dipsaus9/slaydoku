import { describe, expect, it } from 'vitest'
import { buildSolvabilityReport, renderSolvabilityMarkdown, serializeSolvabilityReport } from './report.ts'
import { oneCardLadder, soloPuzzle, twoCardIntersection } from './testing.fixture.ts'

describe('solvability report', () => {
  it('counts puzzles per tier and builds the label by tier matrix', () => {
    const report = buildSolvabilityReport({
      houseLevels: [{ id: 'solo', source: 'x', label: 'very-easy', puzzle: soloPuzzle }],
      packs: [
        { id: 'one', source: 'x', label: 'easy', puzzle: oneCardLadder },
        { id: 'two', source: 'x', label: 'easy', puzzle: twoCardIntersection },
      ],
    })
    expect(report.summary.houseLevels.exact['very-easy']).toBe(1)
    expect(report.summary.packs.exact.easy).toBe(2)
    expect(report.summary.all.meets).toEqual({ 'very-easy': 1, easy: 3, 'easy-medium': 3, medium: 3 })
    expect(report.packMatrix.easy?.easy).toBe(2)
    expect(report.packs[1]).toMatchObject({ cardsPerStep: [2, 1, 1, 0], firstPlacementCards: 2, ladderOk: true })
    expect(renderSolvabilityMarkdown(report)).toContain('## House levels (1 puzzles)')
  })

  it('is deterministic', () => {
    const input = { houseLevels: [], packs: [{ id: 'one', source: 'x', label: 'easy', puzzle: oneCardLadder }] }
    expect(serializeSolvabilityReport(buildSolvabilityReport(input))).toBe(serializeSolvabilityReport(buildSolvabilityReport(input)))
  })

})
