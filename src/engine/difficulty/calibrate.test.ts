import { describe, expect, it } from 'vitest'
import { TIER_IDS, bandOf, bandsFromCuts, calibrate, chooseCuts, effortPerPuzzle, parseJudgementsExport, parseTelemetryExport, spearman } from './calibrate.ts'
import type { CalibrationRow } from './calibrate.ts'
import { PART_KEYS } from './score.ts'
import type { ScoreV2 } from './types.ts'

const parts = (over: Partial<ScoreV2['parts']>): ScoreV2['parts'] =>
  ({ ...Object.fromEntries(PART_KEYS.map((k) => [k, 0])), ...over }) as ScoreV2['parts']

/** Six tiers of a made-up world where the level part and the cards part grow with the tier, with a little noise inside a tier. */
function world(perTier = 8): CalibrationRow[] {
  return TIER_IDS.flatMap((tier, k) =>
    Array.from({ length: perTier }, (_, i) => ({
      id: `${tier}-${i}`,
      kind: 'pack',
      tier,
      intended: tier,
      people: 9,
      parts: parts({ level: k / 5 + (i % 3) * 0.02, cards: k / 5 + (i % 2) * 0.03, steps: (i % 4) * 0.1, chain: 0.5 }),
    })),
  )
}

describe('chooseCuts', () => {
  it('puts each cut in the middle of the gap between two tiers', () => {
    const scores = [1, 2, 3, 20, 21, 22, 60, 61]
    const tiers = [0, 0, 0, 1, 1, 1, 2, 2]
    const cuts = chooseCuts(scores, tiers, 3)
    expect(cuts).toEqual([11, 40])
    expect(bandsFromCuts(cuts)['easy']).toEqual({ min: 12, max: 40 })
  })

  it('keeps the cuts strictly increasing even when a tier is out of order', () => {
    const cuts = chooseCuts([50, 51, 10, 11, 90], [0, 0, 1, 1, 2], 3)
    expect(cuts[0]).toBeLessThan(cuts[1] as number)
  })

  it('makes bands that tile 0..100 and read back', () => {
    const bands = bandsFromCuts([10, 20, 30, 40, 50])
    expect(bands['very-easy']).toEqual({ min: 0, max: 10 })
    expect(bands['expert']).toEqual({ min: 51, max: 100 })
    expect(bandOf(bands, 21)).toBe('easy-medium')
    expect(bandOf(bands, 999)).toBe('expert')
  })
})

describe('spearman', () => {
  it('is 1 for the same order, -1 for the reverse, and null without spread', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1)
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1)
    expect(spearman([1, 1, 1], [1, 2, 3])).toBeNull()
  })
})

describe('calibrate without telemetry or judgements', () => {
  const rows = world()
  const result = calibrate({ rows })

  it('fits weights that sum to 100 and keep every part alive', () => {
    expect(PART_KEYS.reduce((sum, k) => sum + result.weights[k], 0)).toBe(100)
    for (const k of PART_KEYS) expect(result.weights[k], k).toBeGreaterThanOrEqual(2)
  })

  it('orders the tiers: bands tile 0..100 and every puzzle lies in its band', () => {
    expect(result.bands['very-easy'].min).toBe(0)
    expect(result.bands['expert'].max).toBe(100)
    TIER_IDS.forEach((id, i) => {
      if (i > 0) expect(result.bands[id].min).toBe(result.bands[TIER_IDS[i - 1] as (typeof TIER_IDS)[number]].max + 1)
    })
    expect(result.exceptions).toEqual([])
    expect(result.quality).toMatchObject({ puzzles: 48, inBand: 48, adjacentAuc: 1, telemetry: null, judgements: { used: 0, agree: 0 } })
  })

  it('is deterministic', () => {
    expect(JSON.stringify(calibrate({ rows: world() }))).toBe(JSON.stringify(result))
  })
})

