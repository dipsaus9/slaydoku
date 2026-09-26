import type { CatalogClue } from '../../../clues/index.ts'
import { countWord } from '../../../clues/index.ts'
import { countPeople, victimName, lineNames, peopleNames, roomName, sentences } from '../../human/en.ts'
import type { Deduction, Elimination, Technique } from '../../human/types.ts'
import { roomBounds } from '../rooms.ts'
import type { RoomBounds } from '../rooms.ts'
import { snapshot } from '../snapshot.ts'
import type { Snapshot } from '../snapshot.ts'

const inRoom = (snap: Snapshot, person: number, room: number): number[] =>
  (snap.cand[person] as number[]).filter((c) => snap.board.room(c) === room)

const outsideRoom = (snap: Snapshot, person: number, room: number): Elimination[] =>
  (snap.cand[person] as number[]).filter((c) => snap.board.room(c) !== room).map((cell) => ({ person, cell }))

/**
 * Hidden single by room: a room that certainly holds n more people, and
 * exactly n people that can still get there. Those people are in the room.
 * (For n = 1 this is the sudoku "hidden single", with the room in the role of
 * the box.) The count comes from `roomBounds`: rows that only reach the room,
 * the head count the other rooms leave over, the victim rule and "alone" clues.
 */
export const roomHiddenSingle: Technique = {
  id: 'room-hidden-single',
  title: 'Hidden single person per room',
  level: 4,
  find(board, context) {
    const snap = snapshot(board)
    for (const b of roomBounds(snap, context.clues)) {
      const needed = b.lo.value - b.placed
      if (needed < 1 || b.reach.length !== needed) continue
      const eliminate = b.reach.flatMap((p) => outsideRoom(snap, p, b.room))
      if (eliminate.length === 0) continue
      const name = roomName(board, b.room)
      const who = peopleNames(board, b.reach)
      return {
        eliminate,
        explanation: sentences(
          `At least ${countWord(needed)} more ${needed === 1 ? 'person' : 'people'} must stand in ${name}, because ${b.lo.why}. Only ${who} can still get there, so ${b.reach.length === 1 ? 'that person stands' : 'they stand'} there.`,
        ),
        people: b.reach,
        cells: [...new Set(eliminate.map((e) => e.cell))],
      }
    }
    return null
  },
}

/**
 * Room capacity: a room that cannot take more people than it has, or whose
 * full head count is already accounted for.
 *
 * - saturated: the people sure to be in the room fill it up to its maximum,
 *   so nobody else can join;
 * - lines: the rows (or columns) that only reach the room already supply as
 *   many people as it can hold, so the room's squares in other rows (columns)
 *   stay empty.
 */
export const roomCapacity: Technique = {
  id: 'room-capacity',
  title: 'Room is full',
  level: 4,
  find(board, context) {
    const snap = snapshot(board)
    const bounds = roomBounds(snap, context.clues)
    for (const b of bounds) {
      const found = saturated(snap, b) ?? lines(snap, b)
      if (found) return found
    }
    return null
  },
}

function saturated(snap: Snapshot, b: RoomBounds): Deduction | null {
  const { board } = snap
  const inside = b.placed + b.sure.length
  if (b.hi.value < 1 || inside !== b.hi.value) return null
  const others = b.reach.filter((p) => !b.sure.includes(p))
  const eliminate = others.flatMap((p) => inRoom(snap, p, b.room).map((cell) => ({ person: p, cell })))
  if (eliminate.length === 0) return null
  const name = roomName(board, b.room)
  const sure = b.sure.length > 0 ? ` ${peopleNames(board, b.sure)} ${b.sure.length === 1 ? 'is' : 'are'} already sure to be there.` : ''
  return {
    eliminate,
    explanation: sentences(`At most ${countPeople(b.hi.value)} can stand in ${name}, because ${b.hi.why}.${sure} So nobody else can stand there.`),
    people: [...b.sure, ...new Set(eliminate.map((e) => e.person))],
    cells: [...new Set(eliminate.map((e) => e.cell))],
  }
}

