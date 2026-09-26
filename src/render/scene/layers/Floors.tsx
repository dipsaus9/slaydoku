import { cellsInRoom, type Scene } from '../../../engine/model/index.ts'
import type { SceneGeometry } from '../geometry.ts'
import type { ResolvedRoomStyle } from '../roomStyles.ts'
import { PATTERN_TILE, patternContent } from './FloorPatterns.tsx'

interface FloorsProps {
  scene: Scene
  geometry: SceneGeometry
  styles: Record<string, ResolvedRoomStyle>
  /** Prefix that keeps pattern ids unique when several scenes share a page. */
  idPrefix: string
}

const patternId = (prefix: string, s: ResolvedRoomStyle) => `${prefix}-${s.pattern}-${s.variant}`

export function Floors({ scene, geometry, styles, idPrefix }: FloorsProps) {
  const used = new Map<string, ResolvedRoomStyle>()
  for (const style of Object.values(styles)) used.set(patternId(idPrefix, style), style)

  return (
    <g data-layer="floors">
      <defs>
        {[...used].map(([id, style]) => {
          const tile = PATTERN_TILE[style.pattern]
          return (
            <pattern
              key={id}
              id={id}
              patternUnits="userSpaceOnUse"
              x={geometry.origin.x}
              y={geometry.origin.y}
              width={tile.width}
              height={tile.height}
            >
              {patternContent(style.pattern, style.fill, style.ink)}
            </pattern>
          )
        })}
      </defs>
      {scene.rooms.map((room) => {
        const style = styles[room.id]
        if (!style) return null
        // One path per room: adjacent cell squares fill without seams.
        const d = cellsInRoom(scene, room.id)
          .map((cell) => {
            const r = geometry.cellRect(cell)
            return `M${r.x} ${r.y}h${r.width}v${r.height}h${-r.width}z`
          })
          .join('')
        return (
          <path
            key={room.id}
            d={d}
            fill={`url(#${patternId(idPrefix, style)})`}
            data-room={room.id}
            data-floor={style.pattern}
          />
        )
      })}
    </g>
  )
}
