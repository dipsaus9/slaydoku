import type { Scene } from '../../../engine/model/index.ts'
import type { SceneGeometry } from '../geometry.ts'
import { WALL_THICKNESS } from '../geometry.ts'
import { THEME } from '../theme.ts'
import { edgeFeatureSpots } from '../edgeFeatures.ts'
import { edgeKey } from '../walls.ts'

const WINDOW_LENGTH = 0.62 * 64
const DOOR_LENGTH = 0.7 * 64

/** Drawn horizontally around the origin, then rotated into place. */
function Window() {
  const t = WALL_THICKNESS + 4
  return (
    <>
      <rect
        x={-WINDOW_LENGTH / 2}
        y={-t / 2}
        width={WINDOW_LENGTH}
        height={t}
        rx={1.5}
        fill={THEME.windowGlass}
        stroke={THEME.windowFrame}
        strokeWidth={1.6}
      />
      <path
        d={`M${-WINDOW_LENGTH / 2 + 3} 0H${WINDOW_LENGTH / 2 - 3}`}
        stroke="#ffffff"
        strokeWidth={1.4}
      />
    </>
  )
}

function Door() {
  const r = DOOR_LENGTH
  return (
    <>
      {/* Opening: a gap in the wall. */}
      <rect
        x={-r / 2}
        y={-(WALL_THICKNESS + 2) / 2}
        width={r}
        height={WALL_THICKNESS + 2}
        fill={THEME.paper}
        stroke={THEME.wall}
        strokeWidth={1.2}
      />
      {/* Open leaf and its swing. */}
      <path
        d={`M${-r / 2} 0A${r} ${r} 0 0 1 ${-r / 2 + r * Math.cos(Math.PI / 4)} ${-r * Math.sin(Math.PI / 4)}`}
        fill="none"
        stroke={THEME.wall}
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.6}
      />
      <path
        d={`M${-r / 2} 0L${-r / 2 + r * Math.cos(Math.PI / 4)} ${-r * Math.sin(Math.PI / 4)}`}
        stroke={THEME.doorLeaf}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </>
  )
}

export function EdgeFeatures({ scene, geometry }: { scene: Scene; geometry: SceneGeometry }) {
  return (
    <g data-layer="edge-features">
      {edgeFeatureSpots(scene, geometry).map((spot) => (
        <g
          key={`${spot.kind}:${edgeKey(spot.edge)}`}
          data-feature={spot.kind}
          data-edge={edgeKey(spot.edge)}
          transform={`translate(${spot.x} ${spot.y}) rotate(${spot.rotation})`}
        >
          {spot.kind === 'window' ? <Window /> : <Door />}
        </g>
      ))}
    </g>
  )
}
