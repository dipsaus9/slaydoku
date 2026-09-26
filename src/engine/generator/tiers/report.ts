import type { Cell, Scene } from '../../model/index.ts'
import { generateTierWithReport } from './generate.ts'
import type { TierReport } from './generate.ts'
import type { TierId } from './tiers.ts'

/** One generated puzzle, reduced to what difficulty is tuned on. */
export interface TierSample {
  seed: number
  victimCell?: Cell
  /** Hardest technique level, human-solver step count, 0-100 score. */
  level: number
  steps: number
  score: number
  clues: number
  attempts: number
  ms: number
}

export interface TierDistribution {
  tier: TierId
  samples: TierSample[]
  /** Seeds that hit the attempt or time budget (no puzzle). */
  failures: number
}

const asSample = (seed: number, victimCell: Cell | undefined, r: TierReport): TierSample => ({
  seed,
  ...(victimCell ? { victimCell } : {}),
  level: r.human.maxTechnique?.level ?? 0,
  steps: r.human.steps.length,
  score: r.score,
  clues: r.puzzle.clues.length,
  attempts: r.attempts,
  ms: Math.round(r.elapsedMs),
})

/**
 * Generates `seeds` puzzles of a tier on a scene (victim cells cycle through
 * `victimCells` when given) and collects the achieved rating, clue count and
 * time. Used to report what a scene can actually deliver per tier.
 */
export function measureTier(
  scene: Scene,
  tier: TierId,
  seeds: readonly number[],
  victimCells: readonly Cell[] = [],
  timeBudgetMs?: number,
): TierDistribution {
  const samples: TierSample[] = []
  let failures = 0
  seeds.forEach((seed, i) => {
    const victimCell = victimCells.length > 0 ? victimCells[i % victimCells.length] : undefined
    try {
      samples.push(asSample(seed, victimCell, generateTierWithReport(scene, { seed, tier, victimCell, timeBudgetMs })))
    } catch {
      failures++
    }
  })
  return { tier, samples, failures }
}

const range = (values: readonly number[]): string =>
  values.length === 0 ? '-' : `${Math.min(...values)}-${Math.max(...values)}`
const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

/** One markdown-ish line per tier: rating (level, score), steps, clue count and time. */
export function formatDistribution(d: TierDistribution): string {
  const s = d.samples
  return (
    `${d.tier}: ${s.length} ok, ${d.failures} failed | level ${range(s.map((x) => x.level))}, ` +
    `score ${range(s.map((x) => x.score))}, steps ${range(s.map((x) => x.steps))}, ` +
    `clues ${range(s.map((x) => x.clues))} (mean ${mean(s.map((x) => x.clues)).toFixed(1)}), ` +
    `time ${range(s.map((x) => x.ms))} ms (mean ${Math.round(mean(s.map((x) => x.ms)))})`
  )
}
