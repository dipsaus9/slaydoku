import { describe, expect, it } from 'vitest'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { MAX_FREE_CHAIRS_PER_ROOM, MAX_KIND_PER_ROOM, SEAT_AT_TYPES } from '../../engine/scenegen/objects.ts'
import { addDays } from '../../schedule/dates.ts'
import { themeOf } from '../../schedule/pick.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { HALLOWEEN_THEME } from './halloween.ts'
import { SCENE_THEMES, getTheme } from './index.ts'

/** The Halloween theme (SLAY-18.9): its rooms, its Dutch nouns, the hard room rule, the chair and kind caps, and its calendar window. */
const theme = HALLOWEEN_THEME!
const kindOf = (id: string): string => id.replace(/-\d+$/, '')

describe('Halloween theme (SLAY-18.9)', () => {
  it('is registered as a seasonal theme', () => {
    expect(SCENE_THEMES).toContain(theme)
    expect(getTheme('halloween')).toBe(theme)
    expect(theme.seasonal).toBe(true)
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
      expect(r.outdoor === true, r.name).toBe(r.floor === 'grass' || r.name === 'Trick-or-Treat Street')
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
        const scene = generateScene({ width: size, height: size, theme: 'halloween', seed })
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

  it('is the theme of 17-31 October every year, and of no day outside that window', () => {
    for (const year of ['2027', '2028']) {
      for (let d = `${year}-10-17`; d <= `${year}-10-31`; d = addDays(d, 1)) expect(themeOf(d), d).toBe('halloween')
      for (let d = `${year}-01-01`, i = 0; i < 366; d = addDays(d, 1), i++) {
        const md = d.slice(5)
        if (md < '10-17' || md > '10-31') expect(themeOf(d), d).not.toBe('halloween')
      }
    }
  })

  it('leaves the theme of every committed day outside 17-31 October unchanged', () => {
    let checked = 0
    for (const day of readSchedule().days) {
      const md = day.date.slice(5)
      if (md >= '10-17' && md <= '10-31') continue
      expect(themeOf(day.date), day.date).toBe(day.theme)
      checked++
    }
    expect(checked).toBeGreaterThan(50)
  })
})
