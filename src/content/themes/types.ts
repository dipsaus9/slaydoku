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
  /** Display name, for legends and clue text. */
  name: string
  engineType: ObjectType
  /** Copied from the engine catalog for `engineType`; a person can stand on it. */
  occupiable: boolean
  /** Relative chance among the theme's objects of the same class (> 0). */
  weight: number
  footprints: ThemeFootprint[]
  placement: PlacementHint
  /** Singular noun for clue text when `name` is a plural ("lockers" reads "a locker"). Absent: `name`. */
  clueNoun?: string
  /** Own theme art. Absent: the engine catalog icon of `engineType` is used. */
  themeIcon?: ThemeIconId
  /** Cap per room, so a house does not get five televisions. Absent: unlimited. */
  maxPerRoom?: number
  /**
   * Allow-list (SLAY-17.1, required since SLAY-17.2): the room types (see `RoomType`) this object may be
   * placed in, a hard rule the generator never breaks. A room qualifies when it has at least one of them.
   */
  allowedRoomTypes: RoomType[]
  /** Room types this object must never be placed in, hard exclusion. Older than the allow-list; both apply. */
  excludeRoomTypes?: RoomType[]
}

/** A room name (bare, without "the"), with the objects that belong in such a room. */
export interface ThemeRoom {
  name: string
  /** The real Dutch noun for this room (SLAY-5.2), e.g. "Keuken" for "Kitchen": no article, no "de"/"het" — `roomNameNl` (engine/clues/nl.ts) wraps it with the Dutch article. */
  nameNl: string
  /** Object kinds of this theme that fit this room; the generator boosts them. */
  favours: string[]
  /** Outdoor area (garden, playground): drawn without an interior floor. */
  outdoor?: boolean
  /** Room types (see `RoomType`) this room belongs to, for hard placement exclusions. */
  roomTypes?: RoomType[]
}

/**
 * A room category for hard placement rules (see `ThemeObject.allowedRoomTypes`,
 * `ThemeObject.excludeRoomTypes` and `ThemeRoom.roomTypes`) — unlike `favours`, a preference
 * the generator only weighs, a room type is a rule it never breaks (owner: "a delivery van can
 * never be in a sleeping room"). `'sleeping'` marks a room with a bed-like object (a real
 * bedroom, a showroom bedroom, a sick bay bed, a garden hammock nook): no vehicle belongs there.
 * The other types are the shared vocabulary of all five themes (docs/authoring/room-rules.md).
 */
export type RoomType =
  | 'sleeping'
  | 'wet'
  | 'utility'
  | 'garage'
  | 'kitchen'
  | 'living'
  | 'dining'
  | 'study'
  | 'fitness'
  | 'storage'
  | 'circulation'
  | 'meeting'
  | 'garden'
  | 'play'
  | 'water'
  | 'retail'
  | 'fitting'
  | 'checkout'
  | 'party'
  | 'outdoor'

/** The five rotation themes plus the seasonal ones (SLAY-18), which stay out of the rotation and are picked by the calendar (src/schedule/calendar.ts). */
export type ThemeId = 'home' | 'office' | 'park' | 'school' | 'shop' | 'simpshouse' | 'carnaval' | 'christmas' | 'halloween' | 'fall'

export interface SceneTheme {
  id: ThemeId
  /** Seasonal themes are chosen by the calendar and are not part of the five-theme rotation (SLAY-18.1). Absent: a rotation theme. */
  seasonal?: boolean
  name: string
  /** The real Dutch counterpart of `name` (SLAY-5.2), e.g. "Kantoor" for "Office". */
  nameNl: string
  /** Pool the generator draws room names from (no repeats within one scene). */
  rooms: ThemeRoom[]
  objects: ThemeObject[]
}
