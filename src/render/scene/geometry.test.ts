import { describe, expect, it } from 'vitest'
import { tutorialPuzzle } from '../../engine/model/tutorial.fixture.ts'
import { edgeFeatureSpots } from './edgeFeatures.ts'
import {
  AXIS_GUTTER,
  CELL_SIZE,
  MARGIN,
  cellLabel,
  createGeometry,
} from './geometry.ts'
import { roomLabelLayout } from './labels.ts'
import { resolveRoomStyles, styleForName } from './roomStyles.ts'
import { sample9x9 } from './sample.fixture.ts'

const tutorial = tutorialPuzzle.scene

describe('createGeometry', () => {
  it('lays cells out on a square lattice without gaps', () => {
    const g = createGeometry({ width: 6, height: 4 })
    const a = g.cellRect({ row: 0, col: 0 })
    const b = g.cellRect({ row: 3, col: 5 })
    expect(a).toEqual({ x: MARGIN, y: MARGIN, width: CELL_SIZE, height: CELL_SIZE })
    expect(b.x).toBe(MARGIN + 5 * CELL_SIZE)
    expect(b.y).toBe(MARGIN + 3 * CELL_SIZE)
    expect(g.viewBox).toEqual({ width: 2 * MARGIN + 6 * CELL_SIZE, height: 2 * MARGIN + 4 * CELL_SIZE })
  })

  it('reserves a gutter for axis labels only when asked', () => {
    const plain = createGeometry({ width: 4, height: 4 })
    const axis = createGeometry({ width: 4, height: 4 }, { axisLabels: true })
    expect(axis.origin.x - plain.origin.x).toBe(AXIS_GUTTER)
    expect(axis.viewBox.width - plain.viewBox.width).toBe(AXIS_GUTTER)
  })

  it('centres a cell', () => {
    const g = createGeometry({ width: 4, height: 4 })
    expect(g.cellCenter({ row: 1, col: 2 })).toEqual({
      x: MARGIN + 2.5 * CELL_SIZE,
      y: MARGIN + 1.5 * CELL_SIZE,
    })
  })

  it('formats 1-based cell labels', () => {
    expect(cellLabel({ row: 0, col: 0 })).toBe('r1c1')
    expect(cellLabel({ row: 3, col: 8 })).toBe('r4c9')
  })
})

describe('edgeFeatureSpots', () => {
  it('places the tutorial window on the east border of r3c4', () => {
    const g = createGeometry(tutorial)
    const [spot, ...rest] = edgeFeatureSpots(tutorial, g)
    expect(rest).toEqual([])
    expect(spot).toMatchObject({
      kind: 'window',
      rotation: 90,
      x: MARGIN + 4 * CELL_SIZE,
      y: MARGIN + 2.5 * CELL_SIZE,
    })
  })

  it('draws a feature written from both neighbours once', () => {
    const scene = {
      ...sample9x9,
      edgeFeatures: [
        { kind: 'door' as const, cell: { row: 4, col: 3 }, side: 'south' as const },
        { kind: 'door' as const, cell: { row: 5, col: 3 }, side: 'north' as const },
      ],
    }
    expect(edgeFeatureSpots(scene, createGeometry(scene))).toHaveLength(1)
  })

  it('puts horizontal-line features at rotation 0 on the line between the rows', () => {
    const g = createGeometry(sample9x9)
    const door = edgeFeatureSpots(sample9x9, g).find((s) => s.kind === 'door')
    expect(door).toMatchObject({ rotation: 0, x: MARGIN + 3.5 * CELL_SIZE, y: MARGIN + 5 * CELL_SIZE })
  })
})

describe('roomLabelLayout', () => {
  it('puts every label inside its own room', () => {
    for (const scene of [tutorial, sample9x9]) {
      for (const room of scene.rooms) {
        const label = roomLabelLayout(scene, room.id)
        expect(label).toBeDefined()
        if (!label) continue
        const { row, fromCol, toCol } = label.run
        for (let col = fromCol; col <= toCol; col++) {
          expect(scene.cellRooms[row]?.[col]).toBe(room.id)
        }
        // pill stays within the run of cells
        expect(label.center.x - label.width / 2).toBeGreaterThanOrEqual(fromCol)
        expect(label.center.x + label.width / 2).toBeLessThanOrEqual(toCol + 1)
      }
    }
  })

  it('avoids cells covered by objects when it can', () => {
    const label = roomLabelLayout(tutorial, 'living')
    expect(label?.run).toEqual({ row: 1, fromCol: 1, toCol: 3 })
  })

  it('wraps a long name over two lines on a short run', () => {
    const label = roomLabelLayout(tutorial, 'bedroom')
    expect(label?.lines).toEqual(['GROTE', 'SLAAPKAMER'])
  })

  it('returns nothing for an unknown room', () => {
    expect(roomLabelLayout(tutorial, 'nope')).toBeUndefined()
  })
})

describe('resolveRoomStyles', () => {
  it('styles rooms by name hint', () => {
    expect(styleForName('Keuken')).toBe('tiles')
    expect(styleForName('Backyard')).toBe('grass')
    expect(styleForName('Pond')).toBe('water')
    expect(styleForName('Grote slaapkamer')).toBe('carpet')
    expect(styleForName('Zzz')).toBeUndefined()
  })

  it('lets an override win and gives a repeated pattern another tone', () => {
    const scene = { rooms: [{ id: 'a', name: 'Hal' }, { id: 'b', name: 'Keuken' }, { id: 'c', name: 'Zzz' }] }
    const styles = resolveRoomStyles(scene, { c: 'tiles' })
    expect(styles['c']?.pattern).toBe('tiles')
    expect(styles['a']?.variant).toBe(0)
    expect(styles['b']?.variant).toBe(1)
    expect(styles['a']?.fill).not.toBe(styles['b']?.fill)
  })

  it('always resolves a style for every room', () => {
    const styles = resolveRoomStyles(sample9x9)
    expect(Object.keys(styles).sort()).toEqual(sample9x9.rooms.map((r) => r.id).sort())
  })
})
