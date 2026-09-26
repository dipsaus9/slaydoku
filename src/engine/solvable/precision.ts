import { evaluate, isGenderClue } from '../clues/index.ts'
import type { Cell, Placement, Puzzle } from '../model/index.ts'
import { occupiableCells } from '../model/index.ts'
import { cardsOf, partCards } from './cards.ts'
import type { Card } from './cards.ts'

/** What one clue card leaves its holder, and whether everybody holding the same card still fits. */
export interface CardPrecision {
  /** Index in `puzzle.clues`. */
  clue: number
  holder: string
  type: string
  /** Names another person: the squares are those with some square for that person that makes it true. */
  referencing: boolean
  /** Squares the card leaves the holder when nobody else is placed. */
  squares: number
  /** Holders of an identical card (same kind, same parameters), this holder included, in people order. */
  sharedWith: string[]
  /** Can all `sharedWith` stand on squares the card allows, each in a row and column of their own? */
  sharedFits: boolean
}

export interface PrecisionResult {
  /** One entry per catalog card, in card order. */
  cards: CardPrecision[]
  /** People who own a card without a person reference that leaves exactly one square: placeable with no help at all. */
  placeableAlone: string[]
  /** Cards whose identical holders cannot all fit (the puzzle is then not solvable at all, or the cards are wrong). */
  misfits: number[]
  /** Cards that leave no square at all. */
  empty: number[]
}

/**
 * How precise each card is: the squares it leaves for its holder alone (nobody else
 * placed, so a fact about the room only counts what the scene says), and whether all
 * people holding the very same card can still stand in distinct rows and columns.
 * Pure and deterministic.
 */
export function precision(puzzle: Puzzle): PrecisionResult {
  const cards = cardsOf(puzzle)
  const squares = occupiableCells(puzzle.scene)
  const allowed = new Map<number, Cell[]>(cards.map((card) => [card.index, squaresAlone(puzzle, card, squares)]))
  const orderOf = new Map(puzzle.people.map((p, i) => [p.id, i]))

  const groups = new Map<string, Card[]>()
  for (const card of cards) {
    const key = `${card.clue.type}|${JSON.stringify(sorted(card.clue.args ?? {}))}`
    groups.set(key, [...(groups.get(key) ?? []), card])
  }
  const fits = new Map<number, boolean>()
  const sharing = new Map<number, string[]>()
  for (const group of groups.values()) {
    const holders = [...new Set(group.map((c) => c.holder))].sort((a, b) => (orderOf.get(a) ?? 0) - (orderOf.get(b) ?? 0))
    const ok = holders.length <= 1 ? (allowed.get((group[0] as Card).index) as Cell[]).length > 0 : distinctLines(holders.map((h) => allowed.get((group.find((c) => c.holder === h) as Card).index) as Cell[]))
    for (const card of group) {
      fits.set(card.index, ok)
      sharing.set(card.index, holders)
    }
  }

  const result: CardPrecision[] = cards.map((card) => ({
    clue: card.index,
    holder: card.holder,
    type: card.clue.type,
    referencing: card.referencing,
    squares: (allowed.get(card.index) as Cell[]).length,
    sharedWith: sharing.get(card.index) as string[],
    sharedFits: fits.get(card.index) as boolean,
  }))
  const placeableAlone = [
    ...new Set(result.filter((c) => !c.referencing && c.squares === 1 && !cards.find((k) => k.index === c.clue)?.exclusive).map((c) => c.holder)),
  ].sort((a, b) => (orderOf.get(a) ?? 0) - (orderOf.get(b) ?? 0))
  return {
    cards: result,
    placeableAlone,
    misfits: result.filter((c) => !c.sharedFits).map((c) => c.clue),
    empty: result.filter((c) => c.squares === 0).map((c) => c.clue),
  }
}

const sorted = (args: Record<string, unknown>): [string, unknown][] => Object.entries(args).sort(([a], [b]) => a.localeCompare(b))

/**
 * Squares of the scene where the card can be true for its holder, with the referent (if any) free to stand anywhere else.
 * A combined card leaves the squares BOTH its parts leave (the intersection).
 */
function squaresAlone(puzzle: Puzzle, card: Card, squares: Cell[], holderSquares: Cell[] = squares): Cell[] {
  const parts = partCards(card, puzzle.people)
  if (parts.length > 1) return parts.reduce((left, part) => squaresAlone(puzzle, part, squares, left), holderSquares)
  if (card.clue.type === 'aloneWithMurderer') return holderSquares
  const at = (personId: string, cell: Cell): Placement => ({ personId, cell })
  return holderSquares.filter((cell) => {
    if (card.other === undefined && !isGenderClue(card.clue)) {
      return evaluate(card.clue, puzzle.scene, [at(card.holder, cell)])
    }
    // A gender card is about everybody of that gender: it is possible when any one of them fits next to the holder.
    const referents = card.other === undefined ? card.named : [card.other]
    return referents.some((referent) =>
      squares.some(
        (there) =>
          there.row !== cell.row &&
          there.col !== cell.col &&
          evaluate(card.clue, puzzle.scene, [at(card.holder, cell), at(referent, there)], puzzle.people),
      ),
    )
  })
}

/** Whether every list can give one square, no two sharing a row or a column. */
function distinctLines(lists: Cell[][]): boolean {
  const order = lists.map((cells, i) => ({ cells, i })).sort((a, b) => a.cells.length - b.cells.length)
  const rows = new Set<number>()
  const cols = new Set<number>()
  const place = (n: number): boolean => {
    if (n === order.length) return true
    for (const cell of (order[n] as { cells: Cell[] }).cells) {
      if (rows.has(cell.row) || cols.has(cell.col)) continue
      rows.add(cell.row)
      cols.add(cell.col)
      if (place(n + 1)) return true
      rows.delete(cell.row)
      cols.delete(cell.col)
    }
    return false
  }
  return place(0)
}
