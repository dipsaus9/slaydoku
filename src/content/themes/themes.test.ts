import { describe, expect, it } from 'vitest'
import { OBJECT_CATALOG, checkScene, isOccupiableType } from '../../engine/model/index.ts'
import type { Scene } from '../../engine/model/index.ts'
import { THEME_ICON_IDS } from '../../render/icons/themes/types.ts'
import { resolveThemeObjectIcon } from '../../render/icons/themes/resolve.ts'
import { OBJECT_WORDS } from '../../engine/clues/en.ts'
import { OBJECT_WORDS_NL } from '../../engine/clues/nl.ts'
import { ENGINE_ICON, drawnKinds, kindNoun, kindNounNl, specificNoun, themeObjectOf } from './drawn.ts'
import { SCENE_THEMES, getTheme, roomNameNlOf } from './index.ts'
import type { ThemeId } from './types.ts'

const REQUIRED: ThemeId[] = ['home', 'office', 'park', 'school', 'shop', 'simpshouse']

/** Kinds whose Dutch noun happens to be spelled like the English one. */
const SAME_IN_BOTH = new Set(['printer'])

describe('scene themes', () => {
  it('defines the five rotation themes and Simpshouse with unique ids', () => {
    expect(SCENE_THEMES.map((t) => t.id).sort()).toEqual([...REQUIRED].sort())
    for (const id of REQUIRED) expect(getTheme(id).id).toBe(id)
    expect(() => getTheme('nope' as ThemeId)).toThrow()
  })

  it('gives a room name reused by more than one theme the same Dutch noun everywhere (SLAY-5.2: a scene has no themeId, so roomNameNlOf resolves by name alone)', () => {
    const byName = new Map<string, Set<string>>()
    for (const theme of SCENE_THEMES) {
      for (const room of theme.rooms) byName.set(room.name, (byName.get(room.name) ?? new Set()).add(room.nameNl))
    }
    for (const [name, nls] of byName) expect([...nls], name).toHaveLength(1)
    // Spot-check the lookup itself, including a name two themes share.
    expect(roomNameNlOf('Kitchen')).toBe('Keuken')
    expect(roomNameNlOf('Staff Room')).toBe('Personeelskamer')
    expect(roomNameNlOf('not a real room')).toBeUndefined()
  })

  for (const theme of SCENE_THEMES) {
    describe(theme.id, () => {
      const occupiable = theme.objects.filter((o) => o.occupiable)
      const blocking = theme.objects.filter((o) => !o.occupiable)

      it('has at least 6 occupiable and 6 blocking object kinds', () => {
        expect(occupiable.length).toBeGreaterThanOrEqual(6)
        expect(blocking.length).toBeGreaterThanOrEqual(6)
      })

      it('has no stairs: nobody can stand on them and "stairs" clues confused players (CAD-8.6)', () => {
        expect(theme.objects.filter((o) => o.engineType === 'stairs').map((o) => o.kind)).toEqual([])
        for (const room of theme.rooms) expect(room.favours.some((k) => /stairs/.test(k)), room.name).toBe(false)
      })

      it('has enough room names for a 16x16 board, unique and non-empty', () => {
        const names = theme.rooms.map((r) => r.name)
        expect(names.length).toBeGreaterThanOrEqual(16)
        expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length)
        for (const name of names) expect(name.trim()).toBe(name)
        for (const name of names) expect(name.length).toBeGreaterThan(2)
      })

      it('has a real Dutch name for the theme and for every room, unique and non-empty (SLAY-5.2)', () => {
        expect(theme.nameNl.trim()).toBe(theme.nameNl)
        expect(theme.nameNl.length).toBeGreaterThan(2)
        const namesNl = theme.rooms.map((r) => r.nameNl)
        expect(new Set(namesNl.map((n) => n.toLowerCase())).size).toBe(namesNl.length)
        for (const room of theme.rooms) {
          expect(room.nameNl.trim(), room.name).toBe(room.nameNl)
          expect(room.nameNl.length, room.name).toBeGreaterThan(2)
          // A room whose bare English and Dutch nouns already look the same ("Toilet") is fine; the
          // check only catches a room that was left untranslated by copy-paste.
          expect(room.nameNl === room.name && !/^(toilet|garage|restaurant|lounge|lobby)$/i.test(room.name), room.name).toBe(false)
        }
      })

      it('has unique kinds and names', () => {
        expect(new Set(theme.objects.map((o) => o.kind)).size).toBe(theme.objects.length)
        for (const o of theme.objects) expect(o.name.length, o.kind).toBeGreaterThan(2)
      })

      it('has a real Dutch noun for every object kind (SLAY-17.4): singular, lower case, no article, not the English word', () => {
        for (const o of theme.objects) {
          expect(typeof o.nameNl, o.kind).toBe('string')
          expect(o.nameNl.trim(), o.kind).toBe(o.nameNl)
          expect(o.nameNl.length, o.kind).toBeGreaterThanOrEqual(2) // "wc"
          expect(o.nameNl, o.kind).toBe(o.nameNl.toLowerCase())
          expect(/^(de|het|een) /.test(o.nameNl), `${o.kind}: no article in nameNl`).toBe(false)
          // A kind whose Dutch and English nouns are spelled alike ("printer") is fine; the check catches an untranslated copy-paste.
          expect(o.nameNl === kindNoun(o) && !SAME_IN_BOTH.has(o.kind), `${o.kind}: nameNl equals the English noun`).toBe(false)
        }
      })

      it('gives kinds a player can tell apart different Dutch nouns, and never the generic noun to a kind with its own art (SLAY-17.4: the Dutch noun audit needs it)', () => {
        for (const type of new Set(theme.objects.map((o) => o.engineType))) {
          const kinds = theme.objects.filter((o) => o.engineType === type)
          const byNoun = new Map<string, Set<string>>()
          for (const o of kinds) byNoun.set(o.nameNl, (byNoun.get(o.nameNl) ?? new Set()).add(o.themeIcon ?? ENGINE_ICON))
          // one Dutch noun, one icon: two kinds drawn differently must not share a word, or "een X" would name both
          for (const [noun, icons] of byNoun) expect([...icons], `${theme.id} ${type}: "${noun}" names kinds drawn differently`).toHaveLength(1)
          // a kind with its own art must not take the generic noun, which already names the plain-icon kinds of the type
          for (const o of kinds.filter((o) => o.themeIcon)) expect(o.nameNl, `${o.kind}: nameNl is the generic noun of ${type}`).not.toBe(OBJECT_WORDS_NL[type].noun)
          // the same rule in English (it always held; pinned so both languages are checked alike)
          const byNounEn = new Map<string, Set<string>>()
          for (const o of kinds) byNounEn.set(kindNoun(o), (byNounEn.get(kindNoun(o)) ?? new Set()).add(o.themeIcon ?? ENGINE_ICON))
          for (const [noun, icons] of byNounEn) expect([...icons], `${theme.id} ${type}: "${noun}" names kinds drawn differently`).toHaveLength(1)
          for (const o of kinds.filter((o) => o.themeIcon)) expect(kindNoun(o), `${o.kind}: noun is the generic noun of ${type}`).not.toBe(OBJECT_WORDS[type].noun)
        }
      })

      it('takes the occupiable flag from the engine catalog', () => {
        for (const o of theme.objects) {
          expect(o.occupiable, o.kind).toBe(OBJECT_CATALOG[o.engineType].occupiable)
          expect(o.occupiable, o.kind).toBe(isOccupiableType(o.engineType))
        }
      })

      it('has positive weights, footprint weights and per-room caps', () => {
        for (const o of theme.objects) {
          expect(o.weight, o.kind).toBeGreaterThan(0)
          expect(o.footprints.length, o.kind).toBeGreaterThan(0)
          for (const f of o.footprints) expect(f.weight, `${o.kind} ${f.id}`).toBeGreaterThan(0)
          if (o.maxPerRoom !== undefined) expect(o.maxPerRoom, o.kind).toBeGreaterThanOrEqual(1)
        }
      })

      it('uses connected footprints of unique shapes, within the engine catalog size range', () => {
        for (const o of theme.objects) {
          const ids = o.footprints.map((f) => f.id)
          expect(new Set(ids).size, o.kind).toBe(ids.length)
          for (const f of o.footprints) {
            expect(isConnected(f.cells), `${o.kind} ${f.id}`).toBe(true)
            expect(new Set(f.cells.map((c) => `${c.row}:${c.col}`)).size, `${o.kind} ${f.id}`).toBe(f.cells.length)
            const range = OBJECT_CATALOG[o.engineType].footprint
            if (range) {
              expect(f.cells.length, `${o.kind} ${f.id}`).toBeGreaterThanOrEqual(range.minCells)
              expect(f.cells.length, `${o.kind} ${f.id}`).toBeLessThanOrEqual(range.maxCells)
            }
          }
        }
      })

      it('has an icon for every object at every footprint', () => {
        for (const o of theme.objects) {
          if (o.themeIcon) expect(THEME_ICON_IDS, o.kind).toContain(o.themeIcon)
          for (const f of o.footprints) {
            expect(resolveThemeObjectIcon(o, f.cells), `${o.kind} ${f.id}`).toBeDefined()
          }
        }
      })

      it('only favours object kinds of its own theme', () => {
        const kinds = new Set(theme.objects.map((o) => o.kind))
        for (const room of theme.rooms) {
          for (const kind of room.favours) expect(kinds.has(kind), `${room.name} favours ${kind}`).toBe(true)
        }
      })

      it('never favours a kind in a room type that kind hard-excludes (e.g. a vehicle in a sleeping room)', () => {
        const objectByKind = new Map(theme.objects.map((o) => [o.kind, o]))
        for (const room of theme.rooms) {
          const roomTypes = new Set(room.roomTypes ?? [])
          for (const kind of room.favours) {
            const excluded = objectByKind.get(kind)?.excludeRoomTypes ?? []
            expect(excluded.some((t) => roomTypes.has(t)), `${room.name} favours excluded ${kind}`).toBe(false)
          }
        }
      })

      it('hard-excludes every vehicle kind (car engine type) from every sleeping room', () => {
        const vehicles = theme.objects.filter((o) => o.engineType === 'car')
        const sleepingRooms = theme.rooms.filter((r) => r.roomTypes?.includes('sleeping'))
        if (vehicles.length === 0 || sleepingRooms.length === 0) return
        for (const vehicle of vehicles) {
          for (const room of sleepingRooms) {
            const allowed = vehicle.allowedRoomTypes.some((t) => room.roomTypes!.includes(t))
            expect(allowed && !vehicle.excludeRoomTypes?.includes('sleeping'), `${vehicle.kind} in ${room.name}`).toBe(false)
          }
        }
      })

      it('lets every object kind be favoured by at least one room', () => {
        const favoured = new Set(theme.rooms.flatMap((r) => r.favours))
        const orphans = theme.objects.filter((o) => !favoured.has(o.kind)).map((o) => o.kind)
        // Generic fillers may go unfavoured, but most kinds belong somewhere.
        expect(orphans.length).toBeLessThanOrEqual(3)
      })

      it('builds a valid engine scene from one object of every kind', () => {
        const rows = theme.objects.length * 5
        const objects = theme.objects.map((o, i) => ({
          id: `o${i}`,
          type: o.engineType,
          cells: o.footprints[0]!.cells.map((c) => ({ row: c.row + i * 5, col: c.col })),
        }))
        const scene: Scene = {
          width: 4,
          height: rows,
          rooms: [{ id: 'r', name: theme.rooms[0]!.name }],
          cellRooms: Array.from({ length: rows }, () => ['r', 'r', 'r', 'r']),
          objects,
          edgeFeatures: [],
        }
        const errors = checkScene(scene)
        expect(errors).toEqual([])
      })
    })
  }
})

