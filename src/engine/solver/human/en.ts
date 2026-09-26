import { VICTIM_TEXT, countWord, objectOn, possessive, roomName as roomNameById } from '../../clues/index.ts'
import { objectsAt } from '../../model/index.ts'
import type { BoardView } from './board.ts'

/**
 * The wording of the solver's step explanations. Every shared piece of text of `human/` and
 * `advanced/` lives here; a technique only holds its own sentence template. The clue texts come
 * from `renderClue`, room names and the victim label from the clues module (`roomName`, `VICTIM_TEXT`).
 *
 * House style: short sentences, no cryptic codes. A square is "row 3, column 4" (row 3 from the
 * top, column 4 from the left: how the clue cards count too, and the R3 / C4 of the board's axis
 * labels). Small numbers are written out. The victim is named once per sentence.
 */

export { possessive }

/** "row 3, column 4": row and column, 1-based, counted from the top and the left. */
export const cellName = (board: BoardView, cell: number): string =>
  `row ${board.row(cell) + 1}, column ${board.col(cell) + 1}`

/** "five", "twelve", and "many" above that: a long list of squares is never a number to count. */
export const manyWord = (n: number): string => (n > 12 ? 'many' : countWord(n))

/**
 * "row 1, column 2 and row 3, column 4"; more than two squares are separated by semicolons so the
 * commas inside a name stay readable. Long lists are cut off: "... and five other squares".
 */
export function cellList(board: BoardView, cells: readonly number[], max = 4): string {
  const shown = cells.slice(0, max).map((c) => cellName(board, c))
  const more = cells.length - shown.length
  if (more > 0) shown.push(`${manyWord(more)} other ${more === 1 ? 'square' : 'squares'}`)
  return joinList(shown, 'and', shown.length > 2 ? '; ' : ', ')
}

/**
 * A count of squares for a deduction that rules out many: "row 4, column 4 and row 6, column 6" for a
 * handful, else "62 squares (among them row 1, column 8 and row 2, column 1)".
 */
export function cellSummary(board: BoardView, cells: readonly number[], max = 4): string {
  if (cells.length <= max) return cellList(board, cells, max)
  return `${cells.length} squares (among them ${cells.slice(0, 2).map((c) => cellName(board, c)).join(' and ')})`
}

/** "A, B and C" (or "A, B or C"). */
export function joinList(items: readonly string[], word: 'and' | 'or' = 'and', separator = ', '): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(separator)} ${word} ${items[items.length - 1]}`
}

/** The label of a person, or of the victim. */
export const personName = (board: BoardView, person: number): string =>
  board.people[person]?.label ?? String(person)

export const peopleNames = (board: BoardView, people: readonly number[], word: 'and' | 'or' = 'and'): string =>
  joinList(people.map((p) => personName(board, p)), word)

/** How the victim is called in a sentence: the victim's own label ("the victim"). */
export const victimName = (board: BoardView): string => (board.victim >= 0 ? personName(board, board.victim) : VICTIM_TEXT.noun)

export const rowName = (row: number): string => `row ${row + 1}`
export const colName = (col: number): string => `column ${col + 1}`

/** "row 3", "rows 1 and 2", "columns 1, 2 and 3": the numbers of several rows or columns, sorted. */
export function lineNames(rows: boolean, lines: readonly number[]): string {
  const numbers = [...lines].sort((a, b) => a - b).map((l) => String(l + 1))
  const noun = rows ? 'row' : 'column'
  return `${numbers.length === 1 ? noun : `${noun}s`} ${joinList(numbers)}`
}

/** "the Kitchen", "the Balcony": the shared clue-text helper, by room index. */
export function roomName(board: BoardView, room: number): string {
  const id = board.scene.rooms[room]?.id ?? String(room)
  return roomNameById({ scene: board.scene, people: [...board.people] }, id)
}

/** ", on a bed" when an occupiable object covers the square, else "". */
export function onObject(board: BoardView, cell: number): string {
  const object = objectsAt(board.scene, board.cell(cell))[0]
  return object ? `, ${objectOn(object.type)}` : ''
}

/**
 * Puts a capital at the start of every sentence: the label of the victim ("the victim") or a room
 * ("the Gallery") can open one. Text inside a quoted clue card is left alone (it starts capitalised).
 */
export function sentences(text: string): string {
  return text.replace(/(^|[.!?]["”]?\s+)(\p{Ll})/gu, (_, lead: string, letter: string) => `${lead}${letter.toUpperCase()}`)
}

/** "one person", "two people": a head count in words. */
export const countPeople = (n: number): string => `${countWord(n)} ${n === 1 ? 'person' : 'people'}`
