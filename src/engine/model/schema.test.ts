import { describe, expect, it } from 'vitest'
import {
  checkPuzzle,
  checkScene,
  parsePuzzle,
  parseScene,
  serializePuzzle,
  serializeScene,
} from './schema.ts'
import { isOccupiable } from './scene.ts'
import { tutorialPuzzle } from './tutorial.fixture.ts'
import type { ObjectType } from './types.ts'

/** Deep copy of the fixture that tests can mutate freely. */
function fresh() {
  return structuredClone(tutorialPuzzle)
}

const messages = (issues: { path: string; message: string }[]) => issues.map((i) => i.path)

describe('Person.gender', () => {
  it('is optional: a puzzle without genders stays valid', () => {
    expect(tutorialPuzzle.people.every((p) => p.gender === undefined)).toBe(true)
    expect(checkPuzzle(tutorialPuzzle)).toEqual([])
  })

  it('accepts woman and man and survives the JSON round trip', () => {
    const puzzle = fresh()
    puzzle.people[1]!.gender = 'woman'
    puzzle.people[2]!.gender = 'man'
    expect(checkPuzzle(puzzle)).toEqual([])
    expect(parsePuzzle(serializePuzzle(puzzle))).toEqual({ ok: true, value: puzzle })
  })

  it('rejects any other gender', () => {
    const puzzle = fresh()
    puzzle.people[1]!.gender = 'hij' as never
    expect(messages(checkPuzzle(puzzle))).toEqual(['people[1].gender'])
  })
})

describe('JSON round trip', () => {
  it('serializes and parses a puzzle back to an equal value', () => {
    const parsed = parsePuzzle(serializePuzzle(tutorialPuzzle))
    expect(parsed).toEqual({ ok: true, value: tutorialPuzzle })
  })

  it('serializes and parses a scene back to an equal value', () => {
    expect(parseScene(serializeScene(tutorialPuzzle.scene))).toEqual({
      ok: true,
      value: tutorialPuzzle.scene,
    })
  })

  it('reports invalid JSON', () => {
    const parsed = parsePuzzle('{ nope')
    expect(parsed.ok).toBe(false)
  })

  it('reports schema problems from parse', () => {
    const broken = { ...fresh(), people: [] }
    const parsed = parsePuzzle(JSON.stringify(broken))
    expect(parsed.ok).toBe(false)
  })
})

describe('checkScene', () => {
  it('accepts the tutorial scene', () => {
    expect(checkScene(tutorialPuzzle.scene)).toEqual([])
  })

  it('rejects non-objects and bad dimensions', () => {
    expect(checkScene(null)).toHaveLength(1)
    expect(checkScene([])).toHaveLength(1)
    const scene = { ...fresh().scene, width: 0 }
    expect(messages(checkScene(scene))).toContain('scene.width')
  })

  it('rejects a cell grid of the wrong size', () => {
    const scene = fresh().scene
    scene.cellRooms.pop()
    expect(messages(checkScene(scene))).toContain('scene.cellRooms')
    const wide = fresh().scene
    wide.cellRooms[0]!.push('living')
    expect(messages(checkScene(wide))).toContain('scene.cellRooms[0]')
  })

  it('rejects cells with an unknown room', () => {
    const scene = fresh().scene
    scene.cellRooms[1]![1] = 'garden'
    expect(messages(checkScene(scene))).toContain('scene.cellRooms[1][1]')
  })

  it('rejects duplicate room ids, empty rooms and disconnected rooms', () => {
    const dup = fresh().scene
    dup.rooms.push({ id: 'living', name: 'Again' })
    expect(messages(checkScene(dup))).toContain('scene.rooms[2]')

    const empty = fresh().scene
    empty.rooms.push({ id: 'garden', name: 'Garden' })
    expect(checkScene(empty).map((i) => i.message)).toContain('Room "garden" has no cells.')

    const split = fresh().scene
    split.cellRooms[0]![0] = 'bedroom'
    expect(checkScene(split).map((i) => i.message)).toContain('Room "bedroom" is not connected.')
  })

  it('rejects unknown object types, out-of-grid cells and overlaps', () => {
    const scene = fresh().scene
    scene.objects.push({ id: 'x', type: 'ufo' as never, cells: [{ row: 9, col: 0 }] })
    scene.objects.push({ id: 'rug', type: 'rug', cells: [{ row: 0, col: 2 }] })
    const found = messages(checkScene(scene))
    expect(found).toContain('scene.objects[4].type')
    expect(found).toContain('scene.objects[4].cells[0]')
    expect(found).toContain('scene.objects[5].cells[0]') // overlaps the table
  })

  it('rejects duplicate object ids and empty cell lists', () => {
    const scene = fresh().scene
    scene.objects.push({ id: 'bed', type: 'rug', cells: [] })
    const found = messages(checkScene(scene))
    expect(found).toContain('scene.objects[4]')
    expect(found).toContain('scene.objects[4].cells')
  })

  it('rejects a multi-cell object that is split or crosses a wall', () => {
    const split = fresh().scene
    split.objects[2]!.cells = [
      { row: 2, col: 1 },
      { row: 3, col: 3 },
    ]
    expect(messages(checkScene(split))).toContain('scene.objects[2].cells')

    const crossing = fresh().scene
    crossing.objects[2]!.cells = [
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ]
    expect(checkScene(crossing).map((i) => i.message)).toContain(
      'An object must stay within one room.',
    )
  })

  it('rejects bad edge features', () => {
    const scene = fresh().scene
    scene.edgeFeatures.push(
      { kind: 'hatch' as never, cell: { row: 0, col: 0 }, side: 'up' as never },
      { kind: 'door', cell: { row: 5, col: 5 }, side: 'north' },
    )
    const found = messages(checkScene(scene))
    expect(found).toEqual(
      expect.arrayContaining([
        'scene.edgeFeatures[1].kind',
        'scene.edgeFeatures[1].side',
        'scene.edgeFeatures[2].cell',
      ]),
    )
  })
})

