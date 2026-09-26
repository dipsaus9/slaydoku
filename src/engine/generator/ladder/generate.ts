import { allowsKind, tierById } from '../tiers/index.ts'
import { auditObjectNames } from '../../clues/objectNames.ts'
import { checkClue, expandClue, isBothClue } from '../../clues/index.ts'
import { auditClues } from '../../../validation/clues.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { serializePuzzle, validateSolution } from '../../model/index.ts'
import type { Cell, Gender, ObjectType, Person, Placement, Puzzle, Scene } from '../../model/index.ts'
import { verifyPuzzle } from '../../solver/index.ts'
import { cardsOf } from '../../solvable/cards.ts'
import type { Card } from '../../solvable/cards.ts'
import { ladderCheck } from '../../solvable/ladder.ts'
import type { LadderResult } from '../../solvable/ladder.ts'
import { SOLVABLE_TIERS, assessTier, ladderMeetsTier, ladderOptions } from '../../solvable/tiers.ts'
import type { SolvableTier, SolvableTierId } from '../../solvable/tiers.ts'
import { makePeople } from '../generate.ts'
import { GeneratorError, samplePlacement } from '../placement.ts'
import { enumerateTrueClues, victimClue } from '../pool.ts'
import { Rng } from '../rng.ts'
import { withCastLabels } from './format.ts'
import { guidedSolution, stateFreeTable } from './guided.ts'
import { planLadder } from './plan.ts'
import type { PlanRules } from './plan.ts'

/** The tiers the ladder generator builds: those the human-solvability ladder decides. */
export type LadderTierId = 'very-easy' | 'easy' | 'easy-medium' | 'medium'
export const LADDER_TIER_IDS: readonly LadderTierId[] = ['very-easy', 'easy', 'easy-medium', 'medium']

export interface LadderGenerateOptions {
  /** Pin the victim to this cell (0-based); it must be an occupiable cell. */
  victimCell?: Cell
  /**
   * Demand that `tierFor(puzzle)` is the requested tier (the puzzle does not also fit an easier tier),
   * not only that it passes the requested tier's ladder. Default true: tiers mean what they say.
   */
  exact?: boolean
  /** Wall-clock budget in ms for the whole search, all retries included. Default 30000. */
  budgetMs?: number
  /** Sampled solutions tried before giving up. Default 100. */
  maxAttempts?: number
  /**
   * Gender of each suspect in the order A, B ... (a shorter list leaves the rest without). With genders the pool gets the
   * gender cards ("There was at least one woman in X's room", "X was alone with a man"), usable from medium up;
   * without, none are drawn (CAD-9.1). The pack gives the generated cast names genders (`buildCastForBoard`).
   */
  genders?: readonly (Gender | undefined)[]
}

/** One placement of the solving path. */
export interface LadderPlanStep {
  /** 1-based position in the order. */
  index: number
  personId: string
  cell: Cell
  /** Indexes in `puzzle.clues` of the cards this placement uses (empty for the victim, who takes the last square). */
  clues: number[]
  /** Squares the rows and columns of the people placed before leave, before any card is read. */
  squaresFromLines: number
}

/** Why a candidate (a sampled solution and one solving path on it) was thrown away. */
export type LadderRejection = 'no-path' | 'invalid' | 'audit' | 'ladder' | 'tier' | 'not-unique'

export interface LadderReport {
  ok: true
  puzzle: Puzzle
  /** The requested tier. */
  tier: LadderTierId
  /** The tier `tierFor` gives the puzzle: the easiest whose rules it meets (equal to `tier` when `exact`). */
  assessed: SolvableTierId
  /** The solving path the puzzle was built on: people in placement order (the victim last) with their cards. */
  order: string[]
  steps: LadderPlanStep[]
  /** `ladderCheck` of the finished puzzle with the requested tier's numbers: what a person can do. */
  ladder: LadderResult
  seed: number
  /** Sampled solutions tried (1 = first). */
  attempts: number
  elapsedMs: number
  rejections: Record<LadderRejection, number>
}

export type LadderFailureReason = 'unsupported' | 'no-placement' | 'attempts' | 'budget'

