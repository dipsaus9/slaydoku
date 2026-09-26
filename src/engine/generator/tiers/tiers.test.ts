import { describe, expect, it } from 'vitest'
import { STRUCTURAL_CLUE_TYPES } from '../../clues/index.ts'
import { RELATIONAL_CLUE_TYPES } from '../../clues/relational/types.ts'
import {
  LEVEL_SPANS, RELATIONAL_DISTANCE_KINDS, TIERS, allowsKind, difficultyScore, tierById, tierForScore,
} from './tiers.ts'
import type { TierId } from './tiers.ts'

const ORDER: TierId[] = ['very-easy', 'easy', 'easy-medium', 'medium', 'hard', 'expert']

describe('tier definitions', () => {
  it('lists the six bands easiest first', () => {
    expect(TIERS.map((t) => t.id)).toEqual(ORDER)
    expect(TIERS.map((t) => t.order)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('tiles the 0-100 score scale without gaps or overlaps', () => {
    expect(TIERS[0]?.minScore).toBe(0)
    expect(TIERS.at(-1)?.maxScore).toBe(100)
    TIERS.forEach((tier, i) => {
      expect(tier.minScore).toBeLessThanOrEqual(tier.maxScore)
      if (i > 0) expect(tier.minScore).toBe((TIERS[i - 1]?.maxScore ?? -2) + 1)
    })
  })

  it('maps every score 0-100 to exactly its named band', () => {
    for (let score = 0; score <= 100; score++) {
      const tier = tierForScore(score)
      expect(score).toBeGreaterThanOrEqual(tier.minScore)
      expect(score).toBeLessThanOrEqual(tier.maxScore)
    }
    expect(tierForScore(0).id).toBe('very-easy')
    expect(tierForScore(25).id).toBe('easy')
    expect(tierForScore(40).id).toBe('easy-medium')
    expect(tierForScore(60).id).toBe('medium')
    expect(tierForScore(75).id).toBe('hard')
    expect(tierForScore(100).id).toBe('expert')
    expect(tierForScore(-5).id).toBe('very-easy')
    expect(tierForScore(250).id).toBe('expert')
  })

  it('has technique caps that grow with the band and never exceed the score span order', () => {
    const caps = TIERS.map((t) => t.maxTechniqueLevel)
    expect(caps).toEqual([...caps].sort((a, b) => a - b))
    for (const tier of TIERS) expect(tier.minTechniqueLevel).toBeLessThanOrEqual(tier.maxTechniqueLevel)
    expect(tierById('very-easy').maxTechniqueLevel).toBe(1)
    expect(tierById('medium').maxTechniqueLevel).toBe(3)
  })

  it('widens the allowed clue kinds band by band and only knows real catalog kinds', () => {
    const catalog = new Set<string>([...STRUCTURAL_CLUE_TYPES, ...RELATIONAL_CLUE_TYPES])
    for (const tier of TIERS) {
      expect(tier.allowedKinds).toContain('aloneWithMurderer')
      for (const kind of tier.allowedKinds) expect(catalog.has(kind)).toBe(true)
    }
    for (let i = 1; i < TIERS.length; i++) {
      const before = TIERS[i - 1]?.allowedKinds ?? []
      for (const kind of before) expect(allowsKind(TIERS[i]!, kind)).toBe(true)
    }
    expect(tierById('easy').allowedKinds).toEqual(expect.arrayContaining(['onObject', 'inRoom', 'alone', 'besideObject']))
    expect(allowsKind(tierById('easy'), 'directionOf')).toBe(false)
    expect(allowsKind(tierById('easy-medium'), 'directionOf')).toBe(true)
    expect(allowsKind(tierById('easy-medium'), 'withPerson')).toBe(true)
    expect(allowsKind(tierById('easy-medium'), 'inRow')).toBe(true)
    expect(allowsKind(tierById('medium'), 'exactDistance')).toBe(true)
    // Hard and expert allow the whole catalog.
    expect(new Set(tierById('expert').allowedKinds)).toEqual(catalog)
    expect(new Set(tierById('hard').allowedKinds)).toEqual(catalog)
  })

  it('only marks allowed kinds as fallback kinds', () => {
    for (const tier of TIERS) for (const kind of tier.fallbackKinds) expect(allowsKind(tier, kind)).toBe(true)
    expect(tierById('easy').fallbackKinds).toEqual(['inRow', 'inColumn'])
  })

  it('keeps distance, diagonal and quadrant clues out of easy and easy-medium', () => {
    for (const id of ['very-easy', 'easy', 'easy-medium'] as const) {
      for (const kind of RELATIONAL_DISTANCE_KINDS) expect(allowsKind(tierById(id), kind)).toBe(false)
    }
    for (const kind of RELATIONAL_DISTANCE_KINDS) expect(allowsKind(tierById('medium'), kind)).toBe(true)
  })

  it('defines hard and expert but marks them as waiting for the advanced techniques', () => {
    expect(tierById('hard').availability).toBe('advanced')
    expect(tierById('expert').availability).toBe('advanced')
    for (const id of ['very-easy', 'easy', 'easy-medium', 'medium'] as const) expect(tierById(id).availability).toBe('now')
  })

  it('allows a small number of extra clue cards, more in the higher tiers', () => {
    for (const tier of TIERS) {
      expect(tier.clues.maxExtraClues).toBeGreaterThanOrEqual(0)
      expect(tier.clues.maxCluesPerSuspect).toBeGreaterThanOrEqual(1)
    }
    expect(tierById('medium').clues.maxExtraClues).toBeGreaterThanOrEqual(tierById('very-easy').clues.maxExtraClues)
  })
})

describe('difficultyScore', () => {
  const walk = (level: number, steps: number) => ({
    steps: Array.from({ length: steps }, () => ({})) as never,
    maxTechnique: { id: 't', title: 't', level },
  })

  it('is decided by the hardest technique first, steps second', () => {
    expect(tierForScore(difficultyScore(walk(1, 200), 9)).id).toBe('very-easy')
    expect(tierForScore(difficultyScore(walk(2, 1), 9)).id).toBe('easy')
    expect(tierForScore(difficultyScore(walk(3, 20), 9)).id).toBe('medium')
    expect(tierForScore(difficultyScore(walk(4, 40), 9)).id).toBe('hard')
    expect(tierForScore(difficultyScore(walk(7, 40), 9)).id).toBe('expert')
  })

  it('separates easy from easy-medium by step count within level 2', () => {
    const few = difficultyScore(walk(2, 20), 9)
    const many = difficultyScore(walk(2, 33), 9)
    expect(tierForScore(few).id).toBe('easy')
    expect(tierForScore(many).id).toBe('easy-medium')
    expect(many).toBeGreaterThan(few)
  })

  it('stays inside 0-100 and copes with no steps', () => {
    expect(difficultyScore({ steps: [], maxTechnique: null }, 9)).toBe(0)
    expect(difficultyScore(walk(9, 10_000), 9)).toBe(100)
  })
})

describe('LEVEL_SPANS calibration (CAD-4.24)', () => {
  const walk = (level: number, steps: number) => ({
    steps: Array.from({ length: steps }, () => ({})) as never,
    maxTechnique: { id: 't', title: 't', level },
  })

  it('gives every technique level its own span, ascending and tiling 0-100', () => {
    expect(LEVEL_SPANS.map((s) => s.level)).toEqual([1, 2, 3, 4, 5])
    expect(LEVEL_SPANS[0]?.from).toBe(0)
    expect(LEVEL_SPANS.at(-1)?.to).toBe(100)
    LEVEL_SPANS.forEach((span, i) => {
      expect(span.from).toBeLessThan(span.to)
      expect(span.lowSteps).toBeLessThan(span.highSteps)
      if (i > 0) expect(span.from).toBe((LEVEL_SPANS[i - 1]?.to ?? -2) + 1)
    })
  })

  it('keeps a puzzle of any step count inside the span of its level, so tiers never overlap', () => {
    for (const span of LEVEL_SPANS) {
      for (const people of [6, 7, 9, 12, 16]) {
        for (let steps = 0; steps <= people * 8; steps++) {
          const score = difficultyScore(walk(span.level, steps), people)
          expect(score).toBeGreaterThanOrEqual(span.from)
          expect(score).toBeLessThanOrEqual(span.to)
        }
      }
    }
  })

  it('is scale free: the same steps per person scores the same on every grid size', () => {
    for (const perPerson of [2, 2.5, 3, 4, 5]) {
      for (const level of [1, 2, 3, 4, 5]) {
        const scores = [6, 8, 12, 16].map((people) => difficultyScore(walk(level, perPerson * people), people))
        expect(new Set(scores).size).toBe(1)
      }
    }
  })

  it('rises with the steps per person inside a level', () => {
    for (const level of [1, 2, 3, 4, 5]) {
      const scores = [1, 2, 3, 4, 5, 6, 7].map((perPerson) => difficultyScore(walk(level, perPerson * 10), 10))
      expect(scores).toEqual([...scores].sort((a, b) => a - b))
    }
  })
})
