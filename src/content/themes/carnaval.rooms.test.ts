import { describe, expect, it } from 'vitest'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES } from '../../engine/scenegen/objects.ts'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { seasonalThemeOf } from '../../schedule/calendar.ts'
import { addDays } from '../../schedule/dates.ts'
import { rotationThemeOf, themeOf } from '../../schedule/pick.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { CARNAVAL_THEME } from './carnaval.ts'
import { SCENE_THEMES } from './index.ts'
import type { ThemeId } from './types.ts'

const theme = CARNAVAL_THEME!
const kindOf = (id: string): string => id.replace(/-\d+$/, '')
const roomsAllowing = (kind: string): string[] =>
  theme.rooms.filter((r) => theme.objects.find((o) => o.kind === kind)!.allowedRoomTypes.some((t) => r.roomTypes?.includes(t))).map((r) => r.name)

describe('carnaval theme (SLAY-18.7)', () => {
  it('is registered as a seasonal theme with Oeteldonk rooms in English and Dutch', () => {
    expect(SCENE_THEMES).toContain(theme)
    expect(theme.seasonal).toBe(true)
    expect(theme.rooms.length).toBeGreaterThanOrEqual(16)
    for (const r of theme.rooms) expect(r.nameNl.length, r.name).toBeGreaterThan(2)
    expect(theme.rooms.find((r) => r.name === 'Pub')?.nameNl).toBe('Kroeg')
  })

  it('names every kind in Dutch: singular, lower case, no article', () => {
    for (const o of theme.objects) {
      expect(o.nameNl, o.kind).toBe(o.nameNl.toLowerCase())
      expect(/^(de|het|een) /.test(o.nameNl), o.kind).toBe(false)
    }
  })

  it('has the plain chair as its only chair', () => {
    const chairs = theme.objects.filter((o) => o.engineType === 'chair')
    expect(chairs.map((o) => [o.kind, o.themeIcon])).toEqual([['chair', undefined]])
  })

  it('gives every kind an allow-list with an allowed room, and keeps beds and floats to their own rooms', () => {
    for (const o of theme.objects) expect(roomsAllowing(o.kind).length, o.kind).toBeGreaterThan(0)
    expect(roomsAllowing('singleBed')).toEqual(['Hotel Room'])
    expect(roomsAllowing('floatCart').sort()).toEqual(['Float Building Hall', 'Parade Route'])
    expect(roomsAllowing('barCounter')).toContain('Pub')
  })

  it('never breaks a room rule, the kind cap or the chair cap over many seeds and sizes', () => {
    const types = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
    const byKind = new Map(theme.objects.map((o) => [o.kind, o]))
    const seen = new Set<string>()
    let placed = 0
    for (const size of [6, 7, 9, 12]) {
      for (let seed = 1; seed <= 50; seed++) {
        const scene = generateScene({ width: size, height: size, theme: 'carnaval', seed })
        const typeAt = new Map<string, string>()
        for (const o of scene.objects) for (const c of o.cells) typeAt.set(`${c.row},${c.col}`, o.type)
        const perRoom = new Map<string, { kinds: Map<string, number>; loneChairs: number }>()
        for (const object of scene.objects) {
          const kind = kindOf(object.id)
          seen.add(kind)
          const roomId = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]!
          const roomName = scene.rooms.find((r) => r.id === roomId)!.name
          const where = `${size}x${size} seed ${seed}: ${kind} in ${roomName}`
          expect(byKind.get(kind)!.allowedRoomTypes.some((t) => types.get(roomName)!.includes(t)), where).toBe(true)
          const room = perRoom.get(roomId) ?? { kinds: new Map(), loneChairs: 0 }
          room.kinds.set(kind, (room.kinds.get(kind) ?? 0) + 1)
          const touches = object.cells.some((c) => [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => SEAT_AT_TYPES.has(typeAt.get(`${c.row + dr!},${c.col + dc!}`) ?? '')))
          if (object.type === 'chair' && !touches) room.loneChairs++
          perRoom.set(roomId, room)
          placed++
        }
        for (const [id, room] of perRoom) {
          for (const [kind, n] of room.kinds) expect(n, `${size}x${size} seed ${seed} room ${id}: ${kind}`).toBeLessThanOrEqual(MAX_KIND_PER_ROOM)
          expect(room.loneChairs, `${size}x${size} seed ${seed} room ${id}: chairs`).toBeLessThanOrEqual(MAX_FREE_CHAIRS_PER_ROOM)
        }
      }
    }
    expect(placed).toBeGreaterThan(800)
    expect([...seen].sort()).toEqual(theme.objects.map((o) => o.kind).sort())
  })
})

describe('carnaval in the calendar (SLAY-18.7)', () => {
  const registered = new Set(SCENE_THEMES.map((t) => t.id))
  const withoutCarnaval = (date: string): ThemeId => seasonalThemeOf(date, (id) => registered.has(id) && id !== 'carnaval') ?? rotationThemeOf(date)

  it('picks carnaval on 11 November every year', () => {
    for (let year = 2026; year <= 2030; year++) expect(themeOf(`${year}-11-11`), String(year)).toBe('carnaval')
  })

  it('changes no other day: every date but 11 November has the theme it had before carnaval was registered', () => {
    let checked = 0
    for (let d = '2026-09-27'; d <= '2028-12-31'; d = addDays(d, 1)) {
      if (d.endsWith('-11-11')) continue
      expect(themeOf(d), d).toBe(withoutCarnaval(d))
      checked++
    }
    expect(checked).toBeGreaterThan(800)
  })

  it('keeps the theme of every committed day except 11 November', () => {
    const { days } = readSchedule()
    for (const day of days) if (!day.date.endsWith('-11-11')) expect(themeOf(day.date), day.date).toBe(day.theme)
  })
})
