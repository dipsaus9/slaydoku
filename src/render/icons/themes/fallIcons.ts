import { defineThemeIcons, type IconIdOf } from './define.ts'

/**
 * The own drawings of the Fall theme (SLAY-18.6): a stub until the theme is built. Register each block model of `fallArt.tsx` here as
 * `{ sizes: [[cols, rows], ...], model: (c, r) => draw(c, r) }`; the shared registries pick the set up by themselves (see define.ts). The
 * draft is in docs/themes/seasonal/fall.theme.ts, the recipe in docs/authoring/add-theme.md.
 */
export const FALL_ICONS = defineThemeIcons({})

export type FallIconId = IconIdOf<typeof FALL_ICONS>
