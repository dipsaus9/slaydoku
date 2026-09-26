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
