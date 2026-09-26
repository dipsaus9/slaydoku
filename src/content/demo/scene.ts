import type { Cell, Scene } from '../../engine/model/index.ts'
import type { FloorPattern } from '../../render/scene/index.ts'

/**
 * The demo house: a made-up 9x9 floor plan with four rooms, used by the demo level and as the
 * stock scene of the generator tools and tests. Coordinates are 0-based { row, col }.
 *
 *   kitchen (rows 0-3, cols 0-4)    hall (rows 0-3, cols 5-8)
 *   bedroom (rows 4-8, cols 0-3)  living room (rows 4-8, cols 4-8)
 *
 * The victim lies on the sofa in the living room. No door joins bedroom and living room, so a
 * room never holds more people than the "alone with the victim" rule can use.
 */
const LAYOUT = [
  'KKKKKHHHH',
  'KKKKKHHHH',
  'KKKKKHHHH',
  'KKKKKHHHH',
  'SSSSWWWWW',
  'SSSSWWWWW',
  'SSSSWWWWW',
  'SSSSWWWWW',
  'SSSSWWWWW',
]

const ROOM_IDS: Record<string, string> = {
  K: 'kitchen',
  H: 'hall',
  S: 'bedroom',
  W: 'living',
}

const at = (row: number, col: number): Cell => ({ row, col })

export const demoScene: Scene = {
  width: 9,
  height: 9,
  rooms: [
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'hall', name: 'Hall' },
    { id: 'bedroom', name: 'Bedroom' },
    { id: 'living', name: 'Living Room' },
  ],
  cellRooms: LAYOUT.map((line) => [...line].map((ch) => ROOM_IDS[ch] ?? ch)),
  objects: [
    // Kitchen: counter along the top wall, dining table with two chairs, plant in the corner.
    { id: 'counter', type: 'kitchenCounter', cells: [at(0, 1), at(0, 2)] },
    { id: 'diningTable', type: 'diningTable', cells: [at(2, 2), at(2, 3)] },
    { id: 'chair-kitchen-a', type: 'chair', cells: [at(1, 2)] },
    { id: 'chair-kitchen-b', type: 'chair', cells: [at(3, 3)] },
    { id: 'plant-kitchen', type: 'plant', cells: [at(3, 0)] },
    // Hall: a cabinet and a plant.
    { id: 'cabinet', type: 'cabinet', cells: [at(0, 7), at(0, 8)] },
    { id: 'plant-hall', type: 'plant', cells: [at(3, 8)] },
    // Bedroom: single bed (occupiable), wardrobe against the bottom wall, plant.
    { id: 'bed', type: 'bed', cells: [at(5, 0), at(6, 0)] },
    { id: 'wardrobe', type: 'wardrobe', cells: [at(8, 1), at(8, 2)] },
    { id: 'plant-bedroom', type: 'plant', cells: [at(4, 3)] },
    // Living room: three-cell sofa (occupiable), tv, coffee table and a plant.
    { id: 'sofa', type: 'sofa', cells: [at(8, 5), at(8, 6), at(8, 7)] },
    { id: 'tv', type: 'tv', cells: [at(4, 6)] },
    { id: 'coffeeTable', type: 'table', cells: [at(6, 6)] },
    { id: 'plant-living', type: 'plant', cells: [at(4, 8)] },
  ],
  edgeFeatures: [
    // Kitchen to hall, hall to living room, kitchen to bedroom.
    { kind: 'door', cell: at(2, 4), side: 'east' },
    { kind: 'door', cell: at(3, 6), side: 'south' },
    { kind: 'door', cell: at(3, 1), side: 'south' },
    // A window in the west wall of the bedroom and one in the east wall of the living room.
    { kind: 'window', cell: at(7, 0), side: 'west' },
    { kind: 'window', cell: at(6, 8), side: 'east' },
  ],
}

/** The cells the victim may lie on: the three sofa cells. */
export const DEMO_VICTIM_CELLS: readonly Cell[] = demoScene.objects.find((o) => o.id === 'sofa')?.cells ?? []

/** Floor look per room. */
export const demoRoomStyles: Record<string, FloorPattern> = {
  kitchen: 'tiles',
  hall: 'stone',
  bedroom: 'carpet',
  living: 'wood',
}
