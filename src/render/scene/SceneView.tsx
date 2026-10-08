import { useId, type MouseEvent, type ReactNode } from 'react'
import type { Cell, Scene } from '../../engine/model/index.ts'
import type { Locale } from '../../locale/types.ts'
import { createGeometry, type SceneGeometry } from './geometry.ts'
import { AxisLabels } from './layers/AxisLabels.tsx'
import { EdgeFeatures } from './layers/EdgeFeatures.tsx'
import { Floors } from './layers/Floors.tsx'
import { GridLines } from './layers/GridLines.tsx'
import { HitLayer } from './layers/HitLayer.tsx'
import { RoomLabels } from './layers/RoomLabels.tsx'
import { Shadow, Walls } from './layers/Walls.tsx'
import { resolveRoomStyles, type FloorPattern } from './roomStyles.ts'

/** Content for an overlay slot: nodes drawn in scene coordinates, or a function of the geometry. */
export type LayerContent = ReactNode | ((geometry: SceneGeometry) => ReactNode)

export interface SceneViewProps {
  scene: Scene
  /** Draw R1..Rn / C1..Cn around the grid. Off by default. */
  showAxisLabels?: boolean
  /** Explicit floor pattern per room id; other rooms are styled by name. */
  roomStyles?: Partial<Record<string, FloorPattern>>
  /** Slot for object icons (story 4.10). */
  objectsLayer?: LayerContent
  /** Slot for player notes and marks (crosses, candidates). */
  marksLayer?: LayerContent
  /** Slot for placed people. */
  peopleLayer?: LayerContent
  onCellClick?: (cell: Cell, event: MouseEvent<SVGRectElement>) => void
  className?: string
  /** Accessible name of the drawing. */
  title?: string
  /** Language the room labels draw in (SLAY-5.2). Default 'en'. */
  locale?: Locale
  /** Squares that hold a placed person: room labels keep clear of them when they can. */
  labelAvoid?: readonly Cell[]
}

function resolve(content: LayerContent, geometry: SceneGeometry): ReactNode {
  return typeof content === 'function' ? content(geometry) : content
}

/**
 * Draws a Scene as one scalable SVG (viewBox based, fills its container's
 * width). Paint order, bottom to top: shadow, floors, grid, objects, walls, edge features,
 * room labels, marks, people, axis labels, per-cell hit rects. Room labels sit
 * on top of marks and people (SLAY-17.5) so the name stays readable in a room the player has filled in; they keep clear of placed
 * people when the room has other free squares (`labelAvoid`), and the pill is see-through so a person under it still shows.
 */
export function SceneView({
  scene,
  showAxisLabels = false,
  roomStyles,
  objectsLayer,
  marksLayer,
  peopleLayer,
  onCellClick,
  labelAvoid,
  className,
  title = 'Crime scene',
  locale = 'en',
}: SceneViewProps) {
  const geometry = createGeometry(scene, { axisLabels: showAxisLabels })
  const idPrefix = `scene-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const styles = resolveRoomStyles(scene, roomStyles)
  const { width, height } = geometry.viewBox

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={title}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      data-columns={scene.width}
      data-rows={scene.height}
    >
      <Shadow geometry={geometry} />
      <Floors scene={scene} geometry={geometry} styles={styles} idPrefix={idPrefix} />
      <GridLines geometry={geometry} />
      <g data-layer="objects" pointerEvents="none">
        {objectsLayer && resolve(objectsLayer, geometry)}
      </g>
      <Walls scene={scene} geometry={geometry} />
      <EdgeFeatures scene={scene} geometry={geometry} />
      <g data-layer="marks" pointerEvents="none">
        {marksLayer && resolve(marksLayer, geometry)}
      </g>
      <g data-layer="people" pointerEvents="none">
        {peopleLayer && resolve(peopleLayer, geometry)}
      </g>
      <RoomLabels scene={scene} geometry={geometry} locale={locale} avoid={labelAvoid} />
      {showAxisLabels && <AxisLabels geometry={geometry} />}
      <HitLayer geometry={geometry} onCellClick={onCellClick} />
    </svg>
  )
}