describe('checkPuzzle', () => {
  it('accepts the tutorial puzzle', () => {
    expect(checkPuzzle(tutorialPuzzle)).toEqual([])
  })

  it('rejects a puzzle without exactly one victim', () => {
    const none = fresh()
    none.people = none.people.filter((p) => p.kind === 'suspect')
    none.solution = none.solution.filter((p) => p.personId !== 'V')
    expect(messages(checkPuzzle(none))).toContain('people')

    const two = fresh()
    two.people[1]!.kind = 'victim'
    expect(messages(checkPuzzle(two))).toContain('people')
  })

  it('rejects duplicate people and malformed people', () => {
    const puzzle = fresh()
    puzzle.people.push({ id: 'A', kind: 'suspect', label: 'A2' })
    puzzle.people.push({ id: 'Q', kind: 'ghost' as never, label: 'Q' })
    const found = messages(checkPuzzle(puzzle))
    expect(found).toContain('people[4]')
    expect(found).toContain('people[5]')
  })

  it('rejects solutions that miss, repeat, invent or misplace people', () => {
    const puzzle = fresh()
    puzzle.solution = [
      { personId: 'V', cell: { row: 0, col: 0 } },
      { personId: 'V', cell: { row: 0, col: 1 } },
      { personId: 'Z', cell: { row: 1, col: 1 } },
      { personId: 'A', cell: { row: 7, col: 1 } },
    ]
    const found = checkPuzzle(puzzle)
    expect(found.map((i) => i.path)).toEqual(
      expect.arrayContaining(['solution[1]', 'solution[2]', 'solution[3].cell', 'solution']),
    )
  })

  it('rejects clues for unknown people or with bad args', () => {
    const puzzle = fresh()
    puzzle.clues = [
      { personId: 'Z', type: 'alone' },
      { personId: 'A', type: 'beside', args: [] as never },
    ]
    const found = messages(checkPuzzle(puzzle))
    expect(found).toContain('clues[0]')
    expect(found).toContain('clues[1].args')
  })

  it('accepts clue slots with JSON args', () => {
    const puzzle = fresh()
    puzzle.clues = [{ personId: 'A', type: 'besideObject', args: { object: 'table' } }]
    expect(checkPuzzle(puzzle)).toEqual([])
  })

  it('rejects non-objects', () => {
    expect(checkPuzzle('puzzle')).toHaveLength(1)
    expect(messages(checkPuzzle({}))).toEqual(
      expect.arrayContaining(['scene', 'people', 'solution', 'clues']),
    )
  })
})

describe('house object types (CAD-4.28)', () => {
  const houseTypes = [
    'washingMachine',
    'dryer',
    'cabinet',
    'stairs',
    'toilet',
    'sink',
    'shower',
    'desk',
    'wardrobe',
    'diningTable',
    'kitchenCounter',
    'bicycle',
    'gardenTable',
    'bench',
  ] as const

  /** The tutorial scene with one extra object of `type` on the free cell r1c2 (0-based row 0, col 1). */
  function withObject(type: ObjectType) {
    const scene = fresh().scene
    scene.objects.push({ id: 'house', type, cells: [{ row: 0, col: 1 }] })
    return scene
  }

  it.each(houseTypes)('checkScene and parseScene accept %s', (type) => {
    const scene = withObject(type)
    expect(checkScene(scene)).toEqual([])
    expect(parseScene(serializeScene(scene))).toEqual({ ok: true, value: scene })
  })

  it.each(houseTypes)('treats %s as blocking', (type) => {
    const scene = withObject(type)
    expect(isOccupiable(scene, { row: 0, col: 1 })).toBe(false)
  })

  it('still rejects unknown types', () => {
    const scene = withObject('washingMachine')
    scene.objects[scene.objects.length - 1]!.type = 'spaceship' as never
    expect(messages(checkScene(scene))).toContain('scene.objects[4].type')
    expect(parseScene(JSON.stringify(scene)).ok).toBe(false)
  })
})
