import { describe, expect, it } from 'vitest'
import { demoScene } from '../../content/demo/scene.ts'
import { bareRoomName, roomLabelLayout } from './labels.ts'

describe('room labels drop the article of a stored room name', () => {
  it('strips de, het and \'t', () => {
    expect(bareRoomName('het Fietsenhok')).toBe('Fietsenhok')
    expect(bareRoomName('de Speelkamer')).toBe('Speelkamer')
    expect(bareRoomName("'t Hoekje")).toBe('Hoekje')
    expect(bareRoomName('Gang')).toBe('Gang')
    expect(bareRoomName('Grote woonkamer')).toBe('Grote woonkamer')
    expect(bareRoomName('de')).toBe('de')
  })

  it.each([['demo house', demoScene]])('the map of the %s shows bare nouns that fit their room', (_name, scene) => {
    for (const room of scene.rooms) {
      const label = roomLabelLayout(scene, room.id)!
      expect(label.lines.join(' ')).toBe(bareRoomName(room.name).toUpperCase())
      expect(label.lines.join(' ')).not.toMatch(/^(DE|HET) /)
      // the pill stays inside the run of cells the label sits on
      expect(label.width).toBeLessThanOrEqual(label.run.toCol - label.run.fromCol + 1)
    }
  })
})
