import { describe, expect, it } from 'vitest'
import { cellView, hasMark, hasNote, isPlaced, occupantAt } from './board.ts'
import { at, blocked, puzzle } from './fixture.ts'
import { elapsedMs, initialState, reduce } from './reducer.ts'
import type { GameAction, GameOptions, GameState } from './types.ts'

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce((s, a) => reduce(puzzle, s, a), state)
const fresh = (options: Partial<GameOptions> = {}) =>
  initialState({ autoXOnPlace: false, preventXOnBlocked: false, showTimer: true, ...options })

describe('notes', () => {
  it('toggles a small-letter note on and off', () => {
    const s1 = run(fresh(), { type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } })
    expect(hasNote(s1.board, 'A', { row: 1, col: 1 })).toBe(true)
    const s2 = run(s1, { type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } })
    expect(hasNote(s2.board, 'A', { row: 1, col: 1 })).toBe(false)
    expect(s2.board.notes).toEqual({})
  })

  it('keeps several people on one cell in puzzle order', () => {
    const s = run(
      fresh(),
      { type: 'toggleNote', personId: 'C', cell: { row: 1, col: 1 } },
      { type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } },
    )
    expect(cellView(s.board, { row: 1, col: 1 }).noteIds).toEqual(['A', 'C'])
  })

  it('ignores notes on blocked cells, unknown people, off-grid cells and occupied cells', () => {
    const s = fresh()
    expect(run(s, { type: 'toggleNote', personId: 'A', cell: blocked })).toBe(s)
    expect(run(s, { type: 'toggleNote', personId: 'Z', cell: { row: 1, col: 1 } })).toBe(s)
    expect(run(s, { type: 'toggleNote', personId: 'A', cell: { row: 9, col: 9 } })).toBe(s)
    const placed = run(s, { type: 'place', personId: 'A', cell: at.A })
    expect(run(placed, { type: 'toggleNote', personId: 'B', cell: at.A })).toBe(placed)
  })

  it('a note and an X of the same person on one cell exclude each other', () => {
    const cell = { row: 1, col: 1 }
    const noted = run(fresh(), { type: 'toggleNote', personId: 'A', cell })
    const crossed = run(noted, { type: 'toggleMark', personId: 'A', cell })
    expect(hasMark(crossed.board, 'A', cell)).toBe(true)
    expect(hasNote(crossed.board, 'A', cell)).toBe(false)
    const back = run(crossed, { type: 'toggleNote', personId: 'A', cell })
    expect(hasNote(back.board, 'A', cell)).toBe(true)
    expect(hasMark(back.board, 'A', cell)).toBe(false)
  })
})

describe('placing and removing', () => {
  it('places a person and drops their notes and X marks', () => {
    const s = run(
      fresh(),
      { type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } },
      { type: 'toggleMark', personId: 'A', cell: { row: 2, col: 2 } },
      { type: 'toggleNote', personId: 'B', cell: at.A },
      { type: 'place', personId: 'A', cell: at.A },
    )
    expect(occupantAt(s.board, at.A)).toBe('A')
    expect(s.board.notes).toEqual({})
    expect(s.board.marks).toEqual({})
  })

  it('moves an already placed person', () => {
    const s = run(fresh(), { type: 'place', personId: 'A', cell: at.A }, { type: 'place', personId: 'A', cell: { row: 1, col: 1 } })
    expect(s.board.placements).toEqual({ A: { row: 1, col: 1 } })
  })

  it('refuses blocked cells, taken cells and unknown people', () => {
    const s = run(fresh(), { type: 'place', personId: 'A', cell: at.A })
    expect(run(s, { type: 'place', personId: 'B', cell: blocked })).toBe(s)
    expect(run(s, { type: 'place', personId: 'B', cell: at.A })).toBe(s)
    expect(run(s, { type: 'place', personId: 'Q', cell: { row: 3, col: 0 } })).toBe(s)
    expect(run(s, { type: 'place', personId: 'B', cell: { row: 7, col: 0 } })).toBe(s)
  })

  it('removes a person; removing a person who is not placed does nothing', () => {
    const placed = run(fresh(), { type: 'place', personId: 'A', cell: at.A })
    expect(run(placed, { type: 'remove', personId: 'A' }).board.placements).toEqual({})
    const s = fresh()
    expect(run(s, { type: 'remove', personId: 'A' })).toBe(s)
  })

  it('gives placed people no notes or X marks', () => {
    const placed = run(fresh(), { type: 'place', personId: 'A', cell: at.A })
    expect(run(placed, { type: 'toggleNote', personId: 'A', cell: { row: 3, col: 0 } })).toBe(placed)
    expect(run(placed, { type: 'toggleMark', personId: 'A', cell: { row: 3, col: 0 } })).toBe(placed)
  })
})

