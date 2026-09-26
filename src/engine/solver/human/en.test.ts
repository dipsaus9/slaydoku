import { describe, expect, it } from 'vitest'
import type { Person, Scene } from '../../model/index.ts'
import { Board } from './board.ts'
import { cellList, cellName, cellSummary, countPeople, joinList, lineNames, onObject, peopleNames, possessive, roomName, sentences, victimName } from './en.ts'

const scene: Scene = {
  width: 4,
  height: 4,
  rooms: [
    { id: 'top', name: 'the Gallery' },
    { id: 'bottom', name: 'Storeroom' },
  ],
  cellRooms: [
    ['top', 'top', 'top', 'top'],
    ['top', 'top', 'top', 'top'],
    ['bottom', 'bottom', 'bottom', 'bottom'],
    ['bottom', 'bottom', 'bottom', 'bottom'],
  ],
  objects: [{ id: 'bed', type: 'bed', cells: [{ row: 2, col: 1 }] }],
  edgeFeatures: [],
}
const people: Person[] = [
  { id: 'A', kind: 'suspect', label: 'Alice' },
  { id: 'B', kind: 'suspect', label: 'Dan' },
  { id: 'C', kind: 'suspect', label: 'Frank' },
  { id: 'V', kind: 'victim', label: 'the victim' },
]
const board = new Board(scene, people)
const cell = (row: number, col: number) => row * 4 + col

describe('solver wording helpers', () => {
  it('names a square the way the clue cards count: row 3, column 4', () => {
    expect(cellName(board, cell(2, 3))).toBe('row 3, column 4')
  })

  it('lists squares, with semicolons from three on and a cut-off for long lists', () => {
    expect(cellList(board, [cell(0, 0)])).toBe('row 1, column 1')
    expect(cellList(board, [cell(0, 0), cell(1, 1)])).toBe('row 1, column 1 and row 2, column 2')
    expect(cellList(board, [cell(0, 0), cell(1, 1), cell(2, 2)])).toBe('row 1, column 1; row 2, column 2 and row 3, column 3')
    const many = Array.from({ length: 9 }, (_, i) => i)
    expect(cellList(board, many)).toBe('row 1, column 1; row 1, column 2; row 1, column 3; row 1, column 4 and five other squares')
    expect(cellList(board, many.slice(0, 5))).toBe('row 1, column 1; row 1, column 2; row 1, column 3; row 1, column 4 and one other square')
  })

  it('summarises a large elimination as a count with two examples', () => {
    expect(cellSummary(board, [cell(0, 0), cell(1, 1)])).toBe('row 1, column 1 and row 2, column 2')
    expect(cellSummary(board, Array.from({ length: 12 }, (_, i) => i))).toBe('12 squares (among them row 1, column 1 and row 1, column 2)')
  })

  it('joins with and or or', () => {
    expect(joinList(['A'])).toBe('A')
    expect(joinList(['A', 'B', 'C'])).toBe('A, B and C')
    expect(joinList(['A', 'B', 'C'], 'or')).toBe('A, B or C')
    expect(peopleNames(board, [0, 1, 3], 'or')).toBe('Alice, Dan or the victim')
  })

  it('numbers rows and columns compactly, plural from two on', () => {
    expect(lineNames(true, [2])).toBe('row 3')
    expect(lineNames(true, [1, 0])).toBe('rows 1 and 2')
    expect(lineNames(false, [0, 1, 2])).toBe('columns 1, 2 and 3')
  })

  it('reuses the clue-text room name ("the" kept or added) and the victim label', () => {
    expect(roomName(board, 0)).toBe('the Gallery')
    expect(roomName(board, 1)).toBe('the Storeroom')
    expect(victimName(board)).toBe('the victim')
  })

  it('says "on a bed" for a square with an object, nothing otherwise', () => {
    expect(onObject(board, cell(2, 1))).toBe(', on a bed')
    expect(onObject(board, cell(0, 0))).toBe('')
  })

  it('puts a capital on every sentence, the victim and rooms included', () => {
    expect(sentences('the victim is gone. the Gallery is empty! yes? Right.')).toBe('The victim is gone. The Gallery is empty! Yes? Right.')
    expect(sentences('Card: "Henry was alone." the victim cannot.')).toBe('Card: "Henry was alone." The victim cannot.')
  })

  it('counts people in words and forms possessives', () => {
    expect(countPeople(1)).toBe('one person')
    expect(countPeople(2)).toBe('two people')
    expect(possessive('Alice')).toBe("Alice's")
    expect(possessive('the victim')).toBe("the victim's")
  })
})
