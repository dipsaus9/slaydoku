import { SCENE_THEMES } from '../../../content/themes/index.ts'
import type { ThemeId } from '../../../content/themes/index.ts'
import { generateScene } from '../../scenegen/index.ts'
import type { TierId } from '../tiers/index.ts'
import { tryGenerateForScene } from './generate.ts'
import type { ScaleFailure } from './generate.ts'

/** One generated puzzle reduced to what is tuned on: rating, size of the clue set, time. */
export interface ScaleSample {
  seed: number
  theme: ThemeId
  /** Hardest technique level and the 0-100 score. */
  level: number
  score: number
  steps: number
  clues: number
  attempts: number
  ms: number
}

export interface ScaleDistribution {
  size: number
  tier: TierId
  samples: ScaleSample[]
  /** Seeds that produced no puzzle, with everything needed to reproduce them. Never silently dropped. */
  failures: ScaleFailure[]
}

/** Theme of a seed: cycles through all built-in themes so every size sees every kind of scene. */
export const themeForSeed = (seed: number): ThemeId => (SCENE_THEMES[seed % SCENE_THEMES.length] as { id: ThemeId }).id

/** The random scene the measurements (and the tests) use for a size and seed. */
export const sceneForSeed = (size: number, seed: number) =>
  generateScene({ width: size, height: size, theme: themeForSeed(seed), seed })

/**
 * Generates a puzzle per seed on `generateScene` scenes of one size and
 * collects rating, clue count and time; seeds that fail are listed in
 * `failures`, not skipped.
 */
export function measureScale(size: number, tier: TierId, seeds: readonly number[], budgetMs?: number): ScaleDistribution {
  const samples: ScaleSample[] = []
  const failures: ScaleFailure[] = []
  for (const seed of seeds) {
    const result = tryGenerateForScene(sceneForSeed(size, seed), { seed, tier, budgetMs })
    if (!result.ok) {
      failures.push(result.failure)
      continue
    }
    const r = result.report
    samples.push({
      seed, theme: themeForSeed(seed), level: r.human.maxTechnique?.level ?? 0, score: r.score, steps: r.human.steps.length,
      clues: r.puzzle.clues.length, attempts: r.attempts, ms: Math.round(r.elapsedMs),
    })
  }
  return { size, tier, samples, failures }
}

const range = (values: number[]): string => {
  if (values.length === 0) return '-'
  const sorted = [...values].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] as number
  return `${sorted[0]}-${sorted[sorted.length - 1]} (median ${median})`
}

/** One line: rating level and score, clue count, time, failures. */
export function formatScaleDistribution(d: ScaleDistribution): string {
  const s = d.samples
  const parts = [
    `${d.size}x${d.size} ${d.tier}: ${s.length} ok, ${d.failures.length} failed`,
    `level ${range(s.map((x) => x.level))}`,
    `score ${range(s.map((x) => x.score))}`,
    `clues ${range(s.map((x) => x.clues))}`,
    `steps ${range(s.map((x) => x.steps))}`,
    `attempts ${range(s.map((x) => x.attempts))}`,
    `ms ${range(s.map((x) => x.ms))}`,
  ]
  const lines = [parts.join(' | ')]
  for (const f of d.failures) lines.push(`  FAILED seed ${f.seed}: ${f.message}`)
  return lines.join('\n')
}
