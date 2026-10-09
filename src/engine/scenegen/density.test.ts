import { describe, expect, it } from 'vitest'
import { generateScene } from './generate.ts'
import type { ObjectType } from '../model/index.ts'
import { THEME_MIX, boardMixProblems, densityCap, maxBoardObjects, maxKindCount, minBoardFamilies, minBoardKinds } from './mix.ts'
import { SQUARES_PER_OBJECT, maxObjectsInRoom } from './objects.ts'
import { REGULAR_THEMES } from './variety.testing.ts'

/** SLAY-22: a room holds at most `maxObjectsInRoom(squares)` objects, so it looks furnished but not crowded. The 200-scene sweep is variety.slow.test.ts. */
describe('object density cap (SLAY-22)', () => {
  it('grows with the room: one object per five squares, plus one', () => {
    expect(SQUARES_PER_OBJECT).toBe(5)
    expect([1, 2, 4, 5, 9, 10, 14, 15, 24, 25].map(maxObjectsInRoom)).toEqual([1, 1, 1, 2, 2, 3, 3, 4, 5, 6])
  })

  for (const size of [6, 7, 8, 9]) {
    it(`${size}x${size}: no room over the cap and no bare room of 3+ squares, every theme, 30 seeds`, () => {
      for (const theme of REGULAR_THEMES) {
        for (let seed = 1; seed <= 30; seed++) {
          const scene = generateScene({ width: size, height: size, theme, seed: seed * 97 + size })
          const squares = new Map<string, number>()
          const objects = new Map<string, number>()
          for (const id of scene.cellRooms.flat()) squares.set(id, (squares.get(id) ?? 0) + 1)
          for (const o of scene.objects) {
            const room = scene.cellRooms[o.cells[0]!.row]![o.cells[0]!.col]!
            objects.set(room, (objects.get(room) ?? 0) + 1)
          }
          for (const [room, n] of squares) {
            const placed = objects.get(room) ?? 0
            expect(placed, `${theme} seed ${seed} ${room}`).toBeLessThanOrEqual(maxObjectsInRoom(n))
            if (n >= 3) expect(placed, `${theme} seed ${seed} ${room} is bare`).toBeGreaterThan(0)
          }
        }
      }
    })
  }
})

/** SLAY-22, owner 2026-10-09: the board as a whole must not be cluttered and must look like a real place (mix.ts). */
describe('board mix and density (SLAY-22)', () => {
  it('lets the density cap fall and the kind and family minimums grow with the board', () => {
    expect([6, 7, 8, 9, 12].map((s) => Math.round(densityCap(s) * 100))).toEqual([28, 27, 26, 25, 22])
    expect([6, 7, 8, 9, 12].map((s) => maxBoardObjects(s, s))).toEqual([10, 13, 16, 20, 31])
    expect([6, 7, 8, 9, 12].map(minBoardKinds)).toEqual([5, 6, 7, 8, 11])
    expect([6, 7, 8, 9, 12].map(minBoardFamilies)).toEqual([4, 5, 5, 5, 5])
    expect([8, 12, 16, 30].map(maxKindCount)).toEqual([3, 3, 4, 8])
  })

  it('refuses a board of only chairs and lamps, and one dominated by a single kind', () => {
    const at = (i: number) => [{ row: Math.floor(i / 6), col: i % 6 }]
    const chairsAndLamps = Array.from({ length: 8 }, (_, i) => ({ id: i % 2 ? `chair-${i}` : `floorLamp-${i}`, type: (i % 2 ? 'chair' : 'lamp') as ObjectType, cells: at(i) }))
    const problems = boardMixProblems(chairsAndLamps, 6, 6, 'home')
    expect(problems.some((p) => p.includes('kinds'))).toBe(true)
    expect(problems.some((p) => p.includes('families'))).toBe(true)
    expect(problems.some((p) => p.includes('chair'))).toBe(true)
  })

  it('has a target mix per regular theme that sums to 1', () => {
    for (const theme of REGULAR_THEMES) expect(Object.values(THEME_MIX[theme]!).reduce((a, b) => a + b, 0), theme).toBeCloseTo(1, 5)
  })

  const SIZES = [6, 7, 8, 9, 12]
  for (const theme of [...REGULAR_THEMES, 'simpshouse'] as const) {
    it(`${theme}: every generated board keeps the mix, and objects per square fall as the board grows (sizes 6 to 12, 12 seeds each)`, () => {
      const perSquare: number[] = []
      for (const size of SIZES) {
        let objects = 0
        for (let seed = 1; seed <= 12; seed++) {
          const scene = generateScene({ width: size, height: size, theme, seed: seed * 53 + size })
          expect(boardMixProblems(scene.objects, size, size, theme), `${theme} ${size}x${size} seed ${seed}`).toEqual([])
          objects += scene.objects.length
        }
        perSquare.push(objects / (12 * size * size))
      }
      expect(perSquare[0]!, theme).toBeGreaterThan(perSquare[3]!)
      expect(perSquare[3]!, theme).toBeGreaterThan(perSquare[4]!)
    })
  }
})
