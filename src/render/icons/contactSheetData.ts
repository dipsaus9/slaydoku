import { solidFor } from '../looks/solid.ts'
import type { Solid } from '../looks/solid.ts'
import { orientCells } from './orientation.ts'
import type { Orientation } from './orientation.ts'
import type { IconVariant } from './registry.tsx'
import type { ThemeIconId } from './themes/types.ts'
import type { IconObjectType } from './types.ts'

/** Pixels per cell on the sheet: the board draws 64 per cell at full width. */
export const BOARD_CELL = 64
/** Pixels per cell of a phone (a 9x9 board on a 360 wide screen). */
export const PHONE_CELL = 36

/** The solid of one footprint in one of the 8 orientations. */
export function orientedSolid(type: IconObjectType, themeIcon: ThemeIconId | undefined, variant: IconVariant, o: Orientation): Solid | null {
  const cells = orientCells(variant.cells, variant.cols, variant.rows, o)
  return solidFor(type, themeIcon, cells, o)
}

/**
 * Pairs and triples that must not be mistaken for each other at phone size (36 px per cell): each row is drawn in its plainest facing. Found in
 * the audit of SLAY-17.4 and listed in docs/design/looks.md.
 */
export const CONFUSABLE_GROUPS: readonly { title: string; items: readonly { type: IconObjectType; themeIcon?: ThemeIconId; variant: string }[] }[] = [
  { title: 'Rug, table and bookshelf', items: [{ type: 'rug', variant: '2x1' }, { type: 'table', variant: '2x1' }, { type: 'bookshelf', variant: '2x1' }] },
  { title: 'Tables: table, dining table, garden table, desk', items: [{ type: 'table', variant: '2x1' }, { type: 'diningTable', variant: '2x1' }, { type: 'gardenTable', variant: '2x1' }, { type: 'desk', variant: '2x1' }] },
  { title: 'Cupboards and counters: cabinet, wardrobe, desk, kitchen counter, bookshelf', items: [{ type: 'cabinet', variant: '2x1' }, { type: 'wardrobe', variant: '2x1' }, { type: 'desk', variant: '2x1' }, { type: 'kitchenCounter', variant: '2x1' }, { type: 'bookshelf', variant: '2x1' }] },
  { title: 'Storage: cabinet, wardrobe, chest', items: [{ type: 'cabinet', variant: '2x1' }, { type: 'wardrobe', variant: '2x1' }, { type: 'chest', variant: '1x1' }] },
  { title: 'Laundry: washing machine and dryer', items: [{ type: 'washingMachine', variant: '1x1' }, { type: 'dryer', variant: '1x1' }] },
  { title: 'Bathroom: toilet, sink, shower', items: [{ type: 'toilet', variant: '1x1' }, { type: 'sink', variant: '1x1' }, { type: 'shower', variant: '1x1' }] },
  { title: 'Seats: chair, sofa, bench', items: [{ type: 'chair', variant: '1x1' }, { type: 'sofa', variant: '2x1' }, { type: 'bench', variant: '2x1' }] },
  { title: 'Lying flat: rug, oil slick, framed painting, flowers', items: [{ type: 'rug', variant: '1x1' }, { type: 'oilSlick', variant: '1x1' }, { type: 'framedPainting', variant: '1x1' }, { type: 'flowers', variant: '1x1' }] },
  { title: 'Greenery: plant, tree, flowers', items: [{ type: 'plant', variant: '1x1' }, { type: 'tree', variant: '1x1' }, { type: 'flowers', variant: '1x1' }] },
  { title: 'Upright faces: tv, mirror, kiosk, easel, statue', items: [{ type: 'tv', variant: '1x1' }, { type: 'mirror', variant: '1x1' }, { type: 'kiosk', variant: '1x1' }, { type: 'easel', variant: '1x1' }, { type: 'statue', variant: '1x1' }] },
  // Decor objects (SLAY-19.1).
  { title: 'White boxes: fridge, washing machine, dryer, cabinet, water cooler', items: [{ type: 'fridge', variant: '1x1' }, { type: 'washingMachine', variant: '1x1' }, { type: 'dryer', variant: '1x1' }, { type: 'cabinet', variant: '1x1' }, { type: 'waterCooler', variant: '1x1' }] },
  { title: 'On a post: lamp, plant, globe, bin, coat rack', items: [{ type: 'lamp', variant: '1x1' }, { type: 'plant', variant: '1x1' }, { type: 'globe', variant: '1x1' }, { type: 'bin', variant: '1x1' }, { type: 'coatRack', variant: '1x1' }] },
  { title: 'Dark cabinets: server rack, wardrobe, piano, bookshelf', items: [{ type: 'serverRack', variant: '2x1' }, { type: 'wardrobe', variant: '2x1' }, { type: 'piano', variant: '2x1' }, { type: 'bookshelf', variant: '2x1' }] },
  { title: 'Water: bathtub, aquarium, sink, fireplace', items: [{ type: 'bathtub', variant: '2x1' }, { type: 'aquarium', variant: '2x1' }, { type: 'sink', variant: '2x1' }, { type: 'fireplace', variant: '2x1' }] },
  { title: 'Outdoors: tent, tree, barbecue, slide, bench', items: [{ type: 'tent', variant: '2x2' }, { type: 'tree', variant: '1x1' }, { type: 'barbecue', variant: '1x1' }, { type: 'playEquipment', variant: '2x1' }, { type: 'bench', variant: '2x1' }] },
  { title: 'Small boxes: shopping cart, chest, vaulting box, bin', items: [{ type: 'shoppingCart', variant: '1x1' }, { type: 'chest', variant: '1x1' }, { type: 'gymBox', variant: '1x1' }, { type: 'bin', variant: '1x1' }] },
  { title: 'Two-wheelers: exercise bike, bicycle', items: [{ type: 'exerciseBike', variant: '1x2' }, { type: 'bicycle', variant: '2x1' }] },
]

