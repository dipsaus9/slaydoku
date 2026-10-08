import type { Cell } from '../../engine/model/index.ts'

/**
 * Touch gesture logic of the board, as a pure state machine so it can be tested without a
 * browser. The UI feeds it pointer events (already mapped to grid cells) and a timer tick,
 * and carries out the effects it returns.
 *
 * - quick press and release on a cell: `tap`
 * - press held still for `longPressMs`: `longPress` (fires while the finger is still down)
 * - press, then move more than `slopPx` before the long press fired: nothing. A swipe or a
 *   scroll over the board never sets a note or a cross (SLAY-20, owner: an accidental scroll on
 *   a phone used to paint a row of notes); the multi-square drag is gone, one press is one square.
 *
 * Only one pointer counts. A second finger cancels the running gesture (pinch or palm).
 */

export interface GestureConfig {
  /** How long a press must stay put to count as a long press. */
  longPressMs: number
  /** How far (px) the pointer may wander before a press stops counting as a tap or long press. */
  slopPx: number
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = { longPressMs: 450, slopPx: 10 }

export type GestureState =
  | { phase: 'idle' }
  | { phase: 'pending'; pointerId: number; cell: Cell; x: number; y: number; startedAt: number }
  /** The long press fired; the release that follows does nothing. */
  | { phase: 'held'; pointerId: number }
  /** The pointer moved past the slop: a scroll or a swipe. Its release does nothing. */
  | { phase: 'moved'; pointerId: number }

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

export interface GestureStep {
  state: GestureState
  effects: GestureEffect[]
}

export const IDLE: GestureState = { phase: 'idle' }

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
        return state.pointerId === event.pointerId ? done(state) : done(IDLE)
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
      if (state.phase !== 'pending' || state.pointerId !== event.pointerId) return done(state)
      const far = Math.hypot(event.x - state.x, event.y - state.y) > config.slopPx
      return far ? done({ phase: 'moved', pointerId: event.pointerId }) : done(state)
    }
    case 'up': {
      if (state.phase === 'idle' || state.pointerId !== event.pointerId) return done(state)
      if (state.phase !== 'pending') return done(IDLE)
      // A press that outlived the timer (a throttled tab) still counts as a long press.
      return event.at - state.startedAt >= config.longPressMs
        ? done(IDLE, { type: 'longPress', cell: state.cell })
        : done(IDLE, { type: 'tap', cell: state.cell })
    }
    case 'cancel': {
      if (state.phase === 'idle' || state.pointerId !== event.pointerId) return done(state)
      return done(IDLE)
    }
  }
}