function lines(snap: Snapshot, b: RoomBounds): Deduction | null {
  const { board } = snap
  const room = b.room
  const name = roomName(board, room)
  for (const rows of [true, false]) {
    const confined = rows ? b.confinedRows : b.confinedCols
    const space = b.hi.value - b.placed
    if (confined.length === 0 || confined.length !== space) continue
    const keep = new Set(confined)
    const eliminate: Elimination[] = []
    for (const p of snap.unplaced) {
      for (const c of snap.cand[p] as number[]) {
        if (board.room(c) !== room) continue
        if (!keep.has(rows ? board.row(c) : board.col(c))) eliminate.push({ person: p, cell: c })
      }
    }
    if (eliminate.length === 0) continue
    const noun = rows ? 'rows' : 'columns'
    const names = lineNames(rows, confined)
    return {
      eliminate,
      explanation: sentences(
        `At most ${countPeople(b.hi.value)} can stand in ${name}, because ${b.hi.why}. ${names} already ${confined.length === 1 ? 'supplies' : 'supply'} ${countWord(confined.length)}. So other ${noun} have no room left in ${name}.`,
      ),
      people: [...new Set(eliminate.map((e) => e.person))],
      cells: [...new Set(eliminate.map((e) => e.cell))],
    }
  }
  return null
}

/**
 * Victim room counting: the victim is with exactly one suspect, two people in
 * all. So the victim cannot be in a room that has to hold three or more (rows
 * that only reach it, sure people, what the other rooms leave over) or that
 * cannot hold two at all (too few free rows, columns or people).
 */
export const victimCount: Technique = {
  id: 'victim-count',
  title: 'Count the room of the victim',
  level: 4,
  find(board, context) {
    const victim = board.victim
    if (victim < 0 || board.isPlaced(victim)) return null
    const snap = snapshot(board)
    for (const b of roomBounds(snap, context.clues)) {
      const eliminate = inRoom(snap, victim, b.room).map((cell) => ({ person: victim, cell }))
      if (eliminate.length === 0) continue
      const name = roomName(board, b.room)
      let why: string | null = null
      if (b.lo.value > 2) why = `${name} must hold at least ${countPeople(b.lo.value)}, because ${b.lo.why}. ${victimName(board)} is with exactly one suspect`
      else if (b.hi.value < 2) why = `${name} can hold at most ${countPeople(b.hi.value)}, because ${b.hi.why}. ${victimName(board)} is with a suspect`
      if (!why) continue
      return {
        eliminate,
        explanation: sentences(`${why}, so cannot be there.`),
        people: [victim],
        cells: eliminate.map((e) => e.cell),
      }
    }
    return null
  },
}

/**
 * Clue and room head counts. A card that says its holder is "alone" (or "alone
 * with" one other) in a room pins that room's head count to 1 (or 2). The
 * holder cannot stand in a room that has to hold more people than that, or,
 * for "alone with", fewer.
 */
export const clueRoomCount: Technique = {
  id: 'clue-room-count',
  title: 'Clue and room occupancy',
  level: 5,
  find(board, context) {
    const snap = snapshot(board)
    const bounds = roomBounds(snap, context.clues)
    for (let i = 0; i < context.clues.length; i++) {
      const clue = context.clues[i] as CatalogClue
      const args = clue.args as Record<string, unknown>
      const holder = board.people.findIndex((p) => p.id === clue.personId)
      if (holder < 0) continue
      const pair = clue.type === 'aloneWith' && typeof args.otherId === 'string'
      const alone = clue.type === 'alone' || args.alone === true
      if (!pair && !alone) continue
      const other = pair ? board.people.findIndex((p) => p.id === args.otherId) : -1
      const members = [holder, ...(other >= 0 && other !== holder ? [other] : [])]
      const size = members.length
      for (const b of bounds) {
        if (b.lo.value <= size && b.hi.value >= size) continue
        const eliminate = members.filter((m) => !board.isPlaced(m)).flatMap((m) => inRoom(snap, m, b.room).map((cell) => ({ person: m, cell })))
        if (eliminate.length === 0) continue
        const name = roomName(board, b.room)
        const reason =
          b.lo.value > size
            ? `${name} must hold at least ${countPeople(b.lo.value)}, because ${b.lo.why}`
            : `${name} can hold at most ${countPeople(b.hi.value)}, because ${b.hi.why}`
        const who = peopleNames(board, members)
        return {
          eliminate,
          explanation: sentences(
            `A card says ${who} ${size === 1 ? 'is' : 'are'} ${size === 1 ? 'alone' : 'alone together'} in a room, so exactly ${countPeople(size)} ${size === 1 ? 'stands' : 'stand'} there. ${reason}. So ${who} cannot stand in ${name}.`,
          ),
          people: members,
          cells: eliminate.map((e) => e.cell),
          clueIndex: i,
        }
      }
    }
    return null
  },
}
