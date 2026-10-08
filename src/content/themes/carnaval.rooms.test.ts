import { describe, expect, it } from 'vitest'
import { OBJECT_WORDS } from '../../engine/clues/en.ts'
import { OBJECT_WORDS_NL } from '../../engine/clues/nl.ts'
import { OBJECT_CATALOG, checkScene, isOccupiableType } from '../../engine/model/index.ts'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES } from '../../engine/scenegen/objects.ts'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { orientedSolid } from '../../render/icons/contactSheetData.ts'
import { ORIENTATIONS } from '../../render/icons/orientation.ts'
import { MAX_Z } from '../../render/looks/project.ts'
import { CARNAVAL_THEME, carnavalTheme as theme } from './carnaval.ts'
import { ENGINE_ICON, kindNoun } from './drawn.ts'
import { SCENE_THEMES } from './index.ts'

/**
 * The Carnaval theme (SLAY-18.7) checked on its own, unregistered: the rules `themes.test.ts`, `rooms.test.ts` and the look-completeness
 * test apply to registered themes, run here against `carnavalTheme` directly. The tests that need the theme registered (the calendar
 * picks it on 11 November, no other day changes) are in carnaval.registered.test.ts, which SLAY-18.10 un-skips.
 */
const kindOf = (id: string): string => id.replace(/-\d+$/, '')
const roomsAllowing = (kind: string): string[] =>
  theme.rooms.filter((r) => theme.objects.find((o) => o.kind === kind)!.allowedRoomTypes.some((t) => r.roomTypes?.includes(t))).map((r) => r.name)

