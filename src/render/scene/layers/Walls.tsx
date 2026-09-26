import type { Scene } from '../../../engine/model/index.ts'
import type { SceneGeometry } from '../geometry.ts'
import { WALL_THICKNESS } from '../geometry.ts'
import { THEME } from '../theme.ts'
import { wallSegments } from '../walls.ts'

/** Flat drop shadow behind the whole grid, like the printed sheets. Paints first. */
export function Shadow({ geometry }: { geometry: SceneGeometry }) {
  const { origin } = geometry
  return (
    <rect
      data-layer="shadow"
      x={origin.x + 5}
      y={origin.y + 5}
      width={geometry.columns * geometry.cellSize}
      height={geometry.rows * geometry.cellSize}
      fill={THEME.shadow}
    />
  )
}

/** Thick walls between cells of different rooms and around the outside. */
export function Walls({ scene, geometry }: { scene: Scene; geometry: SceneGeometry }) {
  const segments = wallSegments(scene)
  const d = segments
    .map((s) => {
      const a = geometry.toPoint(s.x1, s.y1)
      const b = geometry.toPoint(s.x2, s.y2)
      return `M${a.x} ${a.y}L${b.x} ${b.y}`
    })
    .join('')
  return (
    <path
      data-layer="walls"
      d={d}
      stroke={THEME.wall}
      strokeWidth={WALL_THICKNESS}
      strokeLinecap="square"
      fill="none"
    />
  )
}
