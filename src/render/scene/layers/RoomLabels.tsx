import type { Scene } from '../../../engine/model/index.ts'
import type { Locale } from '../../../locale/types.ts'
import type { SceneGeometry } from '../geometry.ts'
import { LABEL_LINE_HEIGHT, roomLabelLayout, type RoomLabelLayout } from '../labels.ts'
import { THEME } from '../theme.ts'

const round = (n: number) => Math.round(n * 100) / 100

/** The squares of a label's run that its text actually covers. */
function labelCells(label: RoomLabelLayout): string[] {
  const from = Math.max(label.run.fromCol, Math.floor(label.center.x - label.width / 2))
  const to = Math.min(label.run.toCol, Math.ceil(label.center.x + label.width / 2) - 1)
  const keys: string[] = []
  for (let col = from; col <= to; col++) keys.push(`${label.run.row},${col}`)
  return keys
}

/** Opacity of a room name that lies over a square with notes: the letters drawn over it stay the clearest thing (SLAY-20). */
export const YIELDING_LABEL_OPACITY = 0.5

/**
 * `notedCells` (cell keys "row,col") are squares with candidate notes. A name over one of them steps back
 * (YIELDING_LABEL_OPACITY): the notes are drawn above the names (SceneView), and a faded name behind them
 * keeps every letter of the notes readable while the name itself still shows through.
 */
export function RoomLabels({ scene, geometry, locale = 'en', notedCells }: { scene: Scene; geometry: SceneGeometry; locale?: Locale; notedCells?: ReadonlySet<string> }) {
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
        const yields = !!notedCells && labelCells(label).some((key) => notedCells.has(key))
        // No pill: the paper-coloured halo around the text keeps it readable over marks and people (SLAY-17.5).
        return (
          <g
            key={room.id}
            data-room-label={room.id}
            transform={`translate(${centre.x} ${centre.y})`}
            opacity={yields ? YIELDING_LABEL_OPACITY : undefined}
            data-yield={yields ? '' : undefined}
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
