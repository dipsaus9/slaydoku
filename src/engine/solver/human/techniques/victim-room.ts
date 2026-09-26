import type { BoardView } from '../board.ts'
import type { Deduction, Elimination, Technique } from '../types.ts'
import { giftName, peopleNames, roomName, sentences } from '../nl.ts'

/**
 * Room and victim reasoning: the victim shares their room with exactly one
 * suspect (the murderer). So the victim can never be in a room that already
 * holds two suspects for certain, nor in a room no suspect can reach. And once
 * the victim's room is known, exactly one suspect belongs in it: a second one
 * is kept out, and when only one suspect can still get there, that suspect
 * must be there.
 */
export const victimRoom: Technique = {
  id: 'victim-room',
  title: 'Kamer van het cadeau',
  level: 2,
  find(board) {
    if (board.victim < 0) return null
    const suspects = board.people.flatMap((p, i) => (p.kind === 'suspect' ? [i] : []))
    const rooms = board.scene.rooms.length
    const sure: number[][] = Array.from({ length: rooms }, () => [])
    const reach: number[][] = Array.from({ length: rooms }, () => [])
    for (const s of suspects) {
      const room = board.certainRoom(s)
      if (room >= 0) (sure[room] as number[]).push(s)
      const seen = new Set(board.candidates(s).map((c) => board.room(c)))
      for (const r of seen) if (r >= 0) (reach[r] as number[]).push(s)
    }
    return crowded(board, sure) ?? unreachable(board, reach) ?? settled(board, suspects, sure, reach)
  },
}

/** The victim's candidates inside `room`, as eliminations. */
function victimIn(board: BoardView, room: number): Elimination[] {
  return board
    .candidates(board.victim)
    .filter((c) => board.room(c) === room)
    .map((cell) => ({ person: board.victim, cell }))
}

function crowded(board: BoardView, sure: number[][]): Deduction | null {
  if (board.isPlaced(board.victim)) return null
  for (let room = 0; room < sure.length; room++) {
    const inside = sure[room] as number[]
    if (inside.length < 2) continue
    const eliminate = victimIn(board, room)
    if (eliminate.length === 0) continue
    return {
      eliminate,
      explanation: sentences(
        `${peopleNames(board, inside)} staan zeker in ${roomName(board, room)}. ${giftName(board)} is met precies één verdachte en kan daar dus niet zijn.`,
      ),
      people: [board.victim, ...inside],
      cells: eliminate.map((e) => e.cell),
    }
  }
  return null
}

function unreachable(board: BoardView, reach: number[][]): Deduction | null {
  if (board.isPlaced(board.victim)) return null
  for (let room = 0; room < reach.length; room++) {
    if ((reach[room] as number[]).length > 0) continue
    const eliminate = victimIn(board, room)
    if (eliminate.length === 0) continue
    return {
      eliminate,
      explanation: sentences(
        `Geen enkele verdachte kan nog in ${roomName(board, room)} staan. ${giftName(board)} is met een verdachte en kan daar dus niet zijn.`,
      ),
      people: [board.victim],
      cells: eliminate.map((e) => e.cell),
    }
  }
  return null
}

function settled(
  board: BoardView,
  suspects: number[],
  sure: number[][],
  reach: number[][],
): Deduction | null {
  const room = board.certainRoom(board.victim)
  if (room < 0) return null
  const inside = sure[room] as number[]
  const name = roomName(board, room)
  if (inside.length === 1) {
    const eliminate: Elimination[] = []
    for (const s of suspects) {
      if (board.isPlaced(s) || inside.includes(s)) continue
      for (const c of board.candidates(s)) if (board.room(c) === room) eliminate.push({ person: s, cell: c })
    }
    if (eliminate.length === 0) return null
    return {
      eliminate,
      explanation: sentences(
        `${giftName(board)} is in ${name}, samen met ${peopleNames(board, inside)}. Dat is de dader, dus geen andere verdachte kan daar staan.`,
      ),
      people: [board.victim, ...inside, ...new Set(eliminate.map((e) => e.person))],
      cells: [...new Set(eliminate.map((e) => e.cell))],
    }
  }
  const only = reach[room] as number[]
  if (inside.length === 0 && only.length === 1) {
    const s = only[0] as number
    const eliminate = board
      .candidates(s)
      .filter((c) => board.room(c) !== room)
      .map((cell) => ({ person: s, cell }))
    if (eliminate.length === 0) return null
    return {
      eliminate,
      explanation: sentences(
        `${giftName(board)} is in ${name} en moet daar met een verdachte zijn. Alleen ${peopleNames(board, only)} kan daar nog komen, dus die staat daar.`,
      ),
      people: [board.victim, s],
      cells: eliminate.map((e) => e.cell),
    }
  }
  return null
}
