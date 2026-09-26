import { evaluate } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import { validateSolution } from '../model/index.ts'
import type { Cell, ObjectType, Person, PlacedObject, Placement, Scene, Side } from '../model/index.ts'
import { solve } from './solve.ts'

/** Deterministic random numbers so fixtures never change between runs. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Random = () => number

const shuffle = <T>(items: T[], random: Random): T[] => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

/**
 * Object types the random scenes draw from. Fixed here (not the live catalog) so the
 * generated fixtures stay the same when the catalog gains types.
 */
const SCENE_OBJECT_TYPES: ObjectType[] = [
  'chair', 'rug', 'bed', 'sofa', 'car', 'oilSlick', 'framedPainting', 'table',
  'tv', 'plant', 'bookshelf', 'chest', 'tree', 'flowers', 'easel', 'statue',
]

/** A square scene of `blockSize` x `blockSize` rooms with scattered objects and a few windows/doors. */
export function randomScene(size: number, blockSize: number, random: Random): Scene {
  const blocks = Math.ceil(size / blockSize)
  const rooms = Array.from({ length: blocks * blocks }, (_, i) => ({ id: `room${i}`, name: `Room ${i}` }))
  const cellRooms = Array.from({ length: size }, (_, row) =>
    Array.from(
      { length: size },
      (_, col) => `room${Math.floor(row / blockSize) * blocks + Math.floor(col / blockSize)}`,
    ),
  )
  const taken = new Set<string>()
  const objects: PlacedObject[] = []
  const free = shuffle(
    Array.from({ length: size * size }, (_, i): Cell => ({ row: Math.floor(i / size), col: i % size })),
    random,
  )
  const count = Math.round(size * size * 0.25)
  for (const cell of free) {
    if (objects.length >= count) break
    const key = `${cell.row},${cell.col}`
    if (taken.has(key)) continue
    const type = SCENE_OBJECT_TYPES[Math.floor(random() * SCENE_OBJECT_TYPES.length)] as ObjectType
    const cells = [cell]
    const next = { row: cell.row, col: cell.col + 1 }
    const sameRoom = next.col < size && cellRooms[next.row]?.[next.col] === cellRooms[cell.row]?.[cell.col]
    if ((type === 'bed' || type === 'sofa') && sameRoom && !taken.has(`${next.row},${next.col}`)) {
      cells.push(next)
    }
    for (const c of cells) taken.add(`${c.row},${c.col}`)
    objects.push({ id: `o${objects.length}`, type, cells })
  }
  const sides: Side[] = ['north', 'east', 'south', 'west']
  const edgeFeatures = Array.from({ length: 4 }, (_, i) => ({
    kind: i % 2 === 0 ? ('window' as const) : ('door' as const),
    cell: { row: Math.floor(random() * size), col: Math.floor(random() * size) },
    side: sides[Math.floor(random() * 4)] as Side,
  }))
  return { width: size, height: size, rooms, cellRooms, objects, edgeFeatures }
}

export function makePeople(size: number): Person[] {
  const suspects = Array.from({ length: size - 1 }, (_, i) => ({
    id: `S${i}`,
    kind: 'suspect' as const,
    label: `S${i}`,
  }))
  return [...suspects, { id: 'V', kind: 'victim' as const, label: 'V' }]
}

/** A random placement obeying every rule (row/column, occupiable, exactly one suspect with the victim). */
export function randomSolution(scene: Scene, people: Person[], random: Random): Placement[] {
  for (let attempt = 0; attempt < 20000; attempt++) {
    const rows = shuffle([...people.keys()], random)
    const cols = shuffle([...people.keys()], random)
    const placements = people.map((person, i) => ({
      personId: person.id,
      cell: { row: rows[i] as number, col: cols[i] as number },
    }))
    if (validateSolution({ scene, people, solution: placements, clues: [] }).ok) return placements
  }
  throw new Error('no valid random solution found')
}

/**
 * Every clue from a broad slice of the catalog that is true for `solution`.
 * Kinds that pin an exact row/column (`inRow`, `onLine`...) are skipped unless
 * `pinning` is set, since real puzzles seldom lean on them.
 */