function isConnected(cells: readonly { row: number; col: number }[]): boolean {
  const seen = new Set([0])
  const queue = [0]
  while (queue.length > 0) {
    const cur = queue.pop()!
    cells.forEach((c, i) => {
      const a = cells[cur]!
      if (!seen.has(i) && Math.abs(a.row - c.row) + Math.abs(a.col - c.col) === 1) {
        seen.add(i)
        queue.push(i)
      }
    })
  }
  return seen.size === cells.length
}

describe('drawn kinds (clue nouns)', () => {
  const all = SCENE_THEMES.flatMap((t) => t.objects)

  it('gives a kind name shared by several themes the same nouns (both languages), engine type and art', () => {
    for (const o of all) {
      for (const other of all.filter((x) => x.kind === o.kind)) {
        expect([other.name, other.clueNoun, other.nameNl, other.engineType, other.themeIcon], o.kind).toEqual([o.name, o.clueNoun, o.nameNl, o.engineType, o.themeIcon])
      }
    }
  })

  it('names every kind in Dutch too: no kind of any registered theme is without a nameNl (SLAY-17.4)', () => {
    const missing = SCENE_THEMES.flatMap((t) => t.objects.filter((o) => !o.nameNl || o.nameNl.trim() === '').map((o) => `${t.id}:${o.kind}`))
    expect(missing).toEqual([])
    expect(all.length).toBeGreaterThan(100)
  })

  it('draws every chair kind with the plain chair in Dutch too, one group with the generic noun; a kind with own art gets its own Dutch noun', () => {
    const chairs = drawnKinds(
      [
        { id: 'gardenChair-1', type: 'chair' as const },
        { id: 'schoolChair-1', type: 'chair' as const },
      ],
      'chair',
    )
    expect(chairs.map((g) => [g.nounsNl, specificNoun(g, 'nl')])).toEqual([[['tuinstoel', 'schoolstoel'], undefined]])
    const plants = drawnKinds(
      [
        { id: 'houseplant-1', type: 'plant' as const },
        { id: 'lavaLamp-1', type: 'plant' as const },
      ],
      'plant',
    )
    expect(plants.map((g) => [g.icon, g.nounsNl, specificNoun(g, 'nl')])).toEqual([
      [ENGINE_ICON, ['kamerplant'], 'kamerplant'],
      ['lavaLamp', ['lavalamp'], 'lavalamp'],
    ])
    expect(kindNounNl(all.find((o) => o.kind === 'filingCabinet')!)).toBe('archiefkast')
    expect(kindNounNl(all.find((o) => o.kind === 'lockers')!)).toBe('kluisje')
  })

  it('finds the theme object behind a generated object id, only for its own engine type', () => {
    expect(themeObjectOf({ id: 'gardenChair-3', type: 'chair' })?.kind).toBe('gardenChair')
    expect(themeObjectOf({ id: 'gardenChair-3', type: 'rug' })).toBeUndefined()
    expect(themeObjectOf({ id: 'plant-gallery-top', type: 'plant' })).toBeUndefined()
  })

  it('draws every chair kind with the plain chair (SLAY-17.2), one group', () => {
    const objects = [
      { id: 'gardenChair-1', type: 'chair' as const },
      { id: 'schoolChair-1', type: 'chair' as const },
      { id: 'meetingChair-1', type: 'chair' as const },
      { id: 'fittingStool-1', type: 'chair' as const },
    ]
    const groups = drawnKinds(objects, 'chair')
    expect(groups.map((g) => [g.icon, g.nouns, specificNoun(g)])).toEqual([
      [ENGINE_ICON, ['garden chair', 'school chair', 'meeting chair', 'fitting stool'], undefined],
    ])
  })

  it('has a singular clue noun for every kind that names a plural', () => {
    expect(kindNoun(all.find((o) => o.kind === 'lockers')!)).toBe('locker')
    expect(kindNoun(all.find((o) => o.kind === 'crates')!)).toBe('crate')
  })
})
