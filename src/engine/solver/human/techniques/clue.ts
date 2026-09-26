import { bothPartsText, evaluate, expandClue, isGenderClue, renderClue } from '../../../clues/index.ts'
import type { CatalogClue } from '../../../clues/index.ts'
import type { BoardView } from '../board.ts'
import type { Deduction, Elimination, HumanContext, Technique } from '../types.ts'
import { cellSummary, peopleNames, personName, roomName, sentences } from '../nl.ts'

/**
 * Clue-specific eliminations: what one clue card alone rules out. Uses the
 * clue catalog's own `evaluate`, so every clue kind works, present and future:
 *
 * - a clue about one person removes the squares where it is false;
 * - a clue linking two people removes each square that has no agreeing square
 *   left for the other;
 * - "alone" style clues keep other people out of the holder's room, and out
 *   of any room somebody else is already sure to be in;
 * - "the only one on ..." keeps everybody else off that object;
 * - an empty room is closed to everybody.
 */
export const clueEliminations: Technique = {
  id: 'clue',
  title: 'Aanwijzing gebruiken',
  level: 1,
  find(board, context) {
    const total = totalCandidates(board)
    for (let i = 0; i < context.clues.length; i++) {
      const idle = `clue:idle:${i}`
      // Candidates only ever shrink, so an unchanged total means nothing new for this clue.
      if (context.memo.get(idle) === total) continue
      const found = fromClue(board, context, i)
      if (found) return found
      context.memo.set(idle, total)
    }
    return null
  },
}

function totalCandidates(board: BoardView): number {
  let sum = 0
  for (let p = 0; p < board.people.length; p++) sum += board.candidateCount(p)
  return sum
}

function memoized(context: HumanContext, key: string, compute: () => boolean): boolean {
  const known = context.memo.get(key)
  if (typeof known === 'boolean') return known
  const value = compute()
  context.memo.set(key, value)
  return value
}

function fromClue(board: BoardView, context: HumanContext, index: number): Deduction | null {
  const card = context.clues[index] as CatalogClue
  const holder = board.people.findIndex((p) => p.id === card.personId)
  if (holder < 0) return null
  const found = new Map<number, Elimination>()
  const add = (person: number, cell: number) => {
    if (board.hasCandidate(person, cell)) found.set(person * board.cellCount + cell, { person, cell })
  }
  // A combined card holds when both parts do: what either part rules out, the card rules out.
  const parts = expandClue(card)
  const others: number[] = []
  for (const [k, clue] of parts.entries()) {
    const args = clue.args as Record<string, unknown>
    const otherId = typeof args.otherId === 'string' ? args.otherId : undefined
    const other = otherId === undefined ? -1 : board.people.findIndex((p) => p.id === otherId)
    if (otherId !== undefined && other < 0) return null
    if (other >= 0) others.push(other)
    eliminationsOf(board, context, parts.length === 1 ? String(index) : `${index}.${k}`, clue, holder, other, add)
  }
  const eliminate = [...found.values()]
  if (eliminate.length === 0) return null
  const ctx = { scene: board.scene, people: [...board.people] }
  const text = renderClue(card, ctx)
  // People who lose the very same squares are named together.
  const lost = new Map<string, { people: number[]; cells: number[] }>()
  for (const p of new Set(eliminate.map((e) => e.person))) {
    const cells = eliminate.filter((e) => e.person === p).map((e) => e.cell)
    const group = lost.get(cells.join(',')) ?? { people: [], cells }
    group.people.push(p)
    lost.set(cells.join(','), group)
  }
  const verdicts = [...lost.values()].map(({ people, cells }, i) => {
    const who = peopleNames(board, people)
    const verb = people.length === 1 ? 'kan' : 'kunnen'
    const where = cellSummary(board, cells)
    return i === 0 ? `${who} ${verb} dus niet op ${where} staan` : `Ook ${who} ${verb} niet op ${where} staan`
  })
  const room =
    card.type === 'emptyRoom' ? board.scene.rooms.findIndex((r) => r.id === (card.args as { roomId: string }).roomId) : -1
  const twoParts = bothPartsText(card, ctx)
  const lead =
    room >= 0
      ? `Een kaart zegt: "${text}"`
      : `De kaart van ${personName(board, holder)} zegt: "${text}"${twoParts === null ? '' : ` ${twoParts}`}`
  return {
    eliminate,
    explanation: sentences(room >= 0 ? `${lead} Niemand kan dus in ${roomName(board, room)} staan.` : `${lead} ${verdicts.join('. ')}.`),
    people: [...new Set([holder, ...others, ...eliminate.map((e) => e.person)])],
    cells: [...new Set(eliminate.map((e) => e.cell))],
    clueIndex: index,
  }
}

