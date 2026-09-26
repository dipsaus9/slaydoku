import type { Scene } from '../../model/index.ts'
import { generateLadder } from './generate.ts'
import type { LadderGenerateOptions, LadderRejection, LadderTierId } from './generate.ts'

/** Success rate and time per puzzle of the ladder generator over a run of seeds. */
export interface LadderMeasurement {
  tier: LadderTierId
  seeds: number
  ok: number
  /** Milliseconds per seed, successes and failures together, in seed order. */
  ms: number[]
  /** Solutions sampled per seed. */
  attempts: number[]
  /** Reasons the failed seeds gave up, and the candidates rejected on the way (all seeds). */
  failures: { seed: number; reason: string }[]
  rejections: Record<LadderRejection, number>
}

/** Generates one puzzle per seed (the scene of a seed comes from `sceneFor`) and collects success and time. */
export function measureLadder(
  sceneFor: (seed: number) => Scene,
  tier: LadderTierId,
  seeds: readonly number[],
  options: LadderGenerateOptions = {},
): LadderMeasurement {
  const result: LadderMeasurement = {
    tier, seeds: seeds.length, ok: 0, ms: [], attempts: [], failures: [],
    rejections: { 'no-path': 0, invalid: 0, audit: 0, ladder: 0, tier: 0, 'not-unique': 0 },
  }
  for (const seed of seeds) {
    const outcome = generateLadder(sceneFor(seed), tier, seed, options)
    result.ms.push(outcome.elapsedMs)
    result.attempts.push(outcome.attempts)
    for (const [key, n] of Object.entries(outcome.rejections)) result.rejections[key as LadderRejection] += n
    if (outcome.ok) result.ok++
    else result.failures.push({ seed, reason: outcome.reason })
  }
  return result
}

const percentile = (sorted: number[], p: number): number => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] as number

/** One line: success rate and the time per puzzle (median, 90th percentile, slowest). */
export function formatMeasurement(label: string, m: LadderMeasurement): string {
  const sorted = [...m.ms].sort((a, b) => a - b)
  const rate = m.seeds === 0 ? 0 : Math.round((m.ok / m.seeds) * 100)
  const time = sorted.length === 0 ? '-' : `median ${percentile(sorted, 0.5)} ms, p90 ${percentile(sorted, 0.9)} ms, max ${sorted[sorted.length - 1]} ms`
  const mean = sorted.length === 0 ? 0 : Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
  const lines = [`${label} ${m.tier}: ${m.ok}/${m.seeds} ok (${rate}%), ${time}, mean ${mean} ms`]
  const rejected = Object.entries(m.rejections).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`)
  if (rejected.length > 0) lines.push(`  rejected candidates: ${rejected.join(', ')}`)
  for (const f of m.failures) lines.push(`  FAILED seed ${f.seed}: ${f.reason}`)
  return lines.join('\n')
}
