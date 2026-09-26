import type { ReactNode } from 'react'
import type { Cell } from '../../../engine/model/index.ts'
import type { IconVariant } from '../registry.tsx'
import * as art from './art.tsx'
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
  officeChair: define('officeChair', [[1, 1]], art.officeChair),
  beanbag: define('beanbag', [[1, 1]], art.beanbag),
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
}
