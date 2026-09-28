import { VICTIM_TEXT_NL, countWordNl, objectOnNl, possessive, roomName as roomNameLocale } from '../../clues/index.ts'
import { objectsAt } from '../../model/index.ts'
import type { BoardView } from './board.ts'

/**
 * The Dutch counterpart of `en.ts`, function for function, so the two stay easy to compare
 * (SLAY-3.3). Every shared piece of text of `human/` and `advanced/` lives here in Dutch; a
 * technique picks this module or `en.ts` by `context.locale`. The clue texts come from
 * `renderClue`/`bothPartsText` (called with locale `'nl'`), room names and the victim label from
 * the clues module's Dutch wording (`roomName` with locale `'nl'`, `VICTIM_TEXT_NL`).
 *
 * Same house style as `en.ts`, Dutch: short sentences, no cryptic codes, a square is "rij 3, kolom
 * 4" (from the top and the left, same axis the board and the clue cards use). Small numbers are
 * written out. The victim is named once per sentence.
 */

export { possessive }

/** "rij 3, kolom 4": row and column, 1-based, counted from the top and the left. */
export const cellName = (board: BoardView, cell: number): string =>
  `rij ${board.row(cell) + 1}, kolom ${board.col(cell) + 1}`

/** "vijf", "twaalf", and "veel" above that: a long list of squares is never a number to count. */
export const manyWord = (n: number): string => (n > 12 ? 'veel' : countWordNl(n))

/**
 * "rij 1, kolom 2 en rij 3, kolom 4"; more than two squares are separated by semicolons so the
 * commas inside a name stay readable. Long lists are cut off: "... en vijf andere vakjes".
 */
export function cellList(board: BoardView, cells: readonly number[], max = 4): string {
  const shown = cells.slice(0, max).map((c) => cellName(board, c))
  const more = cells.length - shown.length
  if (more > 0) shown.push(`${manyWord(more)} ander${more === 1 ? '' : 'e'} vakje${more === 1 ? '' : 's'}`)
  return joinList(shown, 'and', shown.length > 2 ? '; ' : ', ')
}

/**
 * A count of squares for a deduction that rules out many: "rij 4, kolom 4 en rij 6, kolom 6" for a
 * handful, else "62 vakjes (waaronder rij 1, kolom 8 en rij 2, kolom 1)".
 */
export function cellSummary(board: BoardView, cells: readonly number[], max = 4): string {
  if (cells.length <= max) return cellList(board, cells, max)
  return `${cells.length} vakjes (waaronder ${cells.slice(0, 2).map((c) => cellName(board, c)).join(' en ')})`
}

const WORD_NL: Record<'and' | 'or', string> = { and: 'en', or: 'of' }

/** "A, B en C" (or "A, B of C"). Same `word` domain as `en.ts` ('and'/'or'), Dutch word chosen for it. */
export function joinList(items: readonly string[], word: 'and' | 'or' = 'and', separator = ', '): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(separator)} ${WORD_NL[word]} ${items[items.length - 1]}`
}

/** The label of a person, or of the victim. */
export const personName = (board: BoardView, person: number): string =>
  board.people[person]?.label ?? String(person)

export const peopleNames = (board: BoardView, people: readonly number[], word: 'and' | 'or' = 'and'): string =>
  joinList(people.map((p) => personName(board, p)), word)

/** How the victim is called in a sentence: the victim's own label ("het slachtoffer"). */
export const victimName = (board: BoardView): string => (board.victim >= 0 ? personName(board, board.victim) : VICTIM_TEXT_NL.noun)

export const rowName = (row: number): string => `rij ${row + 1}`
export const colName = (col: number): string => `kolom ${col + 1}`

/** "rij 3", "rijen 1 en 2", "kolommen 1, 2 en 3": the numbers of several rows or columns, sorted. */
export function lineNames(rows: boolean, lines: readonly number[]): string {
  const numbers = [...lines].sort((a, b) => a - b).map((l) => String(l + 1))
  const noun = numbers.length === 1 ? (rows ? 'rij' : 'kolom') : rows ? 'rijen' : 'kolommen'
  return `${noun} ${joinList(numbers)}`
}

/** "de Kitchen", "de Balcony": the shared clue-text helper (locale `'nl'`), by room index. */
export function roomName(board: BoardView, room: number): string {
  const id = board.scene.rooms[room]?.id ?? String(room)
  return roomNameLocale({ scene: board.scene, people: [...board.people] }, id, 'nl')
}

/** ", op een bed" when an occupiable object covers the square, else "". */
export function onObject(board: BoardView, cell: number): string {
  const object = objectsAt(board.scene, board.cell(cell))[0]
  return object ? `, ${objectOnNl(object.type)}` : ''
}

/**
 * Puts a capital at the start of every sentence: the label of the victim ("het slachtoffer") or a
 * room ("de Gallery") can open one. Text inside a quoted clue card is left alone (it starts
 * capitalised). Same regex as `en.ts` — capitalisation logic does not depend on the language.
 */
export function sentences(text: string): string {
  return text.replace(/(^|[.!?]["”]?\s+)(\p{Ll})/gu, (_, lead: string, letter: string) => `${lead}${letter.toUpperCase()}`)
}

/** "een persoon", "twee mensen": a head count in words. */
export const countPeople = (n: number): string => `${countWordNl(n)} ${n === 1 ? 'persoon' : 'mensen'}`

/**
 * Full-sentence builders, one per basic technique (`techniques/*.ts`): the Dutch counterpart of
 * that technique's own English template. Kept here rather than in the technique file so no Dutch
 * word ever sits outside a file the Dutch-text guard test already treats as deliberately Dutch
 * (`src/validation/dutch.test.ts`, SLAY-3.3 following the SLAY-3.2 pattern of `clues/nl.ts`). Each
 * takes the already-rendered pieces (names, cell text, counts) a technique computes with the
 * helpers above, and decides the Dutch grammar (verb, singular/plural) around them.
 */

