import type { Cell, Placement, Puzzle, Scene } from '../../model/index.ts'
import { defaultRegistry } from '../../solver/human/index.ts'
import type { HumanResult, Technique } from '../../solver/human/index.ts'
import { advancedRegistry } from '../../solver/advanced/index.ts'
import { makePeople } from '../generate.ts'
import { samplePlacement } from '../placement.ts'
import { enumerateTrueClues } from '../pool.ts'
import { Rng } from '../rng.ts'
import { TierError, allowsKind, difficultyScore, selectTierClues, tierById } from '../tiers/index.ts'
import type { TierDefinition, TierId } from '../tiers/index.ts'
import { DEFAULT_BUDGET_MS, Deadline } from './budget.ts'
import { qualityGate } from './gates.ts'
import type { GateFailure } from './gates.ts'
import { samplePool } from './sample.ts'

export interface ScaleOptions {
  tier: TierId
  /** Same scene + seed + tier (+ victim cell) gives the same puzzle, unless the time budget cuts the search short. */
  seed: number
  /** Wall-clock budget in ms for the whole search, all retries included. Default `DEFAULT_BUDGET_MS` (60 s). */
  budgetMs?: number
  /** Pin the victim to this cell (0-based); it must be occupiable. */
  victimCell?: Cell
  /** Placements tried before giving up. Default 100000, i.e. the time budget ends the search. */
  maxAttempts?: number
}

/** Why an attempt (one sampled placement) did not become a puzzle. */
export type ScaleRejection = GateFailure | 'no-selection' | 'timeout'

export interface ScaleReport {
  puzzle: Puzzle
  tier: TierDefinition
  seed: number
  /** Grid side (the scene is square). */
  size: number
  /** Placements tried (1 = first try). */
  attempts: number
  /** Walk of the tier's solver over the final clues. */
  human: HumanResult
  /** 0-100 difficulty; always inside the tier's range. */
  score: number
  elapsedMs: number
  budgetMs: number
  rejections: Record<ScaleRejection, number>
}

/** What is known about a seed that did not yield a puzzle: enough to reproduce and investigate it. */
export interface ScaleFailure {
  tier: TierId
  seed: number
  size: number
  attempts: number
  elapsedMs: number
  budgetMs: number
  /** True when the search stopped because the time budget ran out (not because attempts did). */
  timedOut: boolean
  rejections: Record<ScaleRejection, number>
  message: string
}

/** Thrown by `generateForScene` when a seed does not produce a puzzle inside the budget. Carries the failure report. */
export class ScaleError extends TierError {
  readonly failure: ScaleFailure

  constructor(failure: ScaleFailure) {
    super(failure.message)
    this.failure = failure
  }
}

export type ScaleResult = { ok: true; report: ScaleReport } | { ok: false; failure: ScaleFailure }

const DEFAULT_MAX_ATTEMPTS = 100_000
const MAX_ADDED = 14
/** One attempt may use at most this share of the budget (but at least `MIN_ATTEMPT_MS`), so one hopeless placement cannot eat it all. */
const ATTEMPT_SHARE = 0.35
const MIN_ATTEMPT_MS = 8000

const emptyRejections = (): Record<ScaleRejection, number> => ({
  invalid: 0,
  'not-unique': 0,
  'not-deducible': 0,
  'rating-out-of-band': 0,
  'too-many-clues': 0,
  trivial: 0,
  'no-selection': 0,
  timeout: 0,
})

/**
 * Generates a puzzle for a random scene of any size from 6x6 to 16x16 in any
 * of the six tiers, or throws a `ScaleError` naming the seed. It is the single
 * entry point of the scale layer; see `generateForSceneWithReport` for the
 * measurements and `tryGenerateForScene` for a non-throwing variant.
 */
export function generateForScene(scene: Scene, options: ScaleOptions): Puzzle {
  return generateForSceneWithReport(scene, options).puzzle
}

export function generateForSceneWithReport(scene: Scene, options: ScaleOptions): ScaleReport {
  const result = tryGenerateForScene(scene, options)
  if (!result.ok) throw new ScaleError(result.failure)
  return result.report
}

