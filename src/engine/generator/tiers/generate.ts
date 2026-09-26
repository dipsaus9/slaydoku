import type { CatalogClue } from '../../clues/index.ts'
import type { Cell, Placement, Puzzle, Scene } from '../../model/index.ts'
import { validateSolution } from '../../model/index.ts'
import { defaultRegistry } from '../../solver/human/index.ts'
import type { HumanResult } from '../../solver/human/index.ts'
import { makePeople } from '../generate.ts'
import { GeneratorError, samplePlacement } from '../placement.ts'
import { enumerateTrueClues } from '../pool.ts'
import { Rng } from '../rng.ts'
import { selectTierClues } from './select.ts'
import { allowsKind, difficultyScore, tierById, tierForScore } from './tiers.ts'
import type { TierDefinition, TierId } from './tiers.ts'

export interface TierGenerateOptions {
  /** Same scene + seed + tier (+ victim cell) gives the same puzzle, unless the time budget cuts the search short. */
  seed: number
  tier: TierId
  /** Pin the victim to this cell (0-based); it must be occupiable. */
  victimCell?: Cell
  /** Placements tried before giving up. Default 2000. */
  maxAttempts?: number
  /** Wall-clock budget in ms for the whole search. Default 30000. */
  timeBudgetMs?: number
}

/** Why the placements that were tried did not yield an acceptable puzzle. */
export type RejectionReason = 'no-selection' | 'invalid' | 'rating-out-of-band' | 'too-many-clues'

export interface TierReport {
  puzzle: Puzzle
  tier: TierDefinition
  /** Placements tried (1 = first try). */
  attempts: number
  human: HumanResult
  /** 0-100 difficulty (see `difficultyScore`); always inside the tier's range. */
  score: number
  elapsedMs: number
  rejections: Record<RejectionReason, number>
}

export class TierError extends GeneratorError {}

const MAX_ADDED = 14
const DEFAULT_MAX_ATTEMPTS = 2000
const DEFAULT_TIME_BUDGET_MS = 30_000

/** True when a technique of at least this level is registered (the advanced tiers wait for CAD-4.22). */
const techniquesReach = (level: number): boolean => defaultRegistry.list().some((t) => t.level >= level)

/**
 * Generates a puzzle whose human-solver rating lies inside `tier`: only the
 * tier's clue kinds are used, the human solver is capped at the tier's
 * technique level, the result must reach the tier's minimum level and land in
 * its 0-100 score range, and it may carry at most the tier's extra clue cards.
 * A rejection loop over new placements does that, bounded by `maxAttempts` AND
 * `timeBudgetMs`; hitting either throws a TierError.
 */
export function generateTier(scene: Scene, options: TierGenerateOptions): Puzzle {
  return generateTierWithReport(scene, options).puzzle
}

export function generateTierWithReport(scene: Scene, options: TierGenerateOptions): TierReport {
  const tier = tierById(options.tier)
  if (tier.availability === 'advanced' && !techniquesReach(tier.minTechniqueLevel)) {
    throw new TierError(
      `Tier "${tier.id}" needs a technique of level ${tier.minTechniqueLevel}; the human solver only has the basic ones (story CAD-4.22 adds them).`,
    )
  }
  const started = performance.now()
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const budget = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS
  const people = makePeople(scene.width)
  const suspectIds = people.filter((p) => p.kind === 'suspect').map((p) => p.id)
  const techniques = defaultRegistry.list().filter((t) => t.level <= tier.maxTechniqueLevel)
  const fallbackKinds = new Set<string>(tier.fallbackKinds)
  const rng = new Rng(options.seed)
  const rejections: Record<RejectionReason, number> = {
    'no-selection': 0, invalid: 0, 'rating-out-of-band': 0, 'too-many-clues': 0,
  }

  let attempt = 0
  while (attempt < maxAttempts && performance.now() - started < budget) {
    attempt++
    const sampled = samplePlacement(scene, rng, { victimCell: options.victimCell })
    const solution: Placement[] = [
      { personId: 'V', cell: sampled.victim },
      ...rng.shuffle(sampled.suspects).map((cell, i) => ({ personId: suspectIds[i] as string, cell })),
    ]
    const pool = enumerateTrueClues(scene, people, solution).filter((c) => allowsKind(tier, c.clue.type))
    const selection = selectTierClues({ scene, people, solution, pool, techniques, rng, maxAdded: MAX_ADDED, fallbackKinds })
    if (!selection) {
      rejections['no-selection']++
      continue
    }
    const puzzle: Puzzle = { scene, people, solution, clues: selection.clues }
    if (!validateSolution(puzzle).ok) {
      rejections.invalid++
      continue
    }
    const score = difficultyScore(selection.human, people.length)
    if (tierForScore(score).id !== tier.id || !levelInBand(selection.human, tier)) {
      rejections['rating-out-of-band']++
      continue
    }
    if (!withinCluePolicy(selection.clues, people.length, tier)) {
      rejections['too-many-clues']++
      continue
    }
    return { puzzle, tier, attempts: attempt, human: selection.human, score, elapsedMs: performance.now() - started, rejections }
  }
  const spent = Math.round(performance.now() - started)
  throw new TierError(
    `No "${tier.id}" puzzle after ${attempt} placements in ${spent} ms (${JSON.stringify(rejections)}).`,
  )
}

function levelInBand(human: HumanResult, tier: TierDefinition): boolean {
  const level = human.maxTechnique?.level ?? 0
  return human.solved && level >= tier.minTechniqueLevel && level <= tier.maxTechniqueLevel
}

function withinCluePolicy(clues: readonly CatalogClue[], peopleCount: number, tier: TierDefinition): boolean {
  if (clues.length > peopleCount + tier.clues.maxExtraClues) return false
  const perHolder = new Map<string, number>()
  for (const clue of clues) perHolder.set(clue.personId, (perHolder.get(clue.personId) ?? 0) + 1)
  return [...perHolder.values()].every((n) => n <= tier.clues.maxCluesPerSuspect)
}
