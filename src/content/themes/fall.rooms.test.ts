import { describe, expect, it } from 'vitest'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES } from '../../engine/scenegen/objects.ts'
import { seasonalThemeOf } from '../../schedule/calendar.ts'
import { addDays } from '../../schedule/dates.ts'
import { rotationThemeOf, themeOf } from '../../schedule/pick.ts'
import { FALL_THEME } from './fall.ts'
import { SCENE_THEMES, type ThemeId } from './index.ts'

/** The Fall theme (SLAY-18.6): its rooms and hard room rules, the one chair look and the chair caps, and its place in the calendar. */
const theme = FALL_THEME!
const kindOf = (id: string): string => id.replace(/-\d+$/, '')
const byKind = new Map(theme.objects.map((o) => [o.kind, o]))

describe('fall theme: registered as seasonal', () => {
  it('is registered once, seasonal, with EN and NL names for the theme and every room', () => {
    expect(SCENE_THEMES.filter((t) => t.id === 'fall')).toEqual([theme])
    expect(theme.seasonal).toBe(true)
    expect(theme.nameNl).toBe('Herfstboerderij')
    expect(theme.rooms.length).toBeGreaterThanOrEqual(16)
    for (const room of theme.rooms) {
      expect(room.name.length, room.name).toBeGreaterThan(0)
      expect(room.nameNl.length, room.name).toBeGreaterThan(0)
      expect(room.roomTypes?.length, room.name).toBeGreaterThan(0)
      expect(room.floor, room.name).toBeDefined()
    }
  })

  it('gives every kind a Dutch noun and an allow-list that a room of the theme meets', () => {
    for (const o of theme.objects) {
      expect(o.nameNl.length, o.kind).toBeGreaterThan(1)
      expect(o.allowedRoomTypes.length, o.kind).toBeGreaterThan(0)
      expect(theme.rooms.some((r) => o.allowedRoomTypes.some((t) => r.roomTypes?.includes(t))), o.kind).toBe(true)
    }
  })

  it('has the plain chair as its only chair', () => {
    const chairs = theme.objects.filter((o) => o.engineType === 'chair')
    expect(chairs.map((o) => [o.kind, o.themeIcon])).toEqual([['chair', undefined]])
  })
})

describe('fall theme: scenes over many seeds', () => {
  const types = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
  const scenes = [6, 7, 9, 12].flatMap((size) => Array.from({ length: 50 }, (_, i) => ({ size, seed: i + 1, scene: generateScene({ width: size, height: size, theme: 'fall', seed: i + 1 }) })))

  it('never places a kind outside its allow-list (hard room rule)', () => {
    let placed = 0
    const misplaced: string[] = []
    for (const { size, seed, scene } of scenes) {
      for (const object of scene.objects) {
        const kind = kindOf(object.id)
        const roomId = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]!
        const roomName = scene.rooms.find((r) => r.id === roomId)!.name
        placed++
        if (!byKind.get(kind)!.allowedRoomTypes.some((t) => types.get(roomName)!.includes(t))) misplaced.push(`${size}x${size} seed ${seed}: ${kind} in ${roomName}`)
      }
    }
    expect(misplaced).toEqual([])
    expect(placed).toBeGreaterThan(1500)
  })

  it('caps chairs (2 per room unless at a table, desk or counter) and every kind (3 per room)', () => {
    for (const { size, seed, scene } of scenes) {
      const typeAt = new Map(scene.objects.flatMap((o) => o.cells.map((c) => [`${c.row},${c.col}`, o.type] as const)))
      for (const room of scene.rooms) {
        const inRoom = scene.objects.filter((o) => scene.cellRooms[o.cells[0]!.row]![o.cells[0]!.col] === room.id)
        const perKind = new Map<string, number>()
        for (const o of inRoom) perKind.set(kindOf(o.id), (perKind.get(kindOf(o.id)) ?? 0) + 1)
        for (const [kind, n] of perKind) expect(n, `${size} seed ${seed} ${room.name} ${kind}`).toBeLessThanOrEqual(Math.min(byKind.get(kind)!.maxPerRoom ?? Infinity, MAX_KIND_PER_ROOM))
        const chairs = inRoom.filter((o) => o.type === 'chair')
        const seated = chairs.filter((o) => o.cells.some((c) => [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => SEAT_AT_TYPES.has(typeAt.get(`${c.row + dr!},${c.col + dc!}`) ?? ''))))
        expect(chairs.length - seated.length, `${size} seed ${seed} ${room.name}: free chairs`).toBeLessThanOrEqual(MAX_FREE_CHAIRS_PER_ROOM)
      }
    }
  })

  it('places every kind somewhere in the sweep', () => {
    const seen = new Set(scenes.flatMap(({ scene }) => scene.objects.map((o) => kindOf(o.id))))
    expect(theme.objects.map((o) => o.kind).filter((k) => !seen.has(k))).toEqual([])
  })
})

describe('fall theme: the calendar', () => {
  const others: ReadonlySet<ThemeId> = new Set(SCENE_THEMES.filter((t) => t.id !== 'fall').map((t) => t.id))

  it('picks fall on 1-16 October and in November, but not on Simpshouse day or 11 November', () => {
    for (const date of ['2026-10-09', '2026-10-15', '2026-10-16', '2026-11-01', '2026-11-10', '2026-11-12', '2026-11-30', '2027-10-01']) expect(themeOf(date), date).toBe('fall')
    expect(themeOf('2026-10-14')).toBe('simpshouse')
    expect(themeOf('2026-11-11')).not.toBe('fall')
    for (const date of ['2026-09-30', '2026-10-17', '2026-10-31', '2026-12-01']) expect(themeOf(date), date).not.toBe('fall')
  })

  it('leaves the theme of every other day as it was without fall', () => {
    let checked = 0
    for (let date = '2026-09-27'; date <= '2028-01-31'; date = addDays(date, 1)) {
      if (themeOf(date) === 'fall') continue
      expect(themeOf(date), date).toBe(seasonalThemeOf(date, (id) => others.has(id)) ?? rotationThemeOf(date))
      checked++
    }
    expect(checked).toBeGreaterThan(400)
  })

  it('keeps fall out of the rotation', () => {
    for (let date = '2026-09-27', i = 0; i < 200; date = addDays(date, 1), i++) expect(rotationThemeOf(date)).not.toBe('fall')
  })
})