describe('X marks and options', () => {
  it('toggles an X mark', () => {
    const cell = { row: 1, col: 1 }
    const on = run(fresh(), { type: 'toggleMark', personId: 'B', cell })
    expect(hasMark(on.board, 'B', cell)).toBe(true)
    expect(hasMark(run(on, { type: 'toggleMark', personId: 'B', cell }).board, 'B', cell)).toBe(false)
  })

  it('allows an X on a blocked cell only while prevention is off', () => {
    const off = run(fresh(), { type: 'toggleMark', personId: 'B', cell: blocked })
    expect(hasMark(off.board, 'B', blocked)).toBe(true)
    const on = fresh({ preventXOnBlocked: true })
    expect(run(on, { type: 'toggleMark', personId: 'B', cell: blocked })).toBe(on)
  })

  it('setOption changes an option and is a no-op when nothing changes', () => {
    const s = fresh()
    const changed = run(s, { type: 'setOption', option: 'autoXOnPlace', value: true })
    expect(changed.options.autoXOnPlace).toBe(true)
    expect(run(changed, { type: 'setOption', option: 'autoXOnPlace', value: true })).toBe(changed)
  })

  it('options changes are not undoable history', () => {
    const s = run(fresh(), { type: 'setOption', option: 'showTimer', value: false })
    expect(s.history.past).toHaveLength(0)
  })
})

describe('auto-X', () => {
  it('crosses row and column for everyone still unplaced, not the placed cell', () => {
    const s = run(fresh({ autoXOnPlace: true }), { type: 'place', personId: 'A', cell: at.A })
    expect(hasMark(s.board, 'B', { row: 1, col: 0 })).toBe(true) // same row (tv cell too: prevention off)
    expect(hasMark(s.board, 'V', { row: 1, col: 3 })).toBe(true)
    expect(hasMark(s.board, 'C', { row: 3, col: 2 })).toBe(true) // same column
    expect(cellView(s.board, at.A).markIds).toEqual([])
    expect(hasMark(s.board, 'A', { row: 1, col: 3 })).toBe(false) // A is placed
    expect(hasMark(s.board, 'B', { row: 2, col: 1 })).toBe(false) // unrelated cell
  })

  it('never crosses blocked cells when prevention is on, and does when it is off', () => {
    const guarded = run(fresh({ autoXOnPlace: true, preventXOnBlocked: true }), { type: 'place', personId: 'A', cell: at.A })
    expect(guarded.board.marks['0,2']).toBeUndefined() // the table, same column
    expect(guarded.board.marks['1,0']).toBeUndefined() // the tv, same row
    expect(guarded.board.marks['3,2']).toEqual(['V', 'B', 'C'])
    const open = run(fresh({ autoXOnPlace: true }), { type: 'place', personId: 'A', cell: at.A })
    expect(open.board.marks['0,2']).toEqual(['V', 'B', 'C'])
  })

  it('does nothing extra when auto-X is off', () => {
    const s = run(fresh(), { type: 'place', personId: 'A', cell: at.A })
    expect(s.board.marks).toEqual({})
  })

  it('replaces notes it crosses out', () => {
    const s = run(
      fresh({ autoXOnPlace: true }),
      { type: 'toggleNote', personId: 'B', cell: { row: 1, col: 1 } },
      { type: 'place', personId: 'C', cell: at.C },
      { type: 'place', personId: 'A', cell: at.A },
    )
    expect(hasNote(s.board, 'B', { row: 1, col: 1 })).toBe(false)
    expect(hasMark(s.board, 'B', { row: 1, col: 1 })).toBe(true)
    expect(s.board.marks['1,3']).toEqual(['V', 'B']) // A's row, C's column
  })

  it('prevention leaves legal cells alone', () => {
    const s = run(fresh({ preventXOnBlocked: true }), { type: 'toggleMark', personId: 'A', cell: { row: 1, col: 1 } })
    expect(hasMark(s.board, 'A', { row: 1, col: 1 })).toBe(true)
  })
})

