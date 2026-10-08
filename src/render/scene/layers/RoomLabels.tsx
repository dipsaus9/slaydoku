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
        const font = round(label.fontSize * size)
        const lineGap = round(font * LABEL_LINE_HEIGHT)
        const firstLineY = -((label.lines.length - 1) * lineGap) / 2
        // No pill: the paper-coloured halo around the text keeps it readable over marks and people (SLAY-17.5).
        return (
          <g
            key={room.id}
            data-room-label={room.id}
            transform={`translate(${centre.x} ${centre.y})`}
          >
            <text
              textAnchor="middle"
              fontFamily={THEME.fontFamily}
              fontWeight={800}
              fontSize={font}
              fill={THEME.labelInk}
              stroke={THEME.labelFill}
              strokeWidth={font * 0.32}
              strokeLinejoin="round"
              paintOrder="stroke"
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
