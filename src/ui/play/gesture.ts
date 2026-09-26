import type { Cell } from '../../engine/model/index.ts'

/**
 * Touch gesture logic of the board, as a pure state machine so it can be tested without a
 * browser. The UI feeds it pointer events (already mapped to grid cells) and a timer tick,
 * and carries out the effects it returns.
 *
 * - quick press and release on a cell: `tap`
 * - press held still for `longPressMs`: `longPress` (fires while the finger is still down)
 * - press, then move more than `slopPx` before the long press fired: painting. `paintStart`
 *   for the first cell, then `paintEnter` for every cell the finger enters (cells skipped by
 *   a fast move are filled in), `paintEnd` on release.
 *
 * Only one pointer counts. A second finger cancels the running gesture (pinch or palm), so
 * it can never paint by accident.
 */

export interface GestureConfig {
  /** How long a press must stay put to count as a long press. */
  longPressMs: number
  /** How far (px) the pointer may wander before a press turns into a drag. */
  slopPx: number
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = { longPressMs: 450, slopPx: 10 }

export type GestureState =
  | { phase: 'idle' }
  | { phase: 'pending'; pointerId: number; cell: Cell; x: number; y: number; startedAt: number }
  | { phase: 'painting'; pointerId: number; last: Cell }
  /** The long press fired; the release that follows does nothing. */
  | { phase: 'held'; pointerId: number }

export type GestureEvent =
  /** `cell` is the grid cell under the pointer, null outside the grid. */
  | { type: 'down'; pointerId: number; cell: Cell | null; x: number; y: number; at: number }
  | { type: 'move'; pointerId: number; cell: Cell | null; x: number; y: number; at: number }
  | { type: 'up'; pointerId: number; at: number }
  | { type: 'cancel'; pointerId: number }
  /** The long-press timer went off. */
  | { type: 'timer'; at: number }

export type GestureEffect =
  | { type: 'tap'; cell: Cell }
  | { type: 'longPress'; cell: Cell }
  | { type: 'paintStart'; cell: Cell }
  | { type: 'paintEnter'; cell: Cell }
  | { type: 'paintEnd' }

export interface GestureStep {
  state: GestureState
  effects: GestureEffect[]
}

export const IDLE: GestureState = { phase: 'idle' }

const same = (a: Cell, b: Cell): boolean => a.row === b.row && a.col === b.col

/** Cells on the straight line from `from` (excluded) to `to` (included), walking one cell at a time. */
export function cellsBetween(from: Cell, to: Cell): Cell[] {
  const cells: Cell[] = []
  let { row, col } = from
  const dRow = Math.abs(to.row - row)
  const dCol = Math.abs(to.col - col)
  const stepRow = row < to.row ? 1 : -1
  const stepCol = col < to.col ? 1 : -1
  let err = dCol - dRow
  while (row !== to.row || col !== to.col) {
    const doubled = 2 * err
    if (doubled > -dRow) {
      err -= dRow
      col += stepCol
    }
    if (doubled < dCol) {
      err += dCol
      row += stepRow
    }
    cells.push({ row, col })
  }
  return cells
}

const done = (state: GestureState, ...effects: GestureEffect[]): GestureStep => ({ state, effects })

export function gestureStep(
  state: GestureState,
  event: GestureEvent,
  config: GestureConfig = DEFAULT_GESTURE_CONFIG,
): GestureStep {
  switch (event.type) {
    case 'down': {
      if (state.phase !== 'idle') {
        // A second pointer: abandon the gesture in progress.
        return state.pointerId === event.pointerId
          ? done(state)
          : done(IDLE, ...(state.phase === 'painting' ? [{ type: 'paintEnd' } as const] : []))
      }
      if (!event.cell) return done(IDLE)
      return done({
        phase: 'pending',
        pointerId: event.pointerId,
        cell: event.cell,
        x: event.x,
        y: event.y,
        startedAt: event.at,
      })
    }
    case 'timer': {
      if (state.phase !== 'pending' || event.at - state.startedAt < config.longPressMs) return done(state)
      return done({ phase: 'held', pointerId: state.pointerId }, { type: 'longPress', cell: state.cell })
    }
    case 'move': {
      if (state.phase === 'pending' && state.pointerId === event.pointerId) {
        const far = Math.hypot(event.x - state.x, event.y - state.y) > config.slopPx
        if (!far) return done(state)
        const effects: GestureEffect[] = [{ type: 'paintStart', cell: state.cell }]
        let last = state.cell
        if (event.cell && !same(event.cell, state.cell)) {
          for (const cell of cellsBetween(state.cell, event.cell)) effects.push({ type: 'paintEnter', cell })
          last = event.cell
        }
        return done({ phase: 'painting', pointerId: event.pointerId, last }, ...effects)
      }
      if (state.phase === 'painting' && state.pointerId === event.pointerId && event.cell && !same(event.cell, state.last)) {
        return done(
          { ...state, last: event.cell },
          ...cellsBetween(state.last, event.cell).map((cell) => ({ type: 'paintEnter', cell }) as const),
        )
      }
      return done(state)
    }
    case 'up': {
      if (state.phase === 'idle' || state.pointerId !== event.pointerId) return done(state)
      if (state.phase === 'painting') return done(IDLE, { type: 'paintEnd' })
      if (state.phase === 'held') return done(IDLE)
      // A press that outlived the timer (a throttled tab) still counts as a long press.
      return event.at - state.startedAt >= config.longPressMs
        ? done(IDLE, { type: 'longPress', cell: state.cell })
        : done(IDLE, { type: 'tap', cell: state.cell })
    }
    case 'cancel': {
      if (state.phase === 'idle' || state.pointerId !== event.pointerId) return done(state)
      return done(IDLE, ...(state.phase === 'painting' ? [{ type: 'paintEnd' } as const] : []))
    }
  }
}
