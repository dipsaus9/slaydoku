import { describe, expect, it } from 'vitest'
import { generateScene } from './generate.ts'
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
