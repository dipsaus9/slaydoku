import type { Placement } from '../model/index.ts'

export interface ChainInput {
  /** Board width: a square is `row * width + col`. */
  width: number
  /** People already placed, with where. */
  placed: readonly Placement[]
  /** Chain length of each placed person (0 = placed from their own cards alone). */
  depths: ReadonlyMap<string, number>
  /** Placed people the used cards name (or that hold a used card): the placement needs them whatever else. */
  named: Iterable<string>
  /** Squares the used cards leave, before any row or column is crossed off. */
  left: readonly number[]
  /** The square the person stands on (one of `left`). */
  cell: number
}

/**
 * Length of the chain of dependent placements a placement ends (CAD-8.7): 0 when the cards leave exactly one square on their own
 * and name nobody; otherwise 1 + the deepest placement it needs. Needed are the people the cards name and, for the other
 * squares the cards leave, the least dependent people (the shallowest first) whose rows and columns cross all of them off.
 * A person placed from their own card alone is depth 0, somebody who needs only that person is 1, and so on.
 */
export function dependentChain(input: ChainInput): number {
  const { width, placed, depths, left, cell } = input
  const depthOf = (id: string) => depths.get(id) as number
  const needed = new Set(input.named)
  let deepest = -1
  for (const id of needed) deepest = Math.max(deepest, depthOf(id))
  const wrong = left.filter((s) => s !== cell)
  if (wrong.length > 0) {
    const crossed = (ids: ReadonlySet<string>): boolean => {
      const rows = new Set<number>()
      const cols = new Set<number>()
      for (const p of placed) {
        if (!ids.has(p.personId)) continue
        rows.add(p.cell.row)
        cols.add(p.cell.col)
      }
      return wrong.every((s) => rows.has(Math.floor(s / width)) || cols.has(s % width))
    }
    const levels = [...new Set(placed.map((p) => depthOf(p.personId)))].sort((a, b) => a - b)
    for (const level of levels) {
      const ids = new Set([...needed, ...placed.filter((p) => depthOf(p.personId) <= level).map((p) => p.personId)])
      if (crossed(ids)) {
        deepest = Math.max(deepest, level)
        break
      }
    }
  }
  return deepest + 1
}