/** What one plain clue (a card, or one part of a combined card) rules out; `key` keeps its memo entries apart. */
function eliminationsOf(
  board: BoardView,
  context: HumanContext,
  key: string,
  clue: CatalogClue,
  holder: number,
  other: number,
  add: (person: number, cell: number) => void,
): void {
  const args = clue.args as Record<string, unknown>
  const place = (person: number, cell: number) => ({ personId: board.people[person]?.id ?? '', cell: board.cell(cell) })

  if (clue.type === 'emptyRoom') {
    const room = board.scene.rooms.findIndex((r) => r.id === args.roomId)
    for (let p = 0; p < board.people.length; p++) for (const c of board.roomCells(room)) add(p, c)
  } else if (other < 0 && clue.type !== 'aloneWithMurderer' && !isGenderClue(clue)) {
    for (const c of board.candidates(holder)) {
      if (!memoized(context, `clue:u:${key}:${c}`, () => evaluate(clue, board.scene, [place(holder, c)], board.people))) {
        add(holder, c)
      }
    }
  } else if (other >= 0 && other !== holder) {
    for (const [p, q] of [[holder, other], [other, holder]] as const) {
      for (const c of board.candidates(p)) {
        const supported = board.candidates(q).some((d) => {
          if (board.row(c) === board.row(d) || board.col(c) === board.col(d)) return false
          const [hc, oc] = p === holder ? [c, d] : [d, c]
          return memoized(context, `clue:p:${key}:${hc}:${oc}`, () =>
            evaluate(clue, board.scene, [place(holder, hc), place(other, oc)], board.people),
          )
        })
        if (!supported) add(p, c)
      }
    }
  }
  roomRules(board, clue, holder, other, add)
}

/** Room exclusivity for "alone", "alone with" and "the only one on" clues. */
function roomRules(
  board: BoardView,
  clue: CatalogClue,
  holder: number,
  other: number,
  add: (person: number, cell: number) => void,
): void {
  const args = clue.args as Record<string, unknown>
  const aloneish = clue.type === 'alone' || args.alone === true
  if (aloneish || clue.type === 'aloneWith') {
    // Members: the holder, and the other person for "alone with". Everybody else stays out.
    const members = clue.type === 'aloneWith' && other >= 0 ? [holder, other] : [holder]
    const outsiders = board.people.map((_, i) => i).filter((i) => !members.includes(i))
    const memberRoom = board.certainRoom(holder)
    if (memberRoom >= 0) {
      for (const q of outsiders) for (const c of board.roomCells(memberRoom)) add(q, c)
    }
    // A member cannot be in a room somebody else is sure to be in.
    for (const q of outsiders) {
      const room = board.certainRoom(q)
      if (room < 0) continue
      for (const m of members) for (const c of board.roomCells(room)) add(m, c)
    }
  }
  if (isGenderClue(clue)) genderRules(board, clue, holder, add)
  if (clue.type === 'onlyOnObject') {
    for (const object of board.scene.objects) {
      if (object.type !== clue.args.objectType) continue
      for (let q = 0; q < board.people.length; q++) {
        if (q === holder) continue
        for (const cell of object.cells) add(q, cell.row * board.width + cell.col)
      }
    }
  }
}

/**
 * Gender clues ("at least one woman in the room", "alone with a man"): they depend on who else is where, so
 * they are read against what the others can still do, never against the holder alone.
 *
 * - the holder cannot stand in a room none of the people of that gender can still reach;
 * - "alone with": everybody who does not have the gender stays out of the holder's room, and the holder
 *   cannot be in a room somebody who does not have the gender is sure to be in.
 */
function genderRules(
  board: BoardView,
  clue: CatalogClue & { type: 'roomHasGender' | 'aloneWithGender' },
  holder: number,
  add: (person: number, cell: number) => void,
): void {
  const fits = (i: number) => i !== holder && board.people[i]?.gender === clue.args.gender
  const members = board.people.map((_, i) => i).filter(fits)
  for (const c of board.candidates(holder)) {
    const room = board.room(c)
    if (room < 0) continue
    const reachable = members.some((q) => board.candidates(q).some((d) => board.room(d) === room))
    if (!reachable) add(holder, c)
  }
  if (clue.type !== 'aloneWithGender') return
  const outsiders = board.people.map((_, i) => i).filter((i) => i !== holder && !fits(i))
  const holderRoom = board.certainRoom(holder)
  if (holderRoom >= 0) {
    for (const q of outsiders) for (const c of board.roomCells(holderRoom)) add(q, c)
  }
  for (const q of outsiders) {
    const room = board.certainRoom(q)
    if (room >= 0) for (const c of board.roomCells(room)) add(holder, c)
  }
}
