import { evaluate } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import type { Person, Placement, Scene } from '../model/index.ts'
import { solve } from '../solver/index.ts'
import { solveHuman } from '../solver/human/index.ts'
import type { HumanResult } from '../solver/human/index.ts'
import { SELF_CLUE_TYPES, victimClue } from './pool.ts'
import type { ClueCandidate } from './pool.ts'
import type { Rng } from './rng.ts'

export interface SelectInput {
  scene: Scene
  people: readonly Person[]
  /** The planted solution every pool clue is true for. */
  solution: readonly Placement[]
  pool: readonly ClueCandidate[]
  rng: Rng
}

export interface Selection {
  /** In people order: every suspect's clue(s), the victim card first. */
  clues: CatalogClue[]
  human: HumanResult
}

/** Alternative solutions sampled per round to judge how much a candidate clue cuts. */
const SAMPLE_SOLUTIONS = 24
/** Candidate clues drawn and scored per round. */
const CANDIDATES_PER_ROUND = 60
/** Candidates tried per round when the human solver is the judge (a full solveHuman each). */
const HUMAN_CANDIDATES = 16
const MAX_ROUNDS = 40

/**
 * Picks the clue set for a planted solution.
 *
 * 1. Every suspect gets one random clue about themself; the victim gets the
 *    fixed murderer card.
 * 2. While the CP solver finds several solutions, add the candidate that
 *    rules out most of the sampled wrong solutions.
 * 3. Once unique, while the HUMAN solver still stalls (a set minimal only for
 *    the CP solver often does), add the candidate that gets it furthest.
 * 4. Prune: drop clues one by one while the set stays unique AND the human
 *    solver still finishes, and every suspect keeps a clue about themself.
 *    Passes repeat until a full pass removes nothing, so the result is minimal
 *    for exactly that pair of checks.
 *
 * Returns null when the rounds run out (the caller retries on a new placement).
 */
export function selectClues(input: SelectInput): Selection | null {
  const { scene, people, solution, pool, rng } = input
  const victim = people.find((p) => p.kind === 'victim')
  if (!victim) return null
  const mandatory = victimClue(victim)
  const suspects = people.filter((p) => p.kind === 'suspect')

  const byHolder = new Map<string, Map<string, ClueCandidate[]>>()
  for (const candidate of pool) {
    const holder = candidate.clue.personId
    const kinds = byHolder.get(holder) ?? new Map<string, ClueCandidate[]>()
    const list = kinds.get(candidate.clue.type) ?? []
    list.push(candidate)
    kinds.set(candidate.clue.type, list)
    byHolder.set(holder, kinds)
  }
  const chosen = new Set<string>()
  const key = (clue: CatalogClue) => JSON.stringify(clue)

  /** Kind first, then a clue of that kind: keeps rare kinds from drowning in the many weak direction clues. */
  const draw = (holders: readonly Person[]): CatalogClue | null => {
    const holder = rng.pick(holders)
    const kinds = [...(byHolder.get(holder.id)?.values() ?? [])]
    if (kinds.length === 0) return null
    return rng.pick(rng.pick(kinds)).clue
  }
  const drawFresh = (holders: readonly Person[]): CatalogClue | null => {
    for (let i = 0; i < 8; i++) {
      const clue = draw(holders)
      if (clue && !chosen.has(key(clue))) return clue
    }
    return null
  }

  let clues: CatalogClue[] = [mandatory]
  for (const suspect of suspects) {
    const own = byHolder.get(suspect.id)
    if (!own) return null
    const selfKinds = [...own.entries()].filter(([type]) => SELF_CLUE_TYPES.has(type))
    if (selfKinds.length === 0) return null
    const clue = rng.pick(rng.pick(selfKinds)[1]).clue
    clues.push(clue)
    chosen.add(key(clue))
  }

  // Phase 2 and 3: grow until unique and human solvable.
  let human: HumanResult | null = null
  for (let round = 0; round < MAX_ROUNDS && human === null; round++) {
    const { count, solutions } = solve(scene, [...people], clues, { limit: SAMPLE_SOLUTIONS })
    if (count > 1) {
      const added = bestByCut(scene, solutions, solution, drawMany(drawFresh, people, CANDIDATES_PER_ROUND))
      if (!added) return null
      clues = [...clues, added]
      chosen.add(key(added))
      continue
    }
    if (count === 0) return null
    const result = solveHuman(scene, people, clues)
    if (result.solved) {
      human = result
      break
    }
    const stuck = suspects.filter((s) => !result.placements.some((p) => p.personId === s.id))
    const added = bestByHuman(scene, people, clues, stuck.length > 0 ? stuck : suspects, drawFresh)
    if (!added) return null
    clues = [...clues, added]
    chosen.add(key(added))
  }
  if (human === null) return null

  // Phase 4: prune to minimal, random order, repeat until a pass changes nothing.
  let removed = true
  while (removed) {
    removed = false
    for (const clue of rng.shuffle(clues)) {
      if (clue === mandatory || !keepsSelfClue(clues, clue, suspects)) continue
      const rest = clues.filter((c) => c !== clue)
      if (isUniqueAndDeducible(scene, people, rest)) {
        clues = rest
        removed = true
      }
    }
  }

  const order = new Map(people.map((p, i) => [p.id, i]))
  const sorted = [...clues].sort((a, b) => (order.get(a.personId) ?? 0) - (order.get(b.personId) ?? 0))
  const finalHuman = solveHuman(scene, people, sorted)
  if (!finalHuman.solved) return null
  return { clues: sorted, human: finalHuman }
}

