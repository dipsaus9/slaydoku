import type { ObjectType } from '../model/index.ts'

/**
 * Object families (SLAY-22): what a board's mix is measured in. A board should look like a real place, so no family (and no single kind)
 * may dominate it, and every theme has a target share per family (`src/engine/scenegen/mix.ts`). Families are by engine type, the same in
 * every theme.
 */
export type ObjectFamily = 'seating' | 'tables' | 'storage' | 'beds' | 'lighting' | 'greenery' | 'rugs' | 'fixtures' | 'vehicles' | 'decor' | 'activity'

export const OBJECT_FAMILIES: readonly ObjectFamily[] = ['seating', 'tables', 'storage', 'beds', 'lighting', 'greenery', 'rugs', 'fixtures', 'vehicles', 'decor', 'activity']

export const FAMILY_OF: Record<ObjectType, ObjectFamily> = {
  chair: 'seating', sofa: 'seating', bench: 'seating',
  table: 'tables', diningTable: 'tables', gardenTable: 'tables', desk: 'tables', kitchenCounter: 'tables',
  bookshelf: 'storage', chest: 'storage', cabinet: 'storage', wardrobe: 'storage', coatRack: 'storage',
  bed: 'beds',
  lamp: 'lighting',
  plant: 'greenery', tree: 'greenery', flowers: 'greenery',
  rug: 'rugs',
  washingMachine: 'fixtures', dryer: 'fixtures', toilet: 'fixtures', sink: 'fixtures', shower: 'fixtures', bathtub: 'fixtures', fridge: 'fixtures',
  tv: 'fixtures', fireplace: 'fixtures', serverRack: 'fixtures', waterCooler: 'fixtures', kiosk: 'fixtures', stairs: 'fixtures',
  car: 'vehicles', bicycle: 'vehicles', shoppingCart: 'vehicles',
  framedPainting: 'decor', easel: 'decor', statue: 'decor', mirror: 'decor', piano: 'decor', aquarium: 'decor', globe: 'decor', bin: 'decor', oilSlick: 'decor',
  exerciseBike: 'activity', gymBox: 'activity', playEquipment: 'activity', barbecue: 'activity', tent: 'activity',
}
