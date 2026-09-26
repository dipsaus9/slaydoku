import { describe, expect, it } from 'vitest'
import type { CatalogClue } from '../../clues/index.ts'
import type { Person, Scene } from '../../model/index.ts'
import { Board } from './board.ts'
import { clueEliminations } from './techniques/clue.ts'
import { intersect } from './techniques/intersect.ts'
import { overload, overloadTechnique } from './techniques/overload.ts'
import { scan } from './techniques/scan.ts'
import { singleCandidate } from './techniques/single.ts'
import { victimRoom } from './techniques/victim-room.ts'
import type { HumanContext } from './types.ts'

/** A 4x4 grid, top half "North Wing", bottom half "South Wing", with an optional rug at r1c1 (row 0, col 0). */
function scene(objects: Scene['objects'] = []): Scene {
  const top = ['top', 'top', 'top', 'top']
  const bottom = ['bottom', 'bottom', 'bottom', 'bottom']
  return {
    width: 4,
    height: 4,
    rooms: [
      { id: 'top', name: 'North Wing' },
      { id: 'bottom', name: 'South Wing' },
    ],
    cellRooms: [top, top, bottom, bottom],
    objects,
    edgeFeatures: [],
  }
}

const people: Person[] = [
  { id: 'A', kind: 'suspect', label: 'A' },
  { id: 'B', kind: 'suspect', label: 'B' },
  { id: 'C', kind: 'suspect', label: 'C' },
  { id: 'V', kind: 'victim', label: 'V' },
]

const cell = (row: number, col: number) => row * 4 + col

/** Leaves `person` exactly the given [row, col] cells. */
function only(board: Board, person: number, cells: [number, number][]): void {
  const keep = new Set(cells.map(([r, c]) => cell(r, c)))
  for (const c of board.candidates(person)) if (!keep.has(c)) board.eliminate(person, c)
}

const context = (board: Board, clues: CatalogClue[] = []): HumanContext => ({
  scene: board.scene,
  people,
  clues,
  memo: new Map(),
})

describe('single-candidate', () => {
  it('places somebody who has one square left, with an English explanation', () => {
    const board = new Board(scene(), people)
    only(board, 1, [[2, 3]])
    const found = singleCandidate.find(board, context(board))
    expect(found?.place).toEqual({ person: 1, cell: cell(2, 3) })
    expect(found?.explanation).toBe('B can only stand on one square now: row 3, column 4. That row and column are taken with it.')
  })

  it('finds nothing while everybody has a choice', () => {
    const board = new Board(scene(), people)
    expect(singleCandidate.find(board, context(board))).toBeNull()
  })

  it('isolates the person others lean on first', () => {
    const board = new Board(scene(), people)
    only(board, 0, [[0, 0]])
    only(board, 1, [[1, 1]])
    const clues: CatalogClue[] = [{ personId: 'A', type: 'withPerson', args: { otherId: 'B' } }]
    expect(singleCandidate.find(board, context(board, clues))?.place?.person).toBe(1)
    expect(singleCandidate.find(board, context(board))?.place?.person).toBe(0)
  })
})

describe('scan', () => {
  it('isolates the only person who can reach the last free square of a row', () => {
    const board = new Board(scene(), people)
    // Row 0 is only reachable at column 1, and only by A.
    for (let p = 0; p < 4; p++) {
      for (const c of board.candidates(p)) {
        if (board.row(c) === 0 && !(p === 0 && board.col(c) === 1)) board.eliminate(p, c)
      }
    }
    const found = scan.find(board, context(board))
    expect(found?.place).toEqual({ person: 0, cell: cell(0, 1) })
    expect(found?.explanation).toBe(
      'Every row and column holds somebody, and in row 1 only one square is still free: column 2. Only A can still stand there. So A stands on row 1, column 2.',
    )
  })

  it('closes the column when several people could be the one on the square', () => {
    const board = new Board(scene(), people)
    // Row 0 keeps only r1c2, reachable by A and B; C and V cannot reach it.
    for (let p = 0; p < 4; p++) {
      for (const c of board.candidates(p)) {
        const keep = board.row(c) === 0 && board.col(c) === 1 && p < 2
        if (board.row(c) === 0 && !keep) board.eliminate(p, c)
      }
    }
    const found = scan.find(board, context(board))
    expect(found?.place).toBeUndefined()
    expect(found?.people).toEqual([0, 1])
    // Column 2 (index 1) belongs to the occupant of r1c2: nobody else may use it below.
    expect(found?.eliminate.every((e) => board.col(e.cell) === 1 && e.cell !== cell(0, 1))).toBe(true)
    expect(found?.eliminate.length).toBeGreaterThan(0)
    expect(found?.explanation).toBe(
      'Every row and column holds somebody, and in row 1 only one square is still free: column 2. One of these people stands there: A or B. We do not know who yet, but column 2 is taken either way, so nobody else can stand there.',
    )
  })

  it('needs a square grid', () => {
    const wide: Scene = { ...scene(), height: 3, cellRooms: [['top', 'top', 'top', 'top'], ['top', 'top', 'top', 'top'], ['top', 'top', 'top', 'top']] }
    const board = new Board(wide, people)
    expect(scan.find(board, context(board))).toBeNull()
  })
})

