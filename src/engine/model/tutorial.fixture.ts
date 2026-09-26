import type { Puzzle } from './types.ts'

/**
 * The public tutorial puzzle from the murdokus.nl rules explanation, own
 * transcription (4x4, three suspects plus the victim). Only the layout and
 * the solution: no art, no clue text.
 *
 * Solution, 1-based as on the site: V r1c1, A r2c3, C r3c4, B r4c2; A is the
 * murderer (alone with V in the Living Room).
 *
 *   r1  V   .   table  .          Living Room
 *   r2  tv  .   A      .          Living Room
 *   r3  .   bed .      C | window Large Bedroom
 *   r4  .   bed .      plant      Large Bedroom
 *
 * The bed covers r3c2 and r4c2; B stands on its lower cell.
 */
export const tutorialPuzzle: Puzzle = {
  scene: {
    width: 4,
    height: 4,
    rooms: [
      { id: 'living', name: 'Living Room' },
      { id: 'bedroom', name: 'Large Bedroom' },
    ],
    cellRooms: [
      ['living', 'living', 'living', 'living'],
      ['living', 'living', 'living', 'living'],
      ['bedroom', 'bedroom', 'bedroom', 'bedroom'],
      ['bedroom', 'bedroom', 'bedroom', 'bedroom'],
    ],
    objects: [
      { id: 'table', type: 'table', cells: [{ row: 0, col: 2 }] },
      { id: 'tv', type: 'tv', cells: [{ row: 1, col: 0 }] },
      {
        id: 'bed',
        type: 'bed',
        cells: [
          { row: 2, col: 1 },
          { row: 3, col: 1 },
        ],
      },
      { id: 'plant', type: 'plant', cells: [{ row: 3, col: 3 }] },
    ],
    edgeFeatures: [{ kind: 'window', cell: { row: 2, col: 3 }, side: 'east' }],
  },
  people: [
    { id: 'V', kind: 'victim', label: 'V' },
    { id: 'A', kind: 'suspect', label: 'A' },
    { id: 'B', kind: 'suspect', label: 'B' },
    { id: 'C', kind: 'suspect', label: 'C' },
  ],
  solution: [
    { personId: 'V', cell: { row: 0, col: 0 } },
    { personId: 'A', cell: { row: 1, col: 2 } },
    { personId: 'C', cell: { row: 2, col: 3 } },
    { personId: 'B', cell: { row: 3, col: 1 } },
  ],
  clues: [],
}
