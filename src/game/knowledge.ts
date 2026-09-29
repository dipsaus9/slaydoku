import type { CatalogClue } from '../engine/clues/index.ts'
import { cellKey, isOccupiable } from '../engine/model/index.ts'
import type { Cell, Person, Puzzle } from '../engine/model/index.ts'
import { defaultRegistry, solveHuman } from '../engine/solver/human/index.ts'
import type { HumanStep } from '../engine/solver/human/index.ts'

/** A hint about one person: who, where they can stand right now, and which cards narrowed them down. */
export interface Focus {
  personId: string
  /** The squares the person can stand on now: one for a placement, a handful for a note. */
  cells: Cell[]
  /** Indexes into the puzzle's clue list of the cards that ruled squares out for the person, most useful first. */
  cards: number[]
  /** Somebody already stands on their square: their row and column count in the reasoning. */
  placed: boolean
  /**
   * The steps between the cards and this person's last square that the reasoning leans on (a row that
   * belongs to somebody, a room that is taken), oldest first. Empty when the cards alone leave one square.
   */
  chain: HumanStep[]
}

/** What all the cards say together, given the people who are already placed. */
export interface Knowledge {
  /** Squares every person still to find can stand on: all cards applied together and worked out with the basic steps. */
  possible: Map<string, Cell[]>
  /** The first person with exactly one possible square, and the solver step that says so; null when nobody has. */
  placement: { step: HumanStep; focus: Focus } | null
  /** Cards that took squares away from a person, with how many. */
  byCard: Map<string, Map<number, number>>
}

/** The people who stand on their true cell, as row and column cards for the solver. */
export function knownCards(known: readonly Person[], truth: ReadonlyMap<string, Cell>): CatalogClue[] {
  return known.flatMap((p) => {
    const cell = truth.get(p.id) as Cell
    return [
      { personId: p.id, type: 'inRow', args: { index: cell.row } } as const,
      { personId: p.id, type: 'inColumn', args: { index: cell.col } } as const,
    ]
  })
}

/**
 * All the cards applied together, plus the people who are placed for good (`known`, their cell given
 * as row and column cards). The solver runs its basic steps (what a card rules out, a person with one
 * square left, a row or column with one square left, ...): a person "has one possible square" when
 * those leave them one. Techniques beyond the basic ones are not part of this knowledge.
 */
export function knowledge(puzzle: Puzzle, known: readonly Person[], truth: ReadonlyMap<string, Cell>): Knowledge {
  const real = puzzle.clues as CatalogClue[]
  const knownIds = new Set(known.map((p) => p.id))
  const result = solveHuman(puzzle.scene, puzzle.people, [...real, ...knownCards(known, truth)], {
    techniques: defaultRegistry.list(),
  })

  const left = new Map<string, Map<string, Cell>>()
  const open: Cell[] = []
  for (let row = 0; row < puzzle.scene.height; row++) {
    for (let col = 0; col < puzzle.scene.width; col++) if (isOccupiable(puzzle.scene, { row, col })) open.push({ row, col })
  }
  for (const p of puzzle.people) left.set(p.id, new Map(open.map((c) => [cellKey(c), c])))
  const byCard = new Map<string, Map<number, number>>()

  const snapshot = (): Map<string, Cell[]> =>
    new Map(puzzle.people.filter((p) => !knownIds.has(p.id)).map((p) => [p.id, [...(left.get(p.id) as Map<string, Cell>).values()]]))

  const seen: HumanStep[] = []
  for (const step of result.steps) {
    if (step.placed && !knownIds.has(step.placed.personId)) {
      const personId = step.placed.personId
      const focus: Focus = {
        personId,
        cells: [step.placed.cell],
        cards: rankCards(puzzle, byCard.get(personId), personId),
        placed: known.length > 0,
        chain: chainTo(seen, [personId], real.length),
      }
      return { possible: snapshot(), placement: { step, focus }, byCard }
    }
    seen.push(step)
    for (const e of step.eliminated) {
      if ((left.get(e.personId) as Map<string, Cell>).delete(cellKey(e.cell)) && step.clueIndex !== undefined && step.clueIndex < real.length) {
        const counts = byCard.get(e.personId) ?? new Map<number, number>()
        counts.set(step.clueIndex, (counts.get(step.clueIndex) ?? 0) + 1)
        byCard.set(e.personId, counts)
      }
    }
  }
  return { possible: snapshot(), placement: null, byCard }
}

/**
 * The steps a step leans on beyond the cards themselves: walking back through `before`, every
 * earlier step that is about one of `subjects`, or about somebody an included step is about (the
 * "about" set grows as the walk finds more). Steps that only read a card, or place a person the
 * cards already settle, are not part of the chain, nor are the bookkeeping steps of the players
 * who are placed already. Used for a placement's own person (one subject) and for an elimination
 * step's people (several, unfiltered -- an already-placed or victim subject can still legitimately
 * ground the chain, even though neither is ever the hint's own target): either way the result is
 * what the player would need to have already been shown for this step to read as the next honest
 * move, not a conclusion out of nowhere.
 */
export function chainTo(before: readonly HumanStep[], subjects: readonly string[], realClues: number): HumanStep[] {
  const about = new Set(subjects)
  const chain: HumanStep[] = []
  for (let i = before.length - 1; i >= 0; i--) {
    const step = before[i] as HumanStep
    if (step.level < 2 || step.placed) continue
    if (step.clueIndex !== undefined && step.clueIndex >= realClues) continue
    const touches = step.people.some((p) => about.has(p)) || step.eliminated.some((e) => about.has(e.personId))
    if (!touches) continue
    chain.unshift(step)
    for (const p of step.people) about.add(p)
  }
  return chain
}

/** The cards that narrowed a person down: their own first, then other people's, each the most useful first. */
export function rankCards(puzzle: Puzzle, counts: ReadonlyMap<number, number> | undefined, personId?: string): number[] {
  const clues = puzzle.clues as CatalogClue[]
  const own = (i: number) => (personId !== undefined && clues[i]?.personId === personId ? 0 : 1)
  return [...(counts?.keys() ?? [])].sort((a, b) => own(a) - own(b) || (counts?.get(b) ?? 0) - (counts?.get(a) ?? 0) || a - b)
}