/** The pair of checks the generator guarantees: exactly one CP solution and a human solve without guessing. */
export function isUniqueAndDeducible(scene: Scene, people: readonly Person[], clues: CatalogClue[]): boolean {
  return solve(scene, [...people], clues, { limit: 2 }).count === 1 && solveHuman(scene, people, clues).solved
}

/** Removing `clue` must leave its holder at least one clue about themself (the victim needs none). */
function keepsSelfClue(clues: CatalogClue[], clue: CatalogClue, suspects: readonly Person[]): boolean {
  if (!SELF_CLUE_TYPES.has(clue.type)) return true
  if (!suspects.some((s) => s.id === clue.personId)) return true
  return clues.some((c) => c !== clue && c.personId === clue.personId && SELF_CLUE_TYPES.has(c.type))
}

function drawMany(
  drawFresh: (holders: readonly Person[]) => CatalogClue | null,
  people: readonly Person[],
  count: number,
): CatalogClue[] {
  const suspects = people.filter((p) => p.kind === 'suspect')
  const out = new Map<string, CatalogClue>()
  for (let i = 0; i < count; i++) {
    const clue = drawFresh(suspects)
    if (clue) out.set(JSON.stringify(clue), clue)
  }
  return [...out.values()]
}

/** The candidate that is false in most of the sampled wrong solutions. */
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

/** The candidate (about somebody the human has not placed) that lets the human solver place the most people. */
function bestByHuman(
  scene: Scene,
  people: readonly Person[],
  clues: CatalogClue[],
  holders: readonly Person[],
  drawFresh: (holders: readonly Person[]) => CatalogClue | null,
): CatalogClue | null {
  let best: CatalogClue | null = null
  let bestScore = -1
  const seen = new Set<string>()
  for (let i = 0; i < HUMAN_CANDIDATES; i++) {
    const clue = drawFresh(holders)
    if (!clue || seen.has(JSON.stringify(clue))) continue
    seen.add(JSON.stringify(clue))
    const result = solveHuman(scene, people, [...clues, clue])
    const score = (result.solved ? 1000 : 0) + result.placements.length
    if (score > bestScore) {
      best = clue
      bestScore = score
    }
    if (result.solved) break
  }
  return best
}
