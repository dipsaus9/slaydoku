export { SceneView, type LayerContent, type SceneViewProps } from './SceneView.tsx'
export {
  AXIS_GUTTER,
  CELL_SIZE,
  cellLabel,
  boardAspect,
  createGeometry,
  GRID_LINE_WIDTH,
  MARGIN,
  WALL_THICKNESS,
  type GeometryOptions,
  type Point,
  type Rect,
  type SceneGeometry,
} from './geometry.ts'
export { edgeFeatureSpots, type EdgeFeatureSpot } from './edgeFeatures.ts'
export { roomLabelLayout, type RoomLabelLayout } from './labels.ts'
export {
  ROOM_STYLES,
  resolveRoomStyles,
  styleForName,
  type FloorPattern,
  type ResolvedRoomStyle,
} from './roomStyles.ts'
export {
  edgeKey,
  edgeOf,
  featureEdge,
  hasWall,
  wallEdges,
  wallSegments,
  type GridEdge,
  type WallEdge,
  type WallSegment,
} from './walls.ts'
