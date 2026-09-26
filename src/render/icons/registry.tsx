import type { ReactNode } from 'react'
import type { Cell } from '../../engine/model/index.ts'
import * as house from './art/house.tsx'
import * as living from './art/living.tsx'
import * as outdoor from './art/outdoor.tsx'
import type { IconObjectType } from './types.ts'

/**
 * One drawable footprint of an object type, in canonical orientation
 * (facing south). `cells` are relative to the `cols` x `rows` box; the art
 * is drawn in that box with 100 units per cell.
 */
export interface IconVariant {
  id: string
  cells: Cell[]
  cols: number
  rows: number
  draw: () => ReactNode
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

/** Rectangular variants, one per size, all drawn by the same function. */
function rects(sizes: readonly Size[], draw: (cols: number, rows: number) => ReactNode): IconVariant[] {
  return sizes.map(([cols, rows]) => ({
    id: `${cols}x${rows}`,
    cells: rectCells(cols, rows),
    cols,
    rows,
    draw: () => draw(cols, rows),
  }))
}

/** L shape: a row of `arm` cells on the north and a column of `arm` on the west. */
function lShape(arm: number): IconVariant {
  const cells: Cell[] = []
  for (let col = 0; col < arm; col++) cells.push({ row: 0, col })
  for (let row = 1; row < arm; row++) cells.push({ row, col: 0 })
  return { id: `L${arm}`, cells, cols: arm, rows: arm, draw: () => living.sofaL(arm) }
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
  chair: { type: 'chair', variants: rects(one, living.chair) },
  rug: { type: 'rug', variants: rects(blocks, living.rug) },
  bed: {
    type: 'bed',
    variants: rects(
      [
        [1, 2],
        [2, 2],
      ],
      living.bed,
    ),
  },
  sofa: {
    type: 'sofa',
    variants: [
      ...rects(
        [
          [2, 1],
          [3, 1],
        ],
        living.sofa,
      ),
      lShape(2),
      lShape(3),
    ],
  },
  car: { type: 'car', variants: rects([[1, 2]], outdoor.car) },
  oilSlick: { type: 'oilSlick', variants: rects(one, outdoor.oilSlick) },
  framedPainting: { type: 'framedPainting', variants: rects(one, living.framedPainting) },
  table: { type: 'table', variants: rects(blocks, living.table) },
  tv: { type: 'tv', variants: rects(one, living.tv) },
  plant: { type: 'plant', variants: rects(one, outdoor.plant) },
  bookshelf: {
    type: 'bookshelf',
    variants: rects(
      [
        [1, 1],
        [2, 1],
      ],
      living.bookshelf,
    ),
  },
  chest: { type: 'chest', variants: rects(one, living.chest) },
  tree: { type: 'tree', variants: rects(one, outdoor.tree) },
  flowers: { type: 'flowers', variants: rects(one, outdoor.flowers) },
  easel: { type: 'easel', variants: rects(one, outdoor.easel) },
  statue: { type: 'statue', variants: rects(one, outdoor.statue) },
  washingMachine: { type: 'washingMachine', variants: rects(one, house.washingMachine) },
  dryer: { type: 'dryer', variants: rects(one, house.dryer) },
  cabinet: { type: 'cabinet', variants: rects(bars, living.cabinet) },
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
      ],
      house.stairs,
    ),
  },
  toilet: { type: 'toilet', variants: rects(one, house.toilet) },
  sink: {
    type: 'sink',
    variants: rects(
      [
        [1, 1],
        [2, 1],
      ],
      house.sink,
    ),
  },
  shower: {
    type: 'shower',
    variants: rects(
      [
        [1, 1],
        [2, 2],
      ],
      house.shower,
    ),
  },
  desk: {
    type: 'desk',
    variants: rects(
      [
        [2, 1],
        [3, 1],
      ],
      living.desk,
    ),
  },
  wardrobe: { type: 'wardrobe', variants: rects([...bars, [2, 2]], living.wardrobe) },
  diningTable: {
    type: 'diningTable',
    variants: rects(
      [
        [2, 1],
        [3, 1],
        [2, 2],
      ],
      living.diningTable,
    ),
  },
  kitchenCounter: { type: 'kitchenCounter', variants: rects(bars, house.kitchenCounter) },
  bicycle: { type: 'bicycle', variants: rects([[2, 1]], house.bicycle) },
  gardenTable: {
    type: 'gardenTable',
    variants: rects(
      [
        [1, 1],
        [2, 1],
        [2, 2],
      ],
      outdoor.gardenTable,
    ),
  },
  bench: {
    type: 'bench',
    variants: rects(
      [
        [2, 1],
        [3, 1],
      ],
      outdoor.bench,
    ),
  },
}
