import { describe, expect, it } from 'vitest'
import { OBJECT_WORDS_NL } from '../../engine/clues/nl.ts'
import { checkScene } from '../../engine/model/index.ts'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES } from '../../engine/scenegen/objects.ts'
import { ORIENTATIONS, orientCells } from '../../render/icons/orientation.ts'
import { solidFor } from '../../render/looks/solid.ts'
import { seasonalThemeOf } from '../../schedule/calendar.ts'
import { addDays } from '../../schedule/dates.ts'
import { rotationThemeOf, themeOf } from '../../schedule/pick.ts'
import { FALL_THEME, fallTheme } from './fall.ts'
import { SCENE_THEMES, type ThemeId } from './index.ts'

/**
 * The Fall theme (SLAY-18.6), tested on its own (registered by SLAY-24, which took over SLAY-18.10, together with the
 * regenerated schedule days), so every test here reads the module directly and never goes through `SCENE_THEMES` or `getTheme`.
 */
const theme = fallTheme
const kindOf = (id: string): string => id.replace(/-\d+$/, '')
const byKind = new Map(theme.objects.map((o) => [o.kind, o]))

describe('fall theme: data', () => {
  it('is seasonal, with EN and NL names for the theme and for at least 16 rooms, each with room types and a floor', () => {
    expect(theme.seasonal).toBe(true)
    expect(theme.nameNl).toBe('Herfstboerderij')
    expect(theme.rooms.length).toBeGreaterThanOrEqual(16)
    expect(new Set(theme.rooms.map((r) => r.name)).size).toBe(theme.rooms.length)
    for (const room of theme.rooms) {
      expect(room.nameNl.length, room.name).toBeGreaterThan(0)
      expect(room.nameNl, room.name).not.toBe(room.name)
      expect(room.roomTypes?.length, room.name).toBeGreaterThan(0)
      expect(room.floor, room.name).toBeDefined()
    }
  })

  it('gives every room name used by another theme the same Dutch noun', () => {
    for (const room of theme.rooms) {
      for (const other of SCENE_THEMES.flatMap((t) => t.rooms).filter((r) => r.name === room.name)) expect(other.nameNl, room.name).toBe(room.nameNl)
    }
  })

  it('has at least 6 occupiable and 6 blocking kinds, unique, each with a Dutch noun (singular, lower case, no article)', () => {
    expect(theme.objects.filter((o) => o.occupiable).length).toBeGreaterThanOrEqual(6)
    expect(theme.objects.filter((o) => !o.occupiable).length).toBeGreaterThanOrEqual(6)
    expect(new Set(theme.objects.map((o) => o.kind)).size).toBe(theme.objects.length)
    for (const o of theme.objects) {
      expect(o.nameNl, o.kind).toBe(o.nameNl.toLowerCase().trim())
      expect(/^(de|het|een) /.test(o.nameNl), o.kind).toBe(false)
      expect(o.nameNl, o.kind).not.toBe(o.name)
    }
  })

  it('gives kinds drawn differently different Dutch nouns, and never the generic noun to a kind with own art', () => {
    for (const type of new Set(theme.objects.map((o) => o.engineType))) {
      const kinds = theme.objects.filter((o) => o.engineType === type)
      const icons = new Map<string, Set<string>>()
      for (const o of kinds) icons.set(o.nameNl, (icons.get(o.nameNl) ?? new Set()).add(o.themeIcon ?? 'engine'))
      for (const [noun, set] of icons) expect([...set], `${type} "${noun}"`).toHaveLength(1)
      for (const o of kinds.filter((x) => x.themeIcon)) expect(o.nameNl, o.kind).not.toBe(OBJECT_WORDS_NL[type].noun)
    }
  })

  it('keeps a kind shared with a registered theme identical to it', () => {
    for (const o of theme.objects) {
      for (const other of SCENE_THEMES.flatMap((t) => t.objects).filter((x) => x.kind === o.kind)) {
        expect([other.name, other.clueNoun, other.nameNl, other.engineType, other.themeIcon], o.kind).toEqual([o.name, o.clueNoun, o.nameNl, o.engineType, o.themeIcon])
      }
    }
  })

  it('has the plain chair as its only chair', () => {
    expect(theme.objects.filter((o) => o.engineType === 'chair').map((o) => [o.kind, o.themeIcon])).toEqual([['chair', undefined]])
  })

  it('gives every kind an allow-list a room meets, every room a favoured kind it allows, and favours every kind somewhere', () => {
    for (const o of theme.objects) {
      expect(o.allowedRoomTypes.length, o.kind).toBeGreaterThan(0)
      expect(theme.rooms.some((r) => o.allowedRoomTypes.some((t) => r.roomTypes?.includes(t))), o.kind).toBe(true)
      expect(theme.rooms.some((r) => r.favours.includes(o.kind)), `${o.kind} is favoured nowhere`).toBe(true)
    }
    for (const room of theme.rooms) {
      for (const kind of room.favours) expect(byKind.get(kind)?.allowedRoomTypes.some((t) => room.roomTypes?.includes(t)), `${room.name} favours ${kind}`).toBe(true)
    }
  })
})

