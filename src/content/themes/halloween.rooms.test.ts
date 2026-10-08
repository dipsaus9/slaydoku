import { describe, expect, it } from 'vitest'
import { OBJECT_WORDS } from '../../engine/clues/en.ts'
import { OBJECT_WORDS_NL } from '../../engine/clues/nl.ts'
import { OBJECT_CATALOG, checkScene } from '../../engine/model/index.ts'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { ORIENTATIONS, orientCells } from '../../render/icons/orientation.ts'
import { solidFor } from '../../render/looks/solid.ts'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES } from '../../engine/scenegen/objects.ts'
import { ENGINE_ICON, kindNoun } from './drawn.ts'
import { HALLOWEEN_THEME, halloweenTheme } from './halloween.ts'
import { SCENE_THEMES } from './index.ts'

/**
 * The Halloween theme (SLAY-18.9), tested on its own: it is not registered until SLAY-18.10 (see `HALLOWEEN_THEME`), so the shared theme
 * tests (themes.test.ts, rooms.test.ts, looks/completeness.test.tsx) do not see it yet. This file runs their checks on `halloweenTheme`
 * directly; the checks that need the registration are in halloween.registered.test.ts, skipped until SLAY-18.10 enables it.
 */
const theme = halloweenTheme
const kindOf = (id: string): string => id.replace(/-\d+$/, '')

