import { useEffect, useRef, type Dispatch, type PointerEvent as ReactPointerEvent, type RefObject, type SetStateAction } from 'react'
import { fingerStep, NO_FINGERS, isZoomed, panBy, zoomAt, type FingerEvent, type FingerState, type View } from './zoom.ts'

/**
 * Two-finger pinch and pan of the board, next to the one-finger cell gestures (useGesture.ts).
 *
 * Only touch and pen pointers count as fingers; a mouse never pinches (it pans and zooms with the
 * wheel instead, see below). Each handler returns true while two or more fingers are down: the
 * caller then keeps the event away from the cell gesture. `cancelGesture` runs once, when the second
 * finger lands, so a pending tap or long press never fires.
 *
 * The pointer position is turned into a fraction of the frame (the element that carries these
 * handlers and never moves), so the maths in zoom.ts stays free of pixels.
 *
 * Wheel: ctrl + wheel (a trackpad pinch) zooms around the pointer; a plain wheel pans a zoomed board.
 */
export function useBoardZoom(
  frame: RefObject<HTMLElement | null>,
  view: View,
  setView: Dispatch<SetStateAction<View>>,
  cancelGesture: () => void,
) {
  const fingers = useRef<FingerState>(NO_FINGERS)
  const latest = useRef({ view, cancelGesture })
  useEffect(() => {
    latest.current = { view, cancelGesture }
  })

  const feed = (e: ReactPointerEvent<HTMLElement>, event: (at: { x: number; y: number }) => FingerEvent): boolean => {
    if (e.pointerType === 'mouse') return false
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false
    const at = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
    // A `view` the pinch just set may not be rendered yet: the ref holds the last committed one,
    // which is what the pinch base wants when a finger lands or lifts.
    const step = fingerStep(fingers.current, event(at), latest.current.view, rect.height / rect.width)
    fingers.current = step.state
    if (step.cancelGesture) latest.current.cancelGesture()
    if (step.view) setView(step.view)
    return step.pinching
  }

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !isZoomed(latest.current.view)) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      e.preventDefault()
      if (e.ctrlKey) {
        const focus = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
        setView((v) => zoomAt(v, v.scale * Math.exp(-e.deltaY * 0.01), focus))
      } else {
        setView((v) => panBy(v, -e.deltaX / rect.width, -e.deltaY / rect.height))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [frame, setView])

  return {
    /** Every handler answers: are two or more fingers down (so the cell gesture stays out)? */
    bind: {
      onPointerDown(e: ReactPointerEvent<HTMLElement>): boolean {
        const pinching = feed(e, (at) => ({ type: 'down', id: e.pointerId, at }))
        if (pinching) {
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* pointer already gone */
          }
        }
        return pinching
      },
      onPointerMove: (e: ReactPointerEvent<HTMLElement>): boolean => feed(e, (at) => ({ type: 'move', id: e.pointerId, at })),
      onPointerUp: (e: ReactPointerEvent<HTMLElement>): boolean => feed(e, () => ({ type: 'up', id: e.pointerId })),
      onPointerCancel: (e: ReactPointerEvent<HTMLElement>): boolean => feed(e, () => ({ type: 'up', id: e.pointerId })),
    },
  }
}
