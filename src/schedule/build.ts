import { isLadderTier } from '../content/packs/gates.ts'
import { buildEntry } from '../content/packs/build.ts'
import { gateOf } from '../content/packs/sweep.ts'
import type { Cast } from '../content/cast/index.ts'
import { puzzleFingerprint } from '../game/fingerprint.ts'
import { missingCardText } from '../render/cards/cardText.ts'
import { fallbackCast } from './cast.ts'
import { ATTEMPT_WINDOW, FALLBACK_SIZE, canFallBack } from './pick.ts'
import type { DayPlan, ScheduleDay } from './types.ts'

/*
 * Builds the puzzle of one planned day. Node side only (it renders the card grid, like the sweep); the tool and the tests import it by path.
 */

/** Wall clock one seed may take, in ms. 12x12 hard and expert are slow (5 to 20 s a seed, seen up to 60 s on a busy machine): they get more. */
export const attemptBudgetMs = (plan: Pick<DayPlan, 'size' | 'tier'>): number => (plan.size >= 12 && !isLadderTier(plan.tier) ? 120_000 : 60_000)

/**
 * Wall clock one day may take across all its seeds, in ms. When it runs out the day counts as exhausted, like a used-up window, and a planned
 * 12x12 hard or expert day falls back (see `canFallBack`). This is the only place the schedule reads the clock: on a machine fast enough
 * for the seeds to finish it never triggers, and the output does not depend on the machine.
 */
export const DAY_BUDGET_MS = 600_000

/** One seed that did not become the day's puzzle: which gate rejected it (as named by the generation sweep, plus `screen`) and why. */
export interface AttemptRecord {
  seed: number
  gate: string
  reason: string
  ms: number
}

export type DayBuild =
  | { ok: true; day: ScheduleDay; rejected: AttemptRecord[]; ms: number }
  | { ok: false; rejected: AttemptRecord[]; reason: string; ms: number }

/**
 * Tries the seeds of a day's window in order (`plan.seed` .. `plan.seed + ATTEMPT_WINDOW - 1`) at `size` and returns the first that passes every gate
 * (`buildEntry`: scene, generator, cast, all gates of `entryProblems`; then the rendered-screen check). Every rejected seed is listed with the gate that
 * rejected it. Same plan, size and cast give the same day.
 */
export function buildDay(plan: DayPlan, size: number, cast: Cast, fallbackFrom?: number, dayBudgetMs = DAY_BUDGET_MS): DayBuild {
  const started = performance.now()
  const rejected: AttemptRecord[] = []
  const budgetMs = attemptBudgetMs({ size, tier: plan.tier })
  for (let attempt = 0; attempt < ATTEMPT_WINDOW; attempt++) {
    if (performance.now() - started > dayBudgetMs) return { ok: false, rejected, reason: `day budget of ${dayBudgetMs / 1000} s used up after ${attempt} seeds`, ms: Math.round(performance.now() - started) }
    const seed = plan.seed + attempt
    const from = performance.now()
    const built = buildEntry(size, plan.tier, plan.theme, seed, budgetMs, undefined, cast)
    const record = (gate: string, reason: string) => rejected.push({ seed, gate, reason: reason.slice(0, 200), ms: Math.round(performance.now() - from) })
    if (!built.ok) {
      const gate = built.problems ? [...new Set(built.problems.map(gateOf))].join(',') : 'generation'
      record(gate, built.reason)
      continue
    }
    const missing = missingCardText(built.entry.puzzle)
    if (missing.length > 0) {
      record('screen', missing.join('; '))
      continue
    }
    const { entry } = built
    const day: ScheduleDay = {
      n: plan.n, date: plan.date, size, tier: plan.tier, theme: plan.theme, seed, attempts: attempt + 1,
      ...(fallbackFrom === undefined ? {} : { fallbackFrom }),
      title: entry.title, portraits: cast.portraits, puzzle: entry.puzzle, fp: puzzleFingerprint(entry.puzzle),
    }
    return { ok: true, day, rejected, ms: Math.round(performance.now() - started) }
  }
  return { ok: false, rejected, reason: `no seed of ${plan.seed}..${plan.seed + ATTEMPT_WINDOW - 1} passed every gate`, ms: Math.round(performance.now() - started) }
}

/**
 * The fallback rule. A planned 12x12 hard or expert day whose nominal build ran dry (no seed of the window passed, or the day budget
 * was used up) is built again as `FALLBACK_SIZE` (9x9) with the same tier, theme and seed window, and the cast of `fallbackCast`
 * (`previousNames`: the day before as it really is). Every other build, a good one or one that ran dry on a day that may not fall back,
 * comes back as it is. The rejected seeds of the failed 12x12 stay in front of the fallback's own, so the report shows both.
 */
export function withFallback(plan: DayPlan, built: DayBuild, previousNames: readonly string[], make: typeof buildDay = buildDay): { build: DayBuild; fellBack: boolean } {
  if (built.ok || !canFallBack(plan)) return { build: built, fellBack: false }
  const fallback = make(plan, FALLBACK_SIZE, fallbackCast(plan.date, FALLBACK_SIZE, previousNames), plan.size)
  const rejected = [...built.rejected, ...fallback.rejected]
  const ms = built.ms + fallback.ms
  return {
    build: fallback.ok ? { ok: true, day: fallback.day, rejected, ms } : { ok: false, rejected, reason: `${built.reason}; fallback: ${fallback.reason}`, ms },
    fellBack: true,
  }
}
