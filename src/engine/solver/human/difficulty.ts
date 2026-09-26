import type { DifficultyBand } from './types.ts'

/**
 * Difficulty score: the level of the hardest technique the solution needed,
 * times 100, plus the number of steps. The hardest technique decides the
 * rating band; the step count separates puzzles within a band.
 */
export function difficulty(
  hardestLevel: number,
  steps: number,
  bands: readonly DifficultyBand[],
): { score: number; band: DifficultyBand | null } {
  let band: DifficultyBand | null = null
  for (const candidate of bands) if (candidate.minLevel <= Math.max(hardestLevel, 1)) band = candidate
  return { score: hardestLevel * 100 + steps, band }
}
