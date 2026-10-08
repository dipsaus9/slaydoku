import { defineThemeIcons, type IconIdOf } from './define.ts'

/**
 * The own drawings of the Carnaval theme (SLAY-18.7): a stub until the theme is built. Register each block model of `carnavalArt.tsx` here as
 * `{ sizes: [[cols, rows], ...], model: (c, r) => draw(c, r) }`; the shared registries pick the set up by themselves (see define.ts). The
 * draft is in docs/themes/seasonal/carnaval.theme.ts, the recipe in docs/authoring/add-theme.md.
 */
export const CARNAVAL_ICONS = defineThemeIcons({})

export type CarnavalIconId = IconIdOf<typeof CARNAVAL_ICONS>
