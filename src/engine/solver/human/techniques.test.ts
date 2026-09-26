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

/** A 4x4 grid, top half "Boven", bottom half "Onder", with an optional rug at r1k1 (row 0, col 0). */
function scene(objects: Scene['objects'] = []): Scene {
  const top = ['top', 'top', 'top', 'top']
  const bottom = ['bottom', 'bottom', 'bottom', 'bottom']
  return {
    width: 4,
    height: 4,
    rooms: [
      { id: 'top', name: 'Boven' },
      { id: 'bottom', name: 'Onder' },
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
  it('places somebody who has one square left, with a Dutch explanation', () => {
    const board = new Board(scene(), people)
    only(board, 1, [[2, 3]])
    const found = singleCandidate.find(board, context(board))
    expect(found?.place).toEqual({ person: 1, cell: cell(2, 3) })
    expect(found?.explanation).toBe('B kan nog maar op één vakje staan: rij 3, kolom 4. Die rij en kolom zijn daarmee bezet.')
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
      'Iedere rij en kolom heeft iemand, en in rij 1 is nog maar één vakje vrij: kolom 2. Alleen A kan daar nog staan. Dus op rij 1, kolom 2 staat A.',
    )
  })

  it('closes the column when several people could be the one on the square', () => {
    const board = new Board(scene(), people)
    // Row 0 keeps only r1k2, reachable by A and B; C and V cannot reach it.
    for (let p = 0; p < 4; p++) {
      for (const c of board.candidates(p)) {
        const keep = board.row(c) === 0 && board.col(c) === 1 && p < 2
        if (board.row(c) === 0 && !keep) board.eliminate(p, c)
      }
    }
    const found = scan.find(board, context(board))
    expect(found?.place).toBeUndefined()
    expect(found?.people).toEqual([0, 1])
    // Column 2 (index 1) belongs to the occupant of r1k2: nobody else may use it below.
    expect(found?.eliminate.every((e) => board.col(e.cell) === 1 && e.cell !== cell(0, 1))).toBe(true)
    expect(found?.eliminate.length).toBeGreaterThan(0)
    expect(found?.explanation).toBe(
      'Iedere rij en kolom heeft iemand, en in rij 1 is nog maar één vakje vrij: kolom 2. Daar staat een van deze mensen: A of B. Wie het is weten we nog niet, maar kolom 2 is in elk geval bezet, dus niemand anders kan daar staan.',
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
      'A en B kunnen alleen nog in rij 1 en 2 staan. Wie in welke rij staat weten we nog niet, maar die rijen zijn samen voor hen: niemand anders kan daar staan.',
    )
  })

  it('works on columns too, and for a single confined person', () => {
    const board = new Board(scene(), people)
    only(board, 2, [[0, 3], [3, 3]])
    const found = overload.find(board, context(board))
    expect(found?.people).toEqual([2])
    expect(found?.eliminate.every((e) => board.col(e.cell) === 3 && e.person !== 2)).toBe(true)
    expect(found?.explanation).toBe('C kan alleen nog in kolom 4 staan. Die kolom is dus voor C: niemand anders kan daar staan.')
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
      'A kan alleen nog op rij 1, kolom 1 en rij 2, kolom 2 staan. Elk van die vakjes deelt een rij of kolom met rij 1, kolom 2 en rij 2, kolom 1. Als daar iemand anders zou staan, houdt A niets over. Daar kan dus niemand anders staan.',
    )
  })

  it('does nothing when no square sees every square of the person', () => {
    const board = new Board(scene(), people)
    only(board, 0, [[0, 0], [1, 1], [2, 3]])
    expect(intersect.find(board, context(board))).toBeNull()
  })

  it('handles squares that line up: a crossing of two objects is blocked', () => {
    const board = new Board(scene(), people)
    // A sits on one of two perpendicular two-square objects; r2k2 sees all four squares.
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
      'A en B staan zeker in de Boven. V is met precies één verdachte en kan daar dus niet zijn.',
    )
  })

  it('rules out a room no suspect can reach', () => {
    const pair = [people[0] as Person, people[3] as Person]
    const board = new Board(scene(), pair)
    for (const c of board.candidates(0)) if (board.room(c) === 1) board.eliminate(0, c)
    const found = victimRoom.find(board, context(board))
    expect(found?.eliminate.every((e) => e.person === 1 && board.room(e.cell) === 1)).toBe(true)
    expect(found?.explanation).toBe(
      'Geen enkele verdachte kan nog in de Onder staan. V is met een verdachte en kan daar dus niet zijn.',
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
      'V is in de Boven, samen met A. Dat is de dader, dus geen andere verdachte kan daar staan.',
    )
  })

  it('pulls the only suspect who can get there into the victim room', () => {
    const board = new Board(scene(), people)
    only(board, 3, [[0, 0], [1, 1]])
    for (const p of [1, 2]) for (const c of board.candidates(p)) if (board.room(c) === 0) board.eliminate(p, c)
    const found = victimRoom.find(board, context(board))
    expect(found?.eliminate.every((e) => e.person === 0 && board.room(e.cell) === 1)).toBe(true)
    expect(found?.explanation).toBe(
      'V is in de Boven en moet daar met een verdachte zijn. Alleen A kan daar nog komen, dus die staat daar.',
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
      'De kaart van A zegt: "A stond op een tapijt." A kan dus niet op 14 vakjes (onder andere rij 1, kolom 2 en rij 1, kolom 3) staan.',
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
      'Een kaart zegt: "Er was niemand in de Boven." Niemand kan dus in de Boven staan.',
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