describe('overload', () => {
  it('keeps everyone else out of the rows two people share', () => {
    const board = new Board(scene(), people)
    only(board, 0, [[0, 0], [1, 2]])
    only(board, 1, [[0, 3], [1, 1]])
    const found = overload.find(board, context(board))
    expect(found?.people).toEqual([0, 1])
    expect(found?.eliminate.every((e) => e.person >= 2 && board.row(e.cell) <= 1)).toBe(true)
    expect(found?.eliminate.length).toBe(2 * 8)
    expect(found?.explanation).toBe(
      'A and B can only stand in rows 1 and 2 now. We do not know who takes which row, but those rows belong to them together, so nobody else can stand there.',
    )
  })

  it('works on columns too, and for a single confined person', () => {
    const board = new Board(scene(), people)
    only(board, 2, [[0, 3], [3, 3]])
    const found = overload.find(board, context(board))
    expect(found?.people).toEqual([2])
    expect(found?.eliminate.every((e) => board.col(e.cell) === 3 && e.person !== 2)).toBe(true)
    expect(found?.explanation).toBe('C can only stand in column 4 now. That column belongs to C, so nobody else can stand there.')
  })

  it('a bigger group size is just a parameter', () => {
    const board = new Board(scene(), people)
    only(board, 0, [[0, 0], [1, 1]])
    only(board, 1, [[1, 3], [2, 2]])
    only(board, 2, [[0, 2], [2, 0]])
    expect(overload.find(board, context(board))).toBeNull()
    const triple = overloadTechnique(3, 'overload-triple', 4)
    expect(triple.find(board, context(board))?.people).toEqual([0, 1, 2])
    expect(triple.level).toBe(4)
  })
})

describe('intersect', () => {
  it('removes the other two corners of the rectangle two squares form', () => {
    const board = new Board(scene(), people)
    only(board, 0, [[0, 0], [1, 1]])
    const found = intersect.find(board, context(board))
    const removed = new Set(found?.eliminate.map((e) => e.cell))
    expect(removed).toEqual(new Set([cell(0, 1), cell(1, 0)]))
    expect(found?.eliminate.length).toBe(3 * 2)
    expect(found?.eliminate.every((e) => e.person !== 0)).toBe(true)
    expect(found?.explanation).toBe(
      'A can only stand on row 1, column 1 and row 2, column 2 now. Each of those squares shares a row or column with row 1, column 2 and row 2, column 1. If somebody else stood there, A would have nothing left. So nobody else can stand there.',
    )
  })

  it('does nothing when no square sees every square of the person', () => {
    const board = new Board(scene(), people)
    only(board, 0, [[0, 0], [1, 1], [2, 3]])
    expect(intersect.find(board, context(board))).toBeNull()
  })

  it('handles squares that line up: a crossing of two objects is blocked', () => {
    const board = new Board(scene(), people)
    // A sits on one of two perpendicular two-square objects; r2c2 sees all four squares.
    only(board, 0, [[1, 0], [1, 2], [0, 1], [2, 1]])
    const found = intersect.find(board, context(board))
    expect(found?.eliminate.some((e) => e.person === 1 && e.cell === cell(1, 1))).toBe(true)
  })
})

