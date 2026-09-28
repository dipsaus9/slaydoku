import { evaluate } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { deriveMurderer, validatePlacement } from '../../model/index.ts'
import type { Person, Placement, Scene } from '../../model/index.ts'
import { Board } from './board.ts'
import { difficulty } from './difficulty.ts'
import { defaultRegistry, sortBands, sortTechniques } from './registry.ts'
import type { Deduction, HumanContext, HumanOptions, HumanResult, HumanStep, Technique } from './types.ts'

/**
 * Solves a puzzle the way a person does: by applying named techniques one at
 * a time, easiest first, and never by guessing. Every application is recorded
 * as a step with an explanation, in `options.locale` (default `'en'`, SLAY-3.3).
 * `solved` is false when the techniques run out before everybody is placed
 * (the puzzle needs search or a technique the catalog lacks) or when the
 * clues contradict themselves.
 */
export function solveHuman(
  scene: Scene,
  people: readonly Person[],
  clues: readonly CatalogClue[],
  options: HumanOptions = {},
): HumanResult {
  const techniques = sortTechniques(options.techniques ?? defaultRegistry.list())
  const bands = sortBands(options.bands ?? defaultRegistry.listBands())
  const board = new Board(scene, people)
  const context: HumanContext = { scene, people, clues, memo: new Map(), locale: options.locale ?? 'en' }
  const steps: HumanStep[] = []
  let contradiction = board.victim < 0 || new Set(people.map((p) => p.id)).size !== people.length

  // Every step changes the board (a candidate goes or somebody is placed), so this ends.
  while (!contradiction && board.unplaced() > 0) {
    const found = firstDeduction(techniques, board, context)
    if (!found) break
    steps.push(apply(board, found.technique, found.deduction, steps.length + 1))
    contradiction = board.broken()
  }

  const placements: Placement[] = people.flatMap((person, i) =>
    board.isPlaced(i) ? [{ personId: person.id, cell: board.cell(board.placedAt(i)) }] : [],
  )
  const complete = placements.length === people.length
  const solved = !contradiction && complete && satisfies(scene, people, clues, placements)
  const hardest = steps.reduce<HumanStep | null>((top, s) => (top === null || s.level > top.level ? s : top), null)
  const rated = difficulty(hardest?.level ?? 0, steps.length, bands)
  return {
    solved,
    contradiction: contradiction || (complete && !solved),
    steps,
    maxTechnique: hardest
      ? { id: hardest.technique, title: titleOf(techniques, hardest.technique), level: hardest.level }
      : null,
    score: rated.score,
    rating: solved ? rated.band : null,
    placements,
    murderer: solved ? deriveMurderer({ scene, people: [...people] }, placements) : null,
  }
}

const titleOf = (techniques: readonly Technique[], id: string): string =>
  techniques.find((t) => t.id === id)?.title ?? id

function firstDeduction(
  techniques: readonly Technique[],
  board: Board,
  context: HumanContext,
): { technique: Technique; deduction: Deduction } | null {
  for (const technique of techniques) {
    const deduction = technique.find(board, context)
    if (deduction && (deduction.place || deduction.eliminate.length > 0)) return { technique, deduction }
  }
  return null
}

/** Applies a deduction to the board and turns it into a recorded step. */
function apply(board: Board, technique: Technique, deduction: Deduction, index: number): HumanStep {
  const eliminated: Placement[] = []
  const drop = (person: number, cell: number) => {
    if (board.eliminate(person, cell)) {
      eliminated.push({ personId: board.people[person]?.id ?? '', cell: board.cell(cell) })
    }
  }
  for (const { person, cell } of deduction.eliminate) drop(person, cell)
  let placed: Placement | undefined
  if (deduction.place) {
    const { person, cell } = deduction.place
    board.place(person, cell)
    placed = { personId: board.people[person]?.id ?? '', cell: board.cell(cell) }
    // Row and column of a placed person belong to them alone.
    for (let q = 0; q < board.people.length; q++) {
      if (q === person) continue
      for (const c of board.candidates(q)) {
        if (board.row(c) === board.row(cell) || board.col(c) === board.col(cell)) drop(q, c)
      }
    }
  }
  const step: HumanStep = {
    index,
    technique: technique.id,
    level: technique.level,
    explanation: deduction.explanation,
    people: deduction.people.map((p) => board.people[p]?.id ?? ''),
    cells: deduction.cells.map((c) => board.cell(c)),
    eliminated,
  }
  if (placed) step.placed = placed
  if (deduction.clueIndex !== undefined) step.clueIndex = deduction.clueIndex
  return step
}

/** The final answer must obey the rules and every clue, whatever the techniques believed. */
function satisfies(
  scene: Scene,
  people: readonly Person[],
  clues: readonly CatalogClue[],
  placements: Placement[],
): boolean {
  const puzzle = { scene, people: [...people] }
  return (
    validatePlacement(puzzle, placements).ok &&
    deriveMurderer(puzzle, placements) !== null &&
    clues.every((clue) => evaluate(clue, scene, placements, people))
  )
}