/**
 * The generator loop. Per attempt: sample a placement, enumerate and down-sample
 * the true clues (`samplePool`), select a clue set (`selectTierClues`: grow with
 * the cheap basic techniques, prune under the tier's technique cap; hard and
 * expert prune with the ADVANCED techniques, opt-in through `advancedRegistry`,
 * so `defaultRegistry` and the very-easy..medium behaviour are untouched), then
 * run the quality gates. A rejected attempt is retried on a new placement until
 * the wall-clock budget or the attempt cap runs out; then the seed is reported
 * as a failure. Nothing that fails a gate is ever returned.
 */
export function tryGenerateForScene(scene: Scene, options: ScaleOptions): ScaleResult {
  const tier = tierById(options.tier)
  const size = scene.width
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const rejections = emptyRejections()
  const deadline = new Deadline(budgetMs)
  let attempt = 0

  const fail = (message: string): ScaleResult => ({
    ok: false,
    failure: {
      tier: tier.id, seed: options.seed, size, attempts: attempt, elapsedMs: Math.round(deadline.elapsedMs()), budgetMs,
      timedOut: deadline.expired(), rejections, message,
    },
  })

  if (scene.width !== scene.height) return fail(`Scale generation needs a square scene (got ${scene.width}x${scene.height}).`)

  const { grow, prune } = techniquesFor(tier)
  const people = makePeople(size)
  const suspectIds = people.filter((p) => p.kind === 'suspect').map((p) => p.id)
  const maxAdded = Math.max(MAX_ADDED, Math.ceil((MAX_ADDED * size) / 9))
  const fallbackKinds = new Set<string>(tier.fallbackKinds)
  const rng = new Rng(options.seed)

  while (attempt < maxAttempts && !deadline.expired()) {
    attempt++
    const attemptDeadline = new Deadline(Math.min(deadline.remainingMs(), Math.max(MIN_ATTEMPT_MS, budgetMs * ATTEMPT_SHARE)))
    let sampled
    try {
      sampled = samplePlacement(scene, rng, { victimCell: options.victimCell })
    } catch (error) {
      return fail(`${error instanceof Error ? error.message : String(error)} (seed ${options.seed}, tier ${tier.id}, ${size}x${size}).`)
    }
    const solution: Placement[] = [
      { personId: 'V', cell: sampled.victim },
      ...rng.shuffle(sampled.suspects).map((cell, i) => ({ personId: suspectIds[i] as string, cell })),
    ]
    const pool = samplePool(enumerateTrueClues(scene, people, solution).filter((c) => allowsKind(tier, c.clue.type)), rng)
    const selection = selectTierClues({
      scene, people, solution, pool, techniques: prune, growTechniques: grow, rng, maxAdded, fallbackKinds,
      shouldStop: () => attemptDeadline.expired(), singlePassPrune: true,
    })
    if (!selection) {
      rejections[attemptDeadline.expired() ? 'timeout' : 'no-selection']++
      continue
    }
    const puzzle: Puzzle = { scene, people, solution, clues: selection.clues }
    const score = difficultyScore(selection.human, people.length)
    const gate = qualityGate({ puzzle, clues: selection.clues, tier, human: selection.human, score })
    if (gate) {
      rejections[gate]++
      continue
    }
    return {
      ok: true,
      report: { puzzle, tier, seed: options.seed, size, attempts: attempt, human: selection.human, score, elapsedMs: deadline.elapsedMs(), budgetMs, rejections },
    }
  }
  const why = deadline.expired() ? `${budgetMs} ms budget` : `${maxAttempts} placements`
  return fail(
    `No "${tier.id}" puzzle for seed ${options.seed} on ${size}x${size} within the ${why}: ${attempt} placements tried, rejections ${JSON.stringify(rejections)}.`,
  )
}

/** Technique sets per tier: cheap basic techniques grow the clue set; hard/expert prune with the advanced catalog. */
function techniquesFor(tier: TierDefinition): { grow: Technique[]; prune: Technique[] } {
  const grow = defaultRegistry.list().filter((t) => t.level <= tier.maxTechniqueLevel)
  if (tier.availability !== 'advanced') return { grow, prune: grow }
  return { grow, prune: advancedRegistry.list().filter((t) => t.level <= tier.maxTechniqueLevel) }
}
