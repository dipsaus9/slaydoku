import { useId, useMemo, type ReactNode } from 'react'
import type { PlacedObject, Scene } from '../../engine/model/index.ts'
import { sortBackToFront } from '../looks/project.ts'
import { roomClipPath } from '../looks/roomClip.ts'
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
  /** The same in model units (100 per cell), for the back-to-front order. */
  left: number
  top: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Draws the objects of a scene, for SceneView's `objectsLayer`: blocks seen from the front and above (docs/design/looks.md), each at the
 * top-left cell of its footprint. Per room (rooms never overlap, so their order does not matter): first the objects that lie on the floor
 * (rugs), then one soft shadow layer, then the tall objects back to front, all inside the room's clip. Walls are drawn above this layer.
 * Objects whose footprint or art does not resolve are skipped (the look-completeness test makes sure no registered theme has one).
 */
export function SceneObjectIcons({ objects, geometry, cellRooms, themeIcons }: SceneObjectIconsProps): ReactNode {
  const prefix = `objs-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const rooms = useMemo(() => {
    const byRoom = new Map<string, Placed[]>()
    for (const object of objects) {
      const solid = solidOf(object, themeIcons)
      if (!solid) continue
      const top = Math.min(...object.cells.map((c) => c.row))
      const left = Math.min(...object.cells.map((c) => c.col))
      const first = object.cells[0]!
      const roomId = cellRooms[first.row]?.[first.col]
      if (roomId === undefined) continue
      const { x, y } = geometry.cellRect({ row: top, col: left })
      const list = byRoom.get(roomId) ?? []
      list.push({ solid, id: object.id, x, y, left: left * 100, top: top * 100 })
      byRoom.set(roomId, list)
    }
    const extent = (p: Placed) => ({ x0: p.left, y0: p.top, x1: p.left + p.solid.width, y1: p.top + p.solid.height, z0: 0, z1: p.solid.flat ? 1 : 2 })
    return [...byRoom].map(([roomId, list]) => ({
      roomId,
      clip: roomClipPath(cellRooms, roomId, geometry),
      flat: sortBackToFront(list.filter((p) => p.solid.flat), extent),
      tall: sortBackToFront(list.filter((p) => !p.solid.flat), extent),
    }))
  }, [objects, geometry, cellRooms, themeIcons])
  if (rooms.length === 0) return null
  const scale = CELL_SIZE / 100
  const at = (p: Placed, body: ReactNode, tag: boolean) => (
    <g
      key={p.id}
      data-object={tag ? p.id : undefined}
      data-icon={tag ? (p.solid.themeIcon ? undefined : p.solid.key) : undefined}
      data-theme-icon={tag ? p.solid.themeIcon : undefined}
      transform={`translate(${r1(p.x)} ${r1(p.y)}) scale(${scale})`}
    >
      {body}
    </g>
  )
  return (
    <g data-look="a2">
      <defs>
        <ShadowFilter id={`${prefix}-blur`} />
        {rooms.map((room, i) => (
          <clipPath key={room.roomId} id={`${prefix}-room-${i}`}>
            <path d={room.clip} />
          </clipPath>
        ))}
      </defs>
      {rooms.map((room, i) => (
        <g key={room.roomId} clipPath={`url(#${prefix}-room-${i})`} data-room-objects={room.roomId}>
          {room.flat.map((p) => at(p, <SolidPrims prims={p.solid.prims} />, true))}
          <g filter={`url(#${prefix}-blur)`}>{room.tall.map((p) => at(p, <SolidShadow solid={p.solid} />, false))}</g>
          {room.tall.map((p) => at(p, <SolidPrims prims={p.solid.prims} />, true))}
        </g>
      ))}
    </g>
  )
}
