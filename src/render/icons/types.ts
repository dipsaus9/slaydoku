import { OBJECT_CATALOG, OBJECT_TYPES, isOccupiableType } from '../../engine/model/index.ts'
import type { ObjectType } from '../../engine/model/index.ts'

/**
 * Every object kind has an icon, so the icon type is the engine's object type
 * (the engine catalog owns the type list and the occupiable/blocking flag).
 */
export type IconObjectType = ObjectType

/**
 * Occupiable vs blocking lives only in the engine catalog: the art itself
 * never encodes it (legends and the sheet group by this flag).
 */
export function isOccupiableIconType(type: IconObjectType): boolean {
  return isOccupiableType(type)
}

/** Object types split by the catalog flag, in catalog order. */
export function iconLegendGroups(): { occupiable: IconObjectType[]; blocking: IconObjectType[] } {
  return {
    occupiable: OBJECT_TYPES.filter((t) => OBJECT_CATALOG[t].occupiable),
    blocking: OBJECT_TYPES.filter((t) => !OBJECT_CATALOG[t].occupiable),
  }
}