describe('eraser', () => {
  const busy = () =>
    run(
      fresh(),
      { type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } },
      { type: 'toggleMark', personId: 'B', cell: { row: 1, col: 1 } },
      { type: 'toggleNote', personId: 'A', cell: { row: 2, col: 2 } },
      { type: 'place', personId: 'C', cell: at.C },
    )

  it('clears one cell: notes, marks and the placed person', () => {
    const s = run(busy(), { type: 'eraseCell', cell: { row: 1, col: 1 } })
    expect(cellView(s.board, { row: 1, col: 1 })).toEqual({ placedPersonId: null, noteIds: [], markIds: [] })
    expect(hasNote(s.board, 'A', { row: 2, col: 2 })).toBe(true)
    const gone = run(s, { type: 'eraseCell', cell: at.C })
    expect(gone.board.placements).toEqual({})
  })

  it('clears everything on clearAll, and clearAll on an empty grid is a no-op', () => {
    const s = run(busy(), { type: 'clearAll' })
    expect(s.board).toEqual({ notes: {}, marks: {}, placements: {} })
    expect(run(s, { type: 'clearAll' })).toBe(s)
  })

  it('erasing an empty cell is a no-op', () => {
    const s = fresh()
    expect(run(s, { type: 'eraseCell', cell: { row: 1, col: 1 } })).toBe(s)
  })
})

describe('undo and redo', () => {
  const cell = { row: 1, col: 1 }

  it('undoes and redoes notes, marks and placements one action at a time', () => {
    const s0 = fresh()
    const s1 = run(s0, { type: 'toggleNote', personId: 'A', cell })
    const s2 = run(s1, { type: 'toggleMark', personId: 'B', cell: { row: 2, col: 2 } })
    const s3 = run(s2, { type: 'place', personId: 'C', cell: at.C })
    let s = s3
    s = run(s, { type: 'undo' })
    expect(s.board).toEqual(s2.board)
    s = run(s, { type: 'undo' })
    expect(s.board).toEqual(s1.board)
    s = run(s, { type: 'undo' })
    expect(s.board).toEqual(s0.board)
    s = run(s, { type: 'redo' }, { type: 'redo' }, { type: 'redo' })
    expect(s.board).toEqual(s3.board)
  })

  it('undoes an auto-X placement in one step', () => {
    const before = run(fresh({ autoXOnPlace: true }), { type: 'toggleNote', personId: 'B', cell })
    const placed = run(before, { type: 'place', personId: 'A', cell: at.A })
    expect(Object.keys(placed.board.marks).length).toBeGreaterThan(0)
    expect(run(placed, { type: 'undo' }).board).toEqual(before.board)
  })

  it('undoes an eraser and a clear-all', () => {
    const built = run(fresh(), { type: 'place', personId: 'A', cell: at.A }, { type: 'toggleNote', personId: 'B', cell })
    const cleared = run(built, { type: 'clearAll' })
    expect(run(cleared, { type: 'undo' }).board).toEqual(built.board)
    const erased = run(built, { type: 'eraseCell', cell: at.A })
    expect(run(erased, { type: 'undo' }).board).toEqual(built.board)
  })

  it('a new edit drops the redo stack', () => {
    const s = run(
      fresh(),
      { type: 'toggleNote', personId: 'A', cell },
      { type: 'undo' },
      { type: 'toggleNote', personId: 'B', cell },
    )
    expect(s.history.future).toHaveLength(0)
    expect(run(s, { type: 'redo' })).toBe(s)
  })

  it('does nothing with an empty stack, and no-op edits leave no history', () => {
    const s = fresh()
    expect(run(s, { type: 'undo' })).toBe(s)
    expect(run(s, { type: 'redo' })).toBe(s)
    expect(run(s, { type: 'remove', personId: 'A' }).history.past).toHaveLength(0)
  })

  it('caps the history depth', () => {
    let s = fresh()
    for (let i = 0; i < 260; i++) s = run(s, { type: 'toggleNote', personId: 'A', cell })
    expect(s.history.past.length).toBeLessThanOrEqual(200)
  })
})

