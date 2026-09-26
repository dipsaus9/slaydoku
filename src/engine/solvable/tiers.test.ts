import { describe, expect, it } from 'vitest'
import { assessTier, ladderOptions, SOLVABLE_TIERS, tierFor } from './tiers.ts'
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

  it('cap the squares a placement\'s own cards leave and the chain of dependent placements per tier', () => {
    expect(ladder.map((t) => [t.id, t.maxSquaresFromCards, t.maxChain])).toEqual([
      ['very-easy', 4, 2],
      ['easy', 6, 2],
      ['easy-medium', 9, 3],
      ['medium', 14, 3],
    ])
  })

  it('hold the last three placements to a tighter cap than any tier cap, and never loosen towards the harder tiers', () => {
    for (const tier of ladder) expect(tier.lastSquaresFromCards).toBeLessThan(tier.maxSquaresFromCards)
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i]!.maxSquaresFromCards).toBeGreaterThanOrEqual(ladder[i - 1]!.maxSquaresFromCards)
      expect(ladder[i]!.maxChain).toBeGreaterThanOrEqual(ladder[i - 1]!.maxChain)
    }
  })

  it('give a puzzle whose cards leave more squares than the cap a harder tier: 3 squares fit very-easy, the tutorial ladder needs 3 squares and a chain of 2', () => {
    expect(ladderOptions(SOLVABLE_TIERS[0]!)).toMatchObject({ maxCards: 1, references: false, maxSquaresFromCards: 4, lastSquaresFromCards: 3, maxChain: 2 })
    // oneCardLadder: C 1 square, B 2, A 3 (chain 2); the last three (B, A, the gift) are held to 3 squares: fine for easy, and the whole ladder meets easy.
    expect(assessTier(oneCardLadder).meets.easy).toBe(true)
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
