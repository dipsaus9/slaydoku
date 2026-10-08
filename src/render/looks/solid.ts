import type { Cell, PlacedObject } from '../../engine/model/index.ts'
import type { OrientationPreference } from '../icons/resolve.ts'
import { resolveThemeObjectIcon } from '../icons/themes/resolve.ts'
import type { ThemeIconId } from '../icons/themes/types.ts'
import type { IconObjectType } from '../icons/types.ts'
import { orientModel, type Prim } from './models.ts'
import { solidModelFor } from './registry.ts'

export type SolidObject = Omit<PlacedObject, 'type'> & { type: IconObjectType }

/** What picks the art of an object: its own theme icon, else the engine type's. */
export type SolidKey = IconObjectType | ThemeIconId

/** An object's block model turned into the footprint of its cells, ready to draw. */
export interface Solid {
  key: SolidKey
  themeIcon: ThemeIconId | undefined
  /** The blocks, in the footprint's own units: 100 per cell, origin at its top-left corner. */
  prims: Prim[]
  /** Lies on the floor: drawn under the tall objects, no shadow. */
  flat: boolean
  /** The footprint's cells relative to its top-left corner. */
  cells: Cell[]
  /** Footprint in model units. */
  width: number
  height: number
}

/**
 * The block form of an object covering `cells`, turned to fit them (`prefer` picks a facing when several fit). Null when the footprint
 * has no art or the art has no model: the look-completeness test makes sure that never happens for an object of a registered theme.
 */
export function solidFor(type: IconObjectType, themeIcon: ThemeIconId | undefined, cells: readonly Cell[], prefer: OrientationPreference = {}): Solid | null {
  if (cells.length === 0) return null
  const icon = resolveThemeObjectIcon({ engineType: type, themeIcon }, cells, prefer)
  if (!icon) return null
  const key = themeIcon ?? type
  const model = solidModelFor(key, icon.variant.cols, icon.variant.rows, icon.variant.id)
  if (!model) return null
  return { key, themeIcon, prims: orientModel(model.prims, icon.matrix), flat: model.flat, cells: icon.cells, width: icon.cols * 100, height: icon.rows * 100 }
}

/**
 * `solidFor` for an object of the scene; `themeIcons` names the objects that have their own theme art. A scene object has no facing, only its
 * cells, so where several turns fit the board shows the most readable one: the front toward the viewer (south) on a wide or square footprint,
 * toward the right (east, the other side that shows) on a tall one. Every one of the 8 orientations still draws (contact sheet, tests).
 */
export function solidOf(object: SolidObject, themeIcons?: Readonly<Record<string, ThemeIconId>>): Solid | null {
  const rows = new Set(object.cells.map((c) => c.row)).size
  const cols = new Set(object.cells.map((c) => c.col)).size
  return solidFor(object.type, themeIcons?.[object.id], object.cells, { rotation: rows > cols ? 270 : 0 })
}
