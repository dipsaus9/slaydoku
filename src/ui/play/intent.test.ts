import { describe, expect, it } from 'vitest'
import { emptyBoard } from '../../game/board.ts'
import type { Board } from '../../game/types.ts'
import { gestureIntent, paintIntent, paintKind, paintModeFor } from './intent.ts'

const cell = { row: 1, col: 2 }
const board = (over: Partial<Board> = {}): Board => ({ ...emptyBoard(), ...over })

describe('gestureIntent', () => {
  it('note mode: tap writes a note, long press places', () => {
    expect(gestureIntent('note', 'tap', 'A', cell, board())).toEqual({ action: { type: 'toggleNote', personId: 'A', cell } })
    expect(gestureIntent('note', 'longPress', 'A', cell, board())).toEqual({ action: { type: 'place', personId: 'A', cell } })
  })

  it('x mode: tap toggles an X, long press still places', () => {
    expect(gestureIntent('x', 'tap', 'A', cell, board())).toEqual({ action: { type: 'toggleMark', personId: 'A', cell } })
    expect(gestureIntent('x', 'longPress', 'A', cell, board())).toEqual({ action: { type: 'place', personId: 'A', cell } })
  })

  it('eraser: tap clears the cell, long press does nothing, no suspect needed', () => {
    expect(gestureIntent('erase', 'tap', null, cell, board())).toEqual({ action: { type: 'eraseCell', cell } })
    expect(gestureIntent('erase', 'longPress', null, cell, board())).toBeNull()
  })

  it('asks for a suspect when none is selected', () => {
    expect(gestureIntent('note', 'tap', null, cell, board())).toEqual({ message: 'pickSuspect' })
    expect(gestureIntent('x', 'tap', null, cell, board())).toEqual({ message: 'pickSuspect' })
  })

  it('placing on the suspect’s own square takes them off again', () => {
    const placed = board({ placements: { A: cell } })
    expect(gestureIntent('note', 'longPress', 'A', cell, placed)).toEqual({ action: { type: 'remove', personId: 'A' } })
    expect(gestureIntent('note', 'longPress', 'A', { row: 0, col: 0 }, placed)).toEqual({
      action: { type: 'place', personId: 'A', cell: { row: 0, col: 0 } },
    })
  })
})

describe('painting', () => {
  it('note mode paints notes', () => {
    expect(paintKind('note')).toBe('note')
    expect(paintKind('x')).toBe('x')
    expect(paintKind('erase')).toBe('erase')
  })

  it('a stroke starting on an empty cell adds, on a noted cell removes', () => {
    expect(paintModeFor('note', 'A', cell, board())).toBe('add')
    expect(paintModeFor('note', 'A', cell, board({ notes: { '1,2': ['A'] } }))).toBe('remove')
    expect(paintModeFor('x', 'A', cell, board({ marks: { '1,2': ['A'] } }))).toBe('remove')
  })

  it('skips cells that already have the wanted state', () => {
    const noted = board({ notes: { '1,2': ['A'] } })
    expect(paintIntent('note', 'add', 'A', cell, noted)).toBeNull()
    expect(paintIntent('note', 'add', 'A', { row: 0, col: 0 }, noted)).toEqual({
      action: { type: 'toggleNote', personId: 'A', cell: { row: 0, col: 0 } },
    })
    expect(paintIntent('note', 'remove', 'A', cell, noted)).toEqual({ action: { type: 'toggleNote', personId: 'A', cell } })
  })

  it('painting X works the same on marks', () => {
    expect(paintIntent('x', 'add', 'A', cell, board())).toEqual({ action: { type: 'toggleMark', personId: 'A', cell } })
    expect(paintIntent('x', 'add', 'A', cell, board({ marks: { '1,2': ['A'] } }))).toBeNull()
  })

  it('a placed suspect paints no notes', () => {
    expect(paintIntent('note', 'add', 'A', cell, board({ placements: { A: { row: 3, col: 3 } } }))).toBeNull()
  })

  it('the eraser wipes every cell it crosses', () => {
    expect(paintIntent('erase', 'add', null, cell, board())).toEqual({ action: { type: 'eraseCell', cell } })
  })
})
