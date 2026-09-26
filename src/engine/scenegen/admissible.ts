import { isOccupiable } from '../model/index.ts'
import type { Cell, Scene } from '../model/index.ts'

/** One full placement the scene admits: the victim's cell and one cell per suspect. */
export interface Witness {
  victim: Cell
  suspects: Cell[]
}

export interface Admissibility {
  /** A valid full placement exists (see {@link checkAdmissible}). */
  ok: boolean
  /** Ids of the rooms that can hold the victim together with exactly one suspect. */
  victimRooms: string[]
  /** A placement proving `ok`, using the first victim room. */
  witness?: Witness
}

/** Number of people a scene is played with: the shorter side, one suspect fewer than that plus the victim. */
export function peopleCount(scene: Pick<Scene, 'width' | 'height'>): number {
  return Math.min(scene.width, scene.height)
}

/**
 * Whether the scene admits a valid full placement, the same rules the solver
 * enforces: `min(width, height)` people (one victim, the rest suspects) on
 * occupiable cells, nobody sharing a row or column, and the victim's room
 * holding exactly one suspect. On a square grid that also means every row and
 * column holds someone, so every row and column needs enough occupiable cells.
 *
 * A room can hold the victim only when it has two occupiable cells that share
 * neither row nor column (victim plus its one suspect); a room whose free cells
 * lie on one line, or that every row spans, can fail. Checked exactly: for each
 * (victim cell, suspect cell) pair in a room the remaining suspects must form a
 * matching outside that room, found by augmenting paths.
 */
export function checkAdmissible(scene: Scene): Admissibility {
  const { width, height } = scene
  const people = peopleCount(scene)
  const free = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => isOccupiable(scene, { row, col })),
  )
  const victimRooms: string[] = []
  let witness: Witness | undefined

  for (const room of scene.rooms) {
    const inRoom: Cell[] = []
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (scene.cellRooms[row]?.[col] === room.id && free[row]![col]) inRoom.push({ row, col })
      }
    }
    const found = findInRoom(scene, room.id, inRoom, free, people)
    if (!found) continue
    victimRooms.push(room.id)
    witness ??= found
  }
  return { ok: victimRooms.length > 0, victimRooms, ...(witness ? { witness } : {}) }
}

function findInRoom(
  scene: Scene,
  roomId: string,
  inRoom: Cell[],
  free: boolean[][],
  people: number,
): Witness | undefined {
  const { width, height } = scene
  for (const victim of inRoom) {
    for (const suspect of inRoom) {
      if (suspect.row === victim.row || suspect.col === victim.col) continue
      // The other people-2 suspects: outside this room, in rows/columns nobody else uses.
      const rows = [...Array(height).keys()].filter((r) => r !== victim.row && r !== suspect.row)
      const cols = [...Array(width).keys()].filter((c) => c !== victim.col && c !== suspect.col)
      const matched = maximumMatching(rows, cols, (row, col) => {
        return free[row]![col]! && scene.cellRooms[row]![col] !== roomId
      })
      if (matched.size >= people - 2) {
        return {
          victim,
          suspects: [suspect, ...[...matched].map(([row, col]) => ({ row, col }))],
        }
      }
    }
  }
  return undefined
}

/** Kuhn's augmenting-path matching of rows to columns; returns row -> column. */
function maximumMatching(
  rows: number[],
  cols: number[],
  allowed: (row: number, col: number) => boolean,
): Map<number, number> {
  const rowOfCol = new Map<number, number>()
  const adjacent = new Map<number, number[]>(
    rows.map((row) => [row, cols.filter((col) => allowed(row, col))]),
  )
  const augment = (row: number, seen: Set<number>): boolean => {
    for (const col of adjacent.get(row) ?? []) {
      if (seen.has(col)) continue
      seen.add(col)
      const owner = rowOfCol.get(col)
      if (owner === undefined || augment(owner, seen)) {
        rowOfCol.set(col, row)
        return true
      }
    }
    return false
  }
  for (const row of rows) augment(row, new Set())
  return new Map([...rowOfCol].map(([col, row]) => [row, col]))
}
