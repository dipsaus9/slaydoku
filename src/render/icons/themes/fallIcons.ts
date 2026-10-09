import { defineThemeIcons, type IconIdOf } from './define.ts'
import * as art from './fallArt.ts'

/**
 * The own drawings of the Fall theme (SLAY-18.6): each block model of `fallArt.ts` with the footprints it is drawn at. The shared
 * registries pick the set up by themselves (define.ts). The theme is src/content/themes/fall.ts; the draft docs/themes/seasonal/fall.theme.ts.
 */
export const FALL_ICONS = defineThemeIcons({
  pumpkin: { sizes: [[1, 1]], model: () => art.pumpkin() },
  mapleTree: { sizes: [[1, 1]], model: () => art.mapleTree() },
  appleTree: { sizes: [[1, 1]], model: () => art.appleTree() },
  mushroom: { sizes: [[1, 1]], model: () => art.mushroom() },
  chrysanthemum: { sizes: [[1, 1]], model: () => art.chrysanthemum() },
  scarecrow: { sizes: [[1, 1]], model: () => art.scarecrow() },
  bonfire: { sizes: [[1, 1]], model: () => art.bonfire() },
  hearth: { sizes: [[1, 1]], model: () => art.hearth() },
  baleOfHay: { sizes: [[1, 1], [2, 1], [2, 2]], model: (c, r) => art.baleOfHay(c, r) },
  leafPile: { sizes: [[1, 1], [2, 1], [2, 2]], model: (c, r) => art.leafPile(c, r) },
  harvestCrate: { sizes: [[1, 1]], model: () => art.harvestCrate() },
  ciderBarrel: { sizes: [[1, 1]], model: () => art.ciderBarrel() },
  harvestTable: { sizes: [[1, 1], [2, 1], [2, 2]], model: (c, r) => art.harvestTable(c, r) },
})

export type FallIconId = IconIdOf<typeof FALL_ICONS>
