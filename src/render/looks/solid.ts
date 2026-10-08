import type { PlacedObject } from '../../engine/model/index.ts'
import { resolveIcon } from '../icons/resolve.ts'
import type { IconObjectType } from '../icons/types.ts'
import { orientModel, solidModel, type Prim } from './models.ts'

export type SolidObject = Omit<PlacedObject, 'type'> & { type: IconObjectType }

export interface Solid {
  object: SolidObject
  prims: Prim[]
  flat: boolean
  /** Footprint in model units (100 per cell), relative to its top-left corner. */
  width: number
  height: number
}

/** The block form of an object, turned into its footprint; null when the object has no blocks (it keeps the flat art). */
export function solidOf(object: SolidObject, themeIcons?: Readonly<Record<string, unknown>>): Solid | null {
  if (object.cells.length === 0 || themeIcons?.[object.id]) return null
  const icon = resolveIcon(object.type, object.cells)
  if (!icon) return null
  const model = solidModel(object.type, icon.variant.cols, icon.variant.rows, icon.variant.id)
  if (!model) return null
  return { object, prims: orientModel(model, icon.matrix), flat: model.flat, width: icon.cols * 100, height: icon.rows * 100 }
}

/** Darker shade of a #rrggbb colour, as the prototype does it: sides are darker than the top. */
export function shade(hex: string, factor: number): string {
  const v = Number.parseInt(hex.slice(1), 16)
  const r = (v >> 16) & 255
  const g = (v >> 8) & 255
  const b = v & 255
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor * 0.96)},${Math.round(b * factor * 0.94)})`
}

