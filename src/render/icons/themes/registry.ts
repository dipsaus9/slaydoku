import type { ReactNode } from 'react'
import type { Cell } from '../../../engine/model/index.ts'
import type { IconVariant } from '../registry.tsx'
import * as art from './art.tsx'
import * as simps from './simpshouseArt.tsx'
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

function define(id: ThemeIconId, sizes: readonly Size[], draw: (cols: number, rows: number) => ReactNode): ThemeIconDefinition {
  return {
    id,
    variants: sizes.map(([cols, rows]) => ({
      id: `${cols}x${rows}`,
      cells: rectCells(cols, rows),
      cols,
      rows,
      draw: () => draw(cols, rows),
    })),
  }
}

export const THEME_ICON_DEFINITIONS: Record<ThemeIconId, ThemeIconDefinition> = {
  picnicBlanket: define('picnicBlanket', [[2, 1], [2, 2]], art.picnicBlanket),
  hammock: define('hammock', [[1, 2]], art.hammock),
  sandbox: define('sandbox', [[2, 1], [2, 2]], art.sandbox),
  gymMat: define('gymMat', [[2, 1], [3, 1]], art.gymMat),
  fountain: define('fountain', [[1, 1], [2, 2]], art.fountain),
  blackboard: define('blackboard', [[1, 1], [2, 1]], art.blackboard),
  printer: define('printer', [[1, 1]], art.printer),
  vendingMachine: define('vendingMachine', [[1, 1]], art.vendingMachine),
  clothesRack: define('clothesRack', [[2, 1], [3, 1]], art.clothesRack),
  mannequin: define('mannequin', [[1, 1]], art.mannequin),
  checkoutCounter: define('checkoutCounter', [[2, 1], [3, 1]], art.checkoutCounter),
  cardBinderShelf: define('cardBinderShelf', [[1, 1], [2, 1]], simps.cardBinderShelf),
  cardTable: define('cardTable', [[2, 1], [2, 2]], simps.cardTable),
  vanity: define('vanity', [[2, 1], [3, 1]], simps.vanity),
  discoBall: define('discoBall', [[1, 1]], () => simps.discoBall()),
  karaokeStage: define('karaokeStage', [[2, 1], [2, 2]], simps.karaokeStage),
  arcadeCabinet: define('arcadeCabinet', [[1, 1]], () => simps.arcadeCabinet()),
  bubbleBath: define('bubbleBath', [[2, 1], [3, 1]], simps.bubbleBath),
  rabbitHutch: define('rabbitHutch', [[1, 1], [2, 1]], simps.rabbitHutch),
  redCarpet: define('redCarpet', [[2, 1], [3, 1]], simps.redCarpet),
  champagneTower: define('champagneTower', [[1, 1]], () => simps.champagneTower()),
  goldMirror: define('goldMirror', [[1, 1], [2, 1]], simps.goldMirror),
  shoeWall: define('shoeWall', [[1, 1], [2, 1]], simps.shoeWall),
  photoWall: define('photoWall', [[1, 1], [2, 1]], simps.photoWall),
  djBooth: define('djBooth', [[2, 1], [3, 1]], simps.djBooth),
  danceFloor: define('danceFloor', [[2, 2], [3, 2]], simps.danceFloor),
  confettiCannon: define('confettiCannon', [[1, 1]], () => simps.confettiCannon()),
  balloons: define('balloons', [[1, 1]], () => simps.balloons()),
  snackTable: define('snackTable', [[2, 1], [3, 1]], simps.snackTable),
  cocktailBar: define('cocktailBar', [[2, 1], [3, 1]], simps.cocktailBar),
  photoBooth: define('photoBooth', [[1, 1]], () => simps.photoBooth()),
  lavaLamp: define('lavaLamp', [[1, 1]], () => simps.lavaLamp()),
  salmariBar: define('salmariBar', [[2, 1], [3, 1]], simps.salmariBar),
  cardDisplayCase: define('cardDisplayCase', [[1, 1], [2, 1]], simps.cardDisplayCase),
  readingNook: define('readingNook', [[2, 1], [2, 2]], simps.readingNook),
  yellowPlush: define('yellowPlush', [[1, 1]], () => simps.yellowPlush()),
}
