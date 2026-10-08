import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Cell } from '../../engine/model/index.ts'
import {
  DEFAULT_GESTURE_CONFIG,
  gestureStep,
  IDLE,
  type GestureConfig,
  type GestureEffect,
  type GestureEvent,
  type GestureState,
} from './gesture.ts'

export interface GestureHandlers {
  onTap?: (cell: Cell) => void
  onLongPress?: (cell: Cell) => void
}

/**
 * Binds the pure gesture machine (gesture.ts) to pointer events.
 *
 * Pointer events, not touch or click: one code path for finger, Pencil and mouse. A press that
 * moves is a scroll or a swipe and sets nothing (SLAY-20): on an unzoomed board the browser may
 * scroll the page (`touch-action: pan-y`, see play.css) and then cancels the stream with
 * `pointercancel`, which the machine treats as nothing too. The wrapper also sets
 * `-webkit-touch-callout: none` / `user-select: none`, and we cancel `contextmenu`, so a long
 * press never opens Safari's callout or selects text. We take pointer capture so a press that
 * leaves the element keeps reporting, and look the cell up with `elementFromPoint`, because
 * with capture the event target is always the wrapper.
 *
 * `cellAt` maps a screen point to a cell (null = outside the grid). For a plain button, return
 * a constant cell to get tap versus long press.
 */
export function useGesture(
  cellAt: (x: number, y: number) => Cell | null,
  handlers: GestureHandlers,
  config: GestureConfig = DEFAULT_GESTURE_CONFIG,
) {
  const state = useRef<GestureState>(IDLE)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef({ handlers, cellAt })
  useEffect(() => {
    latest.current = { handlers, cellAt }
  })
  const [pressed, setPressed] = useState<Cell | null>(null)

  const clearTimer = () => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }

  const carryOut = useCallback((effects: GestureEffect[]) => {
    const h = latest.current.handlers
    for (const effect of effects) {
      switch (effect.type) {
        case 'tap': h.onTap?.(effect.cell); break
        case 'longPress': h.onLongPress?.(effect.cell); break
      }
    }
  }, [])

  const feed = useCallback(
    (event: GestureEvent) => {
      const step = gestureStep(state.current, event, config)
      state.current = step.state
      if (step.state.phase === 'pending') setPressed(step.state.cell)
      else setPressed(null)
      if (step.state.phase !== 'pending') clearTimer()
      carryOut(step.effects)
    },
    [carryOut, config],
  )

  useEffect(() => clearTimer, [])

  /** Abandons the gesture in progress (a second finger landed): no tap, no long press. */
  const cancel = useCallback(() => {
    const running = state.current
    if (running.phase !== 'idle') feed({ type: 'cancel', pointerId: running.pointerId })
  }, [feed])

  return {
    cancel,
    /** The cell under a finger that may still turn into a long press (for the press ring). */
    pressed,
    bind: {
      onPointerDown(e: ReactPointerEvent<HTMLElement>) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        const cell = latest.current.cellAt(e.clientX, e.clientY)
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* pointer already gone */
        }
        feed({ type: 'down', pointerId: e.pointerId, cell, x: e.clientX, y: e.clientY, at: performance.now() })
        if (state.current.phase === 'pending') {
          clearTimer()
          timer.current = setTimeout(() => feed({ type: 'timer', at: performance.now() }), config.longPressMs)
        }
      },
      onPointerMove(e: ReactPointerEvent<HTMLElement>) {
        if (state.current.phase === 'idle') return
        // Only the distance counts (past the slop the press is a scroll); the cell is not looked up.
        feed({ type: 'move', pointerId: e.pointerId, cell: null, x: e.clientX, y: e.clientY, at: performance.now() })
      },
      onPointerUp(e: ReactPointerEvent<HTMLElement>) {
        feed({ type: 'up', pointerId: e.pointerId, at: performance.now() })
      },
      onPointerCancel(e: ReactPointerEvent<HTMLElement>) {
        feed({ type: 'cancel', pointerId: e.pointerId })
      },
      /** Safari opens its callout / context menu on a long press; nothing here should. */
      onContextMenu(e: { preventDefault(): void }) {
        e.preventDefault()
      },
    },
  }
}

/** The grid cell of a screen point: the hit rect (data-row / data-col) SceneView draws on top. */
export function cellAtPoint(x: number, y: number): Cell | null {
  const el = document.elementFromPoint(x, y)?.closest('[data-row][data-col]')
  if (!el) return null
  const row = Number(el.getAttribute('data-row'))
  const col = Number(el.getAttribute('data-col'))
  return Number.isInteger(row) && Number.isInteger(col) ? { row, col } : null
}
