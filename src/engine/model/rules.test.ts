import { describe, expect, it } from 'vitest'
import { deriveMurderer, deriveVictimCell, validatePlacement, validateSolution } from './rules.ts'
import { tutorialPuzzle } from './tutorial.fixture.ts'
import type { Placement, Puzzle } from './types.ts'

const at = (row: number, col: number) => ({ row, col })
const place = (personId: string, row: number, col: number): Placement => ({
  personId,
  cell: at(row, col),
})
const codes = (placements: Placement[], options?: { partial?: boolean }) =>
  validatePlacement(tutorialPuzzle, placements, options).issues.map((i) => i.code)

const solution = tutorialPuzzle.solution

describe('tutorial puzzle (murdokus.nl, 4x4)', () => {
  it('has 3 suspects plus the victim in two rooms', () => {
    const { people, scene } = tutorialPuzzle
    expect(people.filter((p) => p.kind === 'suspect')).toHaveLength(3)
    expect(people.filter((p) => p.kind === 'victim')).toHaveLength(1)
    expect(scene.rooms.map((r) => r.name)).toEqual(['Living Room', 'Large Bedroom'])
    expect([scene.width, scene.height]).toEqual([4, 4])
  })

  it('its solution is V r1c1, A r2c3, C r3c4, B r4c2', () => {
    const cellOf = (id: string) => solution.find((p) => p.personId === id)?.cell
    expect(cellOf('V')).toEqual(at(0, 0))
    expect(cellOf('A')).toEqual(at(1, 2))
    expect(cellOf('C')).toEqual(at(2, 3))
    expect(cellOf('B')).toEqual(at(3, 1))
  })

  it('passes validation', () => {
    expect(validatePlacement(tutorialPuzzle, solution)).toEqual({ ok: true, issues: [] })
    expect(validateSolution(tutorialPuzzle)).toEqual({ ok: true, issues: [] })
  })

  it('has murderer A', () => {
    expect(deriveMurderer(tutorialPuzzle, solution)).toBe('A')
  })

  it('leaves the victim the single leftover cell r1c1', () => {
    const suspects = solution.filter((p) => p.personId !== 'V').map((p) => p.cell)
    expect(deriveVictimCell(tutorialPuzzle.scene, suspects)).toEqual(at(0, 0))
  })
})

describe('validatePlacement', () => {
  it('rejects two people in one row', () => {
    const moved = solution.map((p) => (p.personId === 'B' ? place('B', 2, 1) : p))
    expect(codes(moved)).toContain('row-conflict')
  })

  it('rejects two people in one column, also across rooms', () => {
    // C (bedroom) into A's column (living room): columns are grid-wide.
    const moved = solution.map((p) => (p.personId === 'C' ? place('C', 2, 2) : p))
    const issues = validatePlacement(tutorialPuzzle, moved).issues
    expect(issues.map((i) => i.code)).toContain('col-conflict')
    expect(issues.find((i) => i.code === 'col-conflict')?.personIds.sort()).toEqual(['A', 'C'])
  })

  it('rejects an empty row/column on a square grid', () => {
    const found = codes([place('V', 0, 0), place('A', 1, 2), place('C', 2, 3)], { partial: false })
    expect(found).toContain('missing-person')
    expect(found).toContain('row-empty')
    expect(found).toContain('col-empty')
  })

  it.each([
    ['table', 0, 2],
    ['tv', 1, 0],
    ['plant', 3, 3],
  ])('rejects a person on a blocking %s', (_name, row, col) => {
    const moved = [place('A', row, col), ...solution.filter((p) => p.personId !== 'A')]
    expect(codes(moved)).toContain('not-occupiable')
  })

  it('rejects a victim on a blocked leftover cell', () => {
    // The suspects leave r4c4, where the plant stands.
    const others = [place('A', 1, 2), place('B', 2, 1), place('C', 0, 0)]
    expect(codes([...others, place('V', 3, 3)])).toEqual(['not-occupiable'])
  })

  it('allows any one cell of a multi-cell bed', () => {
    const upper = solution.map((p) => (p.personId === 'B' ? place('B', 2, 1) : p))
    // B now shares row 3 with C, so only the row conflict may show up, not a bed problem.
    expect(codes(upper)).not.toContain('not-occupiable')
  })

  it('rejects unknown, duplicate and out-of-grid placements', () => {
    expect(codes([...solution, place('Z', 1, 1)])).toContain('unknown-person')
    expect(codes([...solution, place('A', 1, 2)])).toContain('duplicate-person')
    const off = solution.map((p) => (p.personId === 'B' ? place('B', 4, 1) : p))
    expect(codes(off)).toContain('out-of-bounds')
  })

  it('reports a person who is not placed', () => {
    expect(codes(solution.filter((p) => p.personId !== 'B'))).toContain('missing-person')
  })

  it('partial placements may be incomplete but still report conflicts', () => {
    expect(codes([place('A', 1, 2)], { partial: true })).toEqual([])
    expect(codes([place('A', 1, 2), place('B', 1, 1)], { partial: true })).toEqual([
      'row-conflict',
    ])
    expect(codes([place('A', 1, 2), place('V', 0, 2)], { partial: true })).toEqual([
      'not-occupiable',
      'col-conflict',
    ])
  })

  it('on a non-square grid only sharing a row or column is forbidden', () => {
    const wide: Puzzle = {
      ...tutorialPuzzle,
      scene: {
        width: 3,
        height: 2,
        rooms: [{ id: 'r', name: 'Room' }],
        cellRooms: [
          ['r', 'r', 'r'],
          ['r', 'r', 'r'],
        ],
        objects: [],
        edgeFeatures: [],
      },
      people: [
        { id: 'V', kind: 'victim', label: 'V' },
        { id: 'A', kind: 'suspect', label: 'A' },
      ],
    }
    expect(validatePlacement(wide, [place('V', 0, 0), place('A', 1, 1)]).ok).toBe(true)
    expect(validatePlacement(wide, [place('V', 0, 0), place('A', 1, 0)]).ok).toBe(false)
  })
})

