import { HOME_THEME } from './home.ts'
import { OFFICE_THEME } from './office.ts'
import { PARK_THEME } from './park.ts'
import { SCHOOL_THEME } from './school.ts'
import { SHOP_THEME } from './shop.ts'
import type { SceneTheme, ThemeId } from './types.ts'

/** All scene themes for the random scene generator, in a stable order. */
export const SCENE_THEMES: readonly SceneTheme[] = [
  HOME_THEME,
  OFFICE_THEME,
  PARK_THEME,
  SCHOOL_THEME,
  SHOP_THEME,
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

/** The real Dutch noun for a room's stored English `name`, if any theme defines one. */
export function roomNameNlOf(name: string): string | undefined {
  return ROOM_NAMES_NL.get(name)
}

export { HOME_THEME, OFFICE_THEME, PARK_THEME, SCHOOL_THEME, SHOP_THEME }
export { lShape, rect, themeObject } from './define.ts'
export type {
  PlacementHint,
  SceneTheme,
  ThemeFootprint,
  ThemeId,
  ThemeObject,
  ThemeRoom,
} from './types.ts'
