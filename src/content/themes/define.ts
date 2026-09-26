import type { Cell, ObjectType } from '../../engine/model/index.ts'
import { isOccupiableType } from '../../engine/model/index.ts'
import type { PlacementHint, ThemeFootprint, ThemeObject } from './types.ts'

/** A full `cols` x `rows` rectangle of cells, relative to its top-left. */
export function rect(cols: number, rows: number, weight = 1): ThemeFootprint {
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) cells.push({ row, col })
  }
  return { id: `${cols}x${rows}`, cells, weight }
}

/** An L of two arms of `arm` cells (north row plus west column), as the sofa icon. */
export function lShape(arm: number, weight = 1): ThemeFootprint {
  const cells: Cell[] = []
  for (let col = 0; col < arm; col++) cells.push({ row: 0, col })
  for (let row = 1; row < arm; row++) cells.push({ row, col: 0 })
  return { id: `L${arm}`, cells, weight }
}

type ObjectSpec = Omit<ThemeObject, 'occupiable' | 'engineType'> & { engineType: ObjectType }

/** Build a ThemeObject; the occupiable flag always comes from the engine catalog. */
export function themeObject(spec: ObjectSpec): ThemeObject {
  return { ...spec, occupiable: isOccupiableType(spec.engineType) }
}

export type { PlacementHint }
