import type { EdgeFeatureKind, Scene } from '../../engine/model/index.ts'
import type { SceneGeometry } from './geometry.ts'
import { edgeKey, featureEdge, type GridEdge } from './walls.ts'

/** Placement of one window or door in viewBox units. */
export interface EdgeFeatureSpot {
  kind: EdgeFeatureKind
  edge: GridEdge
  x: number
  y: number
  /** 0 for a horizontal line, 90 for a vertical one. */
  rotation: 0 | 90
}

/** Windows and doors on their grid edge, deduplicated (both spellings of an inner edge are one feature). */
export function edgeFeatureSpots(scene: Scene, geometry: SceneGeometry): EdgeFeatureSpot[] {
  const seen = new Set<string>()
  const spots: EdgeFeatureSpot[] = []
  for (const feature of scene.edgeFeatures) {
    const edge = featureEdge(feature)
    const key = `${feature.kind}:${edgeKey(edge)}`
    if (seen.has(key)) continue
    seen.add(key)
    const centre =
      edge.orientation === 'h'
        ? geometry.toPoint(edge.index + 0.5, edge.line)
        : geometry.toPoint(edge.line, edge.index + 0.5)
    spots.push({ kind: feature.kind, edge, ...centre, rotation: edge.orientation === 'h' ? 0 : 90 })
  }
  return spots
}
