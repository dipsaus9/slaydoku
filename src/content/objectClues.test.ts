import { describe, expect, it } from 'vitest'
import { evaluate, renderClue } from '../engine/clues/index.ts'
import type { CatalogClue } from '../engine/clues/index.ts'
import { roomIdAt, sameCell } from '../engine/model/index.ts'
import type { Cell, PlacedObject, Puzzle } from '../engine/model/index.ts'
import { demoLevels } from './levels.ts'
import { generatedPuzzles } from './generated.testing.ts'

/**
 * Safeguard: a clue about a multi-cell object means the WHOLE object, the way a person reads
 * it. Every puzzle of the demo level and of a generated sample is checked against an independent
 * (bounding box) statement of the rule, not against the evaluator alone, so the rule holds by construction.
 *
 * - "noordelijker dan een bed": strictly above the whole bed (row < the bed's topmost row) for at least
 *   one bed; south/east/west likewise with the bottom row / columns. A person in the rows or columns the
 *   object itself spans is never beyond it.
 * - "naast" / "niet naast" / "direct boven een X": next to a square of one object, but not standing on it.
 * - No scene has stairs: nobody can stand on them, and they made confusing clues.
 */

interface Subject {
  name: string
  puzzle: Puzzle
}
const subjects: Subject[] = [
  ...demoLevels.map((l) => ({ name: `level ${l.id}`, puzzle: l.puzzle })),
  ...generatedPuzzles().map((e) => ({ name: `generated puzzle ${e.id}`, puzzle: e.puzzle })),
]

const extent = (o: Pick<PlacedObject, 'cells'>) => ({
  minRow: Math.min(...o.cells.map((c) => c.row)),
  maxRow: Math.max(...o.cells.map((c) => c.row)),
  minCol: Math.min(...o.cells.map((c) => c.col)),
  maxCol: Math.max(...o.cells.map((c) => c.col)),
})

/** The rule, written from the bounding box only. */
function beyond(cell: Cell, o: Pick<PlacedObject, 'cells'>, side: string): boolean {
  const e = extent(o)
  switch (side) {
    case 'north':
      return cell.row < e.minRow
    case 'south':
      return cell.row > e.maxRow
    case 'west':
      return cell.col < e.minCol
    default:
      return cell.col > e.maxCol
  }
}

/** Beside, written independently: orthogonal neighbour in the same room, not standing on the object. */
function besideIndependent(puzzle: Puzzle, cell: Cell, o: PlacedObject): boolean {
  if (o.cells.some((c) => sameCell(c, cell))) return false
  return o.cells.some(
    (c) => Math.abs(c.row - cell.row) + Math.abs(c.col - cell.col) === 1 && roomIdAt(puzzle.scene, c) === roomIdAt(puzzle.scene, cell),
  )
}

const SIDE_WORD: Record<string, string> = { north: 'noordelijker', south: 'zuidelijker', east: 'oostelijker', west: 'westelijker' }
const DIRECTION_OF_OBJECT_SIDES = ['north', 'south', 'east', 'west']

const holderCell = (puzzle: Puzzle, clue: { personId: string }): Cell =>
  puzzle.solution.find((p) => p.personId === clue.personId)!.cell

