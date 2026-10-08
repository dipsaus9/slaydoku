import { useId, useMemo, type ReactNode } from 'react'
import type { PlacedObject, Scene } from '../../engine/model/index.ts'
import { chairFacing } from '../looks/facing.ts'
import { sortBackToFront } from '../looks/project.ts'
import { objectClipPath } from '../looks/objectClip.ts'
import { ShadowFilter, SolidPrims, SolidShadow } from '../looks/Solids.tsx'
import { solidOf, type Solid } from '../looks/solid.ts'
import { CELL_SIZE, type SceneGeometry } from '../scene/geometry.ts'
import type { ThemeIconId } from './themes/types.ts'
import type { IconObjectType } from './types.ts'

export interface SceneObjectIconsProps {
  objects: readonly (Omit<PlacedObject, 'type'> & { type: IconObjectType })[]
  geometry: SceneGeometry
  /** Room id per cell (`Scene.cellRooms`): an object is drawn only inside its own room. */
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
  /** Footprint's top-left corner in viewBox units. */
  x: number
  y: number
  /** Path of the squares this object may draw on (objectClip.ts). */
  clip: string
  /** The same in model units (100 per cell), for the back-to-front order. */
  left: number
  top: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Draws the objects of a scene, for SceneView's `objectsLayer`: blocks seen from the front and above (docs/design/looks.md), each at the
 * top-left cell of its footprint. Per room (rooms never overlap, so their order does not matter): first the objects that lie on the floor
 * (rugs), then the shadows, then the tall objects back to front. Each object, its shadow included, is clipped to its own squares plus the free
 * floor of its room around them (objectClip.ts), so nothing ever appears to pass through a wall. Walls are drawn above this layer.
 * Objects whose footprint or art does not resolve are skipped (the look-completeness test makes sure no registered theme has one).
 */
export function SceneObjectIcons({ objects, geometry, cellRooms, themeIcons }: SceneObjectIconsProps): ReactNode {
  const prefix = `objs-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const rooms = useMemo(() => {
    const byRoom = new Map<string, Placed[]>()
    for (const object of objects) {
      const facing = object.type === 'chair' ? chairFacing(object, objects, cellRooms) : undefined
      const solid = solidOf(object, themeIcons, facing)
      if (!solid) continue
      const top = Math.min(...object.cells.map((c) => c.row))
      const left = Math.min(...object.cells.map((c) => c.col))
      const first = object.cells[0]!
      const roomId = cellRooms[first.row]?.[first.col]
      if (roomId === undefined) continue
      const { x, y } = geometry.cellRect({ row: top, col: left })
      const list = byRoom.get(roomId) ?? []
      list.push({ solid, id: object.id, x, y, clip: objectClipPath(object.cells, cellRooms, geometry), left: left * 100, top: top * 100 })
      byRoom.set(roomId, list)
    }
    const extent = (p: Placed) => ({ x0: p.left, y0: p.top, x1: p.left + p.solid.width, y1: p.top + p.solid.height, z0: 0, z1: p.solid.flat ? 1 : 2 })
    return [...byRoom].map(([roomId, list]) => ({
      roomId,
      flat: sortBackToFront(list.filter((p) => p.solid.flat), extent),
      tall: sortBackToFront(list.filter((p) => !p.solid.flat), extent),
    }))
  }, [objects, geometry, cellRooms, themeIcons])
  if (rooms.length === 0) return null
  const scale = CELL_SIZE / 100
  // The object's own group carries data-object; the art inside it names its kind (data-icon, or data-theme-icon for own theme art).
  // Every drawn thing of an object (art and shadow) sits inside the clip of that object (objectClip.ts), the shadow's blur inside it too.
  const at = (p: Placed, body: ReactNode, tag: boolean, clipId: string) => (
    <g key={p.id} clipPath={`url(#${clipId})`} data-clip-of={p.id}>
      <g data-object={tag ? p.id : undefined} transform={`translate(${r1(p.x)} ${r1(p.y)}) scale(${scale})`}>
        {tag ? (
          <g data-solid={p.solid.key} data-icon={p.solid.themeIcon ? undefined : p.solid.key} data-theme-icon={p.solid.themeIcon}>
            {body}
          </g>
        ) : (
          body
        )}
      </g>
    </g>
  )
  const clipId = (p: Placed) => `${prefix}-clip-${p.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
  const art = (p: Placed) => at(p, <SolidPrims prims={p.solid.prims} />, true, clipId(p))
  const shadow = (p: Placed) => (
    <g key={`shadow-${p.id}`} clipPath={`url(#${clipId(p)})`} data-clip-of={p.id}>
      <g filter={`url(#${prefix}-blur)`}>
        <g transform={`translate(${r1(p.x)} ${r1(p.y)}) scale(${scale})`}>
          <SolidShadow solid={p.solid} />
        </g>
      </g>
    </g>
  )
  return (
    <g>
      <defs>
        <ShadowFilter id={`${prefix}-blur`} />
        {rooms.flatMap((room) =>
          [...room.flat, ...room.tall].map((p) => (
            <clipPath key={p.id} id={clipId(p)}>
              <path d={p.clip} />
            </clipPath>
          )),
        )}
      </defs>
      {rooms.map((room) => (
        <g key={room.roomId} data-room-objects={room.roomId}>
          {room.flat.map(art)}
          {room.tall.map(shadow)}
          {room.tall.map(art)}
        </g>
      ))}
    </g>
  )
}
