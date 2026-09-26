import { describe, expect, it } from 'vitest'
import type { Person, Scene } from '../../model/index.ts'
import { Board } from './board.ts'
import { cellList, cellName, cellSummary, giftName, joinNl, lineNames, onObject, peopleNames, roomName, sentences } from './nl.ts'

const scene: Scene = {
  width: 4,
  height: 4,
  rooms: [
    { id: 'top', name: 'de Galerij' },
    { id: 'bottom', name: 'Berging' },
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
  { id: 'V', kind: 'victim', label: 'het cadeau' },
]
const board = new Board(scene, people)
const cell = (row: number, col: number) => row * 4 + col

describe('solver Dutch helpers', () => {
  it('names a square the way the clue cards count: rij 3, kolom 4', () => {
    expect(cellName(board, cell(2, 3))).toBe('rij 3, kolom 4')
  })

  it('lists squares, with semicolons from three on and a cut-off for long lists', () => {
    expect(cellList(board, [cell(0, 0)])).toBe('rij 1, kolom 1')
    expect(cellList(board, [cell(0, 0), cell(1, 1)])).toBe('rij 1, kolom 1 en rij 2, kolom 2')
    expect(cellList(board, [cell(0, 0), cell(1, 1), cell(2, 2)])).toBe('rij 1, kolom 1; rij 2, kolom 2 en rij 3, kolom 3')
    const many = Array.from({ length: 9 }, (_, i) => i)
    expect(cellList(board, many)).toBe('rij 1, kolom 1; rij 1, kolom 2; rij 1, kolom 3; rij 1, kolom 4 en nog vijf andere vakjes')
    expect(cellList(board, many.slice(0, 5))).toBe('rij 1, kolom 1; rij 1, kolom 2; rij 1, kolom 3; rij 1, kolom 4 en nog één ander vakje')
  })

  it('summarises a large elimination as a count with two examples', () => {
    expect(cellSummary(board, [cell(0, 0), cell(1, 1)])).toBe('rij 1, kolom 1 en rij 2, kolom 2')
    expect(cellSummary(board, Array.from({ length: 12 }, (_, i) => i))).toBe('12 vakjes (onder andere rij 1, kolom 1 en rij 1, kolom 2)')
  })

  it('joins with en or of', () => {
    expect(joinNl(['A'])).toBe('A')
    expect(joinNl(['A', 'B', 'C'])).toBe('A, B en C')
    expect(joinNl(['A', 'B', 'C'], 'of')).toBe('A, B of C')
    expect(peopleNames(board, [0, 1, 3], 'of')).toBe('Alice, Dan of het cadeau')
  })

  it('numbers rows and columns compactly', () => {
    expect(lineNames(true, [2])).toBe('rij 3')
    expect(lineNames(true, [1, 0])).toBe('rij 1 en 2')
    expect(lineNames(false, [0, 1, 2])).toBe('kolom 1, 2 en 3')
  })

  it('reuses the clue-text room name (article kept, "de" as fallback) and the victim label', () => {
    expect(roomName(board, 0)).toBe('de Galerij')
    expect(roomName(board, 1)).toBe('de Berging')
    expect(giftName(board)).toBe('het cadeau')
  })

  it('says "op een bed" for a square with an object, nothing otherwise', () => {
    expect(onObject(board, cell(2, 1))).toBe(', op een bed')
    expect(onObject(board, cell(0, 0))).toBe('')
  })

  it('puts a capital on every sentence, the gift and rooms included', () => {
    expect(sentences('het cadeau is weg. de Galerij is leeg! ja? Klopt.')).toBe('Het cadeau is weg. De Galerij is leeg! Ja? Klopt.')
    expect(sentences('Kaart: "Henry was alleen." het cadeau kan niet.')).toBe('Kaart: "Henry was alleen." Het cadeau kan niet.')
  })
})
