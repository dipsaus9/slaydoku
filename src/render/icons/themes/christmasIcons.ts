import { defineThemeIcons, type IconIdOf } from './define.ts'

/**
 * The own drawings of the Christmas theme (SLAY-18.8): a stub until the theme is built. Register each block model of `christmasArt.tsx` here as
 * `{ sizes: [[cols, rows], ...], model: (c, r) => draw(c, r) }`; the shared registries pick the set up by themselves (see define.ts). The
 * draft is in docs/themes/seasonal/christmas.theme.ts, the recipe in docs/authoring/add-theme.md.
 */
export const CHRISTMAS_ICONS = defineThemeIcons({})

export type ChristmasIconId = IconIdOf<typeof CHRISTMAS_ICONS>
