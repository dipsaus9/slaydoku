import { describe, expect, it } from 'vitest'
import { createGeometry } from '../../render/scene/index.ts'
import {
  boardToFrame,
  boxAroundCells,
  clampView,
  fingerStep,
  frameToBoard,
  IDENTITY,
  isZoomed,
  MAX_SCALE,
  NO_FINGERS,
  panBy,
  pinchView,
  revealBox,
  viewTransform,
  zoomAt,
  type FingerEvent,
  type FingerState,
  type Point,
  type View,
} from './zoom.ts'

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 9)
const closePoint = (a: Point, b: Point) => {
  close(a.x, b.x)
  close(a.y, b.y)
}
/** A 2x view around the board's middle: what the removed toolbar button used to toggle to
 * (SLAY-9.8); several tests below still want a generic zoomed-in fixture. */
const zoomed2x = (view: View = IDENTITY): View => zoomAt(view, 2, { x: 0.5, y: 0.5 })

/** A 9x9 board like the phone shows it: which cell is under a spot of the frame, through the view. */
const geometry = createGeometry({ width: 9, height: 9 }, { axisLabels: true })
function cellAtFrame(view: View, p: Point) {
  const board = frameToBoard(view, p)
  const x = board.x * geometry.viewBox.width - geometry.origin.x
  const y = board.y * geometry.viewBox.height - geometry.origin.y
  const col = Math.floor(x / geometry.cellSize)
  const row = Math.floor(y / geometry.cellSize)
  return row < 0 || col < 0 || row >= geometry.rows || col >= geometry.columns ? null : { row, col }
}
const centerOf = (cell: { row: number; col: number }): Point => {
  const c = geometry.cellCenter(cell)
  return { x: c.x / geometry.viewBox.width, y: c.y / geometry.viewBox.height }
}

describe('view maths', () => {
  it('1x is the identity and shows no transform', () => {
    expect(clampView(IDENTITY)).toEqual(IDENTITY)
    expect(isZoomed(IDENTITY)).toBe(false)
    expect(viewTransform(IDENTITY)).toBe('none')
  })

  it('clamps the scale to 1x..3x', () => {
    expect(zoomAt(IDENTITY, 0.2, { x: 0.5, y: 0.5 }).scale).toBe(1)
    expect(zoomAt(IDENTITY, 9, { x: 0.5, y: 0.5 }).scale).toBe(MAX_SCALE)
    expect(clampView({ scale: NaN, x: 0, y: 0 })).toEqual(IDENTITY)
  })

  it('clamps the pan so the pane always covers the frame', () => {
    const z = zoomAt(IDENTITY, 2, { x: 0.5, y: 0.5 })
    expect(clampView({ ...z, x: 0.3, y: 0.3 })).toEqual({ scale: 2, x: 0, y: 0 })
    expect(clampView({ ...z, x: -5, y: -5 })).toEqual({ scale: 2, x: -1, y: -1 })
    expect(panBy(z, -10, 10)).toEqual({ scale: 2, x: -1, y: 0 })
    // at 3x the room is 2 frames wide
    expect(clampView({ scale: 3, x: -5, y: -5 })).toEqual({ scale: 3, x: -2, y: -2 })
  })

  it('zooming keeps the point under the focus where it is', () => {
    for (const focus of [{ x: 0.5, y: 0.5 }, { x: 0.3, y: 0.7 }, { x: 0.9, y: 0.1 }]) {
      const before = frameToBoard(IDENTITY, focus)
      const view = zoomAt(IDENTITY, 2.5, focus)
      closePoint(frameToBoard(view, focus), before)
    }
  })

  it('a focus near an edge is limited by the clamp instead of showing empty margin', () => {
    const view = zoomAt(IDENTITY, 2, { x: 0, y: 0 })
    expect(view).toEqual({ scale: 2, x: 0, y: 0 })
    const far = zoomAt(IDENTITY, 2, { x: 1, y: 1 })
    expect(far).toEqual({ scale: 2, x: -1, y: -1 })
  })

  it('zooming in around the middle transforms the pane accordingly', () => {
    const on = zoomed2x()
    expect(on).toEqual({ scale: 2, x: -0.5, y: -0.5 })
    expect(viewTransform(on)).toBe('translate(-50%, -50%) scale(2)')
  })

  it('boardToFrame and frameToBoard are inverses', () => {
    const view: View = { scale: 2.2, x: -0.4, y: -0.9 }
    const p = { x: 0.37, y: 0.61 }
    closePoint(frameToBoard(view, boardToFrame(view, p)), p)
  })
})

