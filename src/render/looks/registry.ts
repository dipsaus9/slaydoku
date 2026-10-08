import type { IconObjectType } from '../icons/types.ts'
import type { ThemeIconId } from '../icons/themes/types.ts'
import type { ModelBuilder, SolidModel } from './models.ts'
import * as decor from './decorModels.ts'
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
  // Decor objects (SLAY-19.1).
  lamp: () => decor.lamp(),
  mirror: () => decor.mirror(),
  coatRack: () => decor.coatRack(),
  fridge: () => decor.fridge(),
  bathtub: (c, r) => home.bathtub(c, r),
  fireplace: () => decor.fireplace(),
  piano: () => decor.piano(),
  aquarium: () => decor.aquarium(),
  exerciseBike: () => decor.exerciseBike(),
  bin: () => decor.bin(),
  waterCooler: () => decor.waterCooler(),
  serverRack: (c) => decor.serverRack(c),
  globe: () => decor.globe(),
  gymBox: () => decor.gymBox(),
  playEquipment: () => decor.playEquipment(),
  barbecue: () => decor.barbecue(),
  tent: () => decor.tent(),
  shoppingCart: () => decor.shoppingCart(),
  kiosk: () => decor.kiosk(),
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
 * Models that are not an object kind of the app, shown on the contact sheet so a kind can be added later without drawing it again. Empty since
 * SLAY-19.1 made the bathtub an engine type; kept so the sheet and a future model-only drawing need no new plumbing.
 */
export const MODEL_ONLY: Record<string, () => SolidModel> = {}

/** The model of one footprint of an engine type or theme icon; null for an id nobody drew. */
export function solidModelFor(key: string, cols: number, rows: number, variant: string): SolidModel | null {
  const build = (ENGINE_MODELS as Record<string, ModelBuilder | undefined>)[key] ?? (THEME_MODELS as Record<string, ModelBuilder | undefined>)[key]
  return build ? build(cols, rows, variant) : null
}
