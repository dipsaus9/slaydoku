import { describe, expect, it } from 'vitest'
import { emptyBoard } from '../../game/board.ts'
import type { Board } from '../../game/types.ts'
import { gestureIntent } from './intent.ts'

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

  it('place mode (SLAY-8.2): tap places, long press writes a note instead (the two gestures swap)', () => {
    expect(gestureIntent('place', 'tap', 'A', cell, board())).toEqual({ action: { type: 'place', personId: 'A', cell } })
    expect(gestureIntent('place', 'longPress', 'A', cell, board())).toEqual({ action: { type: 'toggleNote', personId: 'A', cell } })
  })

  it('place mode: tapping the suspect’s own square takes them off again', () => {
    const placed = board({ placements: { A: cell } })
    expect(gestureIntent('place', 'tap', 'A', cell, placed)).toEqual({ action: { type: 'remove', personId: 'A' } })
  })

  it('eraser: tap clears the cell, long press does nothing, no suspect needed', () => {
    expect(gestureIntent('erase', 'tap', null, cell, board())).toEqual({ action: { type: 'eraseCell', cell } })
    expect(gestureIntent('erase', 'longPress', null, cell, board())).toBeNull()
  })

  it('asks for a suspect when none is selected', () => {
    expect(gestureIntent('note', 'tap', null, cell, board())).toEqual({ message: 'pickSuspect' })
    expect(gestureIntent('x', 'tap', null, cell, board())).toEqual({ message: 'pickSuspect' })
    expect(gestureIntent('place', 'tap', null, cell, board())).toEqual({ message: 'pickSuspect' })
  })

  it('placing on the suspect’s own square takes them off again', () => {
    const placed = board({ placements: { A: cell } })
    expect(gestureIntent('note', 'longPress', 'A', cell, placed)).toEqual({ action: { type: 'remove', personId: 'A' } })
    expect(gestureIntent('note', 'longPress', 'A', { row: 0, col: 0 }, placed)).toEqual({
      action: { type: 'place', personId: 'A', cell: { row: 0, col: 0 } },
    })
  })
})
