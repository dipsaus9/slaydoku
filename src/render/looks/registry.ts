import type { IconObjectType } from '../icons/types.ts'
import type { ThemeIconId } from '../icons/themes/types.ts'
import type { ModelBuilder, SolidModel } from './models.ts'
import * as home from './modelsHouse.ts'
import * as living from './modelsLiving.ts'
import * as outdoor from './modelsOutdoor.ts'
import * as simps from './modelsSimpshouse.ts'
import * as theme from './modelsTheme.ts'

/**
 * Every drawing of the game is a block model: one builder per engine object type and one per theme-only icon. Both tables list every id
 * (the type checker fails a missing one) and `looks.test.tsx` fails when a footprint of a registered theme object has no model.
 * A builder gets the footprint's cols and rows and its id ('2x1', 'L3').
 */
export const ENGINE_MODELS: Record<IconObjectType, ModelBuilder> = {
  chair: () => living.chair(),
  rug: (c, r) => living.rug(c, r),
  bed: (c, r) => living.bed(c, r),
  sofa: (c, _r, v) => (v.startsWith('L') ? living.sofaL(c) : living.sofa(c)),
  car: () => outdoor.car(),
  oilSlick: () => outdoor.oilSlick(),
  framedPainting: () => living.framedPainting(),
  table: (c, r) => living.table(c, r),
  tv: () => living.tv(),
  plant: () => outdoor.plant(),
  bookshelf: (c) => living.bookshelf(c),
  chest: () => living.chest(),
  tree: () => outdoor.tree(),
  flowers: () => outdoor.flowers(),
  easel: () => outdoor.easel(),
  statue: () => outdoor.statue(),
  washingMachine: () => home.washingMachine(),
  dryer: () => home.dryer(),
  cabinet: (c) => living.cabinet(c),
  stairs: (c, r) => home.stairs(c, r),
  toilet: () => home.toilet(),
  sink: (c) => home.sink(c),
  shower: (c, r) => home.shower(c, r),
  desk: (c) => living.desk(c),
  wardrobe: (c, r) => living.wardrobe(c, r),
  diningTable: (c, r) => living.diningTable(c, r),
  kitchenCounter: (c, r) => home.kitchenCounter(c, r),
  bicycle: () => home.bicycle(),
  gardenTable: (c, r) => outdoor.gardenTable(c, r),
  bench: (c) => outdoor.bench(c),
}

export const THEME_MODELS: Record<ThemeIconId, ModelBuilder> = {
  picnicBlanket: (c, r) => theme.picnicBlanket(c, r),
  hammock: () => theme.hammock(),
  sandbox: (c, r) => theme.sandbox(c, r),
  gymMat: (c, r) => theme.gymMat(c, r),
  fountain: (c, r) => theme.fountain(c, r),
  blackboard: (c) => theme.blackboard(c),
  printer: () => theme.printer(),
  vendingMachine: () => theme.vendingMachine(),
  clothesRack: (c) => theme.clothesRack(c),
  mannequin: () => theme.mannequin(),
  checkoutCounter: (c) => theme.checkoutCounter(c),
  cardBinderShelf: (c) => simps.cardBinderShelf(c),
  cardTable: (c, r) => simps.cardTable(c, r),
  vanity: (c) => simps.vanity(c),
  discoBall: () => simps.discoBall(),
  karaokeStage: (c, r) => simps.karaokeStage(c, r),
  arcadeCabinet: () => simps.arcadeCabinet(),
  bubbleBath: (c) => simps.bubbleBath(c),
  rabbitHutch: (c) => simps.rabbitHutch(c),
  redCarpet: (c) => simps.redCarpet(c),
  champagneTower: () => simps.champagneTower(),
  goldMirror: (c) => simps.goldMirror(c),
  shoeWall: (c) => simps.shoeWall(c),
  photoWall: (c) => simps.photoWall(c),
  djBooth: (c) => simps.djBooth(c),
  danceFloor: (c, r) => simps.danceFloor(c, r),
  confettiCannon: () => simps.confettiCannon(),
  balloons: () => simps.balloons(),
  snackTable: (c) => simps.snackTable(c),
  cocktailBar: (c) => simps.cocktailBar(c),
  photoBooth: () => simps.photoBooth(),
  lavaLamp: () => simps.lavaLamp(),
  salmariBar: (c) => simps.salmariBar(c),
  cardDisplayCase: (c) => simps.cardDisplayCase(c),
  readingNook: (c, r) => simps.readingNook(c, r),
  yellowPlush: () => simps.yellowPlush(),
}

/**
 * Models that are not an object kind of the app: a bathtub (the app has no bath kind; the Simpshouse `bubbleBath` is the only tub) and a
 * lamp. Kept so the contact sheet shows the water of the tub and so a kind can be added without drawing it again.
 */
export const MODEL_ONLY: Record<string, () => SolidModel> = {
  bathtub: () => home.bathtub(2, 1),
}

/** The model of one footprint of an engine type or theme icon; null for an id nobody drew. */
export function solidModelFor(key: string, cols: number, rows: number, variant: string): SolidModel | null {
  const build = (ENGINE_MODELS as Record<string, ModelBuilder | undefined>)[key] ?? (THEME_MODELS as Record<string, ModelBuilder | undefined>)[key]
  return build ? build(cols, rows, variant) : null
}
