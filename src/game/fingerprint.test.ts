import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../engine/model/index.ts'
import { puzzle } from './fixture.ts'
import { puzzleFingerprint } from './fingerprint.ts'

const copy = (): Puzzle => structuredClone(puzzle)

/** The same value with the keys of every object written in reverse order. */
function reverseKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(reverseKeys) as T
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reverseKeys(v)])) as T
  }
  return value
}

describe('puzzleFingerprint', () => {
  it('is 8 lowercase hex digits and deterministic', () => {
    const fp = puzzleFingerprint(puzzle)
    expect(fp).toMatch(/^[0-9a-f]{8}$/)
    expect(puzzleFingerprint(copy())).toBe(fp)
    expect(puzzleFingerprint(JSON.parse(JSON.stringify(puzzle)))).toBe(fp)
  })

  it('does not depend on the order of keys', () => {
    expect(puzzleFingerprint(reverseKeys(puzzle))).toBe(puzzleFingerprint(puzzle))
  })

  it('an unset gender equals a missing one', () => {
    const p = copy()
    p.people = p.people.map((person) => ({ ...person, gender: undefined }))
    expect(puzzleFingerprint(p)).toBe(puzzleFingerprint(puzzle))
  })

  const changes: [string, (p: Puzzle) => void][] = [
    ['a room name', (p) => void (p.scene.rooms[0]!.name = 'Vliering')],
    ['a room of one cell', (p) => void (p.scene.cellRooms[0]![0] = p.scene.cellRooms[3]![3]!)],
    ['the grid size', (p) => void (p.scene.width += 1)],
    ['an object cell', (p) => void (p.scene.objects[0]!.cells[0]!.col += 1)],
    ['an object type', (p) => void (p.scene.objects[0]!.type = 'chair')],
    ['a removed object', (p) => void p.scene.objects.pop()],
    ['a door or window', (p) => void (p.scene.edgeFeatures[0]!.side = p.scene.edgeFeatures[0]!.side === 'north' ? 'south' : 'north')],
    ['a removed door or window', (p) => void p.scene.edgeFeatures.pop()],
    ['a person label', (p) => void (p.people[0]!.label = 'Zoë')],
    ['a person kind', (p) => void (p.people[0]!.kind = p.people[0]!.kind === 'suspect' ? 'victim' : 'suspect')],
    ['a gender', (p) => void (p.people[0]!.gender = 'vrouw')],
    ['a clue argument', (p) => void (p.clues[0]!.args = { objectType: 'bed' })],
    ['a clue type', (p) => void (p.clues[1]!.type = 'besideObject')],
    ['a removed clue', (p) => void p.clues.pop()],
    ['the solution', (p) => void (p.solution[0]!.cell = { row: 3, col: 3 })],
  ]
  it.each(changes)('changes when %s changes', (_name, change) => {
    const p = copy()
    change(p)
    expect(puzzleFingerprint(p)).not.toBe(puzzleFingerprint(puzzle))
  })
})
