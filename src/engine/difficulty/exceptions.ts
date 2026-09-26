import type { SolvableTierId } from '../solvable/tiers.ts'

/**
 * Puzzles whose score v2 lies outside the band of their tier, and why. Score v2 is a mean of measured parts; the tier is decided by
 * hard rules on single placements (the top share of two-card placements, the caps on squares and chains, people placeable alone). A puzzle that just
 * fails a tier on one such rule scores close to the tier below it, and a puzzle that just passes lies close to its edge. An entry here is such a
 * puzzle; the pack gate (`entryProblems`) lets exactly these ids pass a band it would refuse. The list is empty: no pack data is committed.
 */
export interface BandException {
  id: string
  /** The tier of the puzzle (`tierFor`). */
  tier: SolvableTierId
  /** The tier whose band its score lies in. */
  band: SolvableTierId
  reason: string
}

export const BAND_EXCEPTIONS: readonly BandException[] = []

/** The exception of a puzzle id, if it is one. */
export const bandException = (id: string): BandException | undefined => BAND_EXCEPTIONS.find((e) => e.id === id)
