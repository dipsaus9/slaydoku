import { describe, expect, it } from 'vitest'
import { labLevels as demoLevels } from './levels.ts'
import { computeMetrics, scoreV2 } from '../../engine/difficulty/index.ts'
import { withCastNames } from '../play/people.ts'
import type { CatalogClue } from '../../engine/clues/index.ts'
import { solveAdvanced } from '../../engine/solver/advanced/index.ts'
import { getHint, hintFor } from '../../game/hints.ts'
import { initialState } from '../../game/reducer.ts'
import type { TelemetryRecord } from '../../game/telemetry/index.ts'
import { buildInsight, buildTrace, cellLabel, clock, median, recordsFor, summarizeTelemetry } from './insight.ts'

const puzzle = demoLevels[0]!.puzzle

const record = (over: Partial<TelemetryRecord>): TelemetryRecord => ({
  sessionId: 's',
  puzzleId: 'p',
  startedAt: 0,
  activeSeconds: 60,
  hints: { 1: 0, 2: 0, 3: 0 },
  hintPlacements: 0,
  wrongPlacements: 0,
  failedChecks: 0,
  undos: 0,
  outcome: 'solved',
  ...over,
})

describe('solve trace', () => {
  const trace = buildTrace(puzzle)

  it('lists every step with a technique title, squares and the three hints', () => {
    expect(trace.length).toBeGreaterThan(0)
    trace.forEach((step, i) => {
      expect(step.index).toBe(i + 1)
      expect(step.title).not.toBe('')
      expect(step.title).not.toBe(step.techniqueId)
      expect(step.cells.length).toBeGreaterThan(0)
      for (const level of [1, 2, 3] as const) expect(step.hints[level].length).toBeGreaterThan(10)
      expect(new Set(Object.values(step.hints)).size).toBe(3)
    })
  })

  it('has the texts the game builds for the same solver step', () => {
    // The trace walks the solver's own steps; the game's best-move hint (getHint) picks the most useful person instead.
    const [first] = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[]).steps
    for (const level of [1, 2, 3] as const) {
      expect(trace[0]!.hints[level]).toBe(hintFor(puzzle, { step: first! }, level).text)
    }
    expect(getHint(puzzle, initialState(), 1)?.text).toMatch(/^Read \S+'s card: /)
  })

  it('names a placement step with the square it places on', () => {
    const placed = trace.filter((s) => s.placement)
    expect(placed.length).toBeGreaterThan(0)
    for (const step of placed) expect(step.cells).toEqual([step.placement!.cell])
  })
})

describe('insight', () => {
  it('has the score v2 of the metrics', () => {
    const insight = buildInsight(puzzle)
    expect(insight.metrics).toEqual(computeMetrics(puzzle))
    expect(insight.score).toEqual(scoreV2(insight.metrics))
    expect(insight.trace).toHaveLength(insight.metrics.steps)
  })
})

describe('cast names', () => {
  it('puts the played names in the hint texts', () => {
    const played = withCastNames(puzzle, 'some-seed')
    const names = played.people.map((p) => p.label)
    const text = buildInsight(puzzle, played).trace.map((s) => s.hints[1]).join(' ')
    expect(names.some((name) => text.includes(name))).toBe(true)
  })
})

describe('formatting', () => {
  it('shows squares short and times as minutes', () => {
    expect(cellLabel({ row: 2, col: 3 })).toBe('r3c4')
    expect(clock(75)).toBe('1:15')
    expect(clock(5)).toBe('0:05')
  })
})

describe('telemetry summary', () => {
  it('takes the median', () => {
    expect(median([])).toBeNull()
    expect(median([5])).toBe(5)
    expect(median([9, 1, 5])).toBe(5)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('picks the records of one puzzle, oldest first', () => {
    const records = [record({ sessionId: 'b', puzzleId: 'x', startedAt: 2 }), record({ sessionId: 'c', puzzleId: 'y' }), record({ sessionId: 'a', puzzleId: 'x', startedAt: 1 })]
    expect(recordsFor(records, 'x').map((r) => r.sessionId)).toEqual(['a', 'b'])
  })

  it('summarises sessions, time, hints and errors', () => {
    const summary = summarizeTelemetry([
      record({ activeSeconds: 100, hints: { 1: 1, 2: 1, 3: 0 }, wrongPlacements: 1, failedChecks: 1 }),
      record({ activeSeconds: 200, hints: { 1: 0, 2: 0, 3: 0 } }),
      record({ activeSeconds: 900, outcome: 'abandoned', hints: { 1: 3, 2: 2, 3: 1 }, wrongPlacements: 4 }),
    ])
    expect(summary).toEqual({ sessions: 3, solved: 2, abandoned: 1, medianSeconds: 150, medianHints: 2, medianErrors: 2 })
  })

  it('has nothing to say without sessions', () => {
    expect(summarizeTelemetry([])).toEqual({ sessions: 0, solved: 0, abandoned: 0, medianSeconds: null, medianHints: null, medianErrors: null })
  })
})
