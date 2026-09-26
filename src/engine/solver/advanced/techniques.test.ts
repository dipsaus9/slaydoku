import { describe, expect, it } from 'vitest'
import type { CatalogClue } from '../../clues/index.ts'
import type { Person, Scene } from '../../model/index.ts'
import { Board } from '../human/board.ts'
import type { Deduction, HumanContext, Technique } from '../human/types.ts'
import { linkModel } from './links.ts'
import { chain } from './techniques/chain.ts'
import { combinedClues } from './techniques/combined.ts'
import { hiddenLines, nakedLines } from './techniques/lines.ts'
import { fish, intersectWide } from './techniques/rectangle.ts'
import { clueRoomCount, roomCapacity, roomHiddenSingle, victimCount } from './techniques/rooms.ts'
import { ADVANCED_TECHNIQUES } from './registry.ts'
import { Trial } from './trial.ts'

/** A grid whose rows are given as room ids, one string of single letters per row. */
function scene(rows: string[]): Scene {
  const ids = [...new Set(rows.join(''))]
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    rooms: ids.map((id) => ({ id, name: `Kamer ${id}` })),
    cellRooms: rows.map((row) => [...row]),
    objects: [],
    edgeFeatures: [],
  }
}

const TWO_ROOMS = scene(['tttt', 'tttt', 'bbbb', 'bbbb'])

const people: Person[] = [
  { id: 'A', kind: 'suspect', label: 'A' },
  { id: 'B', kind: 'suspect', label: 'B' },
  { id: 'C', kind: 'suspect', label: 'C' },
  { id: 'V', kind: 'victim', label: 'V' },
]
const [A, B, C, V] = [0, 1, 2, 3] as const

const at = (row: number, col: number) => row * 4 + col

/** Leaves `person` exactly the squares for which `keep(row, col)` holds. */
function limit(board: Board, person: number, keep: (row: number, col: number) => boolean): void {
  for (const c of board.candidates(person)) if (!keep(board.row(c), board.col(c))) board.eliminate(person, c)
}
const only = (board: Board, person: number, cells: [number, number][]) =>
  limit(board, person, (r, c) => cells.some(([rr, cc]) => rr === r && cc === c))

const context = (board: Board, clues: CatalogClue[] = []): HumanContext => ({
  scene: board.scene,
  people,
  clues,
  memo: new Map(),
})

const removed = (found: Deduction | null, person: number) =>
  (found?.eliminate ?? []).filter((e) => e.person === person).map((e) => e.cell)

/** Everything the deduction removes, applied to a copy of the board, must be a real change. */
function expectRealChange(board: Board, found: Deduction | null): void {
  expect(found).not.toBeNull()
  expect(found?.eliminate.length).toBeGreaterThan(0)
  for (const e of found?.eliminate ?? []) expect(board.hasCandidate(e.person, e.cell)).toBe(true)
  expect(found?.explanation.length).toBeGreaterThan(20)
}

