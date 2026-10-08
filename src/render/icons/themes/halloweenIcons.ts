import { defineThemeIcons, type IconIdOf } from './define.ts'

/**
 * The own drawings of the Halloween theme (SLAY-18.9): a stub until the theme is built. Register each block model of `halloweenArt.tsx` here as
 * `{ sizes: [[cols, rows], ...], model: (c, r) => draw(c, r) }`; the shared registries pick the set up by themselves (see define.ts). The
 * draft is in docs/themes/seasonal/halloween.theme.ts, the recipe in docs/authoring/add-theme.md.
 */
export const HALLOWEEN_ICONS = defineThemeIcons({})

export type HalloweenIconId = IconIdOf<typeof HALLOWEEN_ICONS>