export function trueClues(
  scene: Scene,
  people: Person[],
  solution: Placement[],
  pinning = false,
): CatalogClue[] {
  const types = [...new Set(scene.objects.map((o) => o.type))]
  const rooms = scene.rooms.map((r) => r.id)
  const candidates: CatalogClue[] = []
  for (const { id, kind } of people) {
    if (kind === 'victim') {
      candidates.push({ personId: id, type: 'aloneWithMurderer', args: {} })
      continue
    }
    for (const objectType of types) {
      candidates.push({ personId: id, type: 'onObject', args: { objectType } })
      candidates.push({ personId: id, type: 'onlyOnObject', args: { objectType } })
      candidates.push({ personId: id, type: 'besideObject', args: { objectType } })
      candidates.push({ personId: id, type: 'besideObject', args: { objectType, exactlyOne: true } })
      candidates.push({ personId: id, type: 'notBesideObject', args: { objectType } })
      for (const side of ['north', 'east', 'south', 'west'] as const) {
        candidates.push({ personId: id, type: 'directionOfObject', args: { side, objectType } })
        candidates.push({ personId: id, type: 'directlyNextToObject', args: { side, objectType } })
      }
    }
    for (const roomId of rooms) {
      candidates.push({ personId: id, type: 'inRoom', args: { roomId } })
      candidates.push({ personId: id, type: 'alone', args: { roomId } })
      candidates.push({ personId: id, type: 'inCorner', args: { roomId } })
    }
    candidates.push({ personId: id, type: 'alone', args: {} })
    candidates.push({ personId: id, type: 'inCorner', args: {} })
    candidates.push({ personId: id, type: 'besideFeature', args: { feature: 'window' } })
    candidates.push({ personId: id, type: 'inFrontOfDoor', args: {} })
    for (const other of people) {
      if (other.id === id) continue
      const otherId = other.id
      candidates.push({ personId: id, type: 'withPerson', args: { otherId } })
      candidates.push({ personId: id, type: 'aloneWith', args: { otherId } })
      candidates.push({ personId: id, type: 'sameRoom', args: { otherId } })
      candidates.push({ personId: id, type: 'differentRoom', args: { otherId } })
      candidates.push({ personId: id, type: 'notWith', args: { otherId } })
      candidates.push({ personId: id, type: 'diagonal', args: { otherId } })
      for (const side of ['north', 'east', 'south', 'west'] as const) {
        candidates.push({ personId: id, type: 'directionOf', args: { side, otherId } })
        for (const count of [1, 2]) {
          candidates.push({ personId: id, type: 'exactDistance', args: { side, otherId, count } })
        }
      }
      for (const direction of ['northwest', 'northeast', 'southwest', 'southeast'] as const) {
        candidates.push({ personId: id, type: 'quadrant', args: { direction, otherId } })
      }
    }
    if (pinning) {
      for (let index = 0; index < scene.height; index++) {
        candidates.push({ personId: id, type: 'inRow', args: { index } })
        candidates.push({ personId: id, type: 'inColumn', args: { index } })
      }
    }
  }
  for (const roomId of rooms) {
    const holder = people[0]?.id ?? 'S0'
    candidates.push({ personId: holder, type: 'emptyRoom', args: { roomId } })
  }
  return candidates.filter((clue) => evaluate(clue, scene, solution))
}

/** Removes every clue the puzzle stays unique without, so fixtures are as hard as their clues allow. */
function dropRedundant(scene: Scene, people: Person[], clues: CatalogClue[]): CatalogClue[] {
  const kept = [...clues]
  for (let i = kept.length - 1; i >= 0; i--) {
    const without = kept.filter((_, j) => j !== i)
    if (solve(scene, people, without).count === 1) kept.splice(i, 1)
  }
  return kept
}

export interface GeneratedPuzzle {
  scene: Scene
  people: Person[]
  solution: Placement[]
  clues: CatalogClue[]
}

/**
 * A puzzle with exactly one solution: true clues are added in random order
 * until the solver reports count 1, then clues that turn out redundant are
 * dropped again so the fixture is not padded.
 */
export function uniquePuzzle(seed: number, size: number, blockSize: number): GeneratedPuzzle {
  const random = rng(seed)
  for (let attempt = 0; attempt < 30; attempt++) {
    const scene = randomScene(size, blockSize, random)
    const people = makePeople(size)
    let solution: Placement[]
    try {
      solution = randomSolution(scene, people, random)
    } catch {
      continue
    }
    for (const pinning of [false, true]) {
      const pool = shuffle(trueClues(scene, people, solution, pinning), random)
      const clues: CatalogClue[] = []
      for (const clue of pool) {
        clues.push(clue)
        if (solve(scene, people, clues).count === 1) {
          return { scene, people, solution, clues: dropRedundant(scene, people, clues) }
        }
      }
    }
  }
  throw new Error(`no unique ${size}x${size} puzzle for seed ${seed}`)
}