describe('hidden lines', () => {
  const find = (t: Technique, board: Board, clues: CatalogClue[] = []) => t.find(board, context(board, clues))

  it('a row only one person can reach confines that person to the row', () => {
    const board = new Board(TWO_ROOMS, people)
    for (const p of [B, C, V]) limit(board, p, (r) => r !== 0)
    const found = find(hiddenLines(1, 2, 'hidden-lines', 4, 'Verborgen'), board)
    expectRealChange(board, found)
    expect(found?.people).toEqual([A])
    expect(removed(found, A).every((c) => board.row(c) !== 0)).toBe(true)
    expect(removed(found, B)).toEqual([])
    expect(found?.explanation).toBe(
      'In rij 1 kan alleen A nog staan. Elke rij heeft iemand, dus A staat daar en nergens anders.',
    )
  })

  it('two rows only two people can reach are theirs', () => {
    const board = new Board(TWO_ROOMS, people)
    for (const p of [C, V]) limit(board, p, (r) => r >= 2)
    const found = find(hiddenLines(2, 2, 'hidden-pair', 4, 'Verborgen'), board)
    expectRealChange(board, found)
    expect(found?.explanation).toBe(
      'In rij 1 en 2 kunnen alleen A en B nog staan. Elke rij heeft iemand, dus zij nemen die twee rijen samen in en staan nergens anders.',
    )
    expect(new Set(found?.people)).toEqual(new Set([A, B]))
    expect(removed(found, A).every((c) => board.row(c) >= 2)).toBe(true)
  })

  it('works on columns too, and finds nothing while everybody has a choice', () => {
    const board = new Board(TWO_ROOMS, people)
    expect(find(hiddenLines(1, 3, 'h', 4, 'Verborgen'), board)).toBeNull()
    for (const p of [B, C, V]) limit(board, p, (_, c) => c !== 3)
    const found = find(hiddenLines(1, 1, 'h', 4, 'Verborgen'), board)
    expect(found?.people).toEqual([A])
    expect(found?.explanation).toBe(
      'In kolom 4 kan alleen A nog staan. Elke kolom heeft iemand, dus A staat daar en nergens anders.',
    )
  })

  it('is silent on grids that are not square', () => {
    const wide = scene(['tttt', 'tttt', 'bbbb'])
    const board = new Board(wide, people)
    for (const p of [B, C, V]) limit(board, p, (r) => r !== 0)
    expect(hiddenLines(1, 2, 'h', 4, 'Verborgen').find(board, context(board))).toBeNull()
  })
})

describe('naked triple and quad', () => {
  it('three people confined to three columns own them', () => {
    const board = new Board(TWO_ROOMS, people)
    for (const p of [A, B, C]) limit(board, p, (_, c) => c <= 2)
    const found = nakedLines(3, 'naked-triple', 4, 'Drietal').find(board, context(board))
    expectRealChange(board, found)
    expect(new Set(found?.people)).toEqual(new Set([A, B, C]))
    expect(removed(found, V).every((c) => board.col(c) <= 2)).toBe(true)
    expect(removed(found, V)).toHaveLength(12)
    expect(found?.explanation).toBe(
      'A, B en C kunnen alleen nog in kolom 1, 2 en 3 staan: drie mensen voor drie kolommen. Wie waar staat weten we nog niet, maar die kolommen zijn samen voor hen. Niemand anders kan daar staan.',
    )
  })

  it('a quad needs four people, so a three-person case stays with the triple', () => {
    const board = new Board(TWO_ROOMS, people)
    for (const p of [A, B, C]) limit(board, p, (r) => r <= 2)
    expect(nakedLines(4, 'naked-quad', 5, 'Viertal').find(board, context(board))).toBeNull()
    expect(nakedLines(3, 'naked-triple', 4, 'Drietal').find(board, context(board))?.eliminate.length).toBeGreaterThan(0)
  })
})

