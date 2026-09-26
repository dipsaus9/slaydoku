import type { Clue, Puzzle, Scene } from '../model/index.ts'
import { tutorialPuzzle } from '../model/tutorial.fixture.ts'

/** The 4x4 tutorial scene: table (0,2), tv (1,0), bed (2,1)+(3,1), plant (3,3), window east of (2,3). V r0c0, A r1c2, C r2c3, B r3c1. */
export const tutorialScene: Scene = tutorialPuzzle.scene

const tutorial = (clues: Clue[]): Puzzle => ({ ...tutorialPuzzle, clues })

/**
 * Hand-made ladder on the tutorial scene, every placement one card at most:
 * C beside the window (one square), B on the bed (2 squares, the row of C crosses one off),
 * A in column 2 (3 squares, rows 2 and 3 are gone by then), V is what is left.
 */
export const oneCardLadder = tutorial([
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'A', type: 'inColumn', args: { index: 2 } },
])

/**
 * B needs TWO cards together: "on the bed" leaves 2 squares, "in the bottom row" leaves 3,
 * only both leave (3,1). C ("beside the plant", 2 squares) and A follow with one card each.
 */
export const twoCardIntersection = tutorial([
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'B', type: 'inRow', args: { index: 3 } },
  { personId: 'C', type: 'besideObject', args: { objectType: 'plant' } },
  { personId: 'A', type: 'inColumn', args: { index: 2 } },
])

/**
 * `twoCardIntersection` with B's two cards written as ONE combined card ("on the bed" and "in the bottom row"):
 * B is placed by a single card whose precision is the intersection (1 square).
 */
export const combinedLadder = tutorial([
  {
    personId: 'B',
    type: 'both',
    args: { a: { type: 'onObject', args: { objectType: 'bed' } }, b: { type: 'inRow', args: { index: 3 } } },
  },
  { personId: 'C', type: 'besideObject', args: { objectType: 'plant' } },
  { personId: 'A', type: 'inColumn', args: { index: 2 } },
])

/** B needs "in column 1" plus "in the same room as C": a person reference, so C must be placed first. */
export const referenceLadder = tutorial([
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'B', type: 'inColumn', args: { index: 1 } },
  { personId: 'B', type: 'withPerson', args: { otherId: 'C' } },
  { personId: 'A', type: 'inColumn', args: { index: 2 } },
])

/**
 * The tutorial with genders (A woman, B and C men) and a gender card that is the only way to tell B apart:
 * C is beside the window (r2c3, the bedroom), A is in the living room column 2 (r1c2), and B is "alone with a
 * man" in column 1. Column 1 leaves r0c1 (the living room, with the woman A) and r3c1 (the bedroom, with the
 * man C): only the gender card picks the bedroom. Needs a person reference, so the ladder puts it at medium.
 */
export const genderLadder: Puzzle = {
  ...tutorialPuzzle,
  people: [
    { id: 'V', kind: 'victim', label: 'V' },
    { id: 'A', kind: 'suspect', label: 'A', gender: 'vrouw' },
    { id: 'B', kind: 'suspect', label: 'B', gender: 'man' },
    { id: 'C', kind: 'suspect', label: 'C', gender: 'man' },
  ],
  clues: [
    { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
    { personId: 'A', type: 'inColumn', args: { index: 2 } },
    { personId: 'A', type: 'inRoom', args: { roomId: 'living' } },
    { personId: 'B', type: 'inColumn', args: { index: 1 } },
    { personId: 'B', type: 'aloneWithGender', args: { gender: 'man' } },
  ],
}

/**
 * The gender ladder with B's two cards ("in column 1", "alone with a man") merged into one combined card.
 * One of its parts is a gender card, so the card is person-referencing: medium at the easiest.
 */
export const combinedGenderLadder: Puzzle = {
  ...genderLadder,
  clues: [
    { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
    { personId: 'A', type: 'inColumn', args: { index: 2 } },
    { personId: 'A', type: 'inRoom', args: { roomId: 'living' } },
    {
      personId: 'B',
      type: 'both',
      args: { a: { type: 'inColumn', args: { index: 1 } }, b: { type: 'aloneWithGender', args: { gender: 'man' } } },
    },
  ],
}

/**
 * A 3x3 scene, two rooms (columns 0-1 and column 2), a rug on (0,0) and a car on (1,2):
 * A "on the rug" and B "on the car" are each placeable from their own card alone;
 * the victim takes the last square.
 */
export const soloPuzzle: Puzzle = {
  scene: {
    width: 3,
    height: 3,
    rooms: [
      { id: 'left', name: 'Links' },
      { id: 'right', name: 'Rechts' },
    ],
    cellRooms: [
      ['left', 'left', 'right'],
      ['left', 'left', 'right'],
      ['left', 'left', 'right'],
    ],
    objects: [
      { id: 'rug', type: 'rug', cells: [{ row: 0, col: 0 }] },
      { id: 'car', type: 'car', cells: [{ row: 1, col: 2 }] },
    ],
    edgeFeatures: [],
  },
  people: [
    { id: 'A', kind: 'suspect', label: 'A' },
    { id: 'B', kind: 'suspect', label: 'B' },
    { id: 'V', kind: 'victim', label: 'V' },
  ],
  solution: [
    { personId: 'A', cell: { row: 0, col: 0 } },
    { personId: 'B', cell: { row: 1, col: 2 } },
    { personId: 'V', cell: { row: 2, col: 1 } },
  ],
  clues: [
    { personId: 'A', type: 'onObject', args: { objectType: 'rug' } },
    { personId: 'B', type: 'onObject', args: { objectType: 'car' } },
  ],
}

/**
 * soloPuzzle with B placed by a room-edge card: B stands on the bottom row of the right-hand room, which is
 * one square (r2c2). With A "on the rug" that is two people placeable from their own card alone, so it is very easy.
 */
export const edgeLadder: Puzzle = {
  ...soloPuzzle,
  solution: [
    { personId: 'A', cell: { row: 0, col: 0 } },
    { personId: 'B', cell: { row: 2, col: 2 } },
    { personId: 'V', cell: { row: 1, col: 1 } },
  ],
  clues: [
    { personId: 'A', type: 'onObject', args: { objectType: 'rug' } },
    { personId: 'B', type: 'inRoomEdge', args: { roomId: 'right', edge: 'south' } },
  ],
}

export { tutorialPuzzle }
export const noCards = tutorial([])