describe('object clues mean the whole object', () => {
  it('covers the demo level and a generated sample of every theme', () => {
    expect(demoLevels).toHaveLength(1)
    expect(generatedPuzzles().length).toBeGreaterThanOrEqual(30)
  })

  it('has no stairs in any level or generated scene', () => {
    for (const { name, puzzle } of subjects) {
      expect(puzzle.scene.objects.filter((o) => o.type === 'stairs').map((o) => o.id), name).toEqual([])
    }
  })

  describe('directionOfObject', () => {
    const wide = subjects.flatMap((s) =>
      s.puzzle.clues
        .filter((c) => c.type === 'directionOfObject')
        .flatMap((c) => s.puzzle.scene.objects.filter((o) => o.type === (c.args as { objectType: string }).objectType && o.cells.length > 1)),
    )
    const seen = subjects.reduce((n, s) => n + s.puzzle.clues.filter((c) => c.type === 'directionOfObject').length, 0)
    it.each(subjects.map((s) => [s.name, s.puzzle] as const))('%s: strictly beyond the whole extent of at least one object', (name, puzzle) => {
      const ctx = { scene: puzzle.scene, people: puzzle.people }
      for (const raw of puzzle.clues) {
        if (raw.type !== 'directionOfObject') continue
        const clue = raw as CatalogClue & { type: 'directionOfObject'; args: { side: string; objectType: string } }
        const { side, objectType } = clue.args
        const objects = puzzle.scene.objects.filter((o) => o.type === objectType)
        expect(objects.length, `${name}: names an object the board has`).toBeGreaterThan(0)
        const cell = holderCell(puzzle, clue)

        // The stored solution satisfies the clue, by the bounding-box rule and by the evaluator.
        const witnesses = objects.filter((o) => beyond(cell, o, side))
        expect(witnesses.length, `${name}: ${renderClue(clue, ctx)}`).toBeGreaterThan(0)
        expect(evaluate(clue, puzzle.scene, puzzle.solution), name).toBe(true)

        // Wording: the compass word of the side, then "dan een <object>".
        const text = renderClue(clue, ctx)
        expect(text, name).toContain(SIDE_WORD[side])
        expect(DIRECTION_OF_OBJECT_SIDES).toContain(side)
        expect(text, name).toMatch(/ dan een [a-zé ,]+\.$/)

        // Same rows/columns as a multi-cell object's own extent: never beyond THAT object.
        for (const o of objects) {
          if (o.cells.length < 2) continue
          const e = extent(o)
          const vertical = side === 'north' || side === 'south'
          const only = { ...puzzle.scene, objects: [o] }
          for (let row = 0; row < puzzle.scene.height; row++) {
            for (let col = 0; col < puzzle.scene.width; col++) {
              const inBand = vertical ? row >= e.minRow && row <= e.maxRow : col >= e.minCol && col <= e.maxCol
              if (!inBand) continue
              expect(
                evaluate(clue, only, [{ personId: clue.personId, cell: { row, col } }]),
                `${name}: r${row + 1}c${col + 1} lies in the ${vertical ? 'rows' : 'columns'} of ${o.id}`,
              ).toBe(false)
            }
          }
        }
      }
    })

    it('the levels and the generated sample really use direction-of-object clues on multi-cell objects (the check is not vacuous)', () => {
      expect(seen).toBeGreaterThan(5)
      expect(wide.length).toBeGreaterThan(2)
    })
  })

  describe('besideObject, notBesideObject, directlyNextToObject', () => {
    it.each(subjects.map((s) => [s.name, s.puzzle] as const))('%s: next to a square of one object, never on it', (name, puzzle) => {
      for (const clue of puzzle.clues) {
        const args = (clue.args ?? {}) as { objectType?: string; side?: string; exactlyOne?: boolean }
        if (args.objectType === undefined) continue
        const objects = puzzle.scene.objects.filter((o) => o.type === args.objectType)
        const cell = holderCell(puzzle, clue)
        if (clue.type === 'besideObject') {
          const count = objects.filter((o) => besideIndependent(puzzle, cell, o)).length
          expect(args.exactlyOne ? count === 1 : count >= 1, `${name}: besideObject`).toBe(true)
        } else if (clue.type === 'notBesideObject') {
          expect(objects.some((o) => besideIndependent(puzzle, cell, o)), `${name}: notBesideObject`).toBe(false)
        } else if (clue.type === 'directlyNextToObject') {
          const d = { north: [1, 0], south: [-1, 0], east: [0, -1], west: [0, 1] }[args.side as string] as number[]
          const from = { row: cell.row + (d[0] as number), col: cell.col + (d[1] as number) }
          const hit = objects.some((o) => o.cells.some((c) => sameCell(c, from)) && besideIndependent(puzzle, cell, o))
          expect(hit, `${name}: directlyNextToObject ${args.side}`).toBe(true)
        }
      }
    })
  })
})