describe('rectangle and fish', () => {
  it('two rows whose squares sit in two columns clear those columns elsewhere', () => {
    const board = new Board(TWO_ROOMS, people)
    for (let p = 0; p < 4; p++) limit(board, p, (r, c) => r > 1 || c === 0 || c === 2)
    const found = fish(2, 2, 'rectangle', 4, 'Rechthoek').find(board, context(board))
    expectRealChange(board, found)
    for (const e of found?.eliminate ?? []) {
      expect([0, 2]).toContain(board.col(e.cell))
      expect(board.row(e.cell)).toBeGreaterThan(1)
    }
    expect(found?.explanation).toBe(
      'In rij 1 en 2 zijn alleen nog deze vakjes vrij: rij 1, kolom 1; rij 1, kolom 3; rij 2, kolom 1 en rij 2, kolom 3. Ze liggen allemaal in kolom 1 en 3. Twee rijen hebben dus twee kolommen nodig: samen nemen ze kolom 1 en 3 in beslag. Buiten rij 1 en 2 kan daarom niemand in kolom 1 en 3 staan, ook A niet.',
    )
  })

  it('three rows in three columns is the bigger pattern, and not a rectangle', () => {
    const board = new Board(TWO_ROOMS, people)
    for (let p = 0; p < 4; p++) limit(board, p, (r, c) => r === 3 || c <= 2)
    // Rows 0-2 reach only columns 0-2; the bottom row keeps all four columns.
    expect(fish(2, 2, 'rectangle', 4, 'Rechthoek').find(board, context(board))).toBeNull()
    const found = fish(3, 3, 'fish', 5, 'Vis').find(board, context(board))
    expectRealChange(board, found)
    expect(found?.explanation).toBe(
      'In rij 1, 2 en 3 zijn alleen nog deze vakjes vrij: rij 1, kolom 1; rij 1, kolom 2; rij 1, kolom 3; rij 2, kolom 1 en nog vijf andere vakjes. Ze liggen allemaal in kolom 1, 2 en 3. Drie rijen hebben dus drie kolommen nodig: samen nemen ze kolom 1, 2 en 3 in beslag. Buiten rij 1, 2 en 3 kan daarom niemand in kolom 1, 2 en 3 staan, ook A niet.',
    )
    expect(new Set(found?.eliminate.map((e) => board.col(e.cell)))).toEqual(new Set([0, 1, 2]))
  })

  it('columns work the same way', () => {
    const board = new Board(TWO_ROOMS, people)
    for (let p = 0; p < 4; p++) limit(board, p, (r, c) => c > 1 || r === 1 || r === 3)
    const found = fish(2, 2, 'rectangle', 4, 'Rechthoek').find(board, context(board))
    expectRealChange(board, found)
    expect(found?.explanation).toBe(
      'In rij 1 en 3 zijn alleen nog deze vakjes vrij: rij 1, kolom 3; rij 1, kolom 4; rij 3, kolom 3 en rij 3, kolom 4. Ze liggen allemaal in kolom 3 en 4. Twee rijen hebben dus twee kolommen nodig: samen nemen ze kolom 3 en 4 in beslag. Buiten rij 1 en 3 kan daarom niemand in kolom 3 en 4 staan, ook A niet.',
    )
    for (const e of found?.eliminate ?? []) expect([1, 3]).toContain(board.row(e.cell))
  })
})

describe('intersect-wide', () => {
  it('a person whose squares all lie in one row and column rules out the crossing', () => {
    const board = new Board(TWO_ROOMS, people)
    // A keeps row 0 and column 0: seven squares, all sharing a line with r1k1.
    limit(board, A, (r, c) => r === 0 || c === 0)
    const found = intersectWide.find(board, context(board))
    expectRealChange(board, found)
    expect(removed(found, B)).toEqual([at(0, 0)])
    expect(removed(found, A)).toEqual([])
    expect(found?.explanation).toBe(
      'A kan nog op zeven vakjes staan, en elk daarvan ligt in dezelfde rij of kolom als rij 1, kolom 1. Als daar iemand anders zou staan, houdt A niets over. Daar kan dus niemand anders staan.',
    )
  })

  it('finds nothing when the squares are spread out', () => {
    const board = new Board(TWO_ROOMS, people)
    only(board, A, [[0, 0], [1, 1], [2, 2]])
    expect(intersectWide.find(board, context(board))).toBeNull()
  })
})

