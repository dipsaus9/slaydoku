import { describe, expect, it } from 'vitest'
import { SCENE_THEMES, getTheme } from '../../content/themes/index.ts'
import type { SceneTheme } from '../../content/themes/index.ts'
import { resolveThemeObjectIcon } from '../../render/icons/themes/resolve.ts'
import {
  cellsInRoom,
  checkScene,
  deriveMurderer,
  isOccupiable,
  parseScene,
  serializeScene,
  step,
  validateSolution,
} from '../model/index.ts'
import type { Person, Scene } from '../model/index.ts'
import { MIN_FREE_PER_LINE } from './objects.ts'
import { generateScene, generateSceneDetailed, MAX_SIZE, MIN_SIZE } from './generate.ts'

/** Size bands of the story, with the room counts each may produce. */
const BANDS: { size: number; rooms: [min: number, max: number] }[] = [
  { size: 6, rooms: [4, 5] },
  { size: 7, rooms: [4, 6] },
  { size: 9, rooms: [5, 7] },
  { size: 12, rooms: [7, 9] },
  { size: 16, rooms: [10, 12] },
]

const SEEDS = 200

function people(count: number): Person[] {
  const suspects = Array.from({ length: count - 1 }, (_, i) => ({
    id: `S${i}`,
    kind: 'suspect' as const,
    label: `S${i}`,
  }))
  return [...suspects, { id: 'V', kind: 'victim', label: 'V' }]
}

function kindOf(id: string): string {
  return id.replace(/-\d+$/, '')
}

/** Everything a generated scene has to satisfy; returns nothing, throws through expect. */
function assertGoodScene(scene: Scene, theme: SceneTheme, label: string, rooms: [number, number]) {
  const { width, height } = scene
  expect(checkScene(scene), label).toEqual([])
  expect(scene.rooms.length, `${label} room count`).toBeGreaterThanOrEqual(rooms[0])
  expect(scene.rooms.length, `${label} room count`).toBeLessThanOrEqual(rooms[1])

  // Room names come from the theme, without repeats.
  const names = scene.rooms.map((r) => r.name)
  expect(new Set(names).size, `${label} names`).toBe(names.length)
  for (const name of names) expect(theme.rooms.some((r) => r.name === name), `${label} ${name}`).toBe(true)
  const outdoor = new Set(theme.rooms.filter((r) => r.outdoor).map((r) => r.name))

  // Doors: between two rooms, off the objects, and linking every room into one connected scene.
  const link = new Map<string, Set<string>>(scene.rooms.map((r) => [r.id, new Set()]))
  const doorCells = new Set<string>()
  for (const feature of scene.edgeFeatures.filter((f) => f.kind === 'door')) {
    const across = step(feature.cell, feature.side)
    const a = scene.cellRooms[feature.cell.row]?.[feature.cell.col]
    const b = scene.cellRooms[across.row]?.[across.col]
    expect(a !== undefined && b !== undefined && a !== b, `${label} door between rooms`).toBe(true)
    link.get(a!)!.add(b!)
    link.get(b!)!.add(a!)
    doorCells.add(`${feature.cell.row},${feature.cell.col}`)
    doorCells.add(`${across.row},${across.col}`)
  }
  for (const [room, others] of link) expect(others.size, `${label} ${room} has a door`).toBeGreaterThan(0)
  const reached = new Set<string>([scene.rooms[0]!.id])
  const todo = [scene.rooms[0]!.id]
  while (todo.length > 0) {
    for (const next of link.get(todo.pop()!)!) {
      if (reached.has(next)) continue
      reached.add(next)
      todo.push(next)
    }
  }
  expect(reached.size, `${label} connected through doors`).toBe(scene.rooms.length)
  for (const object of scene.objects) {
    for (const c of object.cells) expect(doorCells.has(`${c.row},${c.col}`), `${label} ${object.id} on a door`).toBe(false)
  }

  // Windows: on the outer edge of an indoor room.
  const seen = new Set<string>()
  for (const feature of scene.edgeFeatures.filter((f) => f.kind === 'window')) {
    const { cell, side } = feature
    const outer =
      (side === 'north' && cell.row === 0) ||
      (side === 'south' && cell.row === height - 1) ||
      (side === 'west' && cell.col === 0) ||
      (side === 'east' && cell.col === width - 1)
    expect(outer, `${label} window on outer edge`).toBe(true)
    const room = scene.rooms.find((r) => r.id === scene.cellRooms[cell.row]![cell.col])!
    expect(outdoor.has(room.name), `${label} window in outdoor ${room.name}`).toBe(false)
    const key = `${cell.row},${cell.col},${side}`
    expect(seen.has(key), `${label} duplicate window`).toBe(false)
    seen.add(key)
  }

  // Objects: themed kind (id prefix) with the engine type, drawable footprint, capped per room.
  const perRoom = new Map<string, number>()
  for (const object of scene.objects) {
    const themed = theme.objects.find((o) => o.kind === kindOf(object.id))
    expect(themed, `${label} ${object.id} kind`).toBeDefined()
    expect(object.type, `${label} ${object.id} type`).toBe(themed!.engineType)
    expect(resolveThemeObjectIcon(themed!, object.cells), `${label} ${object.id} icon`).toBeDefined()
    const room = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]!
    const key = `${room}:${themed!.kind}`
    perRoom.set(key, (perRoom.get(key) ?? 0) + 1)
    expect(perRoom.get(key)!, `${label} ${key} cap`).toBeLessThanOrEqual(themed!.maxPerRoom ?? Infinity)
  }

  // Occupiable cells: every room, row and column keeps enough of them.
  for (const room of scene.rooms) {
    expect(cellsInRoom(scene, room.id).some((c) => isOccupiable(scene, c)), `${label} ${room.name} occupiable`).toBe(true)
  }
  for (let row = 0; row < height; row++) {
    const free = Array.from({ length: width }, (_, col) => isOccupiable(scene, { row, col })).filter(Boolean).length
    expect(free, `${label} row ${row}`).toBeGreaterThanOrEqual(MIN_FREE_PER_LINE)
  }
  for (let col = 0; col < width; col++) {
    const free = Array.from({ length: height }, (_, row) => isOccupiable(scene, { row, col })).filter(Boolean).length
    expect(free, `${label} col ${col}`).toBeGreaterThanOrEqual(MIN_FREE_PER_LINE)
  }
}

