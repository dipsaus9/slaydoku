import { describe, expect, it } from 'vitest'
import type { Person, Scene } from '../../model/index.ts'
import { Board } from './board.ts'
import { cellList, cellName, cellSummary, countPeople, joinList, lineNames, onObject, peopleNames, possessive, roomName, sentences, victimName } from './en.ts'
import * as nl from './nl.ts'

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

/** The same helpers, in Dutch (locale 'nl', SLAY-3.3): `nl.ts` is `en.ts`'s counterpart, function for function. */
describe('solver wording helpers: Dutch', () => {
  const nlPeople: Person[] = [...people.slice(0, 3), { id: 'V', kind: 'victim', label: 'het slachtoffer' }]
  const nlBoard = new Board(scene, nlPeople)

  it('names a square: rij 3, kolom 4', () => {
    expect(nl.cellName(nlBoard, cell(2, 3))).toBe('rij 3, kolom 4')
  })

  it('lists squares, with semicolons from three on and a cut-off for long lists', () => {
    expect(nl.cellList(nlBoard, [cell(0, 0)])).toBe('rij 1, kolom 1')
    expect(nl.cellList(nlBoard, [cell(0, 0), cell(1, 1)])).toBe('rij 1, kolom 1 en rij 2, kolom 2')
    expect(nl.cellList(nlBoard, [cell(0, 0), cell(1, 1), cell(2, 2)])).toBe('rij 1, kolom 1; rij 2, kolom 2 en rij 3, kolom 3')
    const many = Array.from({ length: 9 }, (_, i) => i)
    expect(nl.cellList(nlBoard, many)).toBe('rij 1, kolom 1; rij 1, kolom 2; rij 1, kolom 3; rij 1, kolom 4 en vijf andere vakjes')
    expect(nl.cellList(nlBoard, many.slice(0, 5))).toBe('rij 1, kolom 1; rij 1, kolom 2; rij 1, kolom 3; rij 1, kolom 4 en een ander vakje')
  })

  it('summarises a large elimination as a count with two examples', () => {
    expect(nl.cellSummary(nlBoard, [cell(0, 0), cell(1, 1)])).toBe('rij 1, kolom 1 en rij 2, kolom 2')
    expect(nl.cellSummary(nlBoard, Array.from({ length: 12 }, (_, i) => i))).toBe('12 vakjes (waaronder rij 1, kolom 1 en rij 1, kolom 2)')
  })

  it('joins with en or of', () => {
    expect(nl.joinList(['A'])).toBe('A')
    expect(nl.joinList(['A', 'B', 'C'])).toBe('A, B en C')
    expect(nl.joinList(['A', 'B', 'C'], 'or')).toBe('A, B of C')
    expect(nl.peopleNames(nlBoard, [0, 1, 3], 'or')).toBe('Alice, Dan of het slachtoffer')
  })

  it('numbers rows and columns compactly, plural from two on', () => {
    expect(nl.lineNames(true, [2])).toBe('rij 3')
    expect(nl.lineNames(true, [1, 0])).toBe('rijen 1 en 2')
    expect(nl.lineNames(false, [0, 1, 2])).toBe('kolommen 1, 2 en 3')
  })

  it('reuses the Dutch clue-text room name (locale nl) and the victim label', () => {
    expect(nl.roomName(nlBoard, 0)).toBe('de Gallery')
    expect(nl.roomName(nlBoard, 1)).toBe('de Bergruimte')
    expect(nl.victimName(nlBoard)).toBe('het slachtoffer')
  })

  it('says "op een bed" for a square with an object, nothing otherwise', () => {
    expect(nl.onObject(nlBoard, cell(2, 1))).toBe(', op een bed')
    expect(nl.onObject(nlBoard, cell(0, 0))).toBe('')
  })

  it('puts a capital on every sentence, the victim and rooms included', () => {
    expect(nl.sentences('het slachtoffer is weg. de Gallery is leeg! ja? Klopt.')).toBe('Het slachtoffer is weg. De Gallery is leeg! Ja? Klopt.')
  })

  it('counts people in words; possessive stays the shared, untranslated form', () => {
    expect(nl.countPeople(1)).toBe('een persoon')
    expect(nl.countPeople(2)).toBe('twee mensen')
    expect(nl.possessive('Alice')).toBe("Alice's")
  })
})