describe('room techniques', () => {
  it('hidden single by room: rows only one room reaches need people from those who can get there', () => {
    const board = new Board(TWO_ROOMS, people)
    // Both top rows lie in Kamer t, so two people stand there; only A and B can reach it.
    for (const p of [C, V]) limit(board, p, (r) => r >= 2)
    const found = roomHiddenSingle.find(board, context(board))
    expectRealChange(board, found)
    expect(new Set(found?.people)).toEqual(new Set([A, B]))
    expect(removed(found, A).every((c) => board.room(c) === 1)).toBe(true)
    expect(found?.explanation).toBe(
      'In de Kamer t moeten nog minstens twee mensen staan, want in twee rijen kan alleen nog iemand in de Kamer t staan. Alleen A en B kunnen daar nog komen, dus zij staan daar.',
    )
  })

  it('room capacity: sure people fill a room, nobody else joins', () => {
    const board = new Board(TWO_ROOMS, people)
    for (const p of [A, B]) limit(board, p, (r) => r <= 1)
    const found = roomCapacity.find(board, context(board))
    expectRealChange(board, found)
    expect(found?.explanation).toBe(
      'In de Kamer t kunnen hooguit twee mensen staan, want de Kamer t heeft nog maar twee vrije rijen. A en B staan er al zeker. Niemand anders kan daar dus nog staan.',
    )
    expect(removed(found, C).every((c) => board.room(c) === 0)).toBe(true)
    expect(removed(found, V).length).toBeGreaterThan(0)
    expect(removed(found, A)).toEqual([])
  })

  it('room capacity: the victim room keeps its squares in other rows empty', () => {
    // Room t: rows 1-2 and two squares of row 3. The victim is sure to be in t, so t holds exactly two people.
    const l = scene(['tttt', 'tttt', 'ttbb', 'bbbb'])
    const board = new Board(l, people)
    limit(board, V, (r, c) => r <= 2 && (r < 2 || c < 2))
    const found = roomCapacity.find(board, context(board))
    expectRealChange(board, found)
    expect(found?.explanation).toBe(
      'In de Kamer t kunnen hooguit twee mensen staan, want de Kamer t heeft V en precies één verdachte. Rij 1 en 2 leveren er al twee. Andere rijen hebben dus geen plek meer in de Kamer t.',
    )
    // Rows 0 and 1 already supply the two people; the squares of row 2 in t go.
    expect(new Set(found?.eliminate.map((e) => board.row(e.cell)))).toEqual(new Set([2]))
  })

  it('room techniques stay silent about empty lines on grids that are not square', () => {
    // 3 rows x 5 columns: a column may stay empty, so the confined-line rules do not apply.
    const wide = scene(['ttbbb', 'tbbbb', 'tbbbb'])
    const three: Person[] = [people[A] as Person, people[B] as Person, people[V] as Person]
    const board = new Board(wide, three)
    for (const p of [1, 2]) limit(board, p, (r, c) => wide.cellRooms[r]?.[c] !== 't')
    const ctx: HumanContext = { scene: wide, people: three, clues: [], memo: new Map() }
    const found = roomCapacity.find(board, ctx)
    // A on r1k2 with B and V in the b room is a real solution (column 2 stays empty).
    expect(found?.eliminate.some((e) => e.person === 0 && e.cell === 1) ?? false).toBe(false)
    expect(roomHiddenSingle.find(board, ctx)?.eliminate.some((e) => e.person === 0 && e.cell === 1) ?? false).toBe(false)
  })

  it('victim count: not in a room that has to hold three people', () => {
    const l = scene(['tttt', 'tttt', 'tttt', 'bbbb'])
    const board = new Board(l, people)
    const found = victimCount.find(board, context(board))
    expectRealChange(board, found)
    expect(found?.people).toEqual([V])
    expect(removed(found, V).every((c) => board.room(c) === 0)).toBe(true)
    expect(found?.explanation).toBe(
      'De Kamer t moet minstens drie mensen hebben, want in drie rijen kan alleen nog iemand in de Kamer t staan. V is met precies één verdachte en kan daar dus niet zijn.',
    )
  })

  it('victim count: not in a room that cannot hold two', () => {
    const l = scene(['tttt', 'tttt', 'tttt', 'bbbb'])
    const board = new Board(l, people)
    limit(board, V, (r) => r === 3)
    const found = victimCount.find(board, context(board))
    expectRealChange(board, found)
    expect(removed(found, V).every((c) => board.room(c) === 1)).toBe(true)
    expect(found?.explanation).toBe(
      'De Kamer b kan hooguit één persoon hebben, want de Kamer b heeft nog maar één vrije rij. V is met een verdachte en kan daar dus niet zijn.',
    )
  })

  it('clue room count: somebody who is alone cannot stand in a room that must be crowded', () => {
    const l = scene(['tttt', 'tttt', 'tttt', 'bbbb'])
    const board = new Board(l, people)
    const clues: CatalogClue[] = [{ personId: 'A', type: 'alone', args: {} }]
    const found = clueRoomCount.find(board, context(board, clues))
    expectRealChange(board, found)
    expect(found?.explanation).toBe(
      'Volgens de kaart is A alleen in een kamer, dus daar staat precies één persoon. De Kamer t moet minstens drie mensen hebben, want in drie rijen kan alleen nog iemand in de Kamer t staan. A kan dus niet in de Kamer t staan.',
    )
    expect(found?.people).toEqual([A])
    expect(found?.clueIndex).toBe(0)
    expect(removed(found, A).every((c) => board.room(c) === 0)).toBe(true)
  })

  it('clue room count: "alone with" needs a room that can hold exactly the two', () => {
    const l = scene(['tttt', 'tttt', 'tttt', 'bbbb'])
    const board = new Board(l, people)
    const clues: CatalogClue[] = [{ personId: 'A', type: 'aloneWith', args: { otherId: 'B' } }]
    const found = clueRoomCount.find(board, context(board, clues))
    expectRealChange(board, found)
    expect(found?.explanation).toBe(
      'Volgens de kaart zijn A en B samen alleen in een kamer, dus daar staan precies twee mensen. De Kamer t moet minstens drie mensen hebben, want in drie rijen kan alleen nog iemand in de Kamer t staan. A en B kunnen dus niet in de Kamer t staan.',
    )
    expect(new Set(found?.people)).toEqual(new Set([A, B]))
    // The top room needs three people, the bottom room can hold one: neither suits the pair.
    expect(removed(found, A).length).toBeGreaterThan(0)
  })
})

