import type { Cell } from '../../engine/model/index.ts'
import type { SceneGeometry } from '../../render/scene/index.ts'

/**
 * Board zoom, as pure maths so it can be tested without a browser.
 *
 * The board is drawn once, in a frame that never moves; a pane inside the frame is scaled and shifted.
 * A `View` says how: a board point p (as a fraction 0..1 of the frame's width and height) shows at
 * `p * scale + (x, y)` (also fractions of the frame). At 1x the view is `IDENTITY`. Because
 * everything is a fraction of the frame, the state does not depend on the pixel size of the board
 * (rotation, resize) and pinch/ctrl+wheel need no measuring.
 *
 * Two rules hold for every view this module returns: the scale is within 1x..3x and the pane covers
 * the whole frame (pan is clamped to the board edges, no empty margin appears).
 */

export interface View {
  scale: number
  /** Shift of the pane's top-left corner, in fractions of the frame; 0 or negative. */
  x: number
  y: number
}

/** A point as a fraction of the frame: (0, 0) top-left, (1, 1) bottom-right. */
export interface Point {
  x: number
  y: number
}

export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

export const MIN_SCALE = 1
export const MAX_SCALE = 3
export const IDENTITY: View = { scale: 1, x: 0, y: 0 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const clampScale = (scale: number): number => (Number.isFinite(scale) ? clamp(scale, MIN_SCALE, MAX_SCALE) : MIN_SCALE)

/** Keeps the scale in range and the pane over the frame. */
export function clampView(view: View): View {
  const scale = clampScale(view.scale)
  if (scale === MIN_SCALE) return IDENTITY
  return {
    scale,
    x: clamp(Number.isFinite(view.x) ? view.x : 0, 1 - scale, 0),
    y: clamp(Number.isFinite(view.y) ? view.y : 0, 1 - scale, 0),
  }
}

export const isZoomed = (view: View): boolean => view.scale > MIN_SCALE + 1e-6

/** Where a board point shows in the frame. */
export const boardToFrame = (view: View, p: Point): Point => ({ x: p.x * view.scale + view.x, y: p.y * view.scale + view.y })

/** Which board point sits under a spot of the frame: the mapping that keeps taps on the right square. */
export const frameToBoard = (view: View, p: Point): Point => ({ x: (p.x - view.x) / view.scale, y: (p.y - view.y) / view.scale })

/** The view with `scale`, keeping the board point under `focus` (a frame point) where it is. */
export function zoomAt(view: View, scale: number, focus: Point): View {
  const next = clampScale(scale)
  const under = frameToBoard(view, focus)
  return clampView({ scale: next, x: focus.x - under.x * next, y: focus.y - under.y * next })
}

/** Shifts the view by a frame distance (a drag or a scroll wheel). */
export const panBy = (view: View, dx: number, dy: number): View => clampView({ ...view, x: view.x + dx, y: view.y + dy })

/** Two fingers as they were when the pinch (re)started, with the view they started from. */
export interface PinchBase {
  view: View
  a: Point
  b: Point
}

const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * The view for two fingers now at `a` and `b`. The board point that was between the fingers when the
 * pinch began stays between them (pan), and the scale follows how far they moved apart or together.
 * `aspect` is frame height over width, so a distance is measured in equal units on both axes.
 */
export function pinchView(base: PinchBase, a: Point, b: Point, aspect = 1): View {
  const dist = (p: Point, q: Point) => Math.hypot(p.x - q.x, (p.y - q.y) * aspect)
  const startDistance = dist(base.a, base.b)
  const ratio = startDistance < 1e-6 ? 1 : dist(a, b) / startDistance
  const scale = clampScale(base.view.scale * ratio)
  const anchor = frameToBoard(base.view, mid(base.a, base.b))
  const now = mid(a, b)
  return clampView({ scale, x: now.x - anchor.x * scale, y: now.y - anchor.y * scale })
}

/**
 * Pans the least that brings a board box (fractions of the board) into the frame; a box bigger than
 * the frame is centred. A view at 1x already shows everything and stays.
 */
export function revealBox(view: View, box: Box): View {
  if (!isZoomed(view)) return view
  const axis = (lo: number, hi: number, shift: number): number => {
    const shown = { lo: lo * view.scale + shift, hi: hi * view.scale + shift }
    if (shown.hi - shown.lo >= 1) return 0.5 - ((lo + hi) / 2) * view.scale
    if (shown.lo < 0) return shift - shown.lo
    if (shown.hi > 1) return shift - (shown.hi - 1)
    return shift
  }
  return clampView({ scale: view.scale, x: axis(box.left, box.right, view.x), y: axis(box.top, box.bottom, view.y) })
}

/** The smallest box (fractions of the drawing) around some cells, or null when there are none. */
export function boxAroundCells(geometry: SceneGeometry, cells: readonly Cell[]): Box | null {
  if (cells.length === 0) return null
  const { width, height } = geometry.viewBox
  const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
  for (const cell of cells) {
    const r = geometry.cellBounds(cell)
    box.left = Math.min(box.left, r.x / width)
    box.top = Math.min(box.top, r.y / height)
    box.right = Math.max(box.right, (r.x + r.width) / width)
    box.bottom = Math.max(box.bottom, (r.y + r.height) / height)
  }
  return box
}

/** CSS transform of the pane for a view (percentages are of the pane, which is as big as the frame). */
export const viewTransform = (view: View): string =>
  isZoomed(view) ? `translate(${view.x * 100}%, ${view.y * 100}%) scale(${view.scale})` : 'none'

/* ---- fingers ------------------------------------------------------------------------------ */

/**
 * Which fingers are down and what they mean. One finger belongs to the cell gestures (gesture.ts);
 * the moment a second one lands, the cell gesture is cancelled and the two fingers pinch and pan
 * until only one is left. That last finger does nothing until it lifts, so a pinch never ends in
 * a stray tap.
 */
export interface FingerState {
  /** In the order they landed. */
  fingers: readonly { id: number; at: Point }[]
  base: PinchBase | null
}

export const NO_FINGERS: FingerState = { fingers: [], base: null }

export type FingerEvent =
  | { type: 'down'; id: number; at: Point }
  | { type: 'move'; id: number; at: Point }
  | { type: 'up'; id: number }

export interface FingerStep {
  state: FingerState
  /** Two or more fingers are down: cell gestures must not start or continue. */
  pinching: boolean
  /** A second finger just landed: abandon the cell gesture in progress. */
  cancelGesture: boolean
  /** New view to show, when the fingers changed it. */
  view: View | null
}

const rebase = (fingers: FingerState['fingers'], view: View): PinchBase | null =>
  fingers.length >= 2 ? { view, a: fingers[0]!.at, b: fingers[1]!.at } : null

export function fingerStep(state: FingerState, event: FingerEvent, view: View, aspect = 1): FingerStep {
  switch (event.type) {
    case 'down': {
      const fingers = [...state.fingers.filter((f) => f.id !== event.id), { id: event.id, at: event.at }]
      const base = fingers.length >= 2 && !state.base ? rebase(fingers, view) : state.base
      return { state: { fingers, base }, pinching: fingers.length >= 2, cancelGesture: fingers.length >= 2, view: null }
    }
    case 'move': {
      if (!state.fingers.some((f) => f.id === event.id)) return { state, pinching: state.fingers.length >= 2, cancelGesture: false, view: null }
      const fingers = state.fingers.map((f) => (f.id === event.id ? { id: f.id, at: event.at } : f))
      if (!state.base || fingers.length < 2) return { state: { fingers, base: state.base }, pinching: false, cancelGesture: false, view: null }
      return {
        state: { fingers, base: state.base },
        pinching: true,
        cancelGesture: false,
        view: pinchView(state.base, fingers[0]!.at, fingers[1]!.at, aspect),
      }
    }
    case 'up': {
      const fingers = state.fingers.filter((f) => f.id !== event.id)
      // Two fingers left of three: carry on from where the view is now, without a jump.
      return { state: { fingers, base: rebase(fingers, view) }, pinching: fingers.length >= 2, cancelGesture: false, view: null }
    }
  }
}
