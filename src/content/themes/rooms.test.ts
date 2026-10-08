import { describe, expect, it } from 'vitest'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { SCENE_THEMES, getTheme } from './index.ts'

/** Rooms each theme had before SLAY-17.2 (the new rooms are the ones after them); home got its extra rooms in SLAY-17.1. */
const ORIGINAL_ROOM_COUNT: Partial<Record<string, number>> = { office: 16, school: 18, park: 18, shop: 19 }

const kindOf = (id: string): string => id.replace(/-\d+$/, '')

describe('room rules (SLAY-17.1, SLAY-17.2)', () => {
  for (const theme of SCENE_THEMES) {
    describe(theme.id, () => {
      it('gives every kind an allow-list with at least one allowed room', () => {
        for (const o of theme.objects) {
          expect(o.allowedRoomTypes?.length, o.kind).toBeGreaterThan(0)
          const home = theme.rooms.some((r) => o.allowedRoomTypes.some((t) => r.roomTypes?.includes(t)))
          expect(home, `${o.kind} has no allowed room`).toBe(true)
        }
        for (const r of theme.rooms) expect(r.roomTypes?.length, r.name).toBeGreaterThan(0)
      })

      it('keeps beds, vehicles and wet fixtures to their own rooms', () => {
        const wanted: Record<string, string> = { bed: 'sleeping', car: 'garage', toilet: 'wet', sink: 'wet', shower: 'wet', bathtub: 'wet', fridge: 'kitchen' }
        for (const o of theme.objects) {
          const need = wanted[o.engineType]
          if (need) expect(o.allowedRoomTypes, o.kind).toEqual([need])
        }
      })

      it('never places a kind outside its allow-list over many seeds and sizes (SLAY-17.2: all themes)', () => {
        const types = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
        const byKind = new Map(theme.objects.map((o) => [o.kind, o]))
        let placed = 0
        for (const size of [6, 9, 12]) {
          for (let seed = 1; seed <= 60; seed++) {
            const scene = generateScene({ width: size, height: size, theme: theme.id, seed })
            for (const object of scene.objects) {
              const kind = kindOf(object.id)
              const roomId = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]!
              const roomName = scene.rooms.find((r) => r.id === roomId)!.name
              const allowed = byKind.get(kind)!.allowedRoomTypes!
              placed++
              expect(
                allowed.some((t) => types.get(roomName)!.includes(t)),
                `${size}x${size} seed ${seed}: ${kind} in ${roomName}`,
              ).toBe(true)
            }
          }
        }
        expect(placed).toBeGreaterThan(500)
      })

      it('has 2-3 rooms beyond the original pool, each with a signature object it allows', () => {
        const original = ORIGINAL_ROOM_COUNT[theme.id]
        if (original === undefined) return
        const added = theme.rooms.slice(original)
        expect(added.length).toBeGreaterThanOrEqual(2)
        expect(added.length).toBeLessThanOrEqual(3)
        for (const r of added) {
          expect(r.nameNl.length, r.name).toBeGreaterThan(0)
          const signature = r.favours.some((k) => theme.objects.find((o) => o.kind === k)!.allowedRoomTypes.some((t) => r.roomTypes!.includes(t)))
          expect(signature, r.name).toBe(true)
        }
      })

      it('allows every favours entry in its own room', () => {
        const byKind = new Map(theme.objects.map((o) => [o.kind, o]))
        for (const room of theme.rooms) {
          for (const kind of room.favours) {
            const allowed = byKind.get(kind)?.allowedRoomTypes
            expect(allowed, `${room.name} favours unknown ${kind}`).toBeDefined()
            expect(
              allowed!.some((t) => room.roomTypes?.includes(t)),
              `${room.name} favours ${kind} but does not allow it`,
            ).toBe(true)
          }
        }
      })
    })
  }

  describe('home', () => {
    const home = getTheme('home')
    const allowedIn = (kind: string): string[] =>
      home.rooms.filter((r) => home.objects.find((o) => o.kind === kind)!.allowedRoomTypes!.some((t) => r.roomTypes?.includes(t))).map((r) => r.name)

    it('assigns every object kind an allow-list and every room a type', () => {
      for (const o of home.objects) expect(o.allowedRoomTypes?.length, o.kind).toBeGreaterThan(0)
      for (const r of home.rooms) expect(r.roomTypes?.length, r.name).toBeGreaterThan(0)
    })

    it('keeps beds to sleeping rooms, sanitary ware to wet rooms, laundry to utility, cars to the garage', () => {
      expect(allowedIn('singleBed').sort()).toEqual(['Bedroom', 'Guest Room', 'Nursery'])
      expect(allowedIn('doubleBed').sort()).toEqual(['Bedroom', 'Guest Room', 'Nursery'])
      for (const kind of ['toilet', 'shower', 'washbasin']) expect(allowedIn(kind).sort(), kind).toEqual(['Bathroom', 'Toilet'])
      for (const kind of ['washingMachine', 'dryer']) expect(allowedIn(kind), kind).toEqual(['Utility Room'])
      expect(allowedIn('car')).toEqual(['Garage'])
      expect(allowedIn('kitchenCounter')).toEqual(['Kitchen'])
    })

    it('has Library, Home Office and Home Gym, each with a signature object it allows', () => {
      for (const [name, nameNl, signature] of [
        ['Library', 'Bibliotheek', 'bookcase'],
        ['Home Office', 'Thuiskantoor', 'desk'],
        ['Home Gym', 'Thuisgym', 'gymMat'],
      ] as const) {
        const room = home.rooms.find((r) => r.name === name)
        expect(room, name).toBeDefined()
        expect(room!.nameNl).toBe(nameNl)
        expect(room!.favours, name).toContain(signature)
        expect(allowedIn(signature), name).toContain(name)
      }
    })
  })
})