describe('hit-testing while zoomed', () => {
  it('at 1x a spot on the centre of a cell resolves to that cell', () => {
    for (const cell of [{ row: 0, col: 0 }, { row: 4, col: 5 }, { row: 8, col: 8 }]) {
      expect(cellAtFrame(IDENTITY, centerOf(cell))).toEqual(cell)
    }
  })

  it('at 2x the cell drawn under a spot is the one a tap there hits', () => {
    for (const view of [zoomed2x(), zoomAt(IDENTITY, 2, { x: 0.8, y: 0.2 }), panBy(zoomed2x(), 0.31, -0.17)]) {
      for (const cell of [{ row: 0, col: 0 }, { row: 3, col: 6 }, { row: 5, col: 2 }, { row: 8, col: 8 }]) {
        const shown = boardToFrame(view, centerOf(cell))
        // only cells that are on screen can be tapped
        if (shown.x < 0 || shown.x > 1 || shown.y < 0 || shown.y > 1) continue
        expect(cellAtFrame(view, shown)).toEqual(cell)
      }
    }
  })

  it('a cell is twice as big on screen at 2x', () => {
    const view = zoomed2x()
    const a = boardToFrame(view, centerOf({ row: 4, col: 4 }))
    const b = boardToFrame(view, centerOf({ row: 4, col: 5 }))
    close(b.x - a.x, (2 * geometry.cellSize) / geometry.viewBox.width)
  })

  it('the middle of the frame at 2x is the middle cell, as at 1x', () => {
    expect(cellAtFrame(zoomed2x(), { x: 0.5, y: 0.5 })).toEqual(cellAtFrame(IDENTITY, { x: 0.5, y: 0.5 }))
  })

  it('the edge of the frame at max pan is the edge cell', () => {
    const view = clampView({ scale: 2, x: -1, y: -1 })
    expect(cellAtFrame(view, { x: 0.95, y: 0.95 })).toEqual({ row: 8, col: 8 })
    const top = clampView({ scale: 2, x: 0, y: 0 })
    expect(cellAtFrame(top, { x: 0.5, y: 0.5 })).toEqual({ row: 1, col: 1 })
  })
})

describe('pinch', () => {
  const a: Point = { x: 0.4, y: 0.5 }
  const b: Point = { x: 0.6, y: 0.5 }

  it('fingers moving apart zoom in, the board point between them stays between them', () => {
    const base = { view: IDENTITY, a, b }
    const view = pinchView(base, { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 })
    close(view.scale, 2)
    closePoint(frameToBoard(view, { x: 0.5, y: 0.5 }), { x: 0.5, y: 0.5 })
  })

  it('fingers together zoom out and never below 1x', () => {
    const zoomed = zoomAt(IDENTITY, 2, { x: 0.5, y: 0.5 })
    expect(pinchView({ view: zoomed, a: { x: 0.3, y: 0.5 }, b: { x: 0.7, y: 0.5 } }, a, b).scale).toBeCloseTo(1, 9)
    expect(pinchView({ view: zoomed, a: { x: 0.1, y: 0.5 }, b: { x: 0.9, y: 0.5 } }, a, b)).toEqual(IDENTITY)
  })

  it('never beyond 3x', () => {
    expect(pinchView({ view: IDENTITY, a, b }, { x: 0, y: 0.5 }, { x: 1, y: 0.5 }).scale).toBe(MAX_SCALE)
  })

  it('moving both fingers together pans, clamped to the edges', () => {
    const start = zoomAt(IDENTITY, 2, { x: 0.5, y: 0.5 })
    const base = { view: start, a, b }
    const shifted = pinchView(base, { x: 0.3, y: 0.5 }, { x: 0.5, y: 0.5 })
    close(shifted.scale, 2)
    // fingers went left by 0.1: the board follows them
    close(shifted.x, start.x - 0.1)
    const far = pinchView(base, { x: -3, y: 0.5 }, { x: -2.8, y: 0.5 })
    close(far.x, -1)
    const other = pinchView(base, { x: 3, y: 0.5 }, { x: 3.2, y: 0.5 })
    close(other.x, 0)
  })

  it('the point under the fingers keeps its cell while zooming', () => {
    const tapAt = { x: 0.5, y: 0.5 }
    const before = cellAtFrame(IDENTITY, tapAt)
    const view = pinchView({ view: IDENTITY, a, b }, { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 })
    expect(cellAtFrame(view, tapAt)).toEqual(before)
  })

  it('uses the same units on both axes for a non-square frame', () => {
    const base = { view: IDENTITY, a: { x: 0.5, y: 0.4 }, b: { x: 0.5, y: 0.6 } }
    // a frame twice as tall as wide: a 0.1 vertical distance counts twice
    close(pinchView(base, { x: 0.5, y: 0.3 }, { x: 0.5, y: 0.7 }, 2).scale, 2)
  })

  it('does not blow up when both fingers start on the same spot', () => {
    expect(pinchView({ view: IDENTITY, a, b: a }, { x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 })).toEqual(IDENTITY)
  })
})

