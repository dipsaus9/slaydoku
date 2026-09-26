import { describe, expect, it } from 'vitest'
import { OBJECT_CATALOG, OBJECT_TYPES, isObjectType, isOccupiableType } from './catalog.ts'

const ORIGINAL = {
  occupiable: ['chair', 'rug', 'bed', 'sofa', 'car', 'oilSlick', 'framedPainting'],
  blocking: ['table', 'tv', 'plant', 'bookshelf', 'chest', 'tree', 'flowers', 'easel', 'statue'],
} as const

const HOUSE = [
  'washingMachine',
  'dryer',
  'cabinet',
  'stairs',
  'toilet',
  'sink',
  'shower',
  'desk',
  'wardrobe',
  'diningTable',
  'kitchenCounter',
  'bicycle',
  'gardenTable',
  'bench',
] as const

describe('object catalog', () => {
  it('keeps the original 16 types and their flags, without footprint metadata', () => {
    for (const type of ORIGINAL.occupiable) expect(OBJECT_CATALOG[type]).toEqual({ occupiable: true })
    for (const type of ORIGINAL.blocking) expect(OBJECT_CATALOG[type]).toEqual({ occupiable: false })
  })

  it('lists the 14 house types, each blocking with an explicit footprint', () => {
    expect(OBJECT_TYPES).toHaveLength(ORIGINAL.occupiable.length + ORIGINAL.blocking.length + HOUSE.length)
    for (const type of HOUSE) {
      expect(isObjectType(type), type).toBe(true)
      expect(OBJECT_CATALOG[type].occupiable, type).toBe(false)
      expect(isOccupiableType(type), type).toBe(false)
      const footprint = OBJECT_CATALOG[type].footprint
      expect(footprint, type).toBeDefined()
      expect(footprint!.minCells, type).toBeGreaterThanOrEqual(1)
      expect(footprint!.maxCells, type).toBeGreaterThanOrEqual(footprint!.minCells)
    }
  })

  it('rejects unknown type names', () => {
    expect(isObjectType('spaceship')).toBe(false)
    expect(isObjectType('toString')).toBe(false)
    expect(isObjectType(3)).toBe(false)
  })
})
