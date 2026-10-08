import type { Cell } from '../../../engine/model/index.ts'
import type { IconVariant } from '../registry.tsx'
import type { ThemeIconId } from './types.ts'

/** Footprints (canonical orientation, facing south) of one theme icon. */
export interface ThemeIconDefinition {
  id: ThemeIconId
  variants: IconVariant[]
}

type Size = readonly [cols: number, rows: number]

function rectCells(cols: number, rows: number): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) cells.push({ row, col })
  }
  return cells
}

function define(id: ThemeIconId, sizes: readonly Size[]): ThemeIconDefinition {
  return {
    id,
    variants: sizes.map(([cols, rows]) => ({ id: `${cols}x${rows}`, cells: rectCells(cols, rows), cols, rows })),
  }
}

export const THEME_ICON_DEFINITIONS: Record<ThemeIconId, ThemeIconDefinition> = {
  picnicBlanket: define('picnicBlanket', [[2, 1], [2, 2]]),
  hammock: define('hammock', [[1, 2]]),
  sandbox: define('sandbox', [[2, 1], [2, 2]]),
  gymMat: define('gymMat', [[2, 1], [3, 1]]),
  fountain: define('fountain', [[1, 1], [2, 2]]),
  blackboard: define('blackboard', [[1, 1], [2, 1]]),
  printer: define('printer', [[1, 1]]),
  vendingMachine: define('vendingMachine', [[1, 1]]),
  clothesRack: define('clothesRack', [[2, 1], [3, 1]]),
  mannequin: define('mannequin', [[1, 1]]),
  checkoutCounter: define('checkoutCounter', [[2, 1], [3, 1]]),
  cardBinderShelf: define('cardBinderShelf', [[1, 1], [2, 1]]),
  cardTable: define('cardTable', [[2, 1], [2, 2]]),
  vanity: define('vanity', [[2, 1], [3, 1]]),
  discoBall: define('discoBall', [[1, 1]]),
  karaokeStage: define('karaokeStage', [[2, 1], [2, 2]]),
  arcadeCabinet: define('arcadeCabinet', [[1, 1]]),
  bubbleBath: define('bubbleBath', [[2, 1], [3, 1]]),
  rabbitHutch: define('rabbitHutch', [[1, 1], [2, 1]]),
  redCarpet: define('redCarpet', [[2, 1], [3, 1]]),
  champagneTower: define('champagneTower', [[1, 1]]),
  goldMirror: define('goldMirror', [[1, 1], [2, 1]]),
  shoeWall: define('shoeWall', [[1, 1], [2, 1]]),
  photoWall: define('photoWall', [[1, 1], [2, 1]]),
  djBooth: define('djBooth', [[2, 1], [3, 1]]),
  danceFloor: define('danceFloor', [[2, 2], [3, 2]]),
  confettiCannon: define('confettiCannon', [[1, 1]]),
  balloons: define('balloons', [[1, 1]]),
  snackTable: define('snackTable', [[2, 1], [3, 1]]),
  cocktailBar: define('cocktailBar', [[2, 1], [3, 1]]),
  photoBooth: define('photoBooth', [[1, 1]]),
  lavaLamp: define('lavaLamp', [[1, 1]]),
  salmariBar: define('salmariBar', [[2, 1], [3, 1]]),
  cardDisplayCase: define('cardDisplayCase', [[1, 1], [2, 1]]),
  readingNook: define('readingNook', [[2, 1], [2, 2]]),
  yellowPlush: define('yellowPlush', [[1, 1]]),
}