describe('timer', () => {
  it('runs from resume to pause and adds up', () => {
    let s = run(fresh(), { type: 'resume', at: 1000 })
    expect(elapsedMs(s, 1500)).toBe(500)
    s = run(s, { type: 'pause', at: 2000 })
    expect(elapsedMs(s, 99999)).toBe(1000)
    s = run(s, { type: 'resume', at: 5000 })
    expect(elapsedMs(s, 5250)).toBe(1250)
  })

  it('ignores double resume and pause without a running clock', () => {
    const running = run(fresh(), { type: 'resume', at: 10 })
    expect(run(running, { type: 'resume', at: 99 })).toBe(running)
    const s = fresh()
    expect(run(s, { type: 'pause', at: 5 })).toBe(s)
  })

  it('restart empties the grid and zeroes the clock but keeps options', () => {
    const s = run(
      fresh({ autoXOnPlace: true }),
      { type: 'resume', at: 0 },
      { type: 'place', personId: 'A', cell: at.A },
      { type: 'restart', at: 900 },
    )
    expect(s.board.placements).toEqual({})
    expect(s.history.past).toHaveLength(0)
    expect(s.options.autoXOnPlace).toBe(true)
    expect(elapsedMs(s, 1000)).toBe(100)
  })
})

describe('the victim: the player places them, like anybody else (SLAY-9.24)', () => {
  it('is not placed while a suspect is still missing', () => {
    const s = run(fresh(), { type: 'place', personId: 'A', cell: at.A }, { type: 'place', personId: 'C', cell: at.C })
    expect(isPlaced(s.board, 'V')).toBe(false)
  })

  it('is NOT auto-filled the instant every suspect has a placement, whatever order they land in', () => {
    const s = run(fresh(), { type: 'place', personId: 'B', cell: at.B }, { type: 'place', personId: 'C', cell: at.C }, { type: 'place', personId: 'A', cell: at.A })
    expect(isPlaced(s.board, 'V')).toBe(false)
    expect(s.status).toBe('playing')
  })

  it('is placed once an explicit place action names them, on the one square left over', () => {
    const suspectsDone = run(fresh(), { type: 'place', personId: 'B', cell: at.B }, { type: 'place', personId: 'C', cell: at.C }, { type: 'place', personId: 'A', cell: at.A })
    const s = run(suspectsDone, { type: 'place', personId: 'V', cell: at.V })
    expect(s.board.placements.V).toEqual(at.V)
    expect(s.status).toBe('solved')
  })

  it('is placed on whichever square is left over, even when a suspect stands on the wrong one', () => {
    // A and C swapped: still every suspect placed, so the one cell nobody stands on is the victim's.
    const suspectsDone = run(fresh(), { type: 'place', personId: 'A', cell: at.C }, { type: 'place', personId: 'C', cell: at.A }, { type: 'place', personId: 'B', cell: at.B })
    const s = run(suspectsDone, { type: 'place', personId: 'V', cell: at.V })
    expect(s.board.placements.V).toEqual(at.V)
  })

  it('is removable and re-placeable, like any other person', () => {
    // A and C swapped, as above: the grid stays open (a solved level locks it, see check.test.ts)
    // so remove/place on the victim actually reach the board instead of being no-ops.
    const filled = run(
      fresh(),
      { type: 'place', personId: 'A', cell: at.C },
      { type: 'place', personId: 'C', cell: at.A },
      { type: 'place', personId: 'B', cell: at.B },
      { type: 'place', personId: 'V', cell: at.V },
    )
    expect(filled.board.placements.V).toEqual(at.V)
    expect(filled.status).toBe('playing')
    const lifted = run(filled, { type: 'remove', personId: 'V' })
    expect(isPlaced(lifted.board, 'V')).toBe(false)
    const back = run(lifted, { type: 'place', personId: 'V', cell: at.V })
    expect(back.board.placements.V).toEqual(at.V)
  })

  it('erasing the victim off the grid leaves that square empty, like any other person', () => {
    // A and C swapped, as above, so the grid stays open and the eraser actually reaches the cell.
    const filled = run(
      fresh(),
      { type: 'place', personId: 'A', cell: at.C },
      { type: 'place', personId: 'C', cell: at.A },
      { type: 'place', personId: 'B', cell: at.B },
      { type: 'place', personId: 'V', cell: at.V },
    )
    expect(filled.status).toBe('playing')
    const erased = run(filled, { type: 'eraseCell', cell: at.V })
    expect(isPlaced(erased.board, 'V')).toBe(false)
  })
})