describe('generateScene', () => {
  it('is deterministic per seed and differs between seeds', () => {
    const options = { width: 9, height: 9, theme: 'home', seed: 42 } as const
    expect(generateScene(options)).toEqual(generateScene(options))
    expect(generateScene({ ...options, seed: 43 })).not.toEqual(generateScene(options))
    expect(generateScene({ ...options, theme: 'office' })).not.toEqual(generateScene(options))
  })

  it('accepts a theme object as well as an id', () => {
    const options = { width: 7, height: 7, seed: 5 } as const
    expect(generateScene({ ...options, theme: getTheme('shop') })).toEqual(generateScene({ ...options, theme: 'shop' }))
  })

  it('survives a JSON round trip through the model schema', () => {
    const scene = generateScene({ width: 12, height: 12, theme: 'school', seed: 7 })
    const parsed = parseScene(serializeScene(scene))
    expect(parsed.ok).toBe(true)
    expect(parsed.ok && parsed.value).toEqual(scene)
  })

  it('rejects sizes outside 6..16 and bad seeds', () => {
    expect(() => generateScene({ width: 5, height: 9, theme: 'home', seed: 1 })).toThrow(RangeError)
    expect(() => generateScene({ width: 9, height: 17, theme: 'home', seed: 1 })).toThrow(RangeError)
    expect(() => generateScene({ width: 9.5, height: 9, theme: 'home', seed: 1 })).toThrow(RangeError)
    expect(() => generateScene({ width: 9, height: 9, theme: 'home', seed: Number.NaN })).toThrow(RangeError)
  })

  it('returns a valid scene for every size from 6 to 16 and every theme', () => {
    for (let size = MIN_SIZE; size <= MAX_SIZE; size++) {
      for (const theme of SCENE_THEMES) {
        const scene = generateScene({ width: size, height: size, theme, seed: size * 31 })
        expect(checkScene(scene), `${size} ${theme.id}`).toEqual([])
        expect(scene.width).toBe(size)
        expect(scene.height).toBe(size)
      }
    }
  })

  it('also builds non-square grids, admitting min(width, height) people', () => {
    for (const [width, height] of [[6, 16], [16, 8], [10, 7]] as const) {
      const result = generateSceneDetailed({ width, height, theme: 'office', seed: 3 })
      expect(checkScene(result.scene)).toEqual([])
      expect(result.witness.suspects).toHaveLength(Math.min(width, height) - 1)
    }
  })

  it('gives rooms of very different sizes and mostly non-rectangular shapes', () => {
    let rooms = 0
    let nonRect = 0
    let mixed = 0
    for (let seed = 0; seed < 30; seed++) {
      const scene = generateScene({ width: 16, height: 16, theme: 'home', seed })
      const sizes: number[] = []
      for (const room of scene.rooms) {
        const cells = cellsInRoom(scene, room.id)
        const rows = cells.map((c) => c.row)
        const cols = cells.map((c) => c.col)
        const box = (Math.max(...rows) - Math.min(...rows) + 1) * (Math.max(...cols) - Math.min(...cols) + 1)
        rooms++
        if (box !== cells.length) nonRect++
        sizes.push(cells.length)
      }
      if (Math.max(...sizes) >= 3 * Math.min(...sizes)) mixed++
    }
    expect(nonRect / rooms).toBeGreaterThan(0.6)
    expect(mixed).toBeGreaterThanOrEqual(27)
  })

  it('puts wall objects against walls most of the time', () => {
    let wall = 0
    let against = 0
    for (let seed = 0; seed < 40; seed++) {
      const theme = getTheme('home')
      const scene = generateScene({ width: 12, height: 12, theme, seed })
      for (const object of scene.objects) {
        const themed = theme.objects.find((o) => o.kind === kindOf(object.id))!
        if (themed.placement !== 'wall') continue
        wall++
        const room = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]
        const touches = object.cells.some((c) =>
          (['north', 'east', 'south', 'west'] as const).some((side) => {
            const n = step(c, side)
            return scene.cellRooms[n.row]?.[n.col] !== room
          }),
        )
        if (touches) against++
      }
    }
    expect(wall).toBeGreaterThan(100)
    expect(against / wall).toBeGreaterThan(0.85)
  })
})

