import { cellKey, inBounds, isOccupiable, sameCell } from '../engine/model/index.ts'
import type { Cell, Person, Puzzle } from '../engine/model/index.ts'
import type { Board, GameOptions } from './types.ts'

export const emptyBoard = (): Board => ({ notes: {}, marks: {}, placements: {} })

export const isBlocked = (puzzle: Puzzle, cell: Cell): boolean => !isOccupiable(puzzle.scene, cell)

/** Who stands on a cell, if anybody. */
export function occupantAt(board: Board, cell: Cell): string | null {
  for (const [personId, at] of Object.entries(board.placements)) if (sameCell(at, cell)) return personId
  return null
}

export const isPlaced = (board: Board, personId: string): boolean => personId in board.placements

export const hasNote = (board: Board, personId: string, cell: Cell): boolean =>
  board.notes[cellKey(cell)]?.includes(personId) ?? false

export const hasMark = (board: Board, personId: string, cell: Cell): boolean =>
  board.marks[cellKey(cell)]?.includes(personId) ?? false

/** What to draw on one cell. */
export interface CellView {
  placedPersonId: string | null
  noteIds: string[]
  markIds: string[]
}

export function cellView(board: Board, cell: Cell): CellView {
  const key = cellKey(cell)
  return {
    placedPersonId: occupantAt(board, cell),
    noteIds: board.notes[key] ?? [],
    markIds: board.marks[key] ?? [],
  }
}

/** True when the cell is not a legal place for a mark or note under the current options. */
export const canMark = (puzzle: Puzzle, options: GameOptions, cell: Cell): boolean =>
  inBounds(puzzle.scene, cell) && !(options.preventXOnBlocked && isBlocked(puzzle, cell))

// --- immutable edits (every helper returns the same object when nothing changes) ------

const order = (people: readonly Person[], ids: string[]): string[] => {
  const rank = new Map(people.map((p, i) => [p.id, i]))
  return [...new Set(ids)].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
}

function setIn(
  record: Record<string, string[]>,
  people: readonly Person[],
  key: string,
  personId: string,
  present: boolean,
): Record<string, string[]> {
  const current = record[key] ?? []
  if (current.includes(personId) === present) return record
  const next = { ...record }
  const list = order(people, present ? [...current, personId] : current.filter((id) => id !== personId))
  if (list.length === 0) delete next[key]
  else next[key] = list
  return next
}

export const withNote = (b: Board, people: readonly Person[], cell: Cell, id: string, on: boolean): Board => {
  const notes = setIn(b.notes, people, cellKey(cell), id, on)
  return notes === b.notes ? b : { ...b, notes }
}

export const withMark = (b: Board, people: readonly Person[], cell: Cell, id: string, on: boolean): Board => {
  const marks = setIn(b.marks, people, cellKey(cell), id, on)
  return marks === b.marks ? b : { ...b, marks }
}

/** Drops every note and X of one person, on all cells. */
export function withoutPersonMarkings(b: Board, personId: string): Board {
  const strip = (record: Record<string, string[]>) => {
    let changed = false
    const next: Record<string, string[]> = {}
    for (const [key, ids] of Object.entries(record)) {
      const kept = ids.filter((id) => id !== personId)
      if (kept.length !== ids.length) changed = true
      if (kept.length > 0) next[key] = kept
    }
    return changed ? next : record
  }
  const notes = strip(b.notes)
  const marks = strip(b.marks)
  return notes === b.notes && marks === b.marks ? b : { ...b, notes, marks }
}

/** Drops every note and X on one cell, for everybody. */
export function withoutCellMarkings(b: Board, cell: Cell): Board {
  const key = cellKey(cell)
  if (!(key in b.notes) && !(key in b.marks)) return b
  const notes = { ...b.notes }
  const marks = { ...b.marks }
  delete notes[key]
  delete marks[key]
  return { ...b, notes, marks }
}