describe('carnaval theme (SLAY-18.7)', () => {
  it('is not registered yet (SLAY-18.10 registers it), so no scheduled day changes', () => {
    expect(CARNAVAL_THEME).toBeUndefined()
    expect(SCENE_THEMES.map((t) => t.id)).not.toContain('carnaval')
    expect(theme.id).toBe('carnaval')
    expect(theme.seasonal).toBe(true)
  })

  it('has at least 16 rooms with unique English and Dutch names, and a shared room name keeps its Dutch noun', () => {
    expect(theme.rooms.length).toBeGreaterThanOrEqual(16)
    expect(new Set(theme.rooms.map((r) => r.name)).size).toBe(theme.rooms.length)
    expect(new Set(theme.rooms.map((r) => r.nameNl.toLowerCase())).size).toBe(theme.rooms.length)
    for (const r of theme.rooms) {
      expect(r.nameNl.length, r.name).toBeGreaterThan(2)
      expect(r.nameNl, r.name).not.toBe(r.name)
      for (const other of SCENE_THEMES.flatMap((t) => t.rooms).filter((o) => o.name === r.name)) expect(r.nameNl, r.name).toBe(other.nameNl)
    }
    expect(theme.rooms.find((r) => r.name === 'Pub')?.nameNl).toBe('Kroeg')
  })

  it('gives a floor to its own rooms only: a room name shared with another theme keeps the floor that theme gives it', () => {
    const shared = new Set(SCENE_THEMES.flatMap((t) => t.rooms.map((r) => r.name)))
    for (const r of theme.rooms) {
      if (shared.has(r.name)) expect(r.floor, r.name).toBeUndefined()
      else expect(r.floor, r.name).toBeDefined()
    }
  })

  it('names every kind in English and Dutch: singular, lower case, no article, not the English word', () => {
    expect(new Set(theme.objects.map((o) => o.kind)).size).toBe(theme.objects.length)
    for (const o of theme.objects) {
      expect(o.name.length, o.kind).toBeGreaterThan(2)
      expect(o.nameNl, o.kind).toBe(o.nameNl.toLowerCase())
      expect(o.nameNl.trim(), o.kind).toBe(o.nameNl)
      expect(/^(de|het|een) /.test(o.nameNl), o.kind).toBe(false)
      expect(o.nameNl, o.kind).not.toBe(kindNoun(o))
    }
  })

  it('gives kinds drawn differently different nouns, and a kind with its own art never the generic noun', () => {
    for (const type of new Set(theme.objects.map((o) => o.engineType))) {
      const kinds = theme.objects.filter((o) => o.engineType === type)
      for (const pick of [(o: (typeof kinds)[number]) => o.nameNl, kindNoun]) {
        const byNoun = new Map<string, Set<string>>()
        for (const o of kinds) byNoun.set(pick(o), (byNoun.get(pick(o)) ?? new Set()).add(o.themeIcon ?? ENGINE_ICON))
        for (const [noun, icons] of byNoun) expect([...icons], `${type}: ${noun}`).toHaveLength(1)
      }
      for (const o of kinds.filter((o) => o.themeIcon)) {
        expect(o.nameNl, o.kind).not.toBe(OBJECT_WORDS_NL[type].noun)
        expect(kindNoun(o), o.kind).not.toBe(OBJECT_WORDS[type].noun)
      }
    }
  })

  it('matches every other theme on a kind name they share (nouns, engine type, art)', () => {
    for (const o of theme.objects) {
      for (const other of SCENE_THEMES.flatMap((t) => t.objects).filter((x) => x.kind === o.kind)) {
        expect([o.name, o.clueNoun, o.nameNl, o.engineType, o.themeIcon], o.kind).toEqual([other.name, other.clueNoun, other.nameNl, other.engineType, other.themeIcon])
      }
    }
  })

  it('has the plain chair as its only chair, no stairs, and enough occupiable and blocking kinds', () => {
    expect(theme.objects.filter((o) => o.engineType === 'chair').map((o) => [o.kind, o.themeIcon])).toEqual([['chair', undefined]])
    expect(theme.objects.filter((o) => o.engineType === 'stairs')).toEqual([])
    for (const o of theme.objects) expect(o.occupiable, o.kind).toBe(isOccupiableType(o.engineType))
    expect(theme.objects.filter((o) => o.occupiable).length).toBeGreaterThanOrEqual(6)
    expect(theme.objects.filter((o) => !o.occupiable).length).toBeGreaterThanOrEqual(6)
  })

  it('draws every kind as a block model at every footprint in all 8 orientations, inside the catalog size and below MAX_Z', () => {
    for (const o of theme.objects) {
      for (const fp of o.footprints) {
        const range = OBJECT_CATALOG[o.engineType].footprint
        if (range) expect(fp.cells.length, `${o.kind} ${fp.id}`).toBeGreaterThanOrEqual(range.minCells)
        if (range) expect(fp.cells.length, `${o.kind} ${fp.id}`).toBeLessThanOrEqual(range.maxCells)
        const variant = { id: fp.id, cells: fp.cells, cols: Math.max(...fp.cells.map((c) => c.col)) + 1, rows: Math.max(...fp.cells.map((c) => c.row)) + 1 }
        for (const orientation of ORIENTATIONS) {
          const solid = orientedSolid(o.engineType, o.themeIcon, variant, orientation)
          expect(solid, `${o.kind} ${fp.id} ${orientation.rotation}${orientation.mirror ? 'm' : ''}`).not.toBeNull()
        }
      }
    }
    expect(MAX_Z).toBe(96)
  })

  it('gives every kind an allow-list with an allowed room, every favour is allowed in its room, and beds and floats keep to their own rooms', () => {
    for (const o of theme.objects) expect(roomsAllowing(o.kind).length, o.kind).toBeGreaterThan(0)
    for (const r of theme.rooms) {
      expect(r.roomTypes?.length, r.name).toBeGreaterThan(0)
      for (const kind of r.favours) expect(roomsAllowing(kind), `${r.name} favours ${kind}`).toContain(r.name)
    }
    for (const o of theme.objects) if (o.engineType === 'bed') expect(o.allowedRoomTypes, o.kind).toEqual(['sleeping'])
    for (const o of theme.objects) if (o.engineType === 'car') expect(o.allowedRoomTypes, o.kind).toEqual(['garage'])
    expect(roomsAllowing('singleBed')).toEqual(['Hotel Room'])
    expect(roomsAllowing('floatCart').sort()).toEqual(['Float Building Hall', 'Parade Route'])
    expect(roomsAllowing('barCounter')).toContain('Pub')
  })

  it('never breaks a room rule, the kind cap or the chair cap over many seeds and sizes, and places every kind', () => {
    const types = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
    const byKind = new Map(theme.objects.map((o) => [o.kind, o]))
    const seen = new Set<string>()
    let placed = 0
    for (const size of [6, 7, 9, 12]) {
      for (let seed = 1; seed <= 50; seed++) {
        const scene = generateScene({ width: size, height: size, theme, seed })
        expect(checkScene(scene), `${size}x${size} seed ${seed}`).toEqual([])
        const typeAt = new Map<string, string>()
        for (const o of scene.objects) for (const c of o.cells) typeAt.set(`${c.row},${c.col}`, o.type)
        const perRoom = new Map<string, { kinds: Map<string, number>; loneChairs: number }>()
        for (const object of scene.objects) {
          const kind = kindOf(object.id)
          seen.add(kind)
          const roomId = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]!
          const roomName = scene.rooms.find((r) => r.id === roomId)!.name
          expect(byKind.get(kind)!.allowedRoomTypes.some((t) => types.get(roomName)!.includes(t)), `${size}x${size} seed ${seed}: ${kind} in ${roomName}`).toBe(true)
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