describe('combined clues', () => {
  // A stands somewhere north of B and on B's diagonal: each card alone leaves both squares of A a partner,
  // together they need a partner that fits both.
  const wide = scene(['tttt', 'tttt', 'bbbb', 'bbbb'])
  const clues: CatalogClue[] = [
    { personId: 'A', type: 'directionOf', args: { side: 'north', otherId: 'B' } },
    { personId: 'A', type: 'diagonal', args: { otherId: 'B' } },
  ]

  it('joint support: a square needs one partner that satisfies both cards', () => {
    const board = new Board(wide, people)
    // B on r3k1 or r4k4; A on r1k2 (diagonal partner r3k... none in B's set) or r1k4.
    only(board, B, [[2, 0], [3, 3]])
    only(board, A, [[0, 1], [1, 3]])
    const found = combinedClues.find(board, context(board, clues))
    // A r1k2: north of both B squares, but diagonal to neither (r3k1: dr=2 dc=1, r4k4: dr=3 dc=2).
    expect(found).not.toBeNull()
    expect(removed(found, A)).toContain(at(0, 1))
    expect(found?.clueIndex).toBeDefined()
    expect(found?.explanation).toBe(
      'De kaarten van A en B horen bij elkaar: "A stond noordelijker dan B." "A stond op dezelfde diagonaal als B." Als A op rij 1, kolom 2 en rij 2, kolom 4 staat, is er voor B geen combinatie van vakjes meer die bij al die kaarten past zonder een rij of kolom te delen. Daar staat A dus niet.',
    )
  })

  it('finds nothing without two cards to combine', () => {
    const board = new Board(wide, people)
    only(board, B, [[2, 0], [3, 3]])
    only(board, A, [[0, 1], [1, 3]])
    expect(combinedClues.find(board, context(board, clues.slice(0, 1)))).toBeNull()
  })

  it('link tables list only squares that agree and share no line', () => {
    const board = new Board(wide, people)
    const model = linkModel(board, context(board, clues))
    expect(model.links).toHaveLength(2)
    const link = model.links[1]
    if (!link) throw new Error('no link')
    // Diagonal: r1k1 with r2k2 (adjacent diagonal) fits, r1k1 with r1k2 shares a row.
    expect(link.compat[at(0, 0) * 16 + at(1, 1)]).toBe(1)
    expect(link.compat[at(0, 0) * 16 + at(0, 1)]).toBe(0)
    expect(link.compat[at(0, 0) * 16 + at(2, 1)]).toBe(0)
  })
})

