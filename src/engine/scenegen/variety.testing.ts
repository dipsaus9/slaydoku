import { getTheme } from '../../content/themes/index.ts'
import type { ThemeId } from '../../content/themes/index.ts'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES, maxObjectsInRoom } from './objects.ts'
import { generateScene } from './generate.ts'

/** The five regular themes (Simpshouse is a seasonal theme with its own pool and is not measured here). */
export const REGULAR_THEMES = ['home', 'office', 'school', 'park', 'shop'] as const satisfies readonly ThemeId[]
export const SIZES = [6, 7, 8, 9, 12] as const

export interface VarietyStats {
  theme: string
  scenes: number
  objects: number
  chairs: number
  rooms: number
  /** Sum over rooms of the number of distinct kinds in the room. */
  distinctKinds: number
  /** Count of each themed kind over all scenes. */
  kinds: Map<string, number>
  /** Rule breaches: more than MAX_KIND_PER_ROOM of a kind, or more than MAX_FREE_CHAIRS_PER_ROOM chairs that do not touch a table, desk or counter. */
  violations: string[]
  /** Sum over scenes of the number of distinct kinds on the board (SLAY-22: variety is a property of the whole board). */
  boardKinds: number
  /** Rooms of 3+ squares without any object (a bare room). */
  bare: number
  /** Rooms with more objects than `maxObjectsInRoom` of their squares (SLAY-22). */
  crowded: string[]
  /** Kinds that a room favours (signature objects) where that room (3+ cells) showed up in at least one scene, but that were never placed. */
  neverPlaced: string[]
}

const kindOf = (id: string): string => id.replace(/-\d+$/, '')

/** Generates `perSize` scenes of each size in SIZES for a theme and measures chairs, variety and the per-room rules. */
export function measureVariety(themeId: (typeof REGULAR_THEMES)[number], perSize: number): VarietyStats {
  const theme = getTheme(themeId)
  const stats: VarietyStats = { theme: themeId, scenes: 0, objects: 0, chairs: 0, rooms: 0, distinctKinds: 0, kinds: new Map(), violations: [], boardKinds: 0, bare: 0, crowded: [], neverPlaced: [] }
  const seenRooms = new Set<string>()
  for (const size of SIZES) {
    for (let i = 1; i <= perSize; i++) {
      const seed = i * 31 + size
      const scene = generateScene({ width: size, height: size, theme: themeId, seed })
      stats.scenes++
      stats.boardKinds += new Set(scene.objects.map((o) => kindOf(o.id))).size
      const typeAt = new Map<string, string>()
      for (const o of scene.objects) for (const c of o.cells) typeAt.set(`${c.row},${c.col}`, o.type)
      const touchesSeatable = (o: { cells: { row: number; col: number }[] }) =>
        o.cells.some((c) => [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => SEAT_AT_TYPES.has(typeAt.get(`${c.row + dr!},${c.col + dc!}`) ?? '')))
      const perRoom = new Map<string, { kinds: Map<string, number>; loneChairs: number; squares: number; objects: number }>()
      for (const r of scene.rooms) {
        const squares = scene.cellRooms.flat().filter((id) => id === r.id).length
        perRoom.set(r.id, { kinds: new Map(), loneChairs: 0, squares, objects: 0 })
        if (squares >= 3) seenRooms.add(r.name) // the generator only seeds a signature object in a room of 3+ cells
      }
      for (const o of scene.objects) {
        const kind = kindOf(o.id)
        stats.objects++
        if (o.type === 'chair') stats.chairs++
        stats.kinds.set(kind, (stats.kinds.get(kind) ?? 0) + 1)
        const room = perRoom.get(scene.cellRooms[o.cells[0]!.row]![o.cells[0]!.col]!)!
        room.kinds.set(kind, (room.kinds.get(kind) ?? 0) + 1)
        room.objects++
        if (o.type === 'chair' && !touchesSeatable(o)) room.loneChairs++
      }
      for (const [id, room] of perRoom) {
        stats.rooms++
        stats.distinctKinds += room.kinds.size
        for (const [kind, n] of room.kinds) if (n > MAX_KIND_PER_ROOM) stats.violations.push(`${size}x${size} seed ${seed} room ${id}: ${n}x ${kind}`)
        if (room.objects > maxObjectsInRoom(room.squares)) stats.crowded.push(`${size}x${size} seed ${seed} room ${id}: ${room.objects} objects on ${room.squares} squares`)
        if (room.objects === 0 && room.squares >= 3) stats.bare++
        if (room.loneChairs > MAX_FREE_CHAIRS_PER_ROOM) stats.violations.push(`${size}x${size} seed ${seed} room ${id}: ${room.loneChairs} chairs away from a table`)
      }
    }
  }
  stats.neverPlaced = theme.objects
    .filter((o) => !stats.kinds.has(o.kind) && theme.rooms.some((r) => seenRooms.has(r.name) && r.favours.includes(o.kind)))
    .map((o) => o.kind)
  return stats
}

/** Mean distinct kinds per board. */
export const kindsPerBoard = (s: VarietyStats): number => s.boardKinds / s.scenes
export const chairShare = (s: Pick<VarietyStats, 'chairs' | 'objects'>): number => s.chairs / s.objects
export const distinctPerRoom = (s: VarietyStats): number => s.distinctKinds / s.rooms
export const topKindShare = (s: VarietyStats): { kind: string; share: number } => {
  const [kind, n] = [...s.kinds.entries()].sort((a, b) => b[1] - a[1])[0]!
  return { kind, share: n / s.objects }
}
