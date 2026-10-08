import { defineThemeIcons, type IconIdOf } from './define.ts'
import * as art from './halloweenArt.ts'

/**
 * The own drawings of the Halloween theme (SLAY-18.9): each block model of `halloweenArt.ts` (a .ts file: the generator worker imports no .tsx module, src/ui/lab/worker.test.ts) with the footprints it is drawn at. The shared
 * registries pick the set up by themselves (see define.ts). The theme is src/content/themes/halloween.ts.
 */
export const HALLOWEEN_ICONS = defineThemeIcons({
  jackOLantern: { sizes: [[1, 1]], model: () => art.jackOLantern() },
  cauldron: { sizes: [[1, 1]], model: () => art.cauldron() },
  ghost: { sizes: [[1, 1]], model: () => art.ghost() },
  tombstone: { sizes: [[1, 1]], model: () => art.tombstone() },
  coffin: { sizes: [[1, 2]], model: () => art.coffin() },
  cobwebRug: { sizes: [[1, 1], [2, 1], [2, 2]], model: (c, r) => art.cobwebRug(c, r) },
  broomstick: { sizes: [[2, 1]], model: () => art.broomstick() },
  candyBowl: { sizes: [[1, 1]], model: () => art.candyBowl() },
  deadTree: { sizes: [[1, 1]], model: () => art.deadTree() },
  spellShelf: { sizes: [[1, 1], [2, 1]], model: (c) => art.spellShelf(c) },
  potionCabinet: { sizes: [[1, 1], [2, 1], [3, 1]], model: (c) => art.potionCabinet(c) },
  alchemyDesk: { sizes: [[2, 1], [3, 1]], model: (c) => art.alchemyDesk(c) },
  thornyPlant: { sizes: [[1, 1]], model: () => art.thornyPlant() },
  candyCounter: { sizes: [[2, 1], [3, 1]], model: (c) => art.candyCounter(c) },
  feastTable: { sizes: [[2, 1], [3, 1], [2, 2]], model: (c, r) => art.feastTable(c, r) },
  slimePuddle: { sizes: [[1, 1]], model: () => art.slimePuddle() },
  ghostPortrait: { sizes: [[1, 1]], model: () => art.ghostPortrait() },
})

export type HalloweenIconId = IconIdOf<typeof HALLOWEEN_ICONS>
