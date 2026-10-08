import type { Cell } from '../../engine/model/index.ts'
import type { IconObjectType } from './types.ts'

/**
 * One footprint of an object type, in canonical orientation (facing south). `cells` are relative to the `cols` x `rows` box, 100 model
 * units per cell. What is drawn on it is the block model of `src/render/looks/`, one per type and footprint.
 */
export interface IconVariant {
  id: string
  cells: Cell[]
  cols: number
  rows: number
}

export interface IconDefinition {
  type: IconObjectType
  variants: IconVariant[]
}

type Size = readonly [cols: number, rows: number]

function rectCells(cols: number, rows: number): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) cells.push({ row, col })
  }
  return cells
}

/** Rectangular variants, one per size. */
function rects(sizes: readonly Size[]): IconVariant[] {
  return sizes.map(([cols, rows]) => ({ id: `${cols}x${rows}`, cells: rectCells(cols, rows), cols, rows }))
}

/** L shape: a row of `arm` cells on the north and a column of `arm` on the west. */
function lShape(arm: number): IconVariant {
  const cells: Cell[] = []
  for (let col = 0; col < arm; col++) cells.push({ row: 0, col })
  for (let row = 1; row < arm; row++) cells.push({ row, col: 0 })
  return { id: `L${arm}`, cells, cols: arm, rows: arm }
}

const one: readonly Size[] = [[1, 1]]
const bars: readonly Size[] = [
  [1, 1],
  [2, 1],
  [3, 1],
]
const blocks: readonly Size[] = [
  [1, 1],
  [2, 1],
  [2, 2],
]

/**
 * Every object type has at least one footprint. Rotations and mirrors of a
 * footprint are derived, so only one orientation is listed here.
 */
export const ICON_DEFINITIONS: Record<IconObjectType, IconDefinition> = {
  chair: { type: 'chair', variants: rects(one) },
  rug: { type: 'rug', variants: rects(blocks) },
  bed: {
    type: 'bed',
    variants: rects(
      [
        [1, 2],
        [2, 2],
      ]),
  },
  sofa: {
    type: 'sofa',
    variants: [
      ...rects(
        [
          [2, 1],
          [3, 1],
        ]),
      lShape(2),
      lShape(3),
    ],
  },
  car: { type: 'car', variants: rects([[1, 2]]) },
  oilSlick: { type: 'oilSlick', variants: rects(one) },
  framedPainting: { type: 'framedPainting', variants: rects(one) },
  table: { type: 'table', variants: rects(blocks) },
  tv: { type: 'tv', variants: rects(one) },
  plant: { type: 'plant', variants: rects(one) },
  bookshelf: {
    type: 'bookshelf',
    variants: rects(
      [
        [1, 1],
        [2, 1],
      ]),
  },
  chest: { type: 'chest', variants: rects(one) },
  tree: { type: 'tree', variants: rects(one) },
  flowers: { type: 'flowers', variants: rects(one) },
  easel: { type: 'easel', variants: rects(one) },
  statue: { type: 'statue', variants: rects(one) },
  washingMachine: { type: 'washingMachine', variants: rects(one) },
  dryer: { type: 'dryer', variants: rects(one) },
  cabinet: { type: 'cabinet', variants: rects(bars) },
  stairs: {
    type: 'stairs',
    variants: rects(
      [
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 2],
        [2, 3],
        [2, 4],
      ]),
  },
  toilet: { type: 'toilet', variants: rects(one) },
  sink: {
    type: 'sink',
    variants: rects(
      [
        [1, 1],
        [2, 1],
      ]),
  },
  shower: {
    type: 'shower',
    variants: rects(
      [
        [1, 1],
        [2, 2],
      ]),
  },
  desk: {
    type: 'desk',
    variants: rects(
      [
        [2, 1],
        [3, 1],
      ]),
  },
  wardrobe: { type: 'wardrobe', variants: rects([...bars, [2, 2]]) },
  diningTable: {
    type: 'diningTable',
    variants: rects(
      [
        [2, 1],
        [3, 1],
        [2, 2],
      ]),
  },
  kitchenCounter: { type: 'kitchenCounter', variants: rects(bars) },
  bicycle: { type: 'bicycle', variants: rects([[2, 1]]) },
  gardenTable: {
    type: 'gardenTable',
    variants: rects(
      [
        [1, 1],
        [2, 1],
        [2, 2],
      ]),
  },
  bench: {
    type: 'bench',
    variants: rects(
      [
        [2, 1],
        [3, 1],
      ]),
  },
}
