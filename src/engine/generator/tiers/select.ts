import { evaluate } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import type { Person, Placement, Scene } from '../../model/index.ts'
import { solve } from '../../solver/index.ts'
import { solveHuman } from '../../solver/human/index.ts'
import type { HumanResult, Technique } from '../../solver/human/index.ts'
import { SELF_CLUE_TYPES, victimClue } from '../pool.ts'
import type { ClueCandidate } from '../pool.ts'
import type { Rng } from '../rng.ts'

export interface TierSelectInput {
  scene: Scene
  people: readonly Person[]
  /** The planted solution every pool clue is true for. */
  solution: readonly Placement[]
  /** Already restricted to the tier's allowed clue kinds. */
  pool: readonly ClueCandidate[]
  /** The techniques the tier permits: a human using only these must finish the puzzle. */
  techniques: readonly Technique[]
  rng: Rng
  /** Kinds that work but are bland (plain row/column numbers): not used as a starting card, and drawn half as often when growing. */
  fallbackKinds?: ReadonlySet<string>
  /** Clues that may be added on top of the starting cards before the attempt is given up. */
  maxAdded: number
  /**
   * Techniques the GROWING phase uses to judge progress (default: `techniques`).
   * Hard and expert grow with the cheap basic techniques and only prune with
   * the advanced ones, which keeps big grids affordable.
   */
  growTechniques?: readonly Technique[]
  /** Polled between expensive steps; returning true abandons the attempt (null). A wall-clock deadline hook. */
  shouldStop?: () => boolean
  /**
   * Prune in ONE pass instead of repeating until nothing goes. Removing a clue
   * only ever makes uniqueness and deducibility harder, so a clue that could
   * not go once cannot go later; the extra passes only re-confirm that (and
   * cost a full pass of solver runs, which is what makes 16x16 slow).
   */
  singlePassPrune?: boolean
}

export interface TierSelection {
  /** In people order, the victim card first. */
  clues: CatalogClue[]
  /** The walk-through with the capped technique set (identical to the full solver's when it solves). */
  human: HumanResult
}

const SAMPLE_SOLUTIONS = 24
const CUT_CANDIDATES = 120
const HUMAN_CANDIDATES = 24
/** Random self clues compared per suspect when the starting cards are drawn. */
const INITIAL_DRAWS = 4
/**
 * Cap on one search for sample solutions while growing, in `shouldStop` polls (the solver polls every 256 nodes,
 * so 600 polls are about 150k nodes, roughly 1.5 s on a 16x16 board). Counted, not timed: a wall-clock leash made
 * the result depend on machine load, and the committed packs (CAD-4.25) must regenerate byte for byte.
 */
const SAMPLE_SEARCH_POLLS = 600

/**
 * Tier-aware sibling of `selectClues` (CAD-4.7): the same grow-then-prune
 * recipe, but the human solver is limited to the tier's techniques, so
 * "solvable" already means "solvable inside the tier's technique cap", and the
 * pool only holds the tier's clue kinds.
 *
 * 1. The victim card plus one random self clue per suspect.
 * 2. While the CP solver finds several solutions, add the candidate that
 *    rules out most sampled wrong solutions.
 * 3. Once unique, while the capped human solver stalls, add the candidate
 *    (about somebody still unplaced) that gets it furthest.
 * 4. Prune in random order until no clue can go without losing uniqueness,
 *    capped-human solvability or a suspect's last self clue.
 *
 * Returns null when the rounds run out; the caller retries on a new placement.
 */