describe('two fingers versus one', () => {
  const at = (x: number, y = 0.5): Point => ({ x, y })
  const run = (events: FingerEvent[], view: View = IDENTITY) => {
    let state: FingerState = NO_FINGERS
    let current = view
    const steps = events.map((event) => {
      const step = fingerStep(state, event, current)
      state = step.state
      if (step.view) current = step.view
      return step
    })
    return { steps, view: current, state }
  }

  it('one finger is left to the cell gesture', () => {
    const { steps, view } = run([{ type: 'down', id: 1, at: at(0.5) }, { type: 'move', id: 1, at: at(0.6) }, { type: 'up', id: 1 }])
    expect(steps.map((s) => s.pinching)).toEqual([false, false, false])
    expect(steps.some((s) => s.cancelGesture)).toBe(false)
    expect(view).toEqual(IDENTITY)
  })

  it('the second finger cancels the cell gesture once and starts the pinch', () => {
    const { steps, view } = run([
      { type: 'down', id: 1, at: at(0.4) },
      { type: 'down', id: 2, at: at(0.6) },
      { type: 'move', id: 2, at: at(0.8) },
    ])
    expect(steps.map((s) => s.cancelGesture)).toEqual([false, true, false])
    expect(steps.map((s) => s.pinching)).toEqual([false, true, true])
    expect(view.scale).toBeGreaterThan(1.9)
  })

  it('the finger left after a pinch does nothing, and a new finger afterwards is a normal one', () => {
    const { steps, state } = run([
      { type: 'down', id: 1, at: at(0.4) },
      { type: 'down', id: 2, at: at(0.6) },
      { type: 'up', id: 2 },
      { type: 'move', id: 1, at: at(0.45) },
      { type: 'up', id: 1 },
      { type: 'down', id: 3, at: at(0.5) },
    ])
    expect(steps.map((s) => s.pinching)).toEqual([false, true, false, false, false, false])
    expect(steps[5]!.cancelGesture).toBe(false)
    expect(state.fingers).toHaveLength(1)
  })

  it('a pinch that starts on a zoomed board continues from the current view', () => {
    const start = zoomed2x()
    const { steps, view } = run(
      [
        { type: 'down', id: 1, at: at(0.4) },
        { type: 'down', id: 2, at: at(0.6) },
        { type: 'move', id: 1, at: at(0.4) },
      ],
      start,
    )
    expect(steps[2]!.view).toEqual(start)
    expect(view).toEqual(start)
  })

  it('a third finger does not jump the view; lifting one of the pair carries on from where it is', () => {
    const { steps } = run([
      { type: 'down', id: 1, at: at(0.4) },
      { type: 'down', id: 2, at: at(0.6) },
      { type: 'move', id: 2, at: at(0.7) },
      { type: 'down', id: 3, at: at(0.9) },
      { type: 'up', id: 3 },
      { type: 'move', id: 2, at: at(0.7) },
    ])
    expect(steps.at(-1)!.pinching).toBe(true)
    expect(steps.at(-1)!.view!.scale).toBeGreaterThanOrEqual(1)
  })
})

describe('reveal a hint', () => {
  it('a board at 1x already shows everything', () => {
    expect(revealBox(IDENTITY, { left: 0.8, top: 0.8, right: 0.9, bottom: 0.9 })).toEqual(IDENTITY)
  })

  it('pans the least that brings a hidden cell into view', () => {
    const view = clampView({ scale: 2, x: 0, y: 0 }) // top-left quarter shown
    const box = boxAroundCells(geometry, [{ row: 7, col: 7 }])!
    const next = revealBox(view, box)
    const shownRight = box.right * next.scale + next.x
    const shownBottom = box.bottom * next.scale + next.y
    expect(shownRight).toBeLessThanOrEqual(1 + 1e-9)
    expect(shownBottom).toBeLessThanOrEqual(1 + 1e-9)
    expect(box.left * next.scale + next.x).toBeGreaterThanOrEqual(0)
    // a cell already in view leaves the view alone
    expect(revealBox(view, boxAroundCells(geometry, [{ row: 1, col: 1 }])!)).toEqual(view)
  })

  it('a box larger than the frame is centred', () => {
    const view = clampView({ scale: 3, x: 0, y: 0 })
    const all = boxAroundCells(geometry, [{ row: 0, col: 0 }, { row: 8, col: 8 }])!
    const next = revealBox(view, all)
    close(((all.left + all.right) / 2) * next.scale + next.x, 0.5)
    close(((all.top + all.bottom) / 2) * next.scale + next.y, 0.5)
  })

  it('has no box for no cells', () => {
    expect(boxAroundCells(geometry, [])).toBeNull()
  })
})