describe('calibrate with judgements', () => {
  it('lists a puzzle outside its band as an exception, and reads a judgement against the tier it was meant for', () => {
    const rows = world()
    // An "easy" puzzle that measures like the hardest tier, judged too hard for the easy tier it was meant for.
    const odd: CalibrationRow = { id: 'odd', kind: 'fixture', tier: 'easy', intended: 'easy', people: 9, parts: parts({ level: 1, cards: 1, steps: 1 }) }
    const result = calibrate({ rows: [...rows, odd], judgements: [{ puzzleId: 'odd', verdict: 'too-hard', judgedAt: 0 }, { puzzleId: 'nobody', verdict: 'good', judgedAt: 0 }] })
    expect(result.exceptions.map((e) => e.id)).toContain('odd')
    expect(result.quality.judgements.used).toBe(1)
    expect(result.quality.judgements.agree).toBe(1)
  })
})

describe('calibrate with telemetry', () => {
  it('reports the rank correlation of score and effort when there are plays of at least 5 puzzles', () => {
    const rows = world(2)
    const telemetry = rows.slice(0, 8).map((r, i) => ({ puzzleId: r.id, activeSeconds: 100 * (i + 1), hints: 0, wrongPlacements: 0, outcome: 'solved' as const }))
    const result = calibrate({ rows, telemetry })
    expect(result.quality.telemetry).toMatchObject({ records: 8, puzzles: 8 })
    expect(result.quality.telemetry?.spearman).not.toBeNull()
  })

  it('counts the median solved play per puzzle, per person, with a hint counting as 30 seconds', () => {
    const effort = effortPerPuzzle(
      [
        { puzzleId: 'a', activeSeconds: 90, hints: 0, wrongPlacements: 0, outcome: 'solved' },
        { puzzleId: 'a', activeSeconds: 270, hints: 0, wrongPlacements: 0, outcome: 'solved' },
        { puzzleId: 'a', activeSeconds: 60, hints: 1, wrongPlacements: 0, outcome: 'solved' },
        { puzzleId: 'a', activeSeconds: 5, hints: 0, wrongPlacements: 0, outcome: 'abandoned' },
        { puzzleId: 'zzz', activeSeconds: 5, hints: 0, wrongPlacements: 0, outcome: 'solved' },
      ],
      new Map([['a', 9]]),
    )
    expect([...effort]).toEqual([['a', 10]])
  })
})

describe('reading the exports of the lab', () => {
  it('reads judgements the way the lab writes them, later judgement winning, bad entries skipped', () => {
    const text = JSON.stringify({
      version: 1,
      judgements: [
        { puzzleId: 'a', verdict: 'too-hard', judgedAt: 5 },
        { puzzleId: 'a', verdict: 'good', judgedAt: 9 },
        { puzzleId: 'b', verdict: 'nonsense', judgedAt: 1 },
        { verdict: 'good' },
        'x',
      ],
    })
    expect(parseJudgementsExport(text)).toEqual([{ puzzleId: 'a', verdict: 'good', judgedAt: 9 }])
    expect(parseJudgementsExport('not json')).toEqual([])
    expect(parseJudgementsExport('{}')).toEqual([])
  })

  it('reads telemetry the way the game writes it, with safe counts', () => {
    const text = JSON.stringify({
      version: 1,
      records: [
        { sessionId: 's1', puzzleId: 'a', startedAt: 1, activeSeconds: 120, hints: { 1: 1, 2: 1, 3: 0 }, wrongPlacements: 2, outcome: 'solved' },
        { sessionId: 's2', puzzleId: 'b', activeSeconds: -4, outcome: 'gone' },
        { sessionId: 's3' },
      ],
    })
    expect(parseTelemetryExport(text)).toEqual([
      { puzzleId: 'a', activeSeconds: 120, hints: 2, wrongPlacements: 2, outcome: 'solved' },
      { puzzleId: 'b', activeSeconds: 0, hints: 0, wrongPlacements: 0, outcome: 'abandoned' },
    ])
    expect(parseTelemetryExport('[]')).toEqual([])
  })
})
