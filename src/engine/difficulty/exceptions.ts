import type { SolvableTierId } from '../solvable/tiers.ts'

/**
 * Puzzles whose score v2 lies outside the band of their tier, and why. Score v2 is a mean of measured parts; the tier is decided by
 * hard rules on single placements (the top share of two-card placements, the caps on squares and chains, people placeable alone). A puzzle that just
 * fails a tier on one such rule scores close to the tier below it, and a puzzle that just passes lies close to its edge. An entry here is such a
 * puzzle; the pack gate (`entryProblems`) lets exactly these ids pass a band it would refuse.
 */
export interface BandException {
  id: string
  /** The tier of the puzzle (`tierFor`). */
  tier: SolvableTierId
  /** The tier whose band its score lies in. */
  band: SolvableTierId
  reason: string
}

export const BAND_EXCEPTIONS: readonly BandException[] = [
  {
    id: '6-easy-school-1038600',
    tier: 'easy',
    band: 'easy-medium',
    reason:
      "SLAY-13.3: the 'squares' part of score v2 now scales with grid size (mean squares per person) instead of a raw count. This committed 6x6 puzzle now scores 16, one point past the easy band (8-15), because a 6x6 board leaves a bigger share of its few squares per person than the larger boards the band was tuned against.",
  },
]

/** The exception of a puzzle id, if it is one. */
export const bandException = (id: string): BandException | undefined => BAND_EXCEPTIONS.find((e) => e.id === id)
