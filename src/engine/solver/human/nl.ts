import { GIFT_NL, OBJECTS_NL, countNl, roomName as roomNameById } from '../../clues/index.ts'
import { objectsAt } from '../../model/index.ts'
import type { BoardView } from './board.ts'

/**
 * The Dutch wording of the solver's step explanations. Every shared piece of Dutch of `human/` and
 * `advanced/` lives here; a technique only holds its own sentence template. The clue texts come
 * from `renderClue`, room names and the gift label from the clues module (`roomName`, `GIFT_NL`).
 *
 * House style: short sentences, no cryptic codes. A square is "rij 3, kolom 4" (row 3 from the
 * top, column 4 from the left: how the clue cards count too, and the R3 / C4 of the board's axis
 * labels). Small numbers are written out. The gift is named once per sentence.
 */

/** "rij 3, kolom 4": row and column, 1-based, counted from the top and the left. */
export const cellName = (board: BoardView, cell: number): string =>
  `rij ${board.row(cell) + 1}, kolom ${board.col(cell) + 1}`

/** "vijf", "twaalf", and "veel" above that: a long list of squares is never a number to count. */
export const manyNl = (n: number): string => (n > 12 ? 'veel' : countNl(n))

/**
 * "rij 1, kolom 2 en rij 3, kolom 4"; more than two squares are separated by semicolons so the
 * commas inside a name stay readable. Long lists are cut off: "... en nog vijf andere vakjes".
 */
export function cellList(board: BoardView, cells: readonly number[], max = 4): string {
  const shown = cells.slice(0, max).map((c) => cellName(board, c))
  const more = cells.length - shown.length
  if (more > 0) shown.push(`nog ${manyNl(more)} ${more === 1 ? 'ander vakje' : 'andere vakjes'}`)
  return joinNl(shown, 'en', shown.length > 2 ? '; ' : ', ')
}

/**
 * A count of squares for a deduction that rules out many: "rij 4, kolom 4 en rij 6, kolom 6" for a
 * handful, else "62 vakjes (onder andere rij 1, kolom 8 en rij 2, kolom 1)".
 */
export function cellSummary(board: BoardView, cells: readonly number[], max = 4): string {
  if (cells.length <= max) return cellList(board, cells, max)
  return `${cells.length} vakjes (onder andere ${cells.slice(0, 2).map((c) => cellName(board, c)).join(' en ')})`
}

/** "A, B en C" (or "A, B of C"). */
export function joinNl(items: readonly string[], word: 'en' | 'of' = 'en', separator = ', '): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(separator)} ${word} ${items[items.length - 1]}`
}

/** The label of a person, or of the gift. */
export const personName = (board: BoardView, person: number): string =>
  board.people[person]?.label ?? String(person)

export const peopleNames = (board: BoardView, people: readonly number[], word: 'en' | 'of' = 'en'): string =>
  joinNl(people.map((p) => personName(board, p)), word)

/** How the gift is called in a sentence: the victim's own label ("het cadeau"). */
export const giftName = (board: BoardView): string => (board.victim >= 0 ? personName(board, board.victim) : GIFT_NL.noun)

export const rowName = (row: number): string => `rij ${row + 1}`
export const colName = (col: number): string => `kolom ${col + 1}`

/** "rij 3", "rij 1 en 2", "kolom 1, 2 en 3": the numbers of several rows or columns, sorted. */
export function lineNames(rows: boolean, lines: readonly number[]): string {
  const numbers = [...lines].sort((a, b) => a - b).map((l) => String(l + 1))
  return `${rows ? 'rij' : 'kolom'} ${joinNl(numbers)}`
}

/** "de Keuken", "het Balkon": the shared clue-text helper, by room index. */
export function roomName(board: BoardView, room: number): string {
  const id = board.scene.rooms[room]?.id ?? String(room)
  return roomNameById({ scene: board.scene, people: [...board.people] }, id)
}

/** ", op een bed" when an occupiable object covers the square, else "". */
export function onObject(board: BoardView, cell: number): string {
  const object = objectsAt(board.scene, board.cell(cell))[0]
  return object ? `, ${OBJECTS_NL[object.type].on}` : ''
}

/**
 * Puts a capital at the start of every sentence: the label of the gift ("het cadeau") or a room
 * ("de Galerij") can open one. Text inside a quoted clue card is left alone (it starts capitalised).
 */
export function sentences(text: string): string {
  return text.replace(/(^|[.!?]["”]?\s+)(\p{Ll})/gu, (_, lead: string, letter: string) => `${lead}${letter.toUpperCase()}`)
}

/** "één persoon", "twee mensen": a head count in words. */
export const countPeople = (n: number): string => `${countNl(n)} ${n === 1 ? 'persoon' : 'mensen'}`
