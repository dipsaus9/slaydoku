import { describe, expect, it } from 'vitest'
import { demoScene } from '../../content/demo/scene.ts'
import { bareRoomName, roomLabelLayout } from './labels.ts'

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
})
