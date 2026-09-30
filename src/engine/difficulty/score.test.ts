import { describe, expect, it } from 'vitest'
import { DEFAULT_WEIGHTS, scoreV2 } from './score.ts'
import type { DifficultyMetrics, ScoreWeights } from './types.ts'

const base: DifficultyMetrics = {
  people: 9,
  clueCount: 10,
  solved: true,
  steps: 23,
  longestChain: 10,
  cluesPerStep: 4,
  directClueShare: 0.5,
  candidatesPerStep: 20,
  hardestLevel: 2,
  ladderSolved: true,
  cardsPerPlacement: 1.5,
  referenceShare: 0.2,
  squaresFromCards: 1.73,
  ladderChain: 1,
  placeableAloneShare: 0.2,
}

const zero = Object.fromEntries(Object.keys(DEFAULT_WEIGHTS).map((k) => [k, 0])) as unknown as ScoreWeights

describe('scoreV2', () => {
  it('is a whole number from 0 to 100 and deterministic', () => {
    const a = scoreV2(base)
    expect(Number.isInteger(a.score)).toBe(true)
    expect(a.score).toBeGreaterThanOrEqual(0)
    expect(a.score).toBeLessThanOrEqual(100)
    expect(scoreV2({ ...base })).toEqual(a)
  })

  it('scores the trivial extreme 0 and the hardest extreme 100', () => {
    const easiest: DifficultyMetrics = {
      ...base, steps: 0, longestChain: 0, cluesPerStep: 0, directClueShare: 1, candidatesPerStep: 0, hardestLevel: 0,
      cardsPerPlacement: 1, referenceShare: 0, squaresFromCards: 1, ladderChain: 0, placeableAloneShare: 0.5,
    }
    const hardest: DifficultyMetrics = {
      ...base, steps: 90, longestChain: 90, cluesPerStep: 10, directClueShare: 0, candidatesPerStep: 81, hardestLevel: 5,
      ladderSolved: false, placeableAloneShare: 0,
    }
    expect(scoreV2(easiest).score).toBe(0)
    expect(scoreV2(hardest).score).toBe(100)
  })

  it.each([
    ['hardestLevel', 4],
    ['steps', 40],
    ['longestChain', 20],
    ['cluesPerStep', 7],
    ['candidatesPerStep', 40],
    ['cardsPerPlacement', 2.2],
    ['referenceShare', 0.5],
    ['squaresFromCards', 6],
    ['ladderChain', 2],
  ] as const)('rises with %s', (key, higher) => {
    expect(scoreV2({ ...base, [key]: higher }).score).toBeGreaterThan(scoreV2(base).score)
  })

  it('rises when fewer people can be placed from their own card alone', () => {
    expect(scoreV2({ ...base, placeableAloneShare: 0 }).score).toBeGreaterThan(scoreV2(base).score)
  })

  it('counts the ladder parts as the hardest when no ladder tier fits the puzzle (hard, expert)', () => {
    const { parts } = scoreV2({ ...base, ladderSolved: false, cardsPerPlacement: 0, squaresFromCards: 0 })
    expect([parts.cards, parts.references, parts.squares, parts.ladderChain]).toEqual([1, 1, 1, 1])
    expect(scoreV2({ ...base, ladderSolved: false }).score).toBeGreaterThan(scoreV2(base).score)
  })

  it('rises when fewer cards are direct', () => {
    expect(scoreV2({ ...base, directClueShare: 0.1 }).score).toBeGreaterThan(scoreV2(base).score)
  })

  it('compares grids of any size: doubling people and steps together leaves the step part alone', () => {
    const small = scoreV2({ ...base, people: 6, steps: 12 }).parts.steps
    const big = scoreV2({ ...base, people: 12, steps: 24 }).parts.steps
    expect(big).toBe(small)
  })

  it('scores squares by grid size: a small and a large grid with equivalent relative openness score the same (SLAY-13.3), where a raw count would have scored the large grid harder just from its size', () => {
    const small = scoreV2({ ...base, people: 6, squaresFromCards: 1.2 }).parts.squares
    const big = scoreV2({ ...base, people: 12, squaresFromCards: 2.4 }).parts.squares
    expect(big).toBe(small)
    // Same absolute squaresFromCards on the two sizes is NOT equivalent openness: the smaller grid reads harder.
    const smallSameRaw = scoreV2({ ...base, people: 6, squaresFromCards: 1.8 }).parts.squares
    const bigSameRaw = scoreV2({ ...base, people: 12, squaresFromCards: 1.8 }).parts.squares
    expect(smallSameRaw).toBeGreaterThan(bigSameRaw)
  })

  it('takes weights: only the level part when all other weights are 0', () => {
    const only = { ...zero, level: 1 }
    expect(scoreV2({ ...base, hardestLevel: 3 }, only).score).toBe(50)
    expect(scoreV2(base, { ...only, level: 0 }).score).toBe(0)
  })

  it('exposes the weighted parts, each 0..1', () => {
    const { parts } = scoreV2(base)
    for (const value of Object.values(parts)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
    expect(Object.keys(parts).sort()).toEqual(Object.keys(DEFAULT_WEIGHTS).sort())
  })
})
