import { describe, expect, it } from 'vitest'
import { OBJECT_WORDS } from '../../engine/clues/en.ts'
import { OBJECT_WORDS_NL } from '../../engine/clues/nl.ts'
import { OBJECT_CATALOG, isOccupiableType } from '../../engine/model/index.ts'
import type { Cell } from '../../engine/model/index.ts'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES } from '../../engine/scenegen/objects.ts'
import { ORIENTATIONS, orientCells } from '../../render/icons/orientation.ts'
import { resolveThemeObjectIcon } from '../../render/icons/themes/resolve.ts'
import { THEME_ICON_IDS } from '../../render/icons/themes/types.ts'
import { solidFor } from '../../render/looks/solid.ts'
import { styleForName } from '../../render/scene/roomStyles.ts'
import { seasonalThemeOf } from '../../schedule/calendar.ts'
import { planDays, themeOf } from '../../schedule/pick.ts'
import { CHRISTMAS_THEME, christmasTheme as theme } from './christmas.ts'
import { kindNoun } from './drawn.ts'
import { SCENE_THEMES } from './index.ts'

/**
 * The Christmas theme (SLAY-18.8), tested on its own: it is not registered until SLAY-18.10 regenerates December (see christmas.ts), so the
 * checks that rooms.test.ts, themes.test.ts and the look-completeness test run over SCENE_THEMES run here against `christmasTheme` directly.
 */
const kindOf = (id: string): string => id.replace(/-\d+$/, '')
const roomTypesOf = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
const byKind = new Map(theme.objects.map((o) => [o.kind, o]))
const registeredObjects = SCENE_THEMES.flatMap((t) => t.objects)
const registeredRooms = SCENE_THEMES.flatMap((t) => t.rooms)

function isConnected(cells: readonly Cell[]): boolean {
  const seen = new Set([0])
  const queue = [0]
  while (queue.length > 0) {
    const a = cells[queue.pop()!]!
    cells.forEach((c, i) => {
      if (!seen.has(i) && Math.abs(a.row - c.row) + Math.abs(a.col - c.col) === 1) {
        seen.add(i)
        queue.push(i)
      }
    })
  }
  return seen.size === cells.length
}

