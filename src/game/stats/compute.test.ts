import { describe, expect, it } from 'vitest'
import { SOLVABLE_TIERS } from '../../engine/solvable/tiers.ts'
import { RESULT_TIERS } from '../daily/results.ts'
import { computeStats, median, streaks } from './compute.ts'
import type { StatsResult } from './compute.ts'

let counter = 0
const r = (date: string, extra: Partial<StatsResult> = {}): StatsResult => ({ n: ++counter, date, elapsedMs: 60_000, hints: 0, ...extra })

describe('median', () => {
  it('is null for nothing, the middle of an odd count and the rounded mean of an even count', () => {
    expect(median([])).toBeNull()
    expect(median([9, 1, 5])).toBe(5)
    expect(median([4, 1, 3, 2])).toBe(3)
    expect(median([1001, 1002])).toBe(1002)
  })
  it('handles ties', () => {
    expect(median([7, 7, 7, 7])).toBe(7)
    expect(median([5, 5, 9])).toBe(5)
  })
})

describe('streaks', () => {
  it('is zero for an empty history', () => {
    expect(streaks([], '2026-10-15')).toEqual({ current: 0, best: 0 })
  })

  it('counts consecutive days up to today', () => {
    expect(streaks(['2026-10-13', '2026-10-14', '2026-10-15'], '2026-10-15')).toEqual({ current: 3, best: 3 })
  })

  it('keeps the streak alive when the last solved day is yesterday, and ends it after that', () => {
    expect(streaks(['2026-10-13', '2026-10-14'], '2026-10-15').current).toBe(2)
    expect(streaks(['2026-10-13', '2026-10-14'], '2026-10-16')).toEqual({ current: 0, best: 2 })
  })

  it('a missed day resets the run; the best run is kept', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06']
    expect(streaks(dates, '2026-10-06')).toEqual({ current: 2, best: 3 })
  })

  it('handles gaps, unsorted input and duplicates', () => {
    const dates = ['2026-10-20', '2026-10-10', '2026-10-11', '2026-10-11', '2026-10-15', '2026-10-19', '2026-10-21']
    expect(streaks(dates, '2026-10-21')).toEqual({ current: 3, best: 3 })
    expect(streaks(dates, '2026-10-30')).toEqual({ current: 0, best: 3 })
  })

  it('runs across a month boundary', () => {
    expect(streaks(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'], '2026-11-02')).toEqual({ current: 4, best: 4 })
  })

  it('runs across a year boundary', () => {
    expect(streaks(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-02')).toEqual({ current: 3, best: 3 })
  })

  it('runs across a leap day, and 28 February does not join 1 March in a normal year', () => {
    expect(streaks(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01')).toEqual({ current: 3, best: 3 })
    expect(streaks(['2027-02-28', '2027-03-01'], '2027-03-01')).toEqual({ current: 2, best: 2 })
    expect(streaks(['2027-02-27', '2027-03-01'], '2027-03-01')).toEqual({ current: 1, best: 1 })
  })

  it('ignores dates that are not real', () => {
    expect(streaks(['2026-02-30', 'nope', '2026-10-14'], '2026-10-14')).toEqual({ current: 1, best: 1 })
  })

  it('is not broken by a clock that is behind the last solved day', () => {
    expect(streaks(['2026-10-14', '2026-10-15'], '2026-10-10').current).toBe(2)
  })
})

describe('computeStats', () => {
  it('reads an empty history as zeros and nulls', () => {
    expect(computeStats([], '2026-10-15')).toEqual({
      played: 0,
      solved: 0,
      solveRate: null,
      currentStreak: 0,
      bestStreak: 0,
      totalHints: 0,
      averageHints: null,
      tiers: [],
    })
  })

  it('counts played (started) and solved, and the rate between them', () => {
    const results = [r('2026-10-12'), r('2026-10-13')]
    const stats = computeStats(results, '2026-10-13', [results[0]!.n, 900, 901])
    expect(stats.solved).toBe(2)
    expect(stats.played).toBe(4)
    expect(stats.solveRate).toBe(0.5)
  })

  it('a solved day is always played, even when no play record survived', () => {
    const stats = computeStats([r('2026-10-12')], '2026-10-12')
    expect(stats.played).toBe(1)
    expect(stats.solveRate).toBe(1)
  })

  it('sums the hints and averages them over solved puzzles', () => {
    const stats = computeStats([r('2026-10-12', { hints: 3 }), r('2026-10-13', { hints: 0 }), r('2026-10-14', { hints: 1 })], '2026-10-14')
    expect(stats.totalHints).toBe(4)
    expect(stats.averageHints).toBeCloseTo(4 / 3)
  })

  it('a day solved the next morning counts for its own day', () => {
    // Results carry the date of their puzzle, never the moment of solving: puzzle 14 solved on the morning of the 15th still sits on the
    // 14th, so 13, 14 and 15 make one run however late a day was solved.
    const stats = computeStats([r('2026-10-13'), r('2026-10-14'), r('2026-10-15')], '2026-10-15')
    expect(stats.currentStreak).toBe(3)
  })

  it('gives best and median times per tier, easiest tier first, with ties', () => {
    const stats = computeStats(
      [
        r('2026-10-12', { tier: 'hard', elapsedMs: 300_000 }),
        r('2026-10-13', { tier: 'easy', elapsedMs: 60_000 }),
        r('2026-10-14', { tier: 'easy', elapsedMs: 60_000 }),
        r('2026-10-15', { tier: 'easy', elapsedMs: 100_000 }),
        r('2026-10-16', { tier: 'easy', elapsedMs: 200_000 }),
        r('2026-10-17'),
      ],
      '2026-10-17',
    )
    expect(stats.tiers).toEqual([
      { tier: 'easy', solved: 4, best: 60_000, median: 80_000 },
      { tier: 'hard', solved: 1, best: 300_000, median: 300_000 },
    ])
  })

  it('results without a tier count everywhere except in the times per tier', () => {
    const stats = computeStats([r('2026-10-12'), r('2026-10-13', { tier: 'medium' })], '2026-10-13')
    expect(stats.solved).toBe(2)
    expect(stats.tiers.map((t) => t.tier)).toEqual(['medium'])
  })

  it('ignores corrupt records', () => {
    const good = r('2026-10-12', { hints: 2, tier: 'easy' })
    const corrupt = [
      { n: 50, date: 'garbage', elapsedMs: 1, hints: 0 },
      { n: 51, date: '2026-13-40', elapsedMs: 1, hints: 0 },
      { n: 52, date: '2026-10-13', elapsedMs: Number.NaN, hints: 0 },
      { n: 53, date: '2026-10-13', elapsedMs: -5, hints: 0 },
      { n: 1.5, date: '2026-10-13', elapsedMs: 5, hints: 0 },
      { n: 54, date: 20261013 as unknown as string, elapsedMs: 5, hints: 0 },
      { n: 55, date: '2026-10-13', elapsedMs: 5, hints: Number.NaN },
    ]
    const stats = computeStats([...corrupt, good], '2026-10-13')
    // Only the last corrupt one (bad hint count only) is usable, with its hints read as 0.
    expect(stats.solved).toBe(2)
    expect(stats.totalHints).toBe(2)
    expect(stats.bestStreak).toBe(2)
  })

  it('uses the first result when a number appears twice', () => {
    const stats = computeStats([{ n: 7, date: '2026-10-12', elapsedMs: 1000, hints: 1 }, { n: 7, date: '2026-10-20', elapsedMs: 5, hints: 9 }], '2026-10-12')
    expect(stats.solved).toBe(1)
    expect(stats.totalHints).toBe(1)
  })

  it('a longer history keeps the best streak when the current one is shorter', () => {
    const dates = [...Array.from({ length: 12 }, (_, i) => `2026-10-${String(12 + i).padStart(2, '0')}`), '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']
    const stats = computeStats(dates.map((d) => r(d)), '2026-10-30')
    expect(stats).toMatchObject({ currentStreak: 5, bestStreak: 12 })
  })
})

describe('tier list', () => {
  it('matches the solvable tiers in order', () => {
    expect(RESULT_TIERS).toEqual(SOLVABLE_TIERS.map((t) => t.id))
  })
})
