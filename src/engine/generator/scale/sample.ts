import type { ClueCandidate } from '../pool.ts'
import type { Rng } from '../rng.ts'

/**
 * Most candidates kept per (holder, clue kind). A 16x16 scene has thousands of
 * true clues per puzzle, dominated by a few kinds with many variants (direction
 * and distance clues with their room/alone qualifiers). The selector draws kind
 * first and a clue of that kind second, so the long tail of one kind adds no
 * variety; it only costs memory and duplicate draws. Small grids never reach
 * the cap and keep their whole pool.
 */
export const PER_KIND_CAP = 24

/**
 * Down-samples a pool for big grids: every (holder, kind) keeps at most `cap`
 * randomly chosen candidates, so every kind stays represented for every
 * suspect. Order of the kept candidates follows the original pool (stable).
 */
export function samplePool(pool: readonly ClueCandidate[], rng: Rng, cap: number = PER_KIND_CAP): ClueCandidate[] {
  const groups = new Map<string, ClueCandidate[]>()
  for (const candidate of pool) {
    const key = `${candidate.clue.personId}|${candidate.clue.type}`
    const list = groups.get(key)
    if (list) list.push(candidate)
    else groups.set(key, [candidate])
  }
  const keep = new Set<ClueCandidate>()
  for (const list of groups.values()) {
    for (const candidate of list.length <= cap ? list : rng.shuffle(list).slice(0, cap)) keep.add(candidate)
  }
  return pool.filter((candidate) => keep.has(candidate))
}