describe('Christmas theme (SLAY-18.8)', () => {
  it('is complete but not registered yet: SLAY-18.10 registers it with the regenerated December', () => {
    expect(CHRISTMAS_THEME).toBeUndefined()
    expect(SCENE_THEMES.some((t) => t.id === 'christmas')).toBe(false)
    expect(theme.id).toBe('christmas')
    expect(theme.seasonal).toBe(true)
    expect(theme.nameNl).toBe('Kerstdorp')
  })

  describe('rooms', () => {
    it('has at least 15 rooms (16 for a 16x16 board), unique EN and NL names, each with room types', () => {
      expect(theme.rooms.length).toBeGreaterThanOrEqual(16)
      for (const names of [theme.rooms.map((r) => r.name), theme.rooms.map((r) => r.nameNl)]) expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length)
      for (const r of theme.rooms) {
        expect(r.nameNl.trim(), r.name).toBe(r.nameNl)
        expect(r.nameNl.length, r.name).toBeGreaterThan(2)
        expect(r.nameNl, r.name).not.toBe(r.name)
        expect(r.roomTypes?.length, r.name).toBeGreaterThan(0)
        // Clues say "the <room>": "the Santa's Workshop" does not read, "the Children's Bedroom" does.
        expect(r.name.includes("'s ") && !r.name.startsWith("Children's"), `${r.name}: reads well after "the"`).toBe(false)
      }
    })

    it('gives a room name another theme already uses the same Dutch noun and leaves that theme its floor', () => {
      for (const r of theme.rooms) {
        const others = registeredRooms.filter((o) => o.name === r.name)
        for (const o of others) expect(r.nameNl, r.name).toBe(o.nameNl)
        if (others.length > 0) expect(r.floor, `${r.name}: a theme floor would change the floor of the other theme's room`).toBeUndefined()
      }
    })

    it('gives the rooms of its own the floor of the approved preview, which no name hint overrides', () => {
      for (const r of theme.rooms) if (r.floor) expect(['wood', 'tiles', 'carpet', 'stone', 'water']).toContain(r.floor)
      expect(theme.rooms.filter((r) => r.outdoor).map((r) => r.floor)).toEqual(['water', 'water', 'water', 'stone'])
      // Registration happens later; until then the name hints decide, and none of the new names is claimed by another theme's floor.
      for (const r of theme.rooms.filter((r) => r.floor)) expect(registeredRooms.some((o) => o.name === r.name), r.name).toBe(false)
      expect(styleForName('Kitchen')).toBe('tiles')
    })

    it('favours only its own kinds, each allowed in that room', () => {
      for (const room of theme.rooms) {
        for (const kind of room.favours) {
          const allowed = byKind.get(kind)?.allowedRoomTypes
          expect(allowed, `${room.name} favours unknown ${kind}`).toBeDefined()
          expect(allowed!.some((t) => room.roomTypes?.includes(t)), `${room.name} favours ${kind} but does not allow it`).toBe(true)
          expect(byKind.get(kind)!.excludeRoomTypes?.some((t) => room.roomTypes?.includes(t)) ?? false, `${room.name} favours excluded ${kind}`).toBe(false)
        }
      }
      const favoured = new Set(theme.rooms.flatMap((r) => r.favours))
      expect(theme.objects.filter((o) => !favoured.has(o.kind)).length).toBeLessThanOrEqual(3)
    })
  })

  describe('kinds', () => {
    const occupiable = theme.objects.filter((o) => o.occupiable)

    it('has at least 6 occupiable and 6 blocking kinds, unique, no stairs, occupiable as the engine says', () => {
      expect(occupiable.length).toBeGreaterThanOrEqual(6)
      expect(theme.objects.length - occupiable.length).toBeGreaterThanOrEqual(6)
      expect(new Set(theme.objects.map((o) => o.kind)).size).toBe(theme.objects.length)
      expect(theme.objects.filter((o) => o.engineType === 'stairs')).toEqual([])
      for (const o of theme.objects) expect(o.occupiable, o.kind).toBe(isOccupiableType(o.engineType))
    })

    it('names every kind in Dutch: singular, lower case, no article, not the English noun', () => {
      for (const o of theme.objects) {
        expect(o.nameNl.trim(), o.kind).toBe(o.nameNl)
        expect(o.nameNl, o.kind).toBe(o.nameNl.toLowerCase())
        expect(/^(de|het|een) /.test(o.nameNl), o.kind).toBe(false)
        expect(o.nameNl, o.kind).not.toBe(kindNoun(o))
      }
    })

    it('gives kinds drawn differently different nouns, and a kind with own art never the generic noun (EN and NL)', () => {
      for (const type of new Set(theme.objects.map((o) => o.engineType))) {
        const kinds = theme.objects.filter((o) => o.engineType === type)
        for (const noun of [(o: (typeof kinds)[number]) => o.nameNl, kindNoun]) {
          const icons = new Map<string, Set<string>>()
          for (const o of kinds) icons.set(noun(o), (icons.get(noun(o)) ?? new Set()).add(o.themeIcon ?? 'engine'))
          for (const [word, set] of icons) expect(set.size, `${type}: "${word}"`).toBe(1)
        }
        for (const o of kinds.filter((k) => k.themeIcon)) {
          expect(o.nameNl, o.kind).not.toBe(OBJECT_WORDS_NL[type].noun)
          expect(kindNoun(o), o.kind).not.toBe(OBJECT_WORDS[type].noun)
        }
      }
    })

    it('keeps a kind it shares with a registered theme identical (nouns, engine type, art)', () => {
      for (const o of theme.objects) {
        for (const other of registeredObjects.filter((x) => x.kind === o.kind)) {
          expect([o.name, o.clueNoun, o.nameNl, o.engineType, o.themeIcon], o.kind).toEqual([other.name, other.clueNoun, other.nameNl, other.engineType, other.themeIcon])
        }
      }
    })

    it('keeps the plain chair the only chair look; the rocking horse is a drawn toy', () => {
      const chairs = theme.objects.filter((o) => o.engineType === 'chair')
      expect(chairs.map((o) => [o.kind, o.themeIcon])).toEqual([['chair', undefined], ['rockingHorse', 'rockingHorse']])
    })

    it('keeps beds to sleeping rooms and the sleigh (a vehicle) to the garage-type Sleigh Shed', () => {
      for (const o of theme.objects) {
        if (o.engineType === 'bed') expect(o.allowedRoomTypes, o.kind).toEqual(['sleeping'])
        if (o.engineType === 'car') expect([o.allowedRoomTypes, o.excludeRoomTypes], o.kind).toEqual([['garage'], ['sleeping']])
      }
      const roomsFor = (kind: string) => theme.rooms.filter((r) => byKind.get(kind)!.allowedRoomTypes.some((t) => r.roomTypes!.includes(t))).map((r) => r.name)
      expect(roomsFor('sleigh')).toEqual(['Sleigh Shed'])
      for (const kind of ['snowman', 'firTree']) for (const room of roomsFor(kind)) expect(theme.rooms.find((r) => r.name === room)!.outdoor, `${kind} in ${room}`).toBe(true)
    })

    it('uses connected footprints within the engine size range, each with art', () => {
      for (const o of theme.objects) {
        if (o.themeIcon) expect(THEME_ICON_IDS, o.kind).toContain(o.themeIcon)
        expect(o.weight, o.kind).toBeGreaterThan(0)
        for (const f of o.footprints) {
          expect(isConnected(f.cells), `${o.kind} ${f.id}`).toBe(true)
          const range = OBJECT_CATALOG[o.engineType].footprint
          if (range) expect(f.cells.length >= range.minCells && f.cells.length <= range.maxCells, `${o.kind} ${f.id}`).toBe(true)
          expect(resolveThemeObjectIcon(o, f.cells), `${o.kind} ${f.id}`).toBeDefined()
        }
      }
    })

    it('draws every kind as a block model at every footprint in all 8 orientations (look completeness)', () => {
      for (const o of theme.objects) {
        for (const f of o.footprints) {
          const cols = Math.max(...f.cells.map((c) => c.col)) + 1
          const rows = Math.max(...f.cells.map((c) => c.row)) + 1
          for (const or of ORIENTATIONS) {
            const solid = solidFor(o.engineType, o.themeIcon, orientCells(f.cells, cols, rows, or), or)
            expect(solid, `${o.kind} ${f.id} ${or.rotation}${or.mirror ? 'm' : ''}`).not.toBeNull()
            expect(solid!.prims.length).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  describe('generated scenes', () => {
    const scenes = [6, 7, 9, 12].flatMap((size) => Array.from({ length: 60 }, (_, i) => ({ size, seed: i + 1, scene: generateScene({ width: size, height: size, theme, seed: i + 1 }) })))

    it('never places a kind outside its allow-list over many seeds and sizes', () => {
      let placed = 0
      for (const { size, seed, scene } of scenes) {
        for (const object of scene.objects) {
          const kind = kindOf(object.id)
          const room = scene.rooms.find((r) => r.id === scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col])!.name
          placed++
          expect(byKind.get(kind)!.allowedRoomTypes.some((t) => roomTypesOf.get(room)!.includes(t)), `${size}x${size} seed ${seed}: ${kind} in ${room}`).toBe(true)
        }
      }
      expect(placed).toBeGreaterThan(1000)
    })

    it('caps a kind at 3 per room and chairs at 2 per room unless they touch a table, desk or counter', () => {
      const problems: string[] = []
      for (const { size, seed, scene } of scenes) {
        const typeAt = new Map<string, string>()
        for (const o of scene.objects) for (const c of o.cells) typeAt.set(`${c.row},${c.col}`, o.type)
        const perRoom = new Map<string, { kinds: Map<string, number>; lone: number }>()
        for (const o of scene.objects) {
          const id = scene.cellRooms[o.cells[0]!.row]![o.cells[0]!.col]!
          const room = perRoom.get(id) ?? { kinds: new Map(), lone: 0 }
          perRoom.set(id, room)
          room.kinds.set(kindOf(o.id), (room.kinds.get(kindOf(o.id)) ?? 0) + 1)
          const atTable = o.cells.some((c) => [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => SEAT_AT_TYPES.has(typeAt.get(`${c.row + dr!},${c.col + dc!}`) ?? '')))
          if (o.type === 'chair' && !atTable) room.lone++
        }
        for (const [id, room] of perRoom) {
          for (const [kind, n] of room.kinds) if (n > MAX_KIND_PER_ROOM) problems.push(`${size}x${size} seed ${seed} ${id}: ${n}x ${kind}`)
          if (room.lone > MAX_FREE_CHAIRS_PER_ROOM) problems.push(`${size}x${size} seed ${seed} ${id}: ${room.lone} lone chairs`)
        }
      }
      expect(problems).toEqual([])
    })

    it('places most kinds somewhere', () => {
      const seen = new Set(scenes.flatMap(({ scene }) => scene.objects.map((o) => kindOf(o.id))))
      expect(theme.objects.filter((o) => !seen.has(o.kind)).map((o) => o.kind)).toEqual([])
    })

    for (const year of [2026, 2027]) {
      it(`${year}: a generated December never has the same set of rooms two days in a row (the first seed of each day's window)`, () => {
        const plans = planDays(`${year}-12-01`, 31)
        const sets = plans.map((p) => [...new Set(generateScene({ width: p.size, height: p.size, theme, seed: p.seed }).rooms.map((r) => r.name))].sort().join('|'))
        for (let i = 1; i < sets.length; i++) expect(sets[i], plans[i]!.date).not.toBe(sets[i - 1])
        expect(new Set(sets).size).toBeGreaterThan(25)
      })
    }
  })

  describe('calendar', () => {
    it('has a rule that gives Christmas 1 to 31 December and nothing around it, once registered', () => {
      const withChristmas = (id: string) => id === 'christmas'
      for (let d = 1; d <= 31; d++) expect(seasonalThemeOf(`2026-12-${String(d).padStart(2, '0')}`, withChristmas)).toBe('christmas')
      for (const date of ['2026-11-30', '2027-01-01', '2027-11-30']) expect(seasonalThemeOf(date, withChristmas), date).toBeUndefined()
    })

    // SLAY-18.10 enables this when it registers the theme and regenerates December.
    it.skip('SLAY-18.10 enables: the picker plans Christmas for every day of December', () => {
      for (const plan of planDays('2026-12-01', 31)) expect(themeOf(plan.date), plan.date).toBe('christmas')
    })
  })
})
