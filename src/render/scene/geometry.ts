import type { Cell, Scene } from '../../engine/model/index.ts'
import type { Look } from '../looks/look.ts'
import { headroom, ISO_X, ISO_Y } from '../looks/project.ts'

/**
 * Fixed drawing units. The SVG viewBox is expressed in these units and the
 * browser scales the whole drawing to its container.
 */
export const CELL_SIZE = 64
export const WALL_THICKNESS = 6
export const GRID_LINE_WIDTH = 1.5
/** Free space around the grid: room for the outer wall and the drop shadow. */
export const MARGIN = 12
/** Extra space on the top and left for the R1.. / C1.. axis labels. */
export const AXIS_GUTTER = 28

export interface Point {
  x: number
  y: number
}

export interface Rect extends Point {
  width: number
  height: number
}

export interface SceneGeometry {
  /** Grid size in cells. */
  columns: number
  rows: number
  cellSize: number
  /** Top-left corner of the grid inside the viewBox. */
  origin: Point
  viewBox: { width: number; height: number }
  axisLabels: boolean
  /** The square of one cell in viewBox units. */
  cellRect(cell: Cell): Rect
  cellCenter(cell: Cell): Point
  /** Grid-line coordinates (cell units, 0 = top/left border) to viewBox units. */
  toPoint(x: number, y: number): Point
  /** The look the geometry was made for. In 'a3' the flat drawing (cellRect, toPoint) is laid onto a diamond grid by `planeTransform`. */
  look: Look
  /** Where a point of the flat drawing ends up on screen. The identity unless the grid is a diamond ('a3'). */
  project(point: Point): Point
  /** SVG transform that lays the flat layers (floors, walls, hit squares, ...) onto the diamond grid; undefined for a square grid. */
  planeTransform: string | undefined
  /**
   * For things that must stand upright on screen (people, notes, labels): the same cells, but cellRect / cellCenter / toPoint are in screen
   * units, the squares centred on the projected cell centres and smaller where a diamond is lower than it is wide. Itself on a square grid.
   */
  upright: SceneGeometry
  /** Box around a cell as it shows on screen (a diamond's bounding box in 'a3'); the cell square otherwise. */
  cellBounds(cell: Cell): Rect
  /** Where the R / C axis label of a row or column goes. */
  axisPoint(axis: 'row' | 'col', index: number): Point
}

export interface GeometryOptions {
  axisLabels?: boolean
  /** Default 'now'. 'a2' only adds headroom above the grid for the blocks; 'a3' turns the grid into a diamond. */
  look?: Look
}

/** Size of the upright cell in 'a3' (screen units): a diamond cell is about 89 wide and 51 high. */
const ISO_UPRIGHT = { width: 66, height: 46, size: 50 }

export function createGeometry(
  size: Pick<Scene, 'width' | 'height'>,
  options: GeometryOptions = {},
): SceneGeometry {
  const axisLabels = options.axisLabels ?? false
  const look = options.look ?? 'now'
  const gutter = axisLabels ? AXIS_GUTTER : 0
  const top = headroom(look)
  const origin: Point = { x: MARGIN + gutter, y: MARGIN + gutter + top }
  const cellRect = (cell: Cell): Rect => ({
    x: origin.x + cell.col * CELL_SIZE,
    y: origin.y + cell.row * CELL_SIZE,
    width: CELL_SIZE,
    height: CELL_SIZE,
  })
  const toPoint = (x: number, y: number): Point => ({ x: origin.x + x * CELL_SIZE, y: origin.y + y * CELL_SIZE })
  const flat: SceneGeometry = {
    columns: size.width,
    rows: size.height,
    cellSize: CELL_SIZE,
    origin,
    viewBox: {
      width: origin.x + size.width * CELL_SIZE + MARGIN,
      height: origin.y + size.height * CELL_SIZE + MARGIN,
    },
    axisLabels,
    cellRect,
    cellCenter(cell) {
      const r = cellRect(cell)
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    },
    toPoint,
    look,
    project: (point) => point,
    planeTransform: undefined,
    upright: undefined as unknown as SceneGeometry, // set below
    cellBounds: cellRect,
    axisPoint: (axis, index) =>
      axis === 'row'
        ? { x: origin.x - 18, y: origin.y + (index + 0.5) * CELL_SIZE }
        : { x: origin.x + (index + 0.5) * CELL_SIZE, y: origin.y - 18 },
  }
  if (look !== 'a3') {
    flat.upright = flat
    return flat
  }

  // Diamond grid: screen = (X0 + (u - v) ISO_X, Y0 + (u + v) ISO_Y) for the grid point (u, v) in plane units from the grid's corner.
  const W = size.width * CELL_SIZE
  const H = size.height * CELL_SIZE
  const side = MARGIN + gutter
  const X0 = side + H * ISO_X
  const Y0 = MARGIN + top + (axisLabels ? AXIS_GUTTER / 2 : 0)
  const project = (p: Point): Point => {
    const u = p.x - origin.x
    const v = p.y - origin.y
    return { x: X0 + (u - v) * ISO_X, y: Y0 + (u + v) * ISO_Y }
  }
  const e = X0 - ISO_X * (origin.x - origin.y)
  const f = Y0 - ISO_Y * (origin.x + origin.y)
  const centre = (cell: Cell): Point => project(toPoint(cell.col + 0.5, cell.row + 0.5))
  const uprightRect = (cell: Cell): Rect => {
    const c = centre(cell)
    return { x: c.x - ISO_UPRIGHT.width / 2, y: c.y - ISO_UPRIGHT.height / 2, width: ISO_UPRIGHT.width, height: ISO_UPRIGHT.height }
  }
  const viewBox = { width: 2 * side + (W + H) * ISO_X, height: Y0 + (W + H) * ISO_Y + MARGIN }
  const base: SceneGeometry = {
    ...flat,
    viewBox,
    project,
    planeTransform: `matrix(${ISO_X} ${ISO_Y} ${-ISO_X} ${ISO_Y} ${e} ${f})`,
    cellBounds(cell) {
      const corners = [toPoint(cell.col, cell.row), toPoint(cell.col + 1, cell.row), toPoint(cell.col + 1, cell.row + 1), toPoint(cell.col, cell.row + 1)].map(project)
      const xs = corners.map((c) => c.x)
      const ys = corners.map((c) => c.y)
      return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
    },
    axisPoint: (axis, index) =>
      axis === 'row'
        ? project({ x: origin.x - 0.55 * CELL_SIZE, y: origin.y + (index + 0.5) * CELL_SIZE })
        : project({ x: origin.x + (index + 0.5) * CELL_SIZE, y: origin.y - 0.55 * CELL_SIZE }),
  }
  const upright: SceneGeometry = {
    ...base,
    cellSize: ISO_UPRIGHT.size,
    cellRect: uprightRect,
    cellCenter: centre,
    toPoint: (x, y) => project(toPoint(x, y)),
    project: (point) => point,
    planeTransform: undefined,
    cellBounds: uprightRect,
    upright: undefined as unknown as SceneGeometry, // set below
  }
  upright.upright = upright
  base.upright = upright
  return base
}

/** 1-based "r1c1" notation used by the official puzzles. */
export function cellLabel(cell: Cell): string {
  return `r${cell.row + 1}c${cell.col + 1}`
}
