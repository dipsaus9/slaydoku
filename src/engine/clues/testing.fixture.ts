import type { Person, Placement, Scene } from '../model/index.ts'

const ROOM_OF: Record<string, string> = { K: 'kitchen', L: 'living', B: 'bedroom', S: 'study' }

/**
 * Test scene: 6x6, four 3x3 rooms (row 0 on top, 0-based cells).
 *
 * Rooms: kitchen r0-2/c0-2, living r0-2/c3-5, bedroom r3-5/c0-2, study r3-5/c3-5.
 * Objects: chair (0,1), table (1,1), framed painting (2,0), bookshelves (0,3) and
 * (1,4), car (2,4), 2-cell bed (3,0)+(4,0), rug (4,4), oil slick (5,3), chair (5,5).
 * Window on the wall between (1,2) and (1,3); door on the wall between (2,1) and
 * (3,1); window on the outer edge below (5,5).
 */
export const scene: Scene = {
  width: 6,
  height: 6,
  rooms: [
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'living', name: 'Living Room' },
    { id: 'bedroom', name: 'Bedroom' },
    { id: 'study', name: 'Study' },
  ],
  cellRooms: ['KKKLLL', 'KKKLLL', 'KKKLLL', 'BBBSSS', 'BBBSSS', 'BBBSSS'].map((row) =>
    [...row].map((ch) => ROOM_OF[ch] as string),
  ),
  objects: [
    { id: 'chair1', type: 'chair', cells: [{ row: 0, col: 1 }] },
    { id: 'table', type: 'table', cells: [{ row: 1, col: 1 }] },
    { id: 'painting', type: 'framedPainting', cells: [{ row: 2, col: 0 }] },
    { id: 'shelf1', type: 'bookshelf', cells: [{ row: 0, col: 3 }] },
    { id: 'shelf2', type: 'bookshelf', cells: [{ row: 1, col: 4 }] },
    { id: 'car', type: 'car', cells: [{ row: 2, col: 4 }] },
    {
      id: 'bed',
      type: 'bed',
      cells: [
        { row: 3, col: 0 },
        { row: 4, col: 0 },
      ],
    },
    { id: 'rug', type: 'rug', cells: [{ row: 4, col: 4 }] },
    { id: 'oil', type: 'oilSlick', cells: [{ row: 5, col: 3 }] },
    { id: 'chair2', type: 'chair', cells: [{ row: 5, col: 5 }] },
  ],
  edgeFeatures: [
    { kind: 'window', cell: { row: 1, col: 2 }, side: 'east' },
    { kind: 'door', cell: { row: 2, col: 1 }, side: 'south' },
    { kind: 'window', cell: { row: 5, col: 5 }, side: 'south' },
  ],
}

/** A and C are men, B is a woman; the victim has no gender. */
export const people: Person[] = [
  { id: 'A', kind: 'suspect', label: 'A', gender: 'man' },
  { id: 'B', kind: 'suspect', label: 'B', gender: 'woman' },
  { id: 'C', kind: 'suspect', label: 'C', gender: 'man' },
  { id: 'V', kind: 'victim', label: 'V' },
]

/** `stand('A', 0, 1, 'B', 3, 4)`: placements from repeated (id, row, col). */
export function stand(...args: (string | number)[]): Placement[] {
  const placements: Placement[] = []
  for (let i = 0; i < args.length; i += 3) {
    placements.push({
      personId: args[i] as string,
      cell: { row: args[i + 1] as number, col: args[i + 2] as number },
    })
  }
  return placements
}
