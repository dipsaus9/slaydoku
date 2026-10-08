import { CARNAVAL_THEME } from './carnaval.ts'
import { CHRISTMAS_THEME } from './christmas.ts'
import { FALL_THEME } from './fall.ts'
import { HALLOWEEN_THEME } from './halloween.ts'
import { HOME_THEME } from './home.ts'
import { OFFICE_THEME } from './office.ts'
import { PARK_THEME } from './park.ts'
import { SCHOOL_THEME } from './school.ts'
import { SIMPSHOUSE_THEME } from './simpshouse.ts'
import { SHOP_THEME } from './shop.ts'
import type { FloorPattern } from '../../render/scene/roomStyles.ts'
import type { SceneTheme, ThemeId } from './types.ts'

/** The seasonal modules that already export a theme (SLAY-18.11); a stub (`undefined`) adds nothing. */
function registered(...themes: (SceneTheme | undefined)[]): SceneTheme[] {
  return themes.filter((t): t is SceneTheme => t !== undefined)
}

/** All scene themes for the random scene generator, in a stable order. */
export const SCENE_THEMES: readonly SceneTheme[] = [
  HOME_THEME,
  OFFICE_THEME,
  PARK_THEME,
  SCHOOL_THEME,
  SHOP_THEME,
  SIMPSHOUSE_THEME,
  ...registered(FALL_THEME, CARNAVAL_THEME, CHRISTMAS_THEME, HALLOWEEN_THEME),
]

const BY_ID: ReadonlyMap<ThemeId, SceneTheme> = new Map(SCENE_THEMES.map((t) => [t.id, t]))

export function getTheme(id: ThemeId): SceneTheme {
  const theme = BY_ID.get(id)
  if (!theme) throw new Error(`unknown scene theme "${id}"`)
  return theme
}

/**
 * Every theme's room names to their real Dutch noun (SLAY-5.2). A generated `Scene` carries no
 * `themeId` (it would change the committed, byte-identical schedule data to add one), so Dutch
 * room text is resolved by the room's stored English `name` alone. That is safe because a name
 * reused by more than one theme ("Staff Room", "Playground") is required to carry the same Dutch
 * noun everywhere it is used (enforced by `themes.test.ts`) — one lookup by name is never
 * ambiguous.
 */
const ROOM_NAMES_NL: ReadonlyMap<string, string> = new Map(SCENE_THEMES.flatMap((t) => t.rooms.map((r) => [r.name, r.nameNl] as const)))

/** Room names to the floor their theme gives them (`ThemeRoom.floor`), so a theme never edits the name hints of roomStyles.ts. */
const ROOM_FLOORS: ReadonlyMap<string, FloorPattern> = new Map(
  SCENE_THEMES.flatMap((t) => t.rooms.flatMap((r) => (r.floor ? [[r.name, r.floor] as const] : []))),
)

/** The floor a theme gave a room name, if any (SLAY-18.11); consulted before the name hints. */
export function roomFloorOf(name: string): FloorPattern | undefined {
  return ROOM_FLOORS.get(name)
}

/** The real Dutch noun for a room's stored English `name`, if any theme defines one. */
export function roomNameNlOf(name: string): string | undefined {
  return ROOM_NAMES_NL.get(name)
}

export { CARNAVAL_THEME, CHRISTMAS_THEME, FALL_THEME, HALLOWEEN_THEME, HOME_THEME, OFFICE_THEME, PARK_THEME, SCHOOL_THEME, SHOP_THEME, SIMPSHOUSE_THEME }
export { lShape, rect, themeObject } from './define.ts'
export type {
  PlacementHint,
  RoomType,
  SceneTheme,
  ThemeFootprint,
  ThemeId,
  ThemeObject,
  ThemeRoom,
} from './types.ts'
