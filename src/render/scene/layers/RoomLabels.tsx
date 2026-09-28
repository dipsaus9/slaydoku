import type { Scene } from '../../../engine/model/index.ts'
import type { Locale } from '../../../locale/types.ts'
import type { SceneGeometry } from '../geometry.ts'
import { LABEL_LINE_HEIGHT, roomLabelLayout } from '../labels.ts'
import { THEME } from '../theme.ts'

const round = (n: number) => Math.round(n * 100) / 100

export function RoomLabels({ scene, geometry, locale = 'en' }: { scene: Scene; geometry: SceneGeometry; locale?: Locale }) {
  const size = geometry.cellSize
  return (
    <g data-layer="room-labels" pointerEvents="none">
      {scene.rooms.map((room) => {
        const label = roomLabelLayout(scene, room.id, locale)
        if (!label) return null
        const centre = geometry.toPoint(label.center.x, label.center.y)
        const w = round(label.width * size)
        const h = round(label.height * size)
        const font = round(label.fontSize * size)
        const lineGap = round(font * LABEL_LINE_HEIGHT)
        const firstLineY = -((label.lines.length - 1) * lineGap) / 2
        return (
          <g
            key={room.id}
            data-room-label={room.id}
            transform={`translate(${centre.x} ${centre.y})`}
          >
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx={Math.min(h / 2, 10)}
              fill={THEME.labelFill}
              stroke={THEME.wall}
              strokeWidth={1.5}
            />
            <text
              textAnchor="middle"
              fontFamily={THEME.fontFamily}
              fontWeight={800}
              fontSize={font}
              fill={THEME.labelInk}
            >
              {label.lines.map((line, i) => (
                <tspan key={line} x={0} y={round(firstLineY + i * lineGap)} dy="0.35em">
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}
    </g>
  )
}
