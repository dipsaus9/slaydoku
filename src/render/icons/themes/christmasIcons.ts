import * as art from './christmasArt.ts'
import { defineThemeIcons, type IconIdOf } from './define.ts'

/**
 * The own drawings of the Christmas theme (SLAY-18.8): one block model per kind (christmasArt.ts), with the footprints it is drawn at.
 * The shared registries pick the set up by themselves (see define.ts). Ids are unique across the seasonal sets: the hay bale and the
 * fireplace are `stableHay` and `stockingFireplace`, so they never meet a `hayBale` or `fireplace` of another theme.
 */
export const CHRISTMAS_ICONS = defineThemeIcons({
  christmasTree: { sizes: [[1, 1]], model: () => art.christmasTree() },
  firTree: { sizes: [[1, 1]], model: () => art.firTree() },
  present: { sizes: [[1, 1]], model: () => art.present() },
  snowman: { sizes: [[1, 1]], model: () => art.snowman() },
  reindeer: { sizes: [[1, 1]], model: () => art.reindeer() },
  gingerbreadHouse: { sizes: [[1, 1]], model: () => art.gingerbreadHouse() },
  stockingFireplace: { sizes: [[1, 1]], model: () => art.stockingFireplace() },
  workbench: { sizes: [[2, 1], [3, 1]], model: (c) => art.workbench(c) },
  toyShelf: { sizes: [[1, 1], [2, 1]], model: (c) => art.toyShelf(c) },
  cocoaCounter: { sizes: [[2, 1], [3, 1]], model: (c) => art.cocoaCounter(c) },
  marketStall: { sizes: [[1, 1], [2, 1]], model: (c) => art.marketStall(c) },
  poinsettia: { sizes: [[1, 1]], model: () => art.poinsettia() },
  holly: { sizes: [[1, 1]], model: () => art.holly() },
  rockingHorse: { sizes: [[1, 1]], model: () => art.rockingHorse() },
  furRug: { sizes: [[1, 1], [2, 1], [2, 2]], model: (c, r) => art.furRug(c, r) },
  stableHay: { sizes: [[1, 1], [2, 1]], model: (c) => art.stableHay(c) },
  sleigh: { sizes: [[1, 2]], model: () => art.sleigh() },
})

export type ChristmasIconId = IconIdOf<typeof CHRISTMAS_ICONS>
