import type { BoardView } from '../board.ts'
import type { Deduction, Elimination, HumanContext, Technique } from '../types.ts'
import * as en from '../en.ts'
import * as nl from '../nl.ts'

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
  title: 'Room of the victim',
  level: 2,
  find(board, context) {
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
    return crowded(board, context, sure) ?? unreachable(board, context, reach) ?? settled(board, context, suspects, sure, reach)
  },
}

/** The victim's candidates inside `room`, as eliminations. */
function victimIn(board: BoardView, room: number): Elimination[] {
  return board
    .candidates(board.victim)
    .filter((c) => board.room(c) === room)
    .map((cell) => ({ person: board.victim, cell }))
}

function crowded(board: BoardView, context: HumanContext, sure: number[][]): Deduction | null {
  if (board.isPlaced(board.victim)) return null
  const w = context.locale === 'nl' ? nl : en
  for (let room = 0; room < sure.length; room++) {
    const inside = sure[room] as number[]
    if (inside.length < 2) continue
    const eliminate = victimIn(board, room)
    if (eliminate.length === 0) continue
    const explanation =
      context.locale === 'nl'
        ? nl.crowdedText(w.peopleNames(board, inside), inside.length, w.roomName(board, room), w.victimName(board))
        : `${w.peopleNames(board, inside)} ${inside.length === 1 ? 'is' : 'are'} sure to be in ${w.roomName(board, room)}. ${w.victimName(board)} is with exactly one suspect, so cannot be there.`
    return {
      eliminate,
      explanation: w.sentences(explanation),
      people: [board.victim, ...inside],
      cells: eliminate.map((e) => e.cell),
    }
  }
  return null
}

function unreachable(board: BoardView, context: HumanContext, reach: number[][]): Deduction | null {
  if (board.isPlaced(board.victim)) return null
  const w = context.locale === 'nl' ? nl : en
  for (let room = 0; room < reach.length; room++) {
    if ((reach[room] as number[]).length > 0) continue
    const eliminate = victimIn(board, room)
    if (eliminate.length === 0) continue
    const explanation =
      context.locale === 'nl'
        ? nl.unreachableText(w.roomName(board, room), w.victimName(board))
        : `No suspect can still stand in ${w.roomName(board, room)}. ${w.victimName(board)} is with a suspect, so cannot be there.`
    return {
      eliminate,
      explanation: w.sentences(explanation),
      people: [board.victim],
      cells: eliminate.map((e) => e.cell),
    }
  }
  return null
}

function settled(
  board: BoardView,
  context: HumanContext,
  suspects: number[],
  sure: number[][],
  reach: number[][],
): Deduction | null {
  const room = board.certainRoom(board.victim)
  if (room < 0) return null
  const w = context.locale === 'nl' ? nl : en
  const inside = sure[room] as number[]
  const name = w.roomName(board, room)
  if (inside.length === 1) {
    const eliminate: Elimination[] = []
    for (const s of suspects) {
      if (board.isPlaced(s) || inside.includes(s)) continue
      for (const c of board.candidates(s)) if (board.room(c) === room) eliminate.push({ person: s, cell: c })
    }
    if (eliminate.length === 0) return null
    const explanation =
      context.locale === 'nl'
        ? nl.settledInsideText(w.victimName(board), name, w.peopleNames(board, inside))
        : `${w.victimName(board)} is in ${name}, together with ${w.peopleNames(board, inside)}. That is the murderer, so no other suspect can stand there.`
    return {
      eliminate,
      explanation: w.sentences(explanation),
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
    const explanation =
      context.locale === 'nl'
        ? nl.settledOnlyText(w.victimName(board), name, w.peopleNames(board, only))
        : `${w.victimName(board)} is in ${name} and must be there with a suspect. Only ${w.peopleNames(board, only)} can still get there, so that person stands there.`
    return {
      eliminate,
      explanation: w.sentences(explanation),
      people: [board.victim, s],
      cells: eliminate.map((e) => e.cell),
    }
  }
  return null
}
