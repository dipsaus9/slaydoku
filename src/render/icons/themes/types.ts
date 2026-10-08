/**
 * Ids of the icons drawn only for theme objects (the rest of a theme's
 * objects reuse the engine catalog icons through their `engineType`).
 */
export const THEME_ICON_IDS = [
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
] as const

export type ThemeIconId = (typeof THEME_ICON_IDS)[number]
