import type { Gender, ObjectType } from './types.ts'

/**
 * Object catalog. `occupiable` objects may hold a person (the person stands
 * on one of the object's cells); blocking objects never can, yet still count
 * for clues such as "beside a tree". Plain floor is always occupiable.
 * Source: official legend "Can be occupied" / "Cannot be occupied".
 */
export interface ObjectCatalogEntry {
  occupiable: boolean
  /**
   * How many grid cells one object of this type may cover, orientation
   * aside. Informational (generators and icon art follow it); the schema does
   * not enforce it. Absent on the original 16 types, which stay unconstrained.
   */
  footprint?: { minCells: number; maxCells: number }
}

const cells = (minCells: number, maxCells: number = minCells) => ({ minCells, maxCells })

export const OBJECT_CATALOG: Record<ObjectType, ObjectCatalogEntry> = {
  chair: { occupiable: true },
  rug: { occupiable: true },
  bed: { occupiable: true },
  sofa: { occupiable: true },
  car: { occupiable: true },
  oilSlick: { occupiable: true },
  framedPainting: { occupiable: true },
  table: { occupiable: false },
  tv: { occupiable: false },
  plant: { occupiable: false },
  bookshelf: { occupiable: false },
  chest: { occupiable: false },
  tree: { occupiable: false },
  flowers: { occupiable: false },
  easel: { occupiable: false },
  statue: { occupiable: false },
  // House objects (CAD-4.28). All blocking: furniture and fixtures a person
  // cannot stand on, like table, tv, plant, bookshelf and chest above.
  washingMachine: { occupiable: false, footprint: cells(1) },
  dryer: { occupiable: false, footprint: cells(1) },
  cabinet: { occupiable: false, footprint: cells(1, 3) },
  stairs: { occupiable: false, footprint: cells(2, 8) },
  toilet: { occupiable: false, footprint: cells(1) },
  sink: { occupiable: false, footprint: cells(1, 2) },
  shower: { occupiable: false, footprint: cells(1, 4) },
  desk: { occupiable: false, footprint: cells(2, 3) },
  wardrobe: { occupiable: false, footprint: cells(1, 4) },
  diningTable: { occupiable: false, footprint: cells(2, 4) },
  kitchenCounter: { occupiable: false, footprint: cells(1, 3) },
  bicycle: { occupiable: false, footprint: cells(2) },
  gardenTable: { occupiable: false, footprint: cells(1, 4) },
  bench: { occupiable: false, footprint: cells(2, 3) },
}

export const OBJECT_TYPES = Object.keys(OBJECT_CATALOG) as ObjectType[]

export function isObjectType(value: unknown): value is ObjectType {
  return typeof value === 'string' && Object.hasOwn(OBJECT_CATALOG, value)
}

export function isOccupiableType(type: ObjectType): boolean {
  return OBJECT_CATALOG[type].occupiable
}

export const GENDERS: readonly Gender[] = ['vrouw', 'man']

export function isGender(value: unknown): value is Gender {
  return typeof value === 'string' && (GENDERS as readonly string[]).includes(value)
}
