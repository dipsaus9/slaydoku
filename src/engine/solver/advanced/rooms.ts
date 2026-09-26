import type { CatalogClue } from '../../clues/index.ts'
import { countWord } from '../../clues/index.ts'
import { victimName, peopleNames, roomName } from '../human/en.ts'
import type { Snapshot } from './snapshot.ts'

/**
 * A bound on how many people stand in a room. `why` is the reason as a clause that fits after
 * "because": "Alice is sure to be in the Dining Nook".
 */
export interface Bound {
  value: number
  why: string
}

/** What is known about the head count of one room. */
export interface RoomBounds {
  room: number
  /** Placed people standing in the room. */
  placed: number
  /** Unplaced people who can still stand in the room. */
  reach: number[]
  /** Unplaced people who are sure to be in the room. */
  sure: number[]
  /** Free rows/columns whose every remaining square lies in the room: each needs somebody in the room. */
  confinedRows: number[]
  confinedCols: number[]
  /** At least this many people (placed ones included) end up in the room. */
  lo: Bound
  /** At most this many people (placed ones included) end up in the room. */
  hi: Bound
}

const isAloneish = (clue: CatalogClue): boolean =>
  clue.type === 'alone' || (clue.args as Record<string, unknown>).alone === true

/**
 * Head-count bounds per room, from the rules and the clues:
 *
 * - every free row (and column) needs somebody, so a row whose squares all lie
 *   in one room puts a person in that room;
 * - a room cannot hold more people than it has free rows, free columns or
 *   people that can still reach it;
 * - all rooms together hold everybody, so what the other rooms cannot take,
 *   this room must;
 * - the victim's room holds exactly the victim and one suspect;
 * - somebody who is sure to be in a room where they are "alone" (or "alone
 *   with" one other) fixes that room's head count.
 *
 * The "free lines need somebody" rules (confined rows/columns) only apply on a square grid.
 */
export function roomBounds(snap: Snapshot, clues: readonly CatalogClue[]): RoomBounds[] {
  const { board } = snap
  const rooms = board.scene.rooms.length
  const total = board.people.length
  const out: RoomBounds[] = []
  let unknownRoom = false
  for (let p = 0; p < total && !unknownRoom; p++) {
    for (const c of snap.cand[p] as number[]) if (board.room(c) < 0) unknownRoom = true
  }

  for (let room = 0; room < rooms; room++) {
    const name = roomName(board, room)
    let placed = 0
    const reach: number[] = []
    const sure: number[] = []
    for (let p = 0; p < total; p++) {
      if (board.isPlaced(p)) {
        if (board.room(board.placedAt(p)) === room) placed++
        continue
      }
      let any = false
      for (const c of snap.cand[p] as number[]) if (board.room(c) === room) any = true
      if (any) reach.push(p)
      if (board.certainRoom(p) === room) sure.push(p)
    }
    const lineStats = (lines: readonly number[], cells: number[][]) => {
      const reachable: number[] = []
      const confined: number[] = []
      for (const l of lines) {
        const inside = (cells[l] as number[]).filter((c) => board.room(c) === room).length
        if (inside > 0) reachable.push(l)
        if (inside > 0 && inside === (cells[l] as number[]).length) confined.push(l)
      }
      return { reachable, confined }
    }
    const rows = lineStats(snap.freeRows, snap.rowCells)
    const cols = lineStats(snap.freeCols, snap.colCells)

    let lo: Bound = { value: placed, why: '' }
    const raiseLo = (value: number, why: string) => {
      if (value > lo.value) lo = { value, why }
    }
    let hi: Bound = { value: total, why: '' }
    const lowerHi = (value: number, why: string) => {
      if (value < hi.value) hi = { value, why }
    }
    if (sure.length > 0) raiseLo(placed + sure.length, `${peopleNames(board, sure)} ${sure.length === 1 ? 'is' : 'are'} sure to be in ${name}`)
    if (snap.square) {
      if (rows.confined.length > 0) {
        const r = rows.confined[0] as number
        raiseLo(placed + rows.confined.length, `${rows.confined.length === 1 ? `row ${r + 1}` : `${countWord(rows.confined.length)} rows`} can only be filled from ${name}`)
      }
      if (cols.confined.length > 0) {
        const k = cols.confined[0] as number
        raiseLo(placed + cols.confined.length, `${cols.confined.length === 1 ? `column ${k + 1}` : `${countWord(cols.confined.length)} columns`} can only be filled from ${name}`)
      }
    }
    lowerHi(placed + rows.reachable.length, `${name} has only ${countWord(rows.reachable.length)} free ${rows.reachable.length === 1 ? 'row' : 'rows'} left`)
    lowerHi(placed + cols.reachable.length, `${name} has only ${countWord(cols.reachable.length)} free ${cols.reachable.length === 1 ? 'column' : 'columns'} left`)
    lowerHi(placed + reach.length, `only ${countWord(reach.length)} ${reach.length === 1 ? 'person' : 'people'} can still get into ${name}`)
    // Without a square grid an empty row or column is fine, so no line is 'confined' (needs somebody).
    const none: number[] = []
    out.push({ room, placed, reach, sure, confinedRows: snap.square ? rows.confined : none, confinedCols: snap.square ? cols.confined : none, lo, hi })
  }

  // Exact head counts the clues and the victim rule fix.
  const fix = (room: number, value: number, why: string, exact: boolean) => {
    const b = out[room]
    if (!b) return
    if (value < b.hi.value) b.hi = { value, why }
    if (exact && value > b.lo.value) b.lo = { value, why }
  }
  const victim = board.victim
  if (victim >= 0) {
    const room = board.isPlaced(victim) ? board.room(board.placedAt(victim)) : board.certainRoom(victim)
    if (room >= 0) fix(room, 2, `${roomName(board, room)} holds ${victimName(board)} and exactly one suspect`, true)
  }
  const label = (id: string) => board.people.find((q) => q.id === id)?.label ?? id
  const roomOfSure = (id: string): number => {
    const p = board.people.findIndex((q) => q.id === id)
    if (p < 0) return -1
    return board.isPlaced(p) ? board.room(board.placedAt(p)) : board.certainRoom(p)
  }
  for (const clue of clues) {
    const args = clue.args as Record<string, unknown>
    if (clue.type === 'aloneWith' && typeof args.otherId === 'string') {
      const room = Math.max(roomOfSure(clue.personId), roomOfSure(args.otherId))
      if (room >= 0) fix(room, 2, `${roomName(board, room)} holds only ${label(clue.personId)} and ${label(args.otherId)}`, true)
    } else if (clue.type === 'aloneWithGender') {
      const room = roomOfSure(clue.personId)
      const who = (clue.args as { gender: string }).gender
      if (room >= 0) fix(room, 2, `${roomName(board, room)} holds only ${label(clue.personId)} and a ${who}`, true)
    } else if (isAloneish(clue)) {
      const room = roomOfSure(clue.personId)
      if (room >= 0) fix(room, 1, `${label(clue.personId)} is alone in ${roomName(board, room)}`, true)
    }
  }
  // Everybody stands somewhere: what the other rooms cannot hold, this room must.
  if (!unknownRoom) {
    const sumHi = out.reduce((sum, b) => sum + b.hi.value, 0)
    for (const b of out) {
      const forced = total - (sumHi - b.hi.value)
      if (forced > b.lo.value) b.lo = { value: forced, why: `all the other rooms together have space for only ${countWord(sumHi - b.hi.value)} ${sumHi - b.hi.value === 1 ? 'person' : 'people'}` }
    }
  }

  return out
}
