import { describe, expect, it } from 'vitest'
import { precision } from './precision.ts'
import { combinedGenderLadder, combinedLadder, edgeLadder, genderLadder, oneCardLadder, referenceLadder, soloPuzzle, tutorialPuzzle, twoCardIntersection } from './testing.fixture.ts'

describe('precision', () => {
  it('counts the squares each card leaves its holder alone', () => {
    const result = precision(twoCardIntersection)
    const squares = Object.fromEntries(result.cards.map((c) => [c.clue, c.squares]))
    // bed: 2, bottom row: 3 of 4 (the plant blocks one), beside the plant: 2, column 2: 3 (the table blocks one).
    expect(squares).toEqual({ 0: 2, 1: 3, 2: 2, 3: 3 })
    expect(result.empty).toEqual([])
    expect(result.misfits).toEqual([])
  })

  it('lists people who are placeable from their own card alone', () => {
    expect(precision(soloPuzzle).placeableAlone).toEqual(['A', 'B'])
    expect(precision(oneCardLadder).placeableAlone).toEqual(['C'])
    expect(precision(twoCardIntersection).placeableAlone).toEqual([])
  })

  it('lets a card that names a person leave the squares that have some square for the other', () => {
    const cards = precision(referenceLadder).cards
    const withC = cards.find((c) => c.type === 'withPerson')
    expect(withC).toMatchObject({ holder: 'B', referencing: true })
    // Any room has a second square for C in a row and column of its own: "with C" leaves every square (13) until C is placed.
    expect(withC?.squares).toBe(13)
  })

  it('a room-edge card is structural: the squares on the edge of the room, placeable from its own card alone', () => {
    const result = precision(edgeLadder)
    const card = result.cards.find((c) => c.type === 'inRoomEdge')
    expect(card).toMatchObject({ holder: 'B', referencing: false, squares: 1 })
    expect(result.placeableAlone).toEqual(['A', 'B'])
    // Tutorial scene: the top row of the living room is r0 (the table blocks r0c2): 3 free squares; the bedroom's bottom row has the plant.
    const top = precision({
      ...tutorialPuzzle,
      clues: [{ personId: 'A', type: 'inRoomEdge', args: { roomId: 'bedroom', edge: 'south' } }],
    }).cards[0]
    expect(top?.squares).toBe(3)
  })

  it('a combined card reports the squares the WHOLE card leaves: the intersection of its parts', () => {
    const result = precision(combinedLadder)
    const card = result.cards.find((c) => c.type === 'both')
    // On the bed: 2 squares, in the bottom row: 3 squares, both: 1.
    expect(card).toMatchObject({ holder: 'B', referencing: false, squares: 1, sharedFits: true })
    expect(result.placeableAlone).toContain('B')
    expect(result.cards).toHaveLength(3)
    // One card whose two parts each leave more squares than the card does.
    const single = (part: { type: string; args: Record<string, unknown> }) => precision({ ...combinedLadder, clues: [{ personId: 'B', ...part }] }).cards[0]?.squares
    expect(single({ type: 'onObject', args: { objectType: 'bed' } })).toBe(2)
    expect(single({ type: 'inRow', args: { index: 3 } })).toBe(3)
  })

  it('a combined card with a gender part is referencing, and leaves the squares where both parts can hold', () => {
    const card = precision(combinedGenderLadder).cards.find((c) => c.type === 'both')
    expect(card).toMatchObject({ holder: 'B', referencing: true })
    // Column 1 has 4 free squares; each has a room with a man who fits in a row and column of his own.
    expect(card?.squares).toBe(4)
    expect(precision(combinedGenderLadder).placeableAlone).toEqual(['C'])
  })

  it('a gender card is referencing: it leaves the squares that have a person of that gender to share the room', () => {
    const card = precision(genderLadder).cards.find((c) => c.type === 'aloneWithGender')
    expect(card).toMatchObject({ holder: 'B', referencing: true, sharedFits: true })
    // Every square has another square for C (a man) in a row and column of its own in the same room: nothing is ruled out yet.
    expect(card?.squares).toBe(13)
    expect(precision(genderLadder).placeableAlone).toEqual(['C'])
    expect(precision(genderLadder).empty).toEqual([])
  })

  it('flags identical cards whose holders cannot all fit in their own rows and columns', () => {
    const shared = {
      ...tutorialPuzzle,
      clues: [
        { personId: 'A', type: 'onObject', args: { objectType: 'bed' } },
        { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
        { personId: 'C', type: 'inRoom', args: { roomId: 'living' } },
      ],
    }
    const result = precision(shared)
    // The bed is one column (two squares): only one of A and B fits.
    expect(result.cards[0]).toMatchObject({ sharedWith: ['A', 'B'], sharedFits: false })
    expect(result.cards[1]).toMatchObject({ sharedWith: ['A', 'B'], sharedFits: false })
    expect(result.cards[2]).toMatchObject({ sharedWith: ['C'], sharedFits: true })
    expect(result.misfits).toEqual([0, 1])
  })

  it('accepts identical cards whose holders do fit', () => {
    const shared = {
      ...tutorialPuzzle,
      clues: [
        { personId: 'A', type: 'inRoom', args: { roomId: 'living' } },
        { personId: 'B', type: 'inRoom', args: { roomId: 'living' } },
      ],
    }
    expect(precision(shared).misfits).toEqual([])
  })

  it('flags a card that leaves no square', () => {
    const impossible = { ...tutorialPuzzle, clues: [{ personId: 'A', type: 'onObject', args: { objectType: 'car' } }] }
    expect(precision(impossible).empty).toEqual([0])
  })
})
