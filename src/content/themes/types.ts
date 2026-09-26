import type { Cell, ObjectType } from '../../engine/model/index.ts'
import type { ThemeIconId } from '../../render/icons/themes/types.ts'

/** Where in a room the random scene generator (CAD-4.21) should try to put an object. */
export type PlacementHint =
  /** Touching a room wall (or the outer border): desks, shelves, tv, counters. */
  | 'wall'
  /** In a room corner: plants, corner sofas, showers. */
  | 'corner'
  /** Away from the walls, in the middle of the room: tables, rugs, fountains. */
  | 'centre'
  /** No preference: chairs, trees. */
  | 'anywhere'

/**
 * One shape an object may take, in canonical orientation and relative to its
 * own top-left. The generator may rotate and mirror it. Every footprint must
 * be drawable: the object's icon has to resolve for it.
 */
export interface ThemeFootprint {
  /** Human-readable, e.g. "2x1" or "L3". */
  id: string
  cells: Cell[]
  /** Relative chance among this object's footprints (> 0). */
  weight: number
}

/**
 * A thing that can stand in a themed scene. `kind` is theme-local (a park
 * `hammock` and a home `bed` are different kinds), `engineType` is the engine
 * catalog type it becomes in a Scene, and with it the occupiable/blocking
 * classification. Several kinds may map onto one engine type.
 */
export interface ThemeObject {
  kind: string
  /** Dutch display name, for legends and clue text. */
  nameNl: string
  engineType: ObjectType
  /** Copied from the engine catalog for `engineType`; a person can stand on it. */
  occupiable: boolean
  /** Relative chance among the theme's objects of the same class (> 0). */
  weight: number
  footprints: ThemeFootprint[]
  placement: PlacementHint
  /** Singular noun for clue text when `nameNl` is a plural ("kluisjes" reads "een kluisje"). Absent: `nameNl`. */
  clueNoun?: string
  /** Own theme art. Absent: the engine catalog icon of `engineType` is used. */
  themeIcon?: ThemeIconId
  /** Cap per room, so a house does not get five televisions. Absent: unlimited. */
  maxPerRoom?: number
}

/** A Dutch room name, with the objects that belong in such a room. */
export interface ThemeRoom {
  name: string
  /** Object kinds of this theme that fit this room; the generator boosts them. */
  favours: string[]
  /** Outdoor area (garden, playground): drawn without an interior floor. */
  outdoor?: boolean
}

export type ThemeId = 'home' | 'office' | 'park' | 'school' | 'shop'

export interface SceneTheme {
  id: ThemeId
  nameNl: string
  /** Pool the generator draws room names from (no repeats within one scene). */
  rooms: ThemeRoom[]
  objects: ThemeObject[]
}