export interface LadderFailure {
  ok: false
  reason: LadderFailureReason
  message: string
  tier: LadderTierId
  seed: number
  attempts: number
  elapsedMs: number
  rejections: Record<LadderRejection, number>
}

export type LadderOutcome = LadderReport | LadderFailure

const DEFAULT_BUDGET_MS = 30_000
const DEFAULT_MAX_ATTEMPTS = 100
/** Solving paths tried on one sampled solution before a new one is sampled. */
const PATHS_PER_SOLUTION = 3

const emptyRejections = (): Record<LadderRejection, number> => ({
  'no-path': 0, invalid: 0, audit: 0, ladder: 0, tier: 0, 'not-unique': 0,
})

function tierRule(id: LadderTierId): SolvableTier {
  return SOLVABLE_TIERS.find((t) => t.id === id) as SolvableTier
}

/** Wanted cards per suspect placement, from the tier table (see docs/solvability/README.md). */
function scheduleFor(tier: SolvableTier, people: number, rng: Rng, exact: boolean): number[] {
  const slots = people - 1
  const schedule = new Array<number>(slots).fill(1)
  const spread = (count: number, cards: number) => {
    for (const i of rng.shuffle(schedule.map((_, i) => i).filter((i) => schedule[i] === 1)).slice(0, count)) schedule[i] = cards
  }
  const third = Math.floor(people / 3)
  switch (tier.id) {
    case 'very-easy':
      break
    case 'easy':
      // Mostly one card; up to a third of the placements take two (the free last one counts in the share).
      spread(exact ? Math.min(slots, 1 + rng.int(Math.max(1, third))) : rng.int(third + 1), 2)
      break
    case 'easy-medium': {
      // More than a third of the placements take two cards (so the puzzle is not also `easy`).
      const from = exact ? third + 1 : 1
      spread(Math.min(slots, from + rng.int(Math.max(1, Math.ceil((slots - from) / 2) + 1))), 2)
      break
    }
    case 'medium': {
      // At least one chain of three cards, a good part of two, the rest one; person references come with the pool.
      spread(1 + rng.int(Math.max(1, Math.ceil(slots / 3))), 3)
      spread(Math.ceil(slots * (0.3 + 0.3 * rng.next())), 2)
      break
    }
    default:
      break
  }
  return schedule
}

/**
 * Negative statements ("not beside a chair", "not with Henry", "in another room than Henry") are harder to hold in
 * the head than positive ones; the two easiest tiers leave them out.
 */
const NEGATIVE_KINDS: ReadonlySet<string> = new Set(['notBesideObject', 'notWith', 'differentRoom'])

/**
 * Which clues the tier may use. The solvability scale (CAD-8.2) limits cards per placement and person references,
 * not kinds, so every catalog kind is open (references only from medium up); very easy and easy skip the negative
 * ones. The object nouns must pass the audit of CAD-8.1.
 */
function clueFilter(id: LadderTierId, scene: Scene): (clue: CatalogClue) => boolean {
  // A combined card (CAD-9.3) is drawn from easy-medium up (two facts on one card is more to read than one); each
  // part then has to pass the tier by itself, so below medium a part cannot name a person or a gender either.
  const combinedOk = id === 'easy-medium' || id === 'medium'
  const definition = tierById('medium')
  const positiveOnly = id === 'very-easy' || id === 'easy'
  const nounOk = new Map<string, boolean>()
  const namesOk = (clue: CatalogClue): boolean => {
    if (isBothClue(clue)) return expandClue(clue).every(namesOk)
    const type = (clue.args as Record<string, unknown> | undefined)?.objectType as ObjectType | undefined
    if (type === undefined) return true
    let ok = nounOk.get(type)
    if (ok === undefined) {
      ok = auditObjectNames({ scene, clues: [clue] }).length === 0
      nounOk.set(type, ok)
    }
    return ok
  }
  const kindOk = (clue: CatalogClue): boolean =>
    clue.type !== 'aloneWithMurderer' && allowsKind(definition, clue.type) && !(positiveOnly && NEGATIVE_KINDS.has(clue.type))
  return (clue) => {
    if (isBothClue(clue)) return combinedOk && kindOk(clue) && expandClue(clue).every(kindOk) && namesOk(clue)
    return kindOk(clue) && namesOk(clue)
  }
}

