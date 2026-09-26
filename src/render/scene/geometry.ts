import type { Cell, Scene } from '../../engine/model/index.ts'

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
}

export interface GeometryOptions {
  axisLabels?: boolean
}

export function createGeometry(
  size: Pick<Scene, 'width' | 'height'>,
  options: GeometryOptions = {},
): SceneGeometry {
  const axisLabels = options.axisLabels ?? false
  const gutter = axisLabels ? AXIS_GUTTER : 0
  const origin: Point = { x: MARGIN + gutter, y: MARGIN + gutter }
  const cellRect = (cell: Cell): Rect => ({
    x: origin.x + cell.col * CELL_SIZE,
    y: origin.y + cell.row * CELL_SIZE,
    width: CELL_SIZE,
    height: CELL_SIZE,
  })
  return {
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
    toPoint: (x, y) => ({ x: origin.x + x * CELL_SIZE, y: origin.y + y * CELL_SIZE }),
  }
}

/** 1-based "r1c1" notation used by the official puzzles. */
export function cellLabel(cell: Cell): string {
  return `r${cell.row + 1}c${cell.col + 1}`
}
