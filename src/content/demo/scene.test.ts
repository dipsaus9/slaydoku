import { describe, expect, it } from 'vitest'
import { checkScene, isOccupiable, isOccupiableType, parseScene, serializeScene } from '../../engine/model/index.ts'
import { checkAdmissible } from '../../engine/scenegen/index.ts'
import { hasIcon } from '../../render/icons/index.ts'
import { DEMO_GIFT_CELLS, demoRoomStyles, demoScene } from './scene.ts'

describe('the demo scene', () => {
  it('is a valid 9x9 scene that survives a JSON round trip', () => {
    expect(demoScene.width).toBe(9)
    expect(demoScene.height).toBe(9)
    expect(checkScene(demoScene)).toEqual([])
    const parsed = parseScene(serializeScene(demoScene))
    expect(parsed.ok && parsed.value).toEqual(demoScene)
  })

  it('has four rooms with articles, each with a floor style', () => {
    expect(demoScene.rooms.map((r) => r.id)).toEqual(['keuken', 'hal', 'slaapkamer', 'woonkamer'])
    for (const room of demoScene.rooms) {
      expect(room.name).toMatch(/^(de|het) [A-Z]/)
      expect(demoRoomStyles[room.id]).toBeDefined()
    }
  })

  it('draws every object: each footprint has an icon', () => {
    for (const object of demoScene.objects) expect(hasIcon(object.type, object.cells), object.id).toBe(true)
  })

  it('classifies bed, sofa and chairs as occupiable and the rest as blocking', () => {
    for (const object of demoScene.objects) {
      expect(isOccupiableType(object.type), object.id).toBe(['bed', 'sofa', 'chair'].includes(object.type))
    }
  })

  it('has gift cells on the sofa, all occupiable, in a room that can hold the gift', () => {
    expect(DEMO_GIFT_CELLS).toHaveLength(3)
    for (const cell of DEMO_GIFT_CELLS) expect(isOccupiable(demoScene, cell)).toBe(true)
    const admissible = checkAdmissible(demoScene)
    expect(admissible.ok).toBe(true)
    expect(admissible.victimRooms).toContain('woonkamer')
  })

  it('keeps an occupiable cell in every row and column', () => {
    for (let i = 0; i < 9; i++) {
      expect(Array.from({ length: 9 }, (_, c) => isOccupiable(demoScene, { row: i, col: c })).some(Boolean), `row ${i}`).toBe(true)
      expect(Array.from({ length: 9 }, (_, r) => isOccupiable(demoScene, { row: r, col: i })).some(Boolean), `column ${i}`).toBe(true)
    }
  })
})