describe('chain reasoning', () => {
  it('refutes a square whose supposition leaves somebody nowhere to stand', () => {
    const board = new Board(TWO_ROOMS, people)
    // A on r1k1 would take row 1 and column 1, and B has only r1k2 and r2k1 left: both closed.
    only(board, A, [[0, 0], [2, 2]])
    only(board, B, [[0, 1], [1, 0]])
    const found = chain.find(board, context(board))
    expectRealChange(board, found)
    expect(removed(found, A)).toContain(at(0, 0))
    expect(removed(found, A)).not.toContain(at(2, 2))
    expect(found?.explanation).toBe(
      'Stel dat A op rij 1, kolom 1 staat. Dan heeft B nergens meer een vakje. Dat kan niet, dus A staat daar niet. Stel dat C op rij 1, kolom 1 staat. Dan heeft B nergens meer een vakje. Dat kan niet, dus C staat daar niet. Met dezelfde redenering vallen nog veel andere vakjes af.',
    )
  })

  it('follows the placements a supposition forces', () => {
    const board = new Board(TWO_ROOMS, people)
    only(board, A, [[0, 0], [3, 3]])
    only(board, B, [[1, 1], [0, 0]])
    only(board, C, [[1, 1], [0, 2], [2, 0]])
    const model = linkModel(board, context(board))
    const trial = new Trial(board, model)
    const refuted = trial.suppose(A, at(0, 0))
    expect(refuted).not.toBeNull()
    // A takes row 1 and column 1, which leaves B and C each with r2k2 only: one of them is placed, the other is left with nothing.
    expect(refuted?.forced.length).toBeGreaterThanOrEqual(2)
    expect(refuted?.forced.some((f) => f.cell === at(1, 1))).toBe(true)
    expect(refuted?.dead.kind).toBe('person')
  })

  it('does not treat empty lines as dead ends on grids that are not square', () => {
    // 3 rows x 5 columns, three people: columns 4 and 5 stay empty in every real solution.
    const wide = scene(['ttttt', 'ttttt', 'ttttt'])
    const three: Person[] = [people[A] as Person, people[B] as Person, people[V] as Person]
    const board = new Board(wide, three)
    const keep = (person: number, cells: number[]) => limit(board, person, (r, c) => cells.includes(r * 5 + c))
    keep(0, [0, 1])
    keep(1, [5, 6])
    keep(2, [10, 11, 12])
    const ctx: HumanContext = { scene: wide, people: three, clues: [], memo: new Map() }
    // Real solutions: A on r1k1 or r1k2, B on r2k2 or r2k1, V on r3k3 (columns 4 and 5 stay empty).
    // Only V's two squares in the first columns are refuted; nothing of A or B, and never V on r3k3.
    const found = chain.find(board, ctx)
    expect(found?.eliminate.every((e) => e.person === 2 && (e.cell === 10 || e.cell === 11))).toBe(true)
    expect(found?.explanation).not.toContain('geen vrij vakje')
  })

  it('leaves squares alone when the chain works out', () => {
    const board = new Board(TWO_ROOMS, people)
    const model = linkModel(board, context(board))
    expect(new Trial(board, model).refuteAll()).toEqual([])
    expect(chain.find(board, context(board))).toBeNull()
  })
})

describe('catalog shape', () => {
  it('every technique explains itself in Dutch through a title and stays on levels 4 and 5', () => {
    for (const technique of ADVANCED_TECHNIQUES) {
      expect(technique.title.length).toBeGreaterThan(5)
      expect([4, 5]).toContain(technique.level)
      expect(technique.id).toMatch(/^[a-z-]+$/)
    }
  })
})
