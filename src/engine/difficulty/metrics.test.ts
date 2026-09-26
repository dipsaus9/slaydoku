import { describe, expect, it } from 'vitest'
import type { Clue, Puzzle } from '../model/index.ts'
import { tutorialPuzzle } from '../model/tutorial.fixture.ts'
import type { HumanStep } from '../solver/human/index.ts'
import { computeMetrics, directClueShare, stepDependencies } from './metrics.ts'

/**
 * Hand-made puzzle: the 4x4 tutorial with four cards. Worked out by hand:
 * three clue steps (A, B, C), then four single-candidate placements (C, B, A, V).
 * Every card is direct except the victim card, which is left out of the share.
 */
const clues: Clue[] = [
  { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'V', type: 'aloneWithMurderer', args: {} },
]
const puzzle: Puzzle = { ...tutorialPuzzle, clues }

describe('computeMetrics on the hand-made tutorial puzzle', () => {
  const metrics = computeMetrics(puzzle)

  it('counts the human-solver steps', () => {
    expect(metrics.solved).toBe(true)
    expect(metrics.steps).toBe(7)
    expect(metrics.people).toBe(4)
    expect(metrics.clueCount).toBe(4)
  })

  it('finds the longest chain: the three card steps are roots, each placement builds on the last', () => {
    // depths 1, 1, 1, 2 (C on card 3), 3 (B on C's placement), 4 (A), 5 (V)
    expect(metrics.longestChain).toBe(5)
  })

  it('counts the clues combined per step', () => {
    // steps rest on 1, 1, 1, 1, 2, 3, 3 different cards
    expect(metrics.cluesPerStep).toBeCloseTo(12 / 7, 3)
  })

  it('shares out the direct clues, victim card left out', () => {
    expect(metrics.directClueShare).toBe(1)
  })

  it('counts the candidates the involved people still had before each step', () => {
    // 13 open squares before each card step, then one square each for the four placements: (3 * 13 + 4) / 7
    expect(metrics.candidatesPerStep).toBeCloseTo(43 / 7, 3)
  })

  it('reports the hardest technique level', () => {
    expect(metrics.hardestLevel).toBe(1)
  })

  it('measures the ladder (CAD-5.6): one card per placement, no person references, one person placeable from their own card', () => {
    expect(metrics.ladderSolved).toBe(true)
    expect(metrics.cardsPerPlacement).toBe(1)
    expect(metrics.referenceShare).toBe(0)
    expect(metrics.squaresFromCards).toBe(2)
    expect(metrics.ladderChain).toBe(1)
    expect(metrics.placeableAloneShare).toBe(0.25)
  })

  it('is deterministic: same puzzle, identical result', () => {
    expect(computeMetrics(puzzle)).toEqual(metrics)
    expect(computeMetrics(structuredClone(puzzle))).toEqual(metrics)
  })

  it('measures an unsolvable puzzle on the steps that were found, without throwing', () => {
    const loose = computeMetrics({ ...puzzle, clues: [] })
    expect(loose.solved).toBe(false)
    expect(loose.steps).toBe(0)
    expect(loose.longestChain).toBe(0)
    expect(loose.cluesPerStep).toBe(0)
    expect(loose.candidatesPerStep).toBe(0)
    expect(loose.hardestLevel).toBe(0)
    expect(loose.ladderSolved).toBe(false)
    expect(loose.cardsPerPlacement).toBe(0)
  })
})

describe('directClueShare', () => {
  const card = (type: string, args: Record<string, unknown> = {}) => ({ type, personId: 'A', args })

  it('counts room, object, door, window, corner and line cards as direct (the definition of the clue audit)', () => {
    const cards = ['inRoom', 'onObject', 'besideObject', 'inCorner', 'besideFeature', 'inFrontOfDoor', 'inRow', 'onLine'].map((type) => card(type))
    expect(directClueShare(cards)).toBe(1)
  })

  it('counts cards about other people or genders as indirect, and skips the victim card', () => {
    const cards = [card('inRoom'), card('withPerson'), card('roomHasGender'), card('directionOf'), card('aloneWithMurderer')]
    expect(directClueShare(cards)).toBe(0.25)
  })

  it('counts a room edge as direct only when it names the room, and a combined card as direct when both parts are', () => {
    const both = (a: string, b: string) => card('both', { a: { type: a, args: {} }, b: { type: b, args: {} } })
    const cards = [
      card('inRoomEdge', { edge: 'north' }),
      card('inRoomEdge', { edge: 'north', roomId: 'kitchen' }),
      both('inRoom', 'inCorner'),
      both('inRoom', 'withPerson'),
    ]
    expect(directClueShare(cards)).toBe(0.5)
  })

  it('is 0 without cards', () => {
    expect(directClueShare([])).toBe(0)
  })
})

describe('stepDependencies', () => {
  const step = (over: Partial<HumanStep> & { people: string[] }): HumanStep => ({
    index: 1,
    technique: 'x',
    level: 1,
    explanation: '',
    cells: [],
    eliminated: [],
    ...over,
  })
  const cell = { row: 0, col: 0 }

  it('makes the first firing of a card a root and a later step depend on earlier steps that touched its people', () => {
    const steps = [
      step({ people: ['A'], clueIndex: 0, eliminated: [{ personId: 'A', cell }] }),
      step({ people: ['B'], clueIndex: 1, eliminated: [{ personId: 'B', cell }] }),
      step({ people: ['A', 'B'], eliminated: [{ personId: 'A', cell }] }),
      step({ people: ['C'], placed: { personId: 'C', cell } }),
    ]
    expect(stepDependencies(steps)).toEqual([[], [], [0, 1], []])
  })

  it('treats a card that fires again as a step that builds on the board', () => {
    const steps = [
      step({ people: ['A'], clueIndex: 0, eliminated: [{ personId: 'A', cell }] }),
      step({ people: ['A'], clueIndex: 0, eliminated: [{ personId: 'A', cell }] }),
    ]
    expect(stepDependencies(steps)).toEqual([[], [0]])
  })
})
