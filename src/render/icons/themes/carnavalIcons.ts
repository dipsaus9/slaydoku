import { barCounter, beerBarrel, beerCrate, confettiPile, drum, floatCart, frog } from './carnavalArt.ts'
import { defineThemeIcons, type IconIdOf } from './define.ts'

/**
 * The own drawings of the Carnaval theme (SLAY-18.7), Oeteldonk style. Each block model of `carnavalArt.ts` with the footprints it is drawn
 * at; the shared registries pick the set up by themselves (see define.ts). The theme is src/content/themes/carnaval.ts.
 */
export const CARNAVAL_ICONS = defineThemeIcons({
  frog: { sizes: [[1, 1]], model: () => frog() },
  beerBarrel: { sizes: [[1, 1]], model: () => beerBarrel() },
  drum: { sizes: [[1, 1]], model: () => drum() },
  confettiPile: { sizes: [[1, 1], [2, 1], [2, 2]], model: (c, r) => confettiPile(c, r) },
  floatCart: { sizes: [[1, 2]], model: () => floatCart() },
  beerCrate: { sizes: [[1, 1]], model: () => beerCrate() },
  barCounter: { sizes: [[2, 1], [3, 1]], model: (c) => barCounter(c) },
})

export type CarnavalIconId = IconIdOf<typeof CARNAVAL_ICONS>
