import { getTheme } from '../../content/themes/index.ts'
import type { SceneTheme, ThemeId } from '../../content/themes/index.ts'
import { checkScene, isOccupiable, cellsInRoom } from '../model/index.ts'
import type { Scene } from '../model/index.ts'
import { checkAdmissible, type Witness } from './admissible.ts'
import { placeObjects } from './objects.ts'
import { placeDoors, placeWindows } from './openings.ts'
import { partitionRooms, roomCountFor } from './partition.ts'
import { createRandom, gaussian, mixSeed, type Random } from './random.ts'

export const MIN_SIZE = 6
export const MAX_SIZE = 16

/** Attempts per scene before giving up; real failures are rare, so this is a safety net. */
export const MAX_ATTEMPTS = 100

export interface GenerateSceneOptions {
  /** Columns, 6 to 16. */
  width: number
  /** Rows, 6 to 16. */
  height: number
  /** A theme, or the id of one of the built-in themes. */
  theme: SceneTheme | ThemeId
  /** Any integer; the same seed always gives the same scene. */
  seed: number
}

export interface GeneratedScene {
  scene: Scene
  /** Which try produced the scene (1 = first). Failed tries are retried with derived seeds. */
  attempts: number
  /** Ids of the rooms that can hold the victim with exactly one suspect. */
  victimRooms: string[]
  /** One valid full placement, proof that the scene admits a solution. */
  witness: Witness
}

/**
 * Random Murdoku scene: irregular rooms of mixed size (big L-shapes, small
 * closets), room names from the theme, doors so every room is reachable,
 * windows on the outer edge of indoor rooms and themed objects with their
 * placement hints. The scene is guaranteed to admit a valid full placement
 * (see `checkAdmissible`); failed tries are retried internally with a seed
 * derived from the given one, so the result is deterministic.
 *
 * The themed kind of every object is the id prefix (`bank-1` is a home sofa).
 */
export function generateScene(options: GenerateSceneOptions): Scene {
  return generateSceneDetailed(options).scene
}

export function generateSceneDetailed(options: GenerateSceneOptions): GeneratedScene {
  const { width, height, seed } = options
  for (const [name, value] of [['width', width], ['height', height]] as const) {
    if (!Number.isInteger(value) || value < MIN_SIZE || value > MAX_SIZE) {
      throw new RangeError(`${name} must be an integer from ${MIN_SIZE} to ${MAX_SIZE}, got ${value}`)
    }
  }
  if (!Number.isFinite(seed)) throw new RangeError(`seed must be a finite number, got ${seed}`)
  const theme = typeof options.theme === 'string' ? getTheme(options.theme) : options.theme

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const random = createRandom(mixSeed(seed, width, height, attempt))
    const built = tryBuild(width, height, theme, random)
    if (built) return { ...built, attempts: attempt }
  }
  throw new Error(`no admissible ${width}x${height} ${theme.id} scene for seed ${seed} in ${MAX_ATTEMPTS} tries`)
}

function tryBuild(
  width: number,
  height: number,
  theme: SceneTheme,
  random: Random,
): Omit<GeneratedScene, 'attempts'> | undefined {
  const wanted = roomCountFor(width, height, random)
  const partition = partitionRooms(width, height, wanted, random)
  const count = Math.max(...partition.flat()) + 1
  if (count !== wanted || count > theme.rooms.length) return undefined

  // Names: bigger rooms get the names with more furniture, with some noise.
  const sizes = Array.from({ length: count }, () => 0)
  for (const id of partition.flat()) sizes[id]!++
  const bySize = [...sizes.keys()].sort((a, b) => sizes[b]! - sizes[a]! || a - b)
  const names = theme.rooms
    .map((room) => ({ room, key: room.favours.length + gaussian(random) * 0.8 }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((entry) => entry.room)
  const themeRoomOf = new Map<number, (typeof names)[number]>()
  bySize.forEach((roomIndex, i) => themeRoomOf.set(roomIndex, names[i]!))
  const indoor = new Set([...themeRoomOf].filter(([, room]) => !room.outdoor).map(([index]) => index))

  const doors = placeDoors(partition, count, random)
  const windows = placeWindows(partition, indoor, random)
  const edgeFeatures = [...doors, ...windows]
  const objects = placeObjects(
    {
      width,
      height,
      rooms: partition,
      favours: Array.from({ length: count }, (_, i) => themeRoomOf.get(i)!.favours),
      roomTypes: Array.from({ length: count }, (_, i) => themeRoomOf.get(i)!.roomTypes ?? []),
      theme,
      edgeFeatures,
    },
    random,
  )

  const scene: Scene = {
    width,
    height,
    rooms: Array.from({ length: count }, (_, i) => ({ id: `r${i + 1}`, name: themeRoomOf.get(i)!.name })),
    cellRooms: partition.map((line) => line.map((id) => `r${id + 1}`)),
    objects,
    edgeFeatures,
  }

  if (checkScene(scene).length > 0) return undefined
  // Every room must be able to hold somebody.
  for (const room of scene.rooms) {
    if (!cellsInRoom(scene, room.id).some((cell) => isOccupiable(scene, cell))) return undefined
  }
  const admissible = checkAdmissible(scene)
  if (!admissible.ok || !admissible.witness) return undefined
  // Variety for the puzzle generator: more than one room can be the crime scene.
  if (admissible.victimRooms.length < Math.min(2, count)) return undefined
  return { scene, victimRooms: admissible.victimRooms, witness: admissible.witness }
}
