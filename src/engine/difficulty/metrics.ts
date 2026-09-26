import { isDirectClue } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import type { Puzzle } from '../model/index.ts'
import { Board } from '../solver/human/board.ts'
import type { HumanStep } from '../solver/human/types.ts'
import { solveAdvanced } from '../solver/advanced/index.ts'
import { assessTier, cardsOf, precision } from '../solvable/index.ts'
import type { DifficultyMetrics } from './types.ts'

/** The victim's fixed card; every puzzle has it, so it says nothing about difficulty. */
const VICTIM_CARD = 'aloneWithMurderer'

const round = (value: number, digits = 3): number => {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

const mean = (values: readonly number[]): number => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length)

/** Share of the non-victim cards that are direct (`isDirectClue`, the definition of the clue audit). 0 when there are none. */
export function directClueShare(clues: readonly { type: string; personId: string; args?: unknown }[]): number {
  const counted = clues.filter((c) => c.type !== VICTIM_CARD)
  return counted.length === 0 ? 0 : counted.filter(isDirectClue).length / counted.length
}

/**
 * For each step, the earlier steps it builds on: those that removed a
 * candidate from (or placed) somebody the step talks about. The first firing
 * of a clue card builds on nothing but the card itself. A step never depends
 * on itself.
 */
export function stepDependencies(steps: readonly HumanStep[]): number[][] {
  const touched: Set<string>[] = steps.map((s) => new Set([...s.eliminated.map((e) => e.personId), ...(s.placed ? [s.placed.personId] : [])]))
  const firedClues = new Set<number>()
  return steps.map((step, j) => {
    const first = step.clueIndex !== undefined && !firedClues.has(step.clueIndex)
    if (step.clueIndex !== undefined) firedClues.add(step.clueIndex)
    if (first) return []
    const deps: number[] = []
    for (let i = 0; i < j; i++) if (step.people.some((id) => touched[i]?.has(id))) deps.push(i)
    return deps
  })
}

/**
 * Replays the walk-through and counts, before each step, the candidate
 * squares of the people that step talks about (mean per step).
 */
function candidatesBeforeEachStep(puzzle: Puzzle, steps: readonly HumanStep[]): number[] {
  const board = new Board(puzzle.scene, puzzle.people)
  const index = new Map(puzzle.people.map((p, i) => [p.id, i]))
  const width = puzzle.scene.width
  const at = (cell: { row: number; col: number }) => cell.row * width + cell.col
  return steps.map((step) => {
    const involved = step.people.flatMap((id) => (index.has(id) ? [index.get(id) as number] : []))
    const before = mean(involved.map((p) => board.candidateCount(p)))
    for (const e of step.eliminated) board.eliminate(index.get(e.personId) as number, at(e.cell))
    if (step.placed) board.place(index.get(step.placed.personId) as number, at(step.placed.cell))
    return before
  })
}

/** The ladder part of the metrics (CAD-5.6): what placing the people one at a time costs, on the ladder of the easiest tier the puzzle meets. */
export function ladderMetrics(puzzle: Puzzle): Pick<DifficultyMetrics, 'ladderSolved' | 'cardsPerPlacement' | 'referenceShare' | 'squaresFromCards' | 'ladderChain' | 'placeableAloneShare'> {
  const assessment = assessTier(puzzle)
  const referencing = new Set(cardsOf(puzzle).filter((c) => c.referencing).map((c) => c.index))
  const used = assessment.ladder.steps.filter((s) => s.clues.length > 0)
  return {
    ladderSolved: assessment.advanced === undefined,
    cardsPerPlacement: round(mean(used.map((s) => s.clues.length))),
    referenceShare: round(used.length === 0 ? 0 : used.filter((s) => s.clues.some((c) => referencing.has(c))).length / used.length),
    squaresFromCards: round(mean(used.map((s) => s.squaresFromCards))),
    ladderChain: round(mean(used.map((s) => s.chain))),
    placeableAloneShare: round(precision(puzzle).placeableAlone.length / Math.max(1, puzzle.people.length)),
  }
}

/**
 * Measures how hard a puzzle is to solve by hand: step count, longest chain of
 * dependent deductions, cards combined per step, share of direct cards,
 * candidates per step and the hardest technique level. Pure and deterministic:
 * the same puzzle always gives the same numbers. Uses the full technique set
 * (basic and advanced), so it measures the way a strong player would solve.
 */
export function computeMetrics(puzzle: Puzzle): DifficultyMetrics {
  const clues = puzzle.clues as CatalogClue[]
  const human = solveAdvanced(puzzle.scene, puzzle.people, clues)
  const { steps } = human
  const deps = stepDependencies(steps)

  const depth: number[] = []
  const support: Set<number>[] = []
  steps.forEach((step, j) => {
    const parents = deps[j] as number[]
    depth[j] = 1 + Math.max(0, ...parents.map((i) => depth[i] as number))
    const cards = new Set<number>(step.clueIndex !== undefined ? [step.clueIndex] : [])
    for (const i of parents) for (const c of support[i] as Set<number>) cards.add(c)
    support[j] = cards
  })

  return {
    people: puzzle.people.length,
    clueCount: clues.length,
    solved: human.solved,
    steps: steps.length,
    longestChain: Math.max(0, ...depth),
    cluesPerStep: round(mean(support.map((s) => s.size))),
    directClueShare: round(directClueShare(clues)),
    candidatesPerStep: round(mean(candidatesBeforeEachStep(puzzle, steps))),
    hardestLevel: human.maxTechnique?.level ?? 0,
    ...ladderMetrics(puzzle),
  }
}