describe('deriveVictimCell', () => {
  const { scene } = tutorialPuzzle

  it('returns the crossing of the one free row and column', () => {
    expect(deriveVictimCell(scene, [at(0, 0), at(1, 1), at(2, 2)])).toEqual(at(3, 3))
  })

  it('is null while more than one cell is left', () => {
    expect(deriveVictimCell(scene, [at(0, 0), at(1, 1)])).toBeNull()
    expect(deriveVictimCell(scene, [])).toBeNull()
  })

  it('is null when suspects share a row or column', () => {
    expect(deriveVictimCell(scene, [at(0, 0), at(0, 1), at(2, 2)])).toBeNull()
  })
})

describe('deriveMurderer', () => {
  it('is the only suspect in the victim room', () => {
    expect(deriveMurderer(tutorialPuzzle, solution)).toBe('A')
    // Victim in the bedroom instead: V r3c1 alone with C.
    const moved = [place('V', 2, 0), place('C', 3, 3), place('A', 0, 2), place('B', 1, 1)]
    expect(deriveMurderer(tutorialPuzzle, moved)).toBe('C')
  })

  it('is null when the victim room holds no suspect', () => {
    const placements = [place('V', 0, 0), place('A', 2, 1), place('B', 3, 2), place('C', 3, 3)]
    expect(deriveMurderer(tutorialPuzzle, placements)).toBeNull()
  })

  it('is null when the victim room holds several suspects', () => {
    const placements = [place('V', 0, 0), place('A', 0, 1), place('B', 1, 2), place('C', 3, 3)]
    expect(deriveMurderer(tutorialPuzzle, placements)).toBeNull()
  })

  it('is null when the victim is not placed', () => {
    expect(deriveMurderer(tutorialPuzzle, solution.filter((p) => p.personId !== 'V'))).toBeNull()
  })

  it('ignores suspects in other rooms', () => {
    // C and B in the bedroom do not count.
    expect(deriveMurderer(tutorialPuzzle, solution)).toBe('A')
  })
})

describe('validateSolution', () => {
  const split: Puzzle = {
    scene: {
      width: 2,
      height: 2,
      rooms: [
        { id: 'l', name: 'Left' },
        { id: 'r', name: 'Right' },
      ],
      cellRooms: [
        ['l', 'r'],
        ['l', 'r'],
      ],
      objects: [],
      edgeFeatures: [],
    },
    people: [
      { id: 'V', kind: 'victim', label: 'V' },
      { id: 'A', kind: 'suspect', label: 'A' },
    ],
    solution: [place('V', 0, 0), place('A', 1, 1)],
    clues: [],
  }

  it('fails when the victim room does not hold exactly one suspect', () => {
    const result = validateSolution(split)
    expect(result.ok).toBe(false)
    expect(result.issues.map((i) => i.code)).toEqual(['no-murderer'])
  })

  it('passes once the victim shares a room with one suspect', () => {
    const together: Puzzle = {
      ...split,
      scene: { ...split.scene, cellRooms: [['l', 'l'], ['l', 'l']] },
    }
    expect(validateSolution(together)).toEqual({ ok: true, issues: [] })
  })
})