describe('Halloween theme (SLAY-18.9)', () => {
  it('is a seasonal theme, not registered yet, so every committed day keeps its theme (SLAY-18.10 registers it)', () => {
    expect(theme.seasonal).toBe(true)
    expect(HALLOWEEN_THEME).toBeUndefined()
    expect(SCENE_THEMES.some((t) => t.id === 'halloween')).toBe(false)
  })

  it('passes the shared theme checks: 6+ occupiable and blocking kinds, no stairs, unique kinds, catalog flags and sizes', () => {
    expect(theme.objects.filter((o) => o.occupiable).length).toBeGreaterThanOrEqual(6)
    expect(theme.objects.filter((o) => !o.occupiable).length).toBeGreaterThanOrEqual(6)
    expect(theme.objects.filter((o) => o.engineType === 'stairs')).toEqual([])
    expect(new Set(theme.objects.map((o) => o.kind)).size).toBe(theme.objects.length)
    expect(theme.rooms.length).toBeGreaterThanOrEqual(16)
    expect(new Set(theme.rooms.map((r) => r.nameNl.toLowerCase())).size).toBe(theme.rooms.length)
    for (const o of theme.objects) {
      expect(o.occupiable, o.kind).toBe(OBJECT_CATALOG[o.engineType].occupiable)
      expect(o.nameNl, o.kind).toBe(o.nameNl.toLowerCase())
      expect(/^(de|het|een) /.test(o.nameNl), o.kind).toBe(false)
      expect(o.nameNl === kindNoun(o), o.kind).toBe(false)
      const range = OBJECT_CATALOG[o.engineType].footprint
      for (const f of o.footprints) if (range) expect(f.cells.length, `${o.kind} ${f.id}`).toBeGreaterThanOrEqual(range.minCells)
    }
    for (const room of theme.rooms) for (const k of room.favours) expect(theme.objects.some((o) => o.kind === k), `${room.name} favours ${k}`).toBe(true)
  })

  it('gives kinds drawn differently different nouns, and never the generic noun to a kind with its own art', () => {
    for (const type of new Set(theme.objects.map((o) => o.engineType))) {
      const kinds = theme.objects.filter((o) => o.engineType === type)
      for (const lang of ['nl', 'en'] as const) {
        const byNoun = new Map<string, Set<string>>()
        for (const o of kinds) {
          const noun = lang === 'nl' ? o.nameNl : kindNoun(o)
          byNoun.set(noun, (byNoun.get(noun) ?? new Set()).add(o.themeIcon ?? ENGINE_ICON))
        }
        for (const [noun, icons] of byNoun) expect([...icons], `${type} "${noun}"`).toHaveLength(1)
      }
      for (const o of kinds.filter((o) => o.themeIcon)) {
        expect(o.nameNl, o.kind).not.toBe(OBJECT_WORDS_NL[type].noun)
        expect(kindNoun(o), o.kind).not.toBe(OBJECT_WORDS[type].noun)
      }
    }
  })

  it('keeps a kind shared with a registered theme identical (nouns, engine type, art)', () => {
    for (const o of theme.objects) {
      for (const other of SCENE_THEMES.flatMap((t) => t.objects).filter((x) => x.kind === o.kind)) {
        expect([other.name, other.clueNoun, other.nameNl, other.engineType, other.themeIcon], o.kind).toEqual([o.name, o.clueNoun, o.nameNl, o.engineType, o.themeIcon])
      }
    }
  })

  it('has block art for every kind at every footprint in all 8 orientations (the look-completeness check)', () => {
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

  it('builds valid scenes', () => {
    for (const size of [6, 9, 12]) expect(checkScene(generateScene({ width: size, height: size, theme, seed: 7 })), `${size}`).toEqual([])
  })

  it('has the rooms of the approved draft in English and Dutch, each with room types and a floor', () => {
    expect(theme.rooms.map((r) => [r.name, r.nameNl])).toEqual([
      ["Witch's Kitchen", 'Heksenkeuken'],
      ['Potion Room', 'Toverdrankkamer'],
      ['Haunted Hall', 'Spookgang'],
      ['Spooky Library', 'Spookbibliotheek'],
      ['Cobweb Cellar', 'Spinnenwebkelder'],
      ['Ghost Attic', 'Spokenzolder'],
      ['Vampire Bedroom', 'Vampierenslaapkamer'],
      ['Crypt', 'Crypte'],
      ['Graveyard', 'Kerkhof'],
      ["Witch's Garden", 'Heksentuin'],
      ['Pumpkin Patch', 'Pompoenenveld'],
      ['Trick-or-Treat Street', 'Snoepstraat'],
      ['Candy Shop', 'Snoepwinkel'],
      ['Party Hall', 'Feestzaal'],
      ['Bat Tower', 'Vleermuistoren'],
      ['Broom Shed', 'Bezemschuur'],
    ])
    for (const r of theme.rooms) {
      expect(r.roomTypes?.length, r.name).toBeGreaterThan(0)
      expect(r.floor, r.name).toBeDefined()
      expect(r.outdoor === true, r.name).toBe(r.roomTypes?.includes('outdoor') === true)
    }
  })

  it('names every kind in Dutch by what it draws', () => {
    expect(Object.fromEntries(theme.objects.map((o) => [o.kind, o.nameNl]))).toEqual({
      chair: 'stoel',
      sofa: 'bank',
      cobwebRug: 'spinnenwebkleed',
      coffin: 'doodskist',
      slimePuddle: 'slijmplas',
      ghostPortrait: 'spookportret',
      jackOLantern: 'pompoenlantaarn',
      cauldron: 'heksenketel',
      ghost: 'spook',
      tombstone: 'grafsteen',
      candyBowl: 'snoepschaal',
      broomstick: 'heksenbezem',
      deadTree: 'kale boom',
      thornyPlant: 'doornstruik',
      spellShelf: 'toverboekenkast',
      potionCabinet: 'toverdrankkast',
      alchemyDesk: 'alchemistentafel',
      candyCounter: 'snoeptoonbank',
      feastTable: 'feesttafel',
      gardenBench: 'tuinbank',
      chest: 'kist',
      wardrobe: 'kledingkast',
      kitchenCounter: 'aanrecht',
      flowerBed: 'bloemperk',
    })
  })

  it('has one chair look: every chair kind draws the plain chair', () => {
    const chairs = theme.objects.filter((o) => o.engineType === 'chair')
    expect(chairs.map((o) => o.kind)).toEqual(['chair'])
    for (const o of chairs) expect(o.themeIcon, o.kind).toBeUndefined()
  })

  it('keeps the coffin to sleeping rooms and the tombstone to the graveyard and crypt', () => {
    const allowedIn = (kind: string): string[] => {
      const o = theme.objects.find((x) => x.kind === kind)!
      return theme.rooms.filter((r) => o.allowedRoomTypes.some((t) => r.roomTypes?.includes(t))).map((r) => r.name)
    }
    expect(allowedIn('coffin').sort()).toEqual(['Crypt', 'Vampire Bedroom'])
    expect(allowedIn('tombstone').sort()).toEqual(['Crypt', 'Graveyard'])
    expect(allowedIn('candyCounter')).toEqual(['Candy Shop'])
  })

  it('never places a kind outside its allow-list, keeps chairs and kinds capped per room, over many seeds and sizes', () => {
    const types = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
    const byKind = new Map(theme.objects.map((o) => [o.kind, o]))
    let placed = 0
    for (const size of [6, 7, 9, 12]) {
      for (let seed = 1; seed <= 50; seed++) {
        const scene = generateScene({ width: size, height: size, theme, seed })
        const where = `${size}x${size} seed ${seed}`
        const typeAt = new Map<string, string>()
        for (const object of scene.objects) for (const c of object.cells) typeAt.set(`${c.row},${c.col}`, object.type)
        const perRoom = new Map<string, { kinds: Map<string, number>; freeChairs: number }>()
        for (const object of scene.objects) {
          const kind = kindOf(object.id)
          const roomId = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]!
          const roomName = scene.rooms.find((r) => r.id === roomId)!.name
          const o = byKind.get(kind)
          expect(o, `${where}: unknown kind ${kind}`).toBeDefined()
          expect(o!.allowedRoomTypes.some((t) => types.get(roomName)!.includes(t)), `${where}: ${kind} in ${roomName}`).toBe(true)
          const tally = perRoom.get(roomId) ?? { kinds: new Map(), freeChairs: 0 }
          tally.kinds.set(kind, (tally.kinds.get(kind) ?? 0) + 1)
          if (object.type === 'chair') {
            const atTable = object.cells.some((c) =>
              [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => SEAT_AT_TYPES.has(typeAt.get(`${c.row + dr!},${c.col + dc!}`) ?? '')),
            )
            if (!atTable) tally.freeChairs++
          }
          perRoom.set(roomId, tally)
          placed++
        }
        for (const [roomId, tally] of perRoom) {
          expect(tally.freeChairs, `${where}: free chairs in ${roomId}`).toBeLessThanOrEqual(MAX_FREE_CHAIRS_PER_ROOM)
          for (const [kind, n] of tally.kinds) expect(n, `${where}: ${kind} in ${roomId}`).toBeLessThanOrEqual(Math.min(MAX_KIND_PER_ROOM, byKind.get(kind)!.maxPerRoom ?? Infinity))
        }
      }
    }
    expect(placed).toBeGreaterThan(1000)
  })

})
