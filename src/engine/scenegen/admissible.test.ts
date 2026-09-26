import { describe, expect, it } from 'vitest'
import { isOccupiable, validateSolution } from '../model/index.ts'
import { tutorialPuzzle } from '../model/tutorial.fixture.ts'
import type { Cell, Person, Scene } from '../model/index.ts'
import { checkAdmissible, peopleCount } from './admissible.ts'
import { createRandom } from './random.ts'

function people(count: number): Person[] {
  const suspects = Array.from({ length: count - 1 }, (_, i) => ({
    id: `S${i}`,
    kind: 'suspect' as const,
    label: `S${i}`,
  }))
  return [...suspects, { id: 'V', kind: 'victim', label: 'V' }]
}

function permutations(n: number): number[][] {
  if (n === 0) return [[]]
  return permutations(n - 1).flatMap((p) =>
    Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]),
  )
}

/** Exhaustive reference: the rooms that can hold the victim next to exactly one suspect. */
function bruteForceVictimRooms(scene: Scene): string[] {
  const n = scene.width
  const rooms = new Set<string>()
  for (const cols of permutations(n)) {
    const cells: Cell[] = cols.map((col, row) => ({ row, col }))
    if (!cells.every((cell) => isOccupiable(scene, cell))) continue
    for (const victim of cells) {
      const room = scene.cellRooms[victim.row]![victim.col]!
      const inRoom = cells.filter((c) => scene.cellRooms[c.row]![c.col] === room)
      if (inRoom.length === 2) rooms.add(room)
    }
  }
  return scene.rooms.map((r) => r.id).filter((id) => rooms.has(id))
}

function randomScene(size: number, seed: number): Scene {
  const random = createRandom(seed)
  const ids = ['a', 'b', 'c', 'd']
  const cellRooms = Array.from({ length: size }, () => Array.from({ length: size }, () => ids[Math.floor(random() * 4)]!))
  // Random rooms need not be connected; admissibility does not care.
  const objects = Array.from({ length: size * 2 }, (_, i) => ({
    id: `o${i}`,
    type: 'table' as const,
    cells: [{ row: Math.floor(random() * size), col: Math.floor(random() * size) }],
  })).filter((o, i, all) => all.findIndex((p) => p.cells[0]!.row === o.cells[0]!.row && p.cells[0]!.col === o.cells[0]!.col) === i)
  return {
    width: size,
    height: size,
    rooms: ids.map((id) => ({ id, name: id })),
    cellRooms,
    objects,
    edgeFeatures: [],
  }
}

describe('checkAdmissible', () => {
  it('accepts the tutorial scene with a witness the rules validate', () => {
    const scene = tutorialPuzzle.scene
    const result = checkAdmissible(scene)
    expect(result.ok).toBe(true)
    const witness = result.witness!
    const all = people(peopleCount(scene))
    const solution = [
      { personId: 'V', cell: witness.victim },
      ...witness.suspects.map((cell, i) => ({ personId: `S${i}`, cell })),
    ]
    expect(validateSolution({ scene, people: all, solution, clues: [] }).ok).toBe(true)
  })

  it('rejects a row without any occupiable cell', () => {
    const scene: Scene = {
      ...tutorialPuzzle.scene,
      objects: [0, 1, 2, 3].map((col) => ({ id: `t${col}`, type: 'table', cells: [{ row: 0, col }] })),
    }
    expect(checkAdmissible(scene).ok).toBe(false)
  })

  it('rejects rooms whose free cells share a line as victim rooms', () => {
    // Two rows, each its own room: a victim and its suspect would share a row.
    const scene: Scene = {
      width: 4,
      height: 4,
      rooms: [
        { id: 'top', name: 'Top' },
        { id: 'mid', name: 'Mid' },
        { id: 'low', name: 'Low' },
        { id: 'end', name: 'End' },
      ],
      cellRooms: [
        ['top', 'top', 'top', 'top'],
        ['mid', 'mid', 'mid', 'mid'],
        ['low', 'low', 'low', 'low'],
        ['end', 'end', 'end', 'end'],
      ],
      objects: [],
      edgeFeatures: [],
    }
    expect(checkAdmissible(scene)).toEqual({ ok: false, victimRooms: [] })
  })

  it('agrees with an exhaustive search on random 4x4 and 5x5 scenes', () => {
    let admissible = 0
    let refused = 0
    for (let seed = 1; seed <= 150; seed++) {
      const scene = randomScene(seed % 2 === 0 ? 4 : 5, seed)
      const result = checkAdmissible(scene)
      expect(result.victimRooms, `seed ${seed}`).toEqual(bruteForceVictimRooms(scene))
      if (result.ok) admissible++
      else refused++
    }
    // The comparison is only worth something when both outcomes occur.
    expect(admissible).toBeGreaterThan(10)
    expect(refused).toBeGreaterThan(10)
  })

  it('handles non-square grids: people = the shorter side, no row or column may be shared', () => {
    const scene: Scene = {
      width: 6,
      height: 4,
      rooms: [
        { id: 'l', name: 'L' },
        { id: 'r', name: 'R' },
      ],
      cellRooms: Array.from({ length: 4 }, () => ['l', 'l', 'l', 'r', 'r', 'r']),
      objects: [],
      edgeFeatures: [],
    }
    const result = checkAdmissible(scene)
    expect(result.ok).toBe(true)
    expect(peopleCount(scene)).toBe(4)
    const cells = [result.witness!.victim, ...result.witness!.suspects]
    expect(cells).toHaveLength(4)
    expect(new Set(cells.map((c) => c.row)).size).toBe(4)
    expect(new Set(cells.map((c) => c.col)).size).toBe(4)
  })
})