/** The true cards of the solution the tier may use (no person references below medium), shuffled. */
function cardsFor(id: LadderTierId, allowed: (clue: CatalogClue) => boolean, scene: Scene, people: readonly Person[], solution: readonly Placement[], rng: Rng): Card[] {
  const rule = tierRule(id)
  const pool = enumerateTrueClues(scene, people, solution, { newKinds: true })
    .map((c) => c.clue)
    .filter(allowed)
  const cards = cardsOf({ clues: pool, people }).filter((card) => rule.references || !card.referencing)
  // A shuffled pool: ties in the plan then break by seed, not by the enumeration order.
  return rng.shuffle(cards)
}

/**
 * Generates a puzzle solve-path first, for a scene of any size, on the human-solvability scale of
 * `src/engine/solvable`. It samples the solution (the victim pinned to `victimCell` when given; the
 * victim room always holds exactly one suspect), picks an order of the people and, for each, the cards
 * that leave one square once the rows and columns of the people placed before are crossed off
 * (`planLadder`); the victim card comes last. Cards that name a person only name somebody placed
 * earlier. The result is then judged by the oracle, not by the plan: `ladderCheck` must pass the
 * requested tier, `verifyPuzzle` must find exactly one solution and `auditObjectNames` must be clean.
 * A candidate that fails goes back into the loop, bounded by `maxAttempts` and `budgetMs`.
 *
 * Deterministic: the same scene, tier, seed and options give the same puzzle (unless the time budget
 * cuts the search short first). Suspects are `A`, `B`...; the victim is `V` and comes last.
 */