describe('fall theme: block art (look completeness for its kinds)', () => {
  for (const o of theme.objects) {
    it(`${o.kind} (${o.themeIcon ?? o.engineType}): every footprint in all 8 orientations`, () => {
      for (const footprint of o.footprints) {
        const cols = Math.max(...footprint.cells.map((c) => c.col)) + 1
        const rows = Math.max(...footprint.cells.map((c) => c.row)) + 1
        expect(solidFor(o.engineType, o.themeIcon, footprint.cells)?.prims.length, `${o.kind} ${footprint.id}`).toBeGreaterThan(0)
        for (const or of ORIENTATIONS) expect(solidFor(o.engineType, o.themeIcon, orientCells(footprint.cells, cols, rows, or), or), `${o.kind} ${footprint.id} ${or.rotation}`).not.toBeNull()
      }
    })
  }
})

describe('fall theme: scenes over many seeds', () => {
  const types = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
  const scenes = [6, 7, 9, 12].flatMap((size) => Array.from({ length: 50 }, (_, i) => ({ size, seed: i + 1, scene: generateScene({ width: size, height: size, theme, seed: i + 1 }) })))

  it('builds valid scenes with the theme rooms', () => {
    for (const { size, seed, scene } of scenes) {
      expect(checkScene(scene), `${size} seed ${seed}`).toEqual([])
      for (const room of scene.rooms) expect(types.has(room.name), room.name).toBe(true)
    }
  })

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
  const registered: ReadonlySet<ThemeId> = new Set(SCENE_THEMES.map((t) => t.id))
  /** `themeOf` with fall registered (SLAY-24). */
  const withFall = (date: string): ThemeId => seasonalThemeOf(date, (id) => id === 'fall' || registered.has(id)) ?? rotationThemeOf(date)

  it('is registered (SLAY-24, which took over SLAY-18.10)', () => {
    expect(FALL_THEME).toBe(fallTheme)
    expect(SCENE_THEMES.some((t) => t.id === 'fall')).toBe(true)
  })

  it('picks fall on 1-16 October and in November, but not on the Simpshouse days (the 1st, 2026-10-10, 2026-10-14) or 11 November', () => {
    for (const date of ['2026-10-09', '2026-10-15', '2026-10-16', '2026-11-02', '2026-11-10', '2026-11-12', '2026-11-30', '2027-10-02']) expect(withFall(date), date).toBe('fall')
    for (const date of ['2026-10-10', '2026-10-14', '2026-11-01', '2027-10-01']) expect(withFall(date), date).toBe('simpshouse')
    expect(withFall('2026-11-11')).not.toBe('fall')
    for (const date of ['2026-09-30', '2026-10-17', '2026-10-31', '2026-12-01']) expect(withFall(date), date).not.toBe('fall')
  })

  it('once registered, leaves the theme of every other day as it is now', () => {
    let checked = 0
    // From 2026-10-10 (RULES_FROM): the days played before it keep the rotation (SLAY-24).
    for (let date = '2026-10-10'; date <= '2028-01-31'; date = addDays(date, 1)) {
      if (withFall(date) === 'fall') continue
      expect(withFall(date), date).toBe(themeOf(date))
      checked++
    }
    expect(checked).toBeGreaterThan(400)
  })
})
