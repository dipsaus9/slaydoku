import type { Puzzle } from '../model/index.ts'
import { SOLVABLE_TIERS, tierForScoreV2 } from '../solvable/tiers.ts'
import type { SolvableTierId } from '../solvable/tiers.ts'
import { bandException } from './exceptions.ts'
import { computeMetrics } from './metrics.ts'
import { DEFAULT_WEIGHTS, scoreV2 } from './score.ts'
import type { ScoreV2 } from './types.ts'

/** Score v2 of a puzzle with the calibrated weights: the metrics of `computeMetrics` and `scoreV2`. */
export function puzzleScoreV2(puzzle: Puzzle): ScoreV2 {
  return scoreV2(computeMetrics(puzzle), DEFAULT_WEIGHTS, puzzle.scene.width * puzzle.scene.height)
}

/**
 * Whether a puzzle of tier `tier` scores inside that tier's band (`SOLVABLE_TIERS[].scoreBand`, the one table). Returns the problem, or null when
 * it does. A puzzle listed in `BAND_EXCEPTIONS` (pass its `id`) is let through where its score lies in the band the list names.
 */
export function scoreBandProblem(puzzle: Puzzle, tier: SolvableTierId, id?: string): string | null {
  const { score } = puzzleScoreV2(puzzle)
  const at = tierForScoreV2(score)
  if (at === tier) return null
  const exception = id === undefined ? undefined : bandException(id)
  if (exception && exception.tier === tier && exception.band === at) return null
  const band = (SOLVABLE_TIERS.find((t) => t.id === tier) as { scoreBand: { min: number; max: number } }).scoreBand
  return `score v2 ${score} outside the ${tier} band ${band.min}-${band.max} (it lies in ${at})`
}
