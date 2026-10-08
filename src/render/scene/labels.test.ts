import { describe, expect, it } from 'vitest'
import { demoScene } from '../../content/demo/scene.ts'
import { cellKey } from '../../engine/model/index.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { bareRoomName, hyphenate, roomLabelLayout } from './labels.ts'

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
      expect(label.width).toBeLessThanOrEqual(label.run.to - label.run.from + 1)
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
})

describe('room labels stay clear of objects (SLAY-17.5)', () => {
  const days = readSchedule().days
  const dayOn = (date: string) => days.find((d) => d.date === date)!.puzzle.scene

  /** Cells of the board that the pill covers by more than a sliver. */
  function coveredByLabel(scene: ReturnType<typeof dayOn>, roomId: string, locale: 'en' | 'nl') {
    const l = roomLabelLayout(scene, roomId, locale)!
    const hw = (l.vertical ? l.height : l.width) / 2
    const hh = (l.vertical ? l.width : l.height) / 2
    const objects = new Set(scene.objects.flatMap((o) => o.cells.map(cellKey)))
    const hits: string[] = []
    for (let r = Math.floor(l.center.y - hh); r < l.center.y + hh; r++)
      for (let c = Math.floor(l.center.x - hw); c < l.center.x + hw; c++) {
        const overlapX = Math.min(l.center.x + hw, c + 1) - Math.max(l.center.x - hw, c)
        const overlapY = Math.min(l.center.y + hh, r + 1) - Math.max(l.center.y - hh, r)
        if (objects.has(cellKey({ row: r, col: c })) && overlapX > 0.02 && overlapY > 0.02) hits.push(cellKey({ row: r, col: c }))
      }
    return { l, hits }
  }

  it.each(['en', 'nl'] as const)('the toy department of 2026-11-30 (a one-cell strip) has no object under its label in %s', (locale) => {
    const scene = dayOn('2026-11-30')
    const { l, hits } = coveredByLabel(scene, 'r6', locale)
    expect(hits).toEqual([])
    expect(l.vertical).toBe(true)
  })

  it('splits a long Dutch compound before its ending, or at its own hyphen', () => {
    expect(hyphenate('SPEELGOEDAFDELING')).toEqual(['SPEELGOED-', 'AFDELING'])
    expect(hyphenate('ELEKTRONICA-AFDELING')).toEqual(['ELEKTRONICA-', 'AFDELING'])
  })

  it('across the whole schedule only a few labels in tiny rooms still touch an object', () => {
    let touching = 0
    for (const day of days) {
      for (const room of day.puzzle.scene.rooms) {
        for (const locale of ['en', 'nl'] as const) if (coveredByLabel(day.puzzle.scene, room.id, locale).hits.length > 0) touching++
      }
    }
    expect(touching).toBeLessThanOrEqual(9)
  })
})
