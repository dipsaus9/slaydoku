import type { Scene } from '../../engine/model/index.ts'

/**
 * A 9x9 sample scene (own layout, not an official puzzle) with non-rectangular
 * rooms, outdoor areas, a window and doors. Used by the renderer tests and for
 * eyeballing the style.
 *
 *   G G G G P P P S S        G Tuin (L-shaped)   P Vijver
 *   G G G G P P P S S        S Terras            K Keuken
 *   G G K K K P S S S        W Woonkamer         B Slaapkamer
 *   G G K K K K S S S        H Hal
 *   G H H K K K W W W
 *   G H H H W W W W W
 *   B B H H W W W W W
 *   B B B H H W W W W
 *   B B B B H H W W W
 */
const layout = [
  'GGGGPPPSS',
  'GGGGPPPSS',
  'GGKKKPSSS',
  'GGKKKKSSS',
  'GHHKKKWWW',
  'GHHHWWWWW',
  'BBHHWWWWW',
  'BBBHHWWWW',
  'BBBBHHWWW',
]

export const sample9x9: Scene = {
  width: 9,
  height: 9,
  rooms: [
    { id: 'G', name: 'Tuin' },
    { id: 'P', name: 'Vijver' },
    { id: 'S', name: 'Terras' },
    { id: 'K', name: 'Keuken' },
    { id: 'H', name: 'Hal' },
    { id: 'W', name: 'Grote woonkamer' },
    { id: 'B', name: 'Slaapkamer' },
  ],
  cellRooms: layout.map((line) => [...line]),
  objects: [
    { id: 'tree', type: 'tree', cells: [{ row: 0, col: 0 }] },
    { id: 'lamp', type: 'statue', cells: [{ row: 0, col: 8 }] },
    { id: 'sofa', type: 'sofa', cells: [{ row: 5, col: 6 }, { row: 5, col: 7 }] },
    { id: 'bed', type: 'bed', cells: [{ row: 7, col: 0 }, { row: 8, col: 0 }] },
  ],
  edgeFeatures: [
    { kind: 'door', cell: { row: 4, col: 3 }, side: 'south' },
    { kind: 'window', cell: { row: 6, col: 4 }, side: 'east' },
    { kind: 'window', cell: { row: 8, col: 7 }, side: 'south' },
    { kind: 'door', cell: { row: 2, col: 6 }, side: 'west' },
  ],
}