export function generateLadder(scene: Scene, tier: LadderTierId, seed: number, options: LadderGenerateOptions = {}): LadderOutcome {
  const started = performance.now()
  const rejections = emptyRejections()
  let attempts = 0
  const elapsed = () => Math.round(performance.now() - started)
  const fail = (reason: LadderFailureReason, message: string): LadderFailure => ({
    ok: false, reason, message, tier, seed, attempts, elapsedMs: elapsed(), rejections,
  })

  if (!LADDER_TIER_IDS.includes(tier)) return fail('unsupported', `Tier "${tier}" is not a ladder tier (use ${LADDER_TIER_IDS.join(', ')}).`)
  if (scene.width !== scene.height) return fail('unsupported', `The generator needs a square scene, got ${scene.width}x${scene.height}.`)
  if (scene.width < 3 || scene.width > 27) return fail('unsupported', `Unsupported grid size ${scene.width}: use 3 to 27.`)

  const rule = tierRule(tier)
  const exact = options.exact ?? true
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  let suspectNo = 0
  const people = makePeople(scene.width).map((p) => {
    if (p.kind !== 'suspect') return p
    const gender = options.genders?.[suspectNo++]
    return gender === undefined ? p : { ...p, gender }
  })
  const suspectIds = people.filter((p) => p.kind === 'suspect').map((p) => p.id)
  const victim = people.find((p) => p.kind === 'victim') as Person
  const rng = new Rng(seed)
  const allowed = clueFilter(tier, scene)
  const lineCap = Math.max(2, Math.floor(people.length / 3))
  /** Very easy puzzles take one card per placement: that only works where the people stand right. */
  const guided = tier === 'very-easy'

  while (attempts < maxAttempts) {
    if (performance.now() - started > budgetMs) return fail('budget', `No "${tier}" puzzle in ${elapsed()} ms (${attempts} solutions tried).`)
    attempts++
    let solution: Placement[]
    try {
      let sampled: { victim: Cell; suspects: Cell[] } | null
      if (guided) {
        // One card per placement is only possible where the people stand right: choose the cells along the path.
        sampled = guidedSolution(scene, stateFreeTable(scene, tier, allowed), rng, {
          victimCell: options.victimCell, entries: rule.minPlaceableAlone, lineCap, nodeBudget: 800,
          maxSquares: rule.maxSquaresFromCards, lastSquares: rule.lastSquaresFromCards,
        })
        if (!sampled) {
          rejections['no-path']++
          continue
        }
      } else {
        sampled = samplePlacement(scene, rng, { victimCell: options.victimCell })
      }
      solution = [
        { personId: victim.id, cell: sampled.victim },
        ...rng.shuffle(sampled.suspects).map((cell, i) => ({ personId: suspectIds[i] as string, cell })),
      ]
    } catch (error) {
      if (error instanceof GeneratorError) return fail('no-placement', error.message)
      throw error
    }
    const cards = cardsFor(tier, allowed, scene, people, solution, rng)

    for (let path = 0; path < PATHS_PER_SOLUTION; path++) {
      if (performance.now() - started > budgetMs) return fail('budget', `No "${tier}" puzzle in ${elapsed()} ms (${attempts} solutions tried).`)
      const rules: PlanRules = {
        maxCards: rule.maxCards,
        references: rule.references,
        maxTopSteps: rule.maxTopShare < 1 ? Math.floor(people.length * rule.maxTopShare + 1e-9) : Infinity,
        minPlaceableAlone: rule.minPlaceableAlone,
        maxSquares: rule.maxSquaresFromCards,
        lastSquares: rule.lastSquaresFromCards,
        maxChain: rule.maxChain,
        lineCap,
        schedule: scheduleFor(rule, people.length, rng, exact),
      }
      const plan = planLadder({ scene, people, solution, cards, rules, rng })
      if (!plan) {
        rejections['no-path']++
        continue
      }
      // Cards in a shuffled order, so the list on the table does not give the order of the path away.
      const chosen = plan.flatMap((s) => s.cards)
      const victimCard = victimClue(victim)
      const entries: { clue: CatalogClue; card: Card | null }[] = rng.shuffle([
        ...chosen.map((card) => ({ clue: card.clue, card })),
        { clue: victimCard, card: null },
      ])
      const indexOf = new Map<Card, number>()
      entries.forEach((e, i) => {
        if (e.card) indexOf.set(e.card, i)
      })
      const puzzle: Puzzle = { scene, people, solution, clues: entries.map((e) => e.clue) }
      const rejected = judge(puzzle, rule, tier, exact)
      if ('reason' in rejected) {
        rejections[rejected.reason]++
        continue
      }
      const steps: LadderPlanStep[] = [
        ...plan.map((s, i) => ({
          index: i + 1, personId: s.personId, cell: s.cell, clues: s.cards.map((c) => indexOf.get(c) as number), squaresFromLines: s.squaresFromLines,
        })),
        {
          index: plan.length + 1, personId: victim.id, cell: (solution.find((p) => p.personId === victim.id) as Placement).cell,
          clues: [entries.findIndex((e) => e.card === null)], squaresFromLines: 1,
        },
      ]
      return {
        ok: true, puzzle, tier, assessed: rejected.assessed, order: steps.map((s) => s.personId), steps,
        ladder: ladderCheck(puzzle, ladderOptions(rule)), seed, attempts,
        elapsedMs: elapsed(), rejections,
      }
    }
  }
  return fail('attempts', `No "${tier}" puzzle after ${attempts} solutions (${JSON.stringify(rejections)}).`)
}

/** The oracle: the tier the puzzle is on when it is good, else why it is not. */
function judge(puzzle: Puzzle, rule: SolvableTier, tier: LadderTierId, exact: boolean): { reason: LadderRejection } | { assessed: SolvableTierId } {
  if (!validateSolution(puzzle).ok) return { reason: 'invalid' }
  for (const clue of puzzle.clues) if (checkClue(clue, puzzle).length > 0) return { reason: 'invalid' }
  if (auditObjectNames(puzzle).length > 0) return { reason: 'audit' }
  // The clue audit of the pack gate (readable one-sentence cards, no card said twice, kinds the tier allows, enough direct cards).
  // Judged with cast names: the audit counts the "en" of a combined card and strips the names first, and a letter label (A, B ...) would eat letters of the text.
  if (auditClues(withCastLabels(puzzle), tier).length > 0) return { reason: 'audit' }
  const ladder = ladderCheck(puzzle, ladderOptions(rule))
  if (!ladderMeetsTier(puzzle, ladder, rule)) return { reason: 'ladder' }
  const assessed = assessTier(puzzle).tier
  if (exact && assessed !== tier) return { reason: 'tier' }
  if (!verifyPuzzle(serializePuzzle(puzzle)).ok) return { reason: 'not-unique' }
  return { assessed }
}
