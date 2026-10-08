import { useId, useMemo, type ReactNode } from 'react'
import type { PlacedObject, Scene } from '../../engine/model/index.ts'
import { chairFacing } from '../looks/facing.ts'
import { drawOrder, frontRow } from '../looks/drawOrder.ts'
import { ShadowFilter, SolidPrims, SolidShadow } from '../looks/Solids.tsx'
import { solidOf, type Solid } from '../looks/solid.ts'
import { CELL_SIZE, type SceneGeometry } from '../scene/geometry.ts'
import type { ThemeIconId } from './themes/types.ts'
import type { IconObjectType } from './types.ts'

export interface SceneObjectIconsProps {
  objects: readonly (Omit<PlacedObject, 'type'> & { type: IconObjectType })[]
  geometry: SceneGeometry
  /** Room id per cell (`Scene.cellRooms`): a chair turns toward a table or away from its room's nearest wall. */
  cellRooms: Scene['cellRooms']
  /**
   * Own theme art per object id (a park `hammock`, an office `printer`). The engine Scene has no
   * kind field, so the caller derives this from the object id prefix. Objects not listed here
   * draw the engine icon of their type.
   */
  themeIcons?: Readonly<Record<string, ThemeIconId>>
}

interface Placed {
  solid: Solid
  id: string
  cells: PlacedObject['cells']
  flat: boolean
  /** Footprint's top-left corner in viewBox units. */
  x: number
  y: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Draws the objects of a scene, for SceneView's `objectsLayer`: blocks seen from the front and above (docs/design/looks.md), each at the
 * top-left cell of its footprint. Painter's order (owner, SLAY-17.4), back to front: what lies flat (rugs) first, then every object that stands up
 * in the order of `drawOrder` (lower on the screen is drawn later and sits on top), each with its own soft shadow just below it. Nothing is cut:
 * a block may rise over the wall behind it and over the squares above it, like real oblique 3D. The walls, doors and windows are drawn before this
 * layer, so they lie under every object; marks, people and room labels are drawn after it.
 * Objects whose footprint or art does not resolve are skipped (the look-completeness test makes sure no registered theme has one).
 */
export function SceneObjectIcons({ objects, geometry, cellRooms, themeIcons }: SceneObjectIconsProps): ReactNode {
  const prefix = `objs-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const ordered = useMemo(() => {
    const list: Placed[] = []
    for (const object of objects) {
      const facing = object.type === 'chair' ? chairFacing(object, objects, cellRooms) : undefined
      const solid = solidOf(object, themeIcons, facing)
      if (!solid) continue
      const top = Math.min(...object.cells.map((c) => c.row))
      const left = Math.min(...object.cells.map((c) => c.col))
      const { x, y } = geometry.cellRect({ row: top, col: left })
      list.push({ solid, id: object.id, cells: object.cells, flat: solid.flat, x, y })
    }
    return drawOrder(list)
  }, [objects, geometry, cellRooms, themeIcons])
  if (ordered.length === 0) return null
  const scale = CELL_SIZE / 100
  const place = (p: Placed) => `translate(${r1(p.x)} ${r1(p.y)}) scale(${scale})`
  return (
    <g data-draw-order="front-row">
      <defs>
        <ShadowFilter id={`${prefix}-blur`} />
      </defs>
      {ordered.map((p) => (
        <g key={p.id} data-object={p.id} data-front-row={frontRow(p.cells)}>
          {p.flat ? null : (
            <g filter={`url(#${prefix}-blur)`}>
              <g transform={place(p)}>
                <SolidShadow solid={p.solid} />
              </g>
            </g>
          )}
          <g transform={place(p)}>
            <g data-solid={p.solid.key} data-icon={p.solid.themeIcon ? undefined : p.solid.key} data-theme-icon={p.solid.themeIcon}>
              <SolidPrims prims={p.solid.prims} />
            </g>
          </g>
        </g>
      ))}
    </g>
  )
}