describe.each(BANDS)('admissibility, $size x $size', ({ size, rooms }) => {
  it.each(SCENE_THEMES.map((t) => t.id))(
    `holds for ${SEEDS} seeds in theme %s`,
    (themeId) => {
      const theme = getTheme(themeId)
      let retried = 0
      for (let seed = 0; seed < SEEDS; seed++) {
        const label = `${size}x${size} ${themeId} seed ${seed}`
        const result = generateSceneDetailed({ width: size, height: size, theme, seed })
        if (result.attempts > 1) retried++
        const { scene, witness } = result
        assertGoodScene(scene, theme, label, rooms)

        // Independent proof: the witness placement passes the engine's own rules.
        const all = people(size)
        const solution = [
          { personId: 'V', cell: witness.victim },
          ...witness.suspects.map((cell, i) => ({ personId: `S${i}`, cell })),
        ]
        const puzzle = { scene, people: all, solution, clues: [] }
        expect(validateSolution(puzzle).ok, label).toBe(true)
        expect(deriveMurderer(puzzle, solution), label).not.toBeNull()
        expect(result.victimRooms.length, label).toBeGreaterThanOrEqual(2)
      }
      // Retries are a safety net, not the main mechanism.
      expect(retried).toBeLessThan(SEEDS * 0.25)
    },
    60_000,
  )
})
