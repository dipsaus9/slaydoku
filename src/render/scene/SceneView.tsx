import { useId, type MouseEvent, type ReactNode } from 'react'
import type { Cell, Scene } from '../../engine/model/index.ts'
import type { Locale } from '../../locale/types.ts'
import type { Look } from '../looks/look.ts'
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
  /**
   * Slot for 3D blocks (SLAY-17.8 looks 'a2' and 'a3'); gets the geometry with `project`. Drawn with the objects on a square grid, and above the
   * walls on a diamond grid, where the blocks stand up and must cover the walls behind them.
   */
  solidsLayer?: LayerContent
  /** Slot for what lies on the floor: crosses, hints, the press ring. Skewed with the floor on a diamond grid. */
  marksLayer?: LayerContent
  /** Slot for candidate letters. Gets the upright geometry: on a diamond grid the letters stay straight. */
  notesLayer?: LayerContent
  /** Slot for placed people (upright geometry). */
  peopleLayer?: LayerContent
  /** Slot for the Legend's pointer, drawn over the people and lying on the floor like the marks. */
  flashLayer?: LayerContent
  /** The object look (SLAY-17.8). 'a3' lays the grid out as a diamond; the default 'now' and 'a2' keep the square grid. */
  look?: Look
  onCellClick?: (cell: Cell, event: MouseEvent<SVGRectElement>) => void
  className?: string
  /** Accessible name of the drawing. */
  title?: string
  /** Language the room labels draw in (SLAY-5.2). Default 'en'. */
  locale?: Locale
}

function resolve(content: LayerContent, geometry: SceneGeometry): ReactNode {
  return typeof content === 'function' ? content(geometry) : content
}

/**
 * Draws a Scene as one scalable SVG (viewBox based, fills its container's
 * width). Paint order, bottom to top: shadow, floors, grid, objects, walls, edge features,
 * room labels, marks, people, axis labels, per-cell hit rects. Room labels sit
 * on top of marks and people (SLAY-17.5) with a paper-coloured halo and no pill, so the name stays readable in a room the player has filled in.
 */
export function SceneView({
  scene,
  showAxisLabels = false,
  roomStyles,
  objectsLayer,
  marksLayer,
  solidsLayer,
  notesLayer,
  flashLayer,
  peopleLayer,
  look = 'now',
  onCellClick,
  className,
  title = 'Crime scene',
  locale = 'en',
}: SceneViewProps) {
  const geometry = createGeometry(scene, { axisLabels: showAxisLabels, look })
  const idPrefix = `scene-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const styles = resolveRoomStyles(scene, roomStyles)
  const { width, height } = geometry.viewBox
  const upright = geometry.upright

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
      {look === 'a3' ? (
        <>
          <g transform={geometry.planeTransform} data-layer="plane">
            <Shadow geometry={geometry} />
            <Floors scene={scene} geometry={geometry} styles={styles} idPrefix={idPrefix} />
            <GridLines geometry={geometry} />
            <g data-layer="objects" pointerEvents="none">
              {objectsLayer && resolve(objectsLayer, geometry)}
            </g>
            <Walls scene={scene} geometry={geometry} />
            <EdgeFeatures scene={scene} geometry={geometry} />
          </g>
          <g data-layer="solids" pointerEvents="none">
            {solidsLayer && resolve(solidsLayer, geometry)}
          </g>
          <g transform={geometry.planeTransform} data-layer="marks" pointerEvents="none">
            {marksLayer && resolve(marksLayer, geometry)}
          </g>
          <g data-layer="marks" pointerEvents="none">
            {notesLayer && resolve(notesLayer, upright)}
          </g>
          <g data-layer="people" pointerEvents="none">
            {peopleLayer && resolve(peopleLayer, upright)}
          </g>
          <g transform={geometry.planeTransform} data-layer="flash-plane" pointerEvents="none">
            {flashLayer && resolve(flashLayer, geometry)}
          </g>
        </>
      ) : (
        <>
          <Shadow geometry={geometry} />
          <Floors scene={scene} geometry={geometry} styles={styles} idPrefix={idPrefix} />
          <GridLines geometry={geometry} />
          <g data-layer="objects" pointerEvents="none">
            {objectsLayer && resolve(objectsLayer, geometry)}
            {solidsLayer && resolve(solidsLayer, geometry)}
          </g>
          <Walls scene={scene} geometry={geometry} />
          <EdgeFeatures scene={scene} geometry={geometry} />
          <g data-layer="marks" pointerEvents="none">
            {marksLayer && resolve(marksLayer, geometry)}
            {notesLayer && resolve(notesLayer, geometry)}
          </g>
          <g data-layer="people" pointerEvents="none">
            {peopleLayer && resolve(peopleLayer, geometry)}
            {flashLayer && resolve(flashLayer, geometry)}
          </g>
        </>
      )}
      <RoomLabels scene={scene} geometry={upright} locale={locale} />
      {showAxisLabels && <AxisLabels geometry={upright} />}
      {look === 'a3' ? (
        <g transform={geometry.planeTransform} data-layer="hit-plane">
          <HitLayer geometry={geometry} onCellClick={onCellClick} />
        </g>
      ) : (
        <HitLayer geometry={geometry} onCellClick={onCellClick} />
      )}
    </svg>
  )
}
