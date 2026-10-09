import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GESTURE_CONFIG as cfg,
  gestureStep,
  IDLE,
  type GestureEffect,
  type GestureEvent,
  type GestureState,
} from './gesture.ts'

const c = (row: number, col: number) => ({ row, col })

/** Feeds events one by one, collecting every effect. */
function run(events: GestureEvent[]): { state: GestureState; effects: GestureEffect[] } {
  let state: GestureState = IDLE
  const effects: GestureEffect[] = []
  for (const event of events) {
    const step = gestureStep(state, event, cfg)
    state = step.state
    effects.push(...step.effects)
  }
  return { state, effects }
}

const down = (cell: ReturnType<typeof c> | null, x = 100, y = 100, at = 0, pointerId = 1): GestureEvent => ({
  type: 'down', pointerId, cell, x, y, at,
})
const move = (cell: ReturnType<typeof c> | null, x: number, y: number, at = 50, pointerId = 1): GestureEvent => ({
  type: 'move', pointerId, cell, x, y, at,
})
const up = (at = 100, pointerId = 1): GestureEvent => ({ type: 'up', pointerId, at })
const timer = (at: number): GestureEvent => ({ type: 'timer', at })

describe('tap', () => {
  it('a quick press and release taps the cell', () => {
    expect(run([down(c(2, 3)), up(120)]).effects).toEqual([{ type: 'tap', cell: c(2, 3) }])
  })

  it('a wobble inside the slop is still a tap', () => {
    const { effects } = run([down(c(2, 3)), move(c(2, 3), 104, 106), up(150)])
    expect(effects).toEqual([{ type: 'tap', cell: c(2, 3) }])
  })

  it('a press outside the grid does nothing', () => {
    expect(run([down(null), up()])).toEqual({ state: IDLE, effects: [] })
  })

  it('a timer that fires too early changes nothing', () => {
    const { effects, state } = run([down(c(0, 0)), timer(cfg.longPressMs - 1)])
    expect(effects).toEqual([])
    expect(state.phase).toBe('pending')
  })
})

describe('long press', () => {
  it('fires while the finger is still down, once, and the release adds nothing', () => {
    const { effects, state } = run([down(c(1, 1)), timer(cfg.longPressMs), timer(cfg.longPressMs + 50), up(900)])
    expect(effects).toEqual([{ type: 'longPress', cell: c(1, 1) }])
    expect(state).toEqual(IDLE)
  })

  it('counts on release when the timer never ran', () => {
    expect(run([down(c(1, 1)), up(cfg.longPressMs + 10)]).effects).toEqual([{ type: 'longPress', cell: c(1, 1) }])
  })

  it('does not fire after the finger moved away', () => {
    const { effects } = run([down(c(1, 1)), move(c(1, 2), 180, 100), timer(cfg.longPressMs), up(900)])
    expect(effects.some((e) => e.type === 'longPress')).toBe(false)
  })

  it('a wobble inside the slop does not cancel the long press', () => {
    const { effects } = run([down(c(1, 1)), move(c(1, 1), 105, 104), timer(cfg.longPressMs)])
    expect(effects).toEqual([{ type: 'longPress', cell: c(1, 1) }])
  })
})

describe('no multi-square swipe (SLAY-20)', () => {
  it('a swipe across several squares does nothing, on press, on every move and on release', () => {
    const { effects, state } = run([down(c(0, 0)), move(c(0, 0), 115, 100), move(c(0, 1), 180, 100), move(c(0, 2), 250, 100), up()])
    expect(effects).toEqual([])
    expect(state).toEqual(IDLE)
  })

  it('a move past the slop inside the first square does nothing either', () => {
    expect(run([down(c(0, 0)), move(c(0, 0), 130, 100), up()]).effects).toEqual([])
  })

  it('a fast vertical scroll over the board sets nothing, also when it is held past the long-press time', () => {
    const { effects } = run([down(c(0, 0)), move(c(4, 0), 100, 400), timer(cfg.longPressMs), move(null, 100, 900), up(cfg.longPressMs + 300)])
    expect(effects).toEqual([])
  })

  it('a cancelled swipe (the browser took it as a scroll) does nothing', () => {
    const { effects, state } = run([down(c(0, 0)), move(c(0, 1), 180, 100), { type: 'cancel', pointerId: 1 }])
    expect(effects).toEqual([])
    expect(state).toEqual(IDLE)
  })

  it('a new tap after a swipe works as before', () => {
    const { effects } = run([down(c(0, 0)), move(c(0, 3), 400, 100), up(), down(c(2, 2), 100, 100, 200), up(260)])
    expect(effects).toEqual([{ type: 'tap', cell: c(2, 2) }])
  })
})

describe('several fingers', () => {
  it('a second finger cancels a pending gesture', () => {
    const { effects, state } = run([down(c(0, 0)), down(c(3, 3), 300, 300, 10, 2), up(20, 1), up(30, 2)])
    expect(effects).toEqual([])
    expect(state).toEqual(IDLE)
  })

  it('a second finger after a swipe sets nothing', () => {
    const { effects } = run([down(c(0, 0)), move(c(0, 1), 180, 100), down(c(4, 4), 400, 400, 60, 2), up(80, 2), up(90, 1)])
    expect(effects).toEqual([])
  })

  it('events of other pointers are ignored', () => {
    const { effects } = run([down(c(0, 0)), move(c(5, 5), 900, 900, 20, 2), up(30, 2), up(40, 1)])
    expect(effects).toEqual([{ type: 'tap', cell: c(0, 0) }])
  })
})
