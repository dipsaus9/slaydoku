import { describe, expect, it } from 'vitest'
import { assessTier, ladderCapsFor, ladderOptions, sizeBandOf, SOLVABLE_TIERS, tierFor } from './tiers.ts'
import { combinedGenderLadder, combinedLadder, edgeLadder, genderLadder, noCards, oneCardLadder, referenceLadder, soloPuzzle, twoCardIntersection } from './testing.fixture.ts'

describe('SOLVABLE_TIERS', () => {
  it('is the scale from very-easy to expert, easiest first', () => {
    expect(SOLVABLE_TIERS.map((t) => t.id)).toEqual(['very-easy', 'easy', 'easy-medium', 'medium', 'hard', 'expert'])
    expect(SOLVABLE_TIERS.map((t) => t.order)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('only lets medium and up use person references', () => {
    expect(SOLVABLE_TIERS.filter((t) => t.references).map((t) => t.id)).toEqual(['medium', 'hard', 'expert'])
  })
})

describe('the caps of CAD-8.7', () => {
  const ladder = SOLVABLE_TIERS.filter((t) => t.method === 'ladder')

  it('cap the squares a placement\'s own cards leave and the chain of dependent placements per tier, per size band (SLAY-13.1)', () => {
    expect(ladder.map((t) => [t.id, t.bySize.small.maxSquaresFromCards, t.bySize.small.maxChain])).toEqual([
      ['very-easy', 4, 2],
      ['easy', 5, 2],
      ['easy-medium', 6, 2],
      ['medium', 8, 3],
    ])
    expect(ladder.map((t) => [t.id, t.bySize.large.maxSquaresFromCards, t.bySize.large.maxChain])).toEqual([
      ['very-easy', 4, 3],
      ['easy', 8, 3],
      ['easy-medium', 10, 4],
      ['medium', 16, 4],
    ])
  })

  it('hold the last three placements to a tighter cap than any tier cap, and never loosen towards the harder tiers, in both size bands', () => {
    for (const band of ['small', 'large'] as const) {
      for (const tier of ladder) expect(tier.bySize[band].lastSquaresFromCards).toBeLessThanOrEqual(tier.bySize[band].maxSquaresFromCards)
      for (let i = 1; i < ladder.length; i++) {
        expect(ladder[i]!.bySize[band].maxSquaresFromCards).toBeGreaterThanOrEqual(ladder[i - 1]!.bySize[band].maxSquaresFromCards)
        expect(ladder[i]!.bySize[band].maxChain).toBeGreaterThanOrEqual(ladder[i - 1]!.bySize[band].maxChain)
      }
    }
  })

  it('a small grid ({6,7}) is held to a relatively stricter bar than a large grid ({9,12}) for the same tier (SLAY-13.1)', () => {
    // easy, easy-medium and medium are all measurably tighter on the small band; very-easy's squares cap
    // is unchanged (SLAY-13.1 found it already an organic non-issue on every size) but its chain is still looser large.
    for (const tier of ladder) {
      expect(tier.bySize.small.maxSquaresFromCards, tier.id).toBeLessThanOrEqual(tier.bySize.large.maxSquaresFromCards)
      expect(tier.bySize.small.maxChain, tier.id).toBeLessThanOrEqual(tier.bySize.large.maxChain)
    }
    expect(ladder.some((t) => t.bySize.small.maxSquaresFromCards < t.bySize.large.maxSquaresFromCards)).toBe(true)
    expect(ladder.some((t) => t.bySize.small.maxChain < t.bySize.large.maxChain)).toBe(true)
  })

  it('sizeBandOf: {6,7} is small, {9,12} is large', () => {
    expect([6, 7].map(sizeBandOf)).toEqual(['small', 'small'])
    expect([9, 12].map(sizeBandOf)).toEqual(['large', 'large'])
  })

  it('ladderOptions/ladderCapsFor resolve a tier\'s caps from the grid size given, not a single flat number', () => {
    const medium = SOLVABLE_TIERS.find((t) => t.id === 'medium')!
    expect(ladderCapsFor(medium, 6)).toEqual({ maxSquaresFromCards: 8, lastSquaresFromCards: 3, maxChain: 3 })
    expect(ladderCapsFor(medium, 12)).toEqual({ maxSquaresFromCards: 16, lastSquaresFromCards: 4, maxChain: 4 })
    expect(ladderOptions(medium, 6)).toMatchObject({ maxSquaresFromCards: 8, lastSquaresFromCards: 3, maxChain: 3 })
    expect(ladderOptions(medium, 12)).toMatchObject({ maxSquaresFromCards: 16, lastSquaresFromCards: 4, maxChain: 4 })
  })

  it('give a puzzle whose cards leave more squares than the cap a harder tier: 3 squares fit very-easy, the tutorial ladder needs 3 squares and a chain of 2', () => {
    // The tutorial scene is 4x4 -- the small band.
    expect(ladderOptions(SOLVABLE_TIERS[0]!, 4)).toMatchObject({ maxCards: 1, references: false, maxSquaresFromCards: 4, lastSquaresFromCards: 3, maxChain: 2 })
    // oneCardLadder: C 1 square, B 2, A 3 (chain 2); the last three (B, A, the gift) are held to 3 squares: fine for easy, and the whole ladder meets easy.
    expect(assessTier(oneCardLadder).meets.easy).toBe(true)
  })
})

describe('hard/expert\'s size-banded threshold (SLAY-13.1)', () => {
  it('scoreBandBySize is a real per-size table, resolved through sizeBandOf', () => {
    const hard = SOLVABLE_TIERS.find((t) => t.id === 'hard')!
    const expert = SOLVABLE_TIERS.find((t) => t.id === 'expert')!
    expect(hard.scoreBandBySize[sizeBandOf(9)]).toEqual({ min: 51, max: 87 })
    expect(expert.scoreBandBySize[sizeBandOf(12)]).toEqual({ min: 88, max: 100 })
    // SLAY-13.1 could not measure a {6,7} hard/expert population (none was generated before SLAY-22 put hard on
    // 6x6 and 7x7 in the first 100 levels): its band mirrors the measured {9,12} one, not a real size difference --
    // unlike the ladder tiers above, this is documented as unbanded-by-evidence (the SLAY-22 sweep passes with it).
    expect(hard.scoreBandBySize.small).toEqual(hard.scoreBandBySize.large)
    expect(expert.scoreBandBySize.small).toEqual(expert.scoreBandBySize.large)
  })

  it('assessTier keeps the technique-level cutoff when no score v2 is given (unchanged default)', () => {
    const assessment = assessTier(noCards)
    expect(['hard', 'expert']).toContain(assessment.tier)
    const bySolvedLevel = assessment.advanced!.solved && assessment.advanced!.level < 5 ? 'hard' : 'expert'
    expect(assessment.tier).toBe(bySolvedLevel)
  })

  it('assessTier, given a score v2, classifies hard/expert from the size-banded band instead of the flat cutoff alone', () => {
    // noCards is a 4x4 (small-band) puzzle with no cards at all: the hint solver cannot solve it, so the
    // flat rule alone would call it expert regardless of score. A score inside hard's small-band range overrides that.
    const withoutScore = assessTier(noCards)
    expect(withoutScore.tier).toBe('expert')
    const withHardScore = assessTier(noCards, 60)
    expect(withHardScore.tier).toBe('hard')
    const withExpertScore = assessTier(noCards, 95)
    expect(withExpertScore.tier).toBe('expert')
  })
})

describe('tierFor', () => {
  it('very-easy: a room-edge card is a structural single card, no person reference needed', () => {
    expect(tierFor(edgeLadder)).toBe('very-easy')
  })

  it('very-easy: one card per placement and two people placeable from their own card alone', () => {
    expect(tierFor(soloPuzzle)).toBe('very-easy')
  })

  it('easy: one card per placement, but fewer than two people placeable from their own card alone', () => {
    expect(tierFor(oneCardLadder)).toBe('easy')
  })

  it('easy: a two-card step is fine when at most a third of the placements use two', () => {
    // 1 of 4 placements uses two cards.
    const assessment = assessTier(twoCardIntersection)
    expect(assessment.tier).toBe('easy')
    expect(assessment.meets).toEqual({ 'very-easy': false, easy: true, 'easy-medium': true, medium: true })
  })

  it('medium: a person reference is only allowed from medium on', () => {
    const assessment = assessTier(referenceLadder)
    expect(assessment.tier).toBe('medium')
    expect(assessment.meets).toEqual({ 'very-easy': false, easy: false, 'easy-medium': false, medium: true })
  })

  it('medium: a gender card counts as a person reference, so a puzzle that needs one is medium at the easiest', () => {
    const assessment = assessTier(genderLadder)
    expect(assessment.tier).toBe('medium')
    expect(assessment.meets).toEqual({ 'very-easy': false, easy: false, 'easy-medium': false, medium: true })
  })

  it('a combined card is one card in the scale: the two-card intersection becomes a one-card ladder', () => {
    const assessment = assessTier(combinedLadder)
    // Only B is placeable from their own card alone, so it is not very easy; but no placement needs more than one card.
    expect(assessment.tier).toBe('easy')
    expect(assessment.ladder.steps.every((s) => s.clues.length <= 1)).toBe(true)
    expect(assessTier(twoCardIntersection).ladder.steps.some((s) => s.clues.length === 2)).toBe(true)
  })

  it('medium: a combined card is person-referencing when either part is (here a gender part)', () => {
    const assessment = assessTier(combinedGenderLadder)
    expect(assessment.tier).toBe('medium')
    expect(assessment.meets).toEqual({ 'very-easy': false, easy: false, 'easy-medium': false, medium: true })
  })

  it('falls back to the advanced solver when no ladder fits', () => {
    const assessment = assessTier(noCards)
    expect(['hard', 'expert']).toContain(assessment.tier)
    expect(assessment.advanced).toBeDefined()
  })
})