export function selectTierClues(input: TierSelectInput): TierSelection | null {
  const { scene, people, solution, pool, techniques, rng, maxAdded, fallbackKinds = new Set<string>() } = input
  const stop = input.shouldStop ?? (() => false)
  const growTechniques = input.growTechniques ?? techniques
  const victim = people.find((p) => p.kind === 'victim')
  if (!victim) return null
  const mandatory = victimClue(victim)
  const suspects = people.filter((p) => p.kind === 'suspect')
  const human = (clues: readonly CatalogClue[]) => solveHuman(scene, people, clues, { techniques })
  const growHuman = (clues: readonly CatalogClue[]) => solveHuman(scene, people, clues, { techniques: growTechniques })

  const byHolder = new Map<string, Map<string, ClueCandidate[]>>()
  for (const candidate of pool) {
    const kinds = byHolder.get(candidate.clue.personId) ?? new Map<string, ClueCandidate[]>()
    const list = kinds.get(candidate.clue.type) ?? []
    list.push(candidate)
    kinds.set(candidate.clue.type, list)
    byHolder.set(candidate.clue.personId, kinds)
  }
  const chosen = new Set<string>()
  const key = (clue: CatalogClue) => JSON.stringify(clue)

  /** Kind first, then a clue of that kind, so rare kinds are not drowned by many weak ones. */
  const draw = (holders: readonly Person[]): CatalogClue | null => {
    const kinds = [...(byHolder.get(rng.pick(holders).id)?.values() ?? [])]
    if (kinds.length === 0) return null
    let list = rng.pick(kinds)
    if (fallbackKinds.has(list[0]?.clue.type ?? '')) list = rng.pick(kinds)
    return rng.pick(list).clue
  }
  const drawMany = (holders: readonly Person[], count: number): CatalogClue[] => {
    const out = new Map<string, CatalogClue>()
    for (let i = 0; i < count * 2 && out.size < count; i++) {
      const clue = draw(holders)
      if (clue && !chosen.has(key(clue))) out.set(key(clue), clue)
    }
    return [...out.values()]
  }

  let clues: CatalogClue[] = [mandatory]
  for (const suspect of suspects) {
    const all = [...(byHolder.get(suspect.id)?.entries() ?? [])].filter(([type]) => SELF_CLUE_TYPES.has(type))
    const preferred = all.filter(([type]) => !fallbackKinds.has(type))
    const selfKinds = preferred.length > 0 ? preferred : all
    if (selfKinds.length === 0) return null
    // Best of a few random draws: the one that leaves the holder the fewest squares.
    let clue = rng.pick(rng.pick(selfKinds)[1]).clue
    let fewest = squaresLeft(scene, solution, clue)
    for (let i = 1; i < INITIAL_DRAWS; i++) {
      const other = rng.pick(rng.pick(selfKinds)[1]).clue
      const left = squaresLeft(scene, solution, other)
      if (left < fewest) {
        clue = other
        fewest = left
      }
    }
    clues.push(clue)
    chosen.add(key(clue))
  }

  let walk: HumanResult | null = null
  for (let round = 0; round < maxAdded && walk === null; round++) {
    if (stop()) return null
    // A sparse clue set on a big grid can take the CP solver a minute to find 24 solutions; the ones it found
    // by the sample cap are enough to judge cuts, so the sample search gets a short leash of its own.
    // (Only with a deadline hook: without one the search stays unbounded and deterministic, as in CAD-4.8.)
    let polls = 0
    const leash = input.shouldStop ? SAMPLE_SEARCH_POLLS : Number.POSITIVE_INFINITY
    const { count, solutions, aborted } = solve(scene, [...people], clues, {
      limit: SAMPLE_SOLUTIONS,
      shouldStop: () => stop() || ++polls > leash,
    })
    if (stop() || count === 0 || (aborted && count < 2)) return null
    let added: CatalogClue | null
    if (count > 1) {
      added = bestByCut(scene, solutions, solution, drawMany(suspects, CUT_CANDIDATES))
    } else {
      const result = growHuman(clues)
      if (result.solved) {
        walk = result
        break
      }
      const stuck = suspects.filter((s) => !result.placements.some((p) => p.personId === s.id))
      added = bestByHuman(drawMany(stuck.length > 0 ? stuck : suspects, HUMAN_CANDIDATES), clues, growHuman, stop)
    }
    if (!added) return null
    clues = [...clues, added]
    chosen.add(key(added))
  }
  if (walk === null) return null

  let removed = true
  while (removed) {
    removed = false
    for (const clue of rng.shuffle(clues)) {
      if (stop()) return null
      if (clue === mandatory || !keepsSelfClue(clues, clue, suspects)) continue
      const rest = clues.filter((c) => c !== clue)
      const check = solve(scene, [...people], rest, { limit: 2, shouldStop: stop })
      if (check.aborted) return null
      if (check.count === 1 && human(rest).solved) {
        clues = rest
        removed = true
      }
    }
    if (input.singlePassPrune) break
  }

  const order = new Map(people.map((p, i) => [p.id, i]))
  const sorted = [...clues].sort((a, b) => (order.get(a.personId) ?? 0) - (order.get(b.personId) ?? 0))
  const finalWalk = human(sorted)
  return finalWalk.solved ? { clues: sorted, human: finalWalk } : null
}

/** Squares the holder could stand on with everybody else where they are and the clue still true (lower = more telling). */
function squaresLeft(scene: Scene, solution: readonly Placement[], clue: CatalogClue): number {
  let count = 0
  const others = solution.filter((p) => p.personId !== clue.personId)
  for (let row = 0; row < scene.height; row++) {
    for (let col = 0; col < scene.width; col++) {
      if (evaluate(clue, scene, [...others, { personId: clue.personId, cell: { row, col } }])) count++
    }
  }
  return count
}

/** Removing `clue` must leave its holder at least one clue about themself (the victim needs none). */
function keepsSelfClue(clues: CatalogClue[], clue: CatalogClue, suspects: readonly Person[]): boolean {
  if (!SELF_CLUE_TYPES.has(clue.type) || !suspects.some((s) => s.id === clue.personId)) return true
  return clues.some((c) => c !== clue && c.personId === clue.personId && SELF_CLUE_TYPES.has(c.type))
}

function bestByCut(
  scene: Scene,
  solutions: Placement[][],
  solution: readonly Placement[],
  candidates: CatalogClue[],
): CatalogClue | null {
  const planted = new Map(solution.map((p) => [p.personId, `${p.cell.row},${p.cell.col}`]))
  const wrong = solutions.filter((s) => s.some((p) => planted.get(p.personId) !== `${p.cell.row},${p.cell.col}`))
  let best: CatalogClue | null = null
  let bestCut = -1
  for (const clue of candidates) {
    const cut = wrong.filter((s) => !evaluate(clue, scene, s)).length
    if (cut > bestCut) {
      best = clue
      bestCut = cut
    }
  }
  return best
}

function bestByHuman(
  candidates: CatalogClue[],
  clues: CatalogClue[],
  human: (clues: readonly CatalogClue[]) => HumanResult,
  stop: () => boolean = () => false,
): CatalogClue | null {
  let best: CatalogClue | null = null
  let bestScore = -1
  for (const clue of candidates) {
    if (stop()) return best
    const result = human([...clues, clue])
    // Progress: solved beats placements beats candidates removed (a stall with more done is closer).
    const removed = result.steps.reduce((sum, step) => sum + step.eliminated.length, 0)
    const score = (result.solved ? 1_000_000 : 0) + result.placements.length * 1000 + removed
    if (score > bestScore) {
      best = clue
      bestScore = score
    }
    if (result.solved) break
  }
  return best
}
