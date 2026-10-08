import type { Prim } from './models.ts'

/**
 * The one projection of the objects (owner pick A2, SLAY-17.8): an oblique view from the front and above on the unchanged square grid.
 * A model point (100 units per cell, x right, y toward the viewer, z up) lands at `(x - SKEW * z, y - RISE * z)` relative to the footprint's
 * top-left corner: the floor stays square, a point at height z moves up and a little left, so the top, the front and the right side of a block
 * show. The camera is at the +x, +y, +z corner; light comes from the top left.
 */
export const SKEW = 0.22
export const RISE = 0.7

/** Nothing a model draws is higher than this (model units), so no block rises more than `RISE * MAX_Z` (about 43 drawing units, under one cell) above its footprint. */
export const MAX_Z = 96

export function projectModel(x: number, y: number, z: number): [number, number] {
  return [x - SKEW * z, y - RISE * z]
}

export interface Extent {
  x0: number
  y0: number
  x1: number
  y1: number
  z0: number
  z1: number
}

export const primExtent = (p: Prim): Extent => {
  switch (p.kind) {
    case 'box':
      return p
    case 'cylinder':
      return { x0: p.x - p.r, y0: p.y - p.r, x1: p.x + p.r, y1: p.y + p.r, z0: p.z0, z1: p.z1 }
    case 'sphere':
      return { x0: p.x - p.r, y0: p.y - p.r, x1: p.x + p.r, y1: p.y + p.r, z0: p.z - p.r, z1: p.z + p.r }
    case 'disc':
      return p.plane === 'xz'
        ? { x0: p.x - p.r, y0: p.y, x1: p.x + p.r, y1: p.y, z0: p.z - p.r, z1: p.z + p.r }
        : { x0: p.x, y0: p.y - p.r, x1: p.x, y1: p.y + p.r, z0: p.z - p.r, z1: p.z + p.r }
  }
}

/**
 * Back to front for a camera at +x, +y, +z: A goes before B when A lies entirely behind, left of or below B and B does not
 * do the same to A. Ties break on the front corner, and a cycle (which a convex arrangement of boxes does not make) falls
 * back on that key. Same rule as the prototype's `sortBF`.
 */
export function sortBackToFront<T>(items: readonly T[], extent: (item: T) => Extent): T[] {
  const EP = 0.01
  const ext = items.map(extent)
  const n = items.length
  const after: number[][] = items.map(() => [])
  const indegree: number[] = items.map(() => 0)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const A = ext[i]!
      const B = ext[j]!
      const forward = A.x1 <= B.x0 + EP || A.y1 <= B.y0 + EP || A.z1 <= B.z0 + EP
      const reverse = B.x1 <= A.x0 + EP || B.y1 <= A.y0 + EP || B.z1 <= A.z0 + EP
      if (forward && !reverse) {
        after[i]!.push(j)
        indegree[j]!++
      }
    }
  }
  const key = (t: number) => ext[t]!.x0 + ext[t]!.y0 + ext[t]!.z0
  const used: boolean[] = items.map(() => false)
  const out: T[] = []
  while (out.length < n) {
    let best = -1
    for (let i = 0; i < n; i++) if (!used[i] && indegree[i] === 0 && (best < 0 || key(i) < key(best))) best = i
    if (best < 0) for (let i = 0; i < n; i++) if (!used[i] && (best < 0 || key(i) < key(best))) best = i
    used[best] = true
    out.push(items[best]!)
    for (const t of after[best]!) indegree[t]!--
  }
  return out
}
