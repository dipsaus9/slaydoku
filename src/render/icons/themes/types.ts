import type { IconIdOf } from './define.ts'
import type { CARNAVAL_ICONS } from './carnavalIcons.ts'
import type { CHRISTMAS_ICONS } from './christmasIcons.ts'
import type { FALL_ICONS } from './fallIcons.ts'
import type { HALLOWEEN_ICONS } from './halloweenIcons.ts'
import { SEASONAL_ICON_SETS } from './sets.ts'

/**
 * Ids of the icons drawn only for theme objects (the rest of a theme's
 * objects reuse the engine catalog icons through their `engineType`).
 */
export const CORE_THEME_ICON_IDS = [
  'picnicBlanket',
  'hammock',
  'sandbox',
  'gymMat',
  'fountain',
  'blackboard',
  'printer',
  'vendingMachine',
  'clothesRack',
  'mannequin',
  'checkoutCounter',
  'cardBinderShelf',
  'cardTable',
  'vanity',
  'discoBall',
  'karaokeStage',
  'arcadeCabinet',
  'bubbleBath',
  'rabbitHutch',
  'redCarpet',
  'champagneTower',
  'goldMirror',
  'shoeWall',
  'photoWall',
  'djBooth',
  'danceFloor',
  'confettiCannon',
  'balloons',
  'snackTable',
  'cocktailBar',
  'photoBooth',
  'lavaLamp',
  'salmariBar',
  'cardDisplayCase',
  'readingNook',
  'yellowPlush',
] as const

export type CoreThemeIconId = (typeof CORE_THEME_ICON_IDS)[number]

/** The ids of the seasonal sets (SLAY-18.11): the union grows with each `<id>Icons.ts`, no edit here. */
export type SeasonalThemeIconId =
  | IconIdOf<typeof FALL_ICONS>
  | IconIdOf<typeof CARNAVAL_ICONS>
  | IconIdOf<typeof CHRISTMAS_ICONS>
  | IconIdOf<typeof HALLOWEEN_ICONS>

export type ThemeIconId = CoreThemeIconId | SeasonalThemeIconId

/** Every theme icon id: the core ids plus the ids of every seasonal set. */
export const THEME_ICON_IDS: readonly ThemeIconId[] = [...CORE_THEME_ICON_IDS, ...SEASONAL_ICON_SETS.flatMap((s) => s.ids)] as ThemeIconId[]
