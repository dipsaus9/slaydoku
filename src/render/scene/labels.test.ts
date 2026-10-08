import { describe, expect, it } from 'vitest'
import { demoScene } from '../../content/demo/scene.ts'
import { cellKey, cellsInRoom } from '../../engine/model/index.ts'
import { bareRoomName, roomLabelLayout } from './labels.ts'

const cellsInRoomOf = (roomId: string) => cellsInRoom(demoScene, roomId)

describe('room labels drop the article of a stored room name', () => {
  it('strips the article', () => {
    expect(bareRoomName('the Kitchen')).toBe('Kitchen')
    expect(bareRoomName('The Meeting Room')).toBe('Meeting Room')
    expect(bareRoomName('Kitchen')).toBe('Kitchen')
    expect(bareRoomName('Large living room')).toBe('Large living room')
    expect(bareRoomName('the')).toBe('the')
  })

  it.each([['demo house', demoScene]])('the map of the %s shows bare nouns that fit their room', (_name, scene) => {
    for (const room of scene.rooms) {
      const label = roomLabelLayout(scene, room.id)!
      expect(label.lines.join(' ')).toBe(bareRoomName(room.name).toUpperCase())
      expect(label.lines.join(' ')).not.toMatch(/^THE /)
      // the pill stays inside the run of cells the label sits on
      expect(label.width).toBeLessThanOrEqual(label.run.toCol - label.run.fromCol + 1)
    }
  })

  it('draws the real Dutch noun, the same one the clue text uses, not a second translation (SLAY-5.2)', () => {
    const expected: Record<string, string> = { kitchen: 'KEUKEN', hall: 'HAL', bedroom: 'SLAAPKAMER', living: 'WOONKAMER' }
    for (const room of demoScene.rooms) {
      const label = roomLabelLayout(demoScene, room.id, 'nl')!
      expect(label.lines.join(' '), room.id).toBe(expected[room.id])
    }
  })

  it('a Dutch label falls back to the bare English noun when no theme defines a Dutch name', () => {
    const scene = { ...demoScene, rooms: [{ id: 'kitchen', name: 'Not A Real Room' }] }
    const label = roomLabelLayout(scene, 'kitchen', 'nl')!
    expect(label.lines.join(' ')).toBe('NOT A REAL ROOM')
  })

  it('keeps the label off the squares where the player has placed people, when the room has other free squares (SLAY-17.5)', () => {
    const room = demoScene.rooms.find((r) => cellsInRoomOf(r.id).length >= 4)!
    const plain = roomLabelLayout(demoScene, room.id)!
    const cells = cellsInRoomOf(room.id)
    const onLabel = cells.filter((c) => c.row === plain.run.row && c.col >= plain.run.fromCol && c.col <= plain.run.toCol)
    const moved = roomLabelLayout(demoScene, room.id, 'en', onLabel)!
    const placed = new Set(onLabel.map(cellKey))
    const free = cells.some((c) => !placed.has(cellKey(c)) && !demoScene.objects.some((o) => o.cells.some((oc) => cellKey(oc) === cellKey(c))))
    expect(free).toBe(true)
    for (let col = moved.run.fromCol; col <= moved.run.toCol; col++) expect(placed.has(cellKey({ row: moved.run.row, col }))).toBe(false)
  })

  it('still places a label when every free square holds a person', () => {
    const everything = demoScene.rooms.flatMap((r) => cellsInRoomOf(r.id))
    for (const room of demoScene.rooms) expect(roomLabelLayout(demoScene, room.id, 'en', everything)).toBeDefined()
  })
})