describe('victim-room', () => {
  it('rules out a room that already holds two suspects', () => {
    const board = new Board(scene(), people)
    only(board, 0, [[0, 0], [1, 1]])
    only(board, 1, [[0, 2], [1, 3]])
    const found = victimRoom.find(board, context(board))
    expect(found?.eliminate.every((e) => e.person === 3 && board.room(e.cell) === 0)).toBe(true)
    expect(found?.explanation).toBe(
      'A and B are sure to be in the North Wing. V is with exactly one suspect, so cannot be there.',
    )
  })

  it('rules out a room no suspect can reach', () => {
    const pair = [people[0] as Person, people[3] as Person]
    const board = new Board(scene(), pair)
    for (const c of board.candidates(0)) if (board.room(c) === 1) board.eliminate(0, c)
    const found = victimRoom.find(board, context(board))
    expect(found?.eliminate.every((e) => e.person === 1 && board.room(e.cell) === 1)).toBe(true)
    expect(found?.explanation).toBe(
      'No suspect can still stand in the South Wing. V is with a suspect, so cannot be there.',
    )
  })

  it('keeps a second suspect out of the victim room', () => {
    const board = new Board(scene(), people)
    only(board, 3, [[0, 0], [1, 1]])
    only(board, 0, [[0, 2], [1, 3]])
    const found = victimRoom.find(board, context(board))
    expect(found?.people).toContain(3)
    expect(found?.eliminate.every((e) => e.person !== 0 && board.room(e.cell) === 0)).toBe(true)
    expect(found?.explanation).toBe(
      'V is in the North Wing, together with A. That is the murderer, so no other suspect can stand there.',
    )
  })

  it('pulls the only suspect who can get there into the victim room', () => {
    const board = new Board(scene(), people)
    only(board, 3, [[0, 0], [1, 1]])
    for (const p of [1, 2]) for (const c of board.candidates(p)) if (board.room(c) === 0) board.eliminate(p, c)
    const found = victimRoom.find(board, context(board))
    expect(found?.eliminate.every((e) => e.person === 0 && board.room(e.cell) === 1)).toBe(true)
    expect(found?.explanation).toBe(
      'V is in the North Wing and must be there with a suspect. Only A can still get there, so that person stands there.',
    )
  })

  it('needs a victim', () => {
    const board = new Board(scene(), people.slice(0, 3))
    expect(victimRoom.find(board, context(board))).toBeNull()
  })
})

describe('clue', () => {
  const rug = scene([{ id: 'rug', type: 'rug', cells: [{ row: 0, col: 0 }, { row: 3, col: 3 }] }])

  it('removes squares where a one-person clue is false', () => {
    const board = new Board(rug, people)
    const clues: CatalogClue[] = [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } }]
    const found = clueEliminations.find(board, context(board, clues))
    expect(found?.clueIndex).toBe(0)
    expect(found?.eliminate.length).toBe(14)
    expect(found?.explanation).toBe(
      "A's card says: \"A stood on a rug.\" So A cannot stand on 14 squares (among them row 1, column 2 and row 1, column 3).",
    )
  })

  it('removes squares without an agreeing square for the other person', () => {
    const board = new Board(rug, people)
    only(board, 1, [[3, 3]])
    const clues: CatalogClue[] = [{ personId: 'A', type: 'withPerson', args: { otherId: 'B' } }]
    const found = clueEliminations.find(board, context(board, clues))
    // B is in the bottom room, so A must be too, and not in B's row or column.
    const dropped = found?.eliminate.filter((e) => e.person === 0).map((e) => e.cell) ?? []
    expect(dropped).toContain(cell(0, 0))
    expect(dropped).not.toContain(cell(2, 0))
  })

  it('keeps everyone off an object only one person may stand on', () => {
    const board = new Board(rug, people)
    const clues: CatalogClue[] = [{ personId: 'A', type: 'onlyOnObject', args: { objectType: 'rug' } }]
    const found = clueEliminations.find(board, context(board, clues))
    const others = found?.eliminate.filter((e) => e.person !== 0) ?? []
    expect(others.length).toBe(3 * 2)
    expect(others.every((e) => e.cell === cell(0, 0) || e.cell === cell(3, 3))).toBe(true)
  })

  it('closes an empty room to everybody', () => {
    const board = new Board(rug, people)
    const clues: CatalogClue[] = [{ personId: 'A', type: 'emptyRoom', args: { roomId: 'top' } }]
    const found = clueEliminations.find(board, context(board, clues))
    expect(found?.eliminate.length).toBe(4 * 8)
    expect(found?.explanation).toBe(
      'A card says: "There was nobody in the North Wing." So nobody can stand in the North Wing.',
    )
  })

  it('an alone clue keeps others out of the room the holder is sure to be in', () => {
    const board = new Board(rug, people)
    only(board, 0, [[0, 0], [1, 2]])
    const clues: CatalogClue[] = [{ personId: 'A', type: 'alone', args: {} }]
    const found = clueEliminations.find(board, context(board, clues))
    expect(found?.eliminate.some((e) => e.person === 1 && board.room(e.cell) === 0)).toBe(true)
  })

  it('does not repeat itself once a clue has nothing left to say', () => {
    const board = new Board(rug, people)
    const clues: CatalogClue[] = [{ personId: 'A', type: 'inRoom', args: { roomId: 'top' } }]
    const ctx = context(board, clues)
    const found = clueEliminations.find(board, ctx)
    for (const e of found?.eliminate ?? []) board.eliminate(e.person, e.cell)
    expect(clueEliminations.find(board, ctx)).toBeNull()
  })
})