/** `techniques/single.ts`. */
export const singleCandidateText = (person: string, cell: string): string =>
  `${person} kan nu nog maar op één vakje staan: ${cell}. Die rij en kolom zijn daarmee bezet.`

/** `techniques/scan.ts`: the shared opening, then the placement or the elimination sentence. */
export const scanOpening = (lineName: string, freeSquare: string): string =>
  `Elke rij en kolom houdt iemand, en in ${lineName} is nog maar één vakje vrij: ${freeSquare}.`
export const scanPlacementText = (opening: string, person: string, cell: string): string =>
  `${opening} Alleen ${person} kan daar nog staan. Dus ${person} staat op ${cell}.`
export const scanEliminationText = (opening: string, who: string, taken: string): string =>
  `${opening} Een van deze mensen staat daar: ${who}. We weten nog niet wie, maar ${taken} is hoe dan ook bezet, dus niemand anders kan daar staan.`

/** `techniques/intersect.ts`. */
export const intersectText = (name: string, own: string, cross: string): string =>
  `${name} kan nu alleen nog op ${own} staan. Elk van die vakjes deelt een rij of kolom met ${cross}. Als iemand anders daar zou staan, had ${name} niets meer over. Dus niemand anders kan daar staan.`

/** `techniques/overload.ts`. */
export function overloadText(who: string, where: string, rows: boolean, size: number): string {
  const noun = rows ? 'rij' : 'kolom'
  return size === 1
    ? `${who} kan nu alleen nog in ${where} staan. Die ${noun} is van ${who}, dus niemand anders kan daar staan.`
    : `${who} kunnen nu alleen nog in ${where} staan. We weten niet wie welke ${noun} neemt, maar die ${rows ? 'rijen' : 'kolommen'} zijn samen van hen, dus niemand anders kan daar staan.`
}

/** `techniques/victim-room.ts`, one per branch. */
export const crowdedText = (who: string, count: number, room: string, victim: string): string =>
  `${who} ${count === 1 ? 'staat' : 'staan'} zeker in ${room}. ${victim} is bij precies één verdachte, en kan daar dus niet zijn.`
export const unreachableText = (room: string, victim: string): string =>
  `Geen enkele verdachte kan nog in ${room} staan. ${victim} is bij een verdachte, en kan daar dus niet zijn.`
export const settledInsideText = (victim: string, room: string, who: string): string =>
  `${victim} is in ${room}, samen met ${who}. Dat is de dader, dus geen andere verdachte kan daar staan.`
export const settledOnlyText = (victim: string, room: string, who: string): string =>
  `${victim} is in ${room} en moet daar samen zijn met een verdachte. Alleen ${who} kan daar nog komen, dus die persoon staat daar.`

/** `techniques/clue.ts`: one verdict line, the card's lead-in, and the final sentence. */
export function clueVerdictText(who: string, where: string, count: number, first: boolean): string {
  const verb = count === 1 ? 'kan' : 'kunnen'
  return first ? `Dus ${who} ${verb} niet op ${where} staan` : `${who} ${verb} ook niet op ${where} staan`
}
export function clueLeadText(room: boolean, possessiveWho: string, text: string, twoParts: string | null): string {
  if (room) return `Een kaartje zegt: "${text}"`
  return `${possessiveWho} kaartje zegt: "${text}"${twoParts === null ? '' : ` ${twoParts}`}`
}
export const clueRoomText = (lead: string, room: string): string => `${lead} Dus niemand kan in ${room} staan.`
export const clueVerdictsText = (lead: string, verdicts: string): string => `${lead} ${verdicts}.`
