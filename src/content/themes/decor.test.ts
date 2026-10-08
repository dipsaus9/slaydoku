import { describe, expect, it } from 'vitest'
import { renderClue } from '../../engine/clues/index.ts'
import type { CatalogClue } from '../../engine/clues/index.ts'
import { OBJECT_CATALOG } from '../../engine/model/index.ts'
import type { ObjectType, Scene } from '../../engine/model/index.ts'
import { REGULAR_THEMES, chairShare, distinctPerRoom, measureVariety } from '../../engine/scenegen/variety.testing.ts'
import { legendOf } from '../../ui/help/legend.ts'
import { generatedPuzzles } from '../generated.testing.ts'
import { getTheme } from './index.ts'
import type { ThemeId } from './types.ts'

/**
 * SLAY-19.1: nineteen decor object types and the kinds that put them in the five regular themes. Checks the engine entries, the room
 * allow-lists kind by kind (fridge only in the kitchen, bathtub only in wet rooms, server rack only in the server room), the clue and legend
 * words in both languages, the variety gain against the baseline measured on main before the change, and that generated puzzles use the new
 * kinds and render every clue in English and Dutch.
 */

const NEW_TYPES = [
  'lamp',
  'mirror',
  'coatRack',
  'fridge',
  'bathtub',
  'fireplace',
  'piano',
  'aquarium',
  'exerciseBike',
  'bin',
  'waterCooler',
  'serverRack',
  'globe',
  'gymBox',
  'playEquipment',
  'barbecue',
  'tent',
  'shoppingCart',
  'kiosk',
] as const satisfies readonly ObjectType[]

/** Every new kind: theme, engine type, the rooms it may stand in (by name) and its Dutch noun. */
const KINDS: readonly { theme: ThemeId; kind: string; type: ObjectType; rooms: readonly string[]; nl: string }[] = [
  { theme: 'home', kind: 'floorLamp', type: 'lamp', rooms: ['Living Room', 'Conservatory', 'Bedroom', 'Nursery', 'Guest Room', 'Study', 'Library', 'Home Office', 'Hall', 'Corridor'], nl: 'staande lamp' },
  { theme: 'home', kind: 'mirror', type: 'mirror', rooms: ['Hall', 'Corridor', 'Bedroom', 'Nursery', 'Guest Room', 'Bathroom', 'Toilet'], nl: 'spiegel' },
  { theme: 'home', kind: 'coatRack', type: 'coatRack', rooms: ['Hall', 'Corridor'], nl: 'kapstok' },
  { theme: 'home', kind: 'fridge', type: 'fridge', rooms: ['Kitchen'], nl: 'koelkast' },
  { theme: 'home', kind: 'bathtub', type: 'bathtub', rooms: ['Bathroom', 'Toilet'], nl: 'bad' },
  { theme: 'home', kind: 'fireplace', type: 'fireplace', rooms: ['Living Room', 'Conservatory'], nl: 'open haard' },
  { theme: 'home', kind: 'piano', type: 'piano', rooms: ['Living Room', 'Conservatory'], nl: 'piano' },
  { theme: 'home', kind: 'aquarium', type: 'aquarium', rooms: ['Living Room', 'Conservatory', 'Study', 'Library', 'Home Office'], nl: 'aquarium' },
  { theme: 'home', kind: 'bedsideCabinet', type: 'cabinet', rooms: ['Bedroom', 'Nursery', 'Guest Room'], nl: 'nachtkastje' },
  { theme: 'home', kind: 'shoeCabinet', type: 'cabinet', rooms: ['Hall', 'Corridor'], nl: 'schoenenkast' },
  { theme: 'home', kind: 'exerciseBike', type: 'exerciseBike', rooms: ['Home Gym'], nl: 'hometrainer' },
  { theme: 'home', kind: 'bin', type: 'bin', rooms: ['Kitchen', 'Bathroom', 'Toilet', 'Study', 'Library', 'Home Office'], nl: 'prullenbak' },
  { theme: 'office', kind: 'waterCooler', type: 'waterCooler', rooms: ['Reception', 'Coffee Corner', 'Canteen', 'Waiting Area', 'Lobby', 'Staff Room'], nl: 'waterkoeler' },
  { theme: 'office', kind: 'serverRack', type: 'serverRack', rooms: ['Server Room'], nl: 'serverrek' },
  { theme: 'office', kind: 'floorLamp', type: 'lamp', rooms: ['Open Office', 'Executive Office', 'Workroom'], nl: 'staande lamp' },
  { theme: 'office', kind: 'bin', type: 'bin', rooms: ['Meeting Room', 'Open Office', 'Executive Office', 'Mail Room', 'Coffee Corner', 'Server Room', 'Archive', 'Canteen', 'Printer Corner', 'Briefing Room', 'Workroom', 'Staff Room', 'Training Room', 'Cloakroom'], nl: 'prullenbak' },
  { theme: 'office', kind: 'coatRack', type: 'coatRack', rooms: ['Reception', 'Waiting Area', 'Lobby'], nl: 'kapstok' },
  { theme: 'school', kind: 'globe', type: 'globe', rooms: ['Classroom', 'Staff Room', 'Library', 'Principal Office', 'Music Room', 'Art Room', 'Computer Room', 'Craft Room', 'Science Room', 'Caretaker Room'], nl: 'wereldbol' },
  { theme: 'school', kind: 'waterCooler', type: 'waterCooler', rooms: ['Gym', 'Assembly Hall', 'Playground', 'Corridor'], nl: 'waterkoeler' },
  { theme: 'school', kind: 'gymBox', type: 'gymBox', rooms: ['Gym'], nl: 'springkast' },
  { theme: 'school', kind: 'slide', type: 'playEquipment', rooms: ['Playground'], nl: 'glijbaan' },
  { theme: 'school', kind: 'trophyCabinet', type: 'cabinet', rooms: ['Assembly Hall', 'Playground', 'Corridor'], nl: 'prijzenkast' },
  { theme: 'park', kind: 'lantern', type: 'lamp', rooms: ['Playground', 'Picnic Meadow', 'Rose Garden', 'Vegetable Garden', 'Terrace', 'Petting Zoo', 'Flower Meadow', 'Grove', 'Parking Lot', 'Bicycle Shelter', 'Deer Park', 'Herb Garden', 'Back Garden', 'Front Garden', 'Pavilion', 'Garden Shed', 'Orchard', 'Pond Garden', 'Duck Pond', 'Sandpit', 'Sunbathing Lawn'], nl: 'lantaarn' },
  { theme: 'park', kind: 'barbecue', type: 'barbecue', rooms: ['Terrace', 'Pavilion'], nl: 'barbecue' },
  { theme: 'park', kind: 'bin', type: 'bin', rooms: ['Playground', 'Picnic Meadow', 'Rose Garden', 'Vegetable Garden', 'Terrace', 'Petting Zoo', 'Flower Meadow', 'Grove', 'Parking Lot', 'Bicycle Shelter', 'Deer Park', 'Herb Garden', 'Back Garden', 'Front Garden', 'Pavilion', 'Garden Shed', 'Orchard', 'Pond Garden', 'Duck Pond', 'Sandpit', 'Sunbathing Lawn'], nl: 'prullenbak' },
  { theme: 'park', kind: 'slide', type: 'playEquipment', rooms: ['Playground', 'Sandpit'], nl: 'glijbaan' },
  { theme: 'park', kind: 'partyTent', type: 'tent', rooms: ['Playground', 'Picnic Meadow', 'Rose Garden', 'Vegetable Garden', 'Terrace', 'Petting Zoo', 'Flower Meadow', 'Grove', 'Deer Park', 'Herb Garden', 'Back Garden', 'Front Garden', 'Pavilion', 'Garden Shed', 'Orchard', 'Pond Garden', 'Duck Pond', 'Sandpit', 'Sunbathing Lawn'], nl: 'partytent' },
  { theme: 'park', kind: 'pottedPlant', type: 'plant', rooms: ['Terrace', 'Pavilion'], nl: 'potplant' },
  { theme: 'shop', kind: 'shoppingCart', type: 'shoppingCart', rooms: ['Checkout', 'Entrance', 'Collection Point', 'Self Checkout'], nl: 'winkelwagen' },
  { theme: 'shop', kind: 'fittingMirror', type: 'mirror', rooms: ['Fitting Rooms', 'Shoe Department'], nl: 'paskamerspiegel' },
  { theme: 'shop', kind: 'selfCheckout', type: 'kiosk', rooms: ['Checkout', 'Collection Point', 'Self Checkout'], nl: 'zelfscankiosk' },
]

/**
 * Distinct kinds per room on the fast sample (12 scenes per size, `measureVariety(theme, 12)`), measured on main at d501e50 before this
 * story; the 200-scene numbers (2.45, 2.64, 2.53, 2.92, 2.67 before; 2.78, 2.85, 2.70, 3.00, 2.72 after) are in the PR and in docs/authoring/room-rules.md.
 */
const BASELINE_DISTINCT_PER_ROOM: Record<(typeof REGULAR_THEMES)[number], number> = { home: 2.463, office: 2.647, school: 2.514, park: 2.892, shop: 2.734 }

const roomsAllowing = (theme: ThemeId, kind: string): string[] => {
  const t = getTheme(theme)
  const o = t.objects.find((x) => x.kind === kind)!
  return t.rooms.filter((r) => o.allowedRoomTypes.some((rt) => r.roomTypes?.includes(rt))).map((r) => r.name)
}

/** A one-room scene with a single object of a theme kind, for the legend words. */
const sceneWith = (kind: string, type: ObjectType): Scene => {
  const cells = OBJECT_CATALOG[type].footprint?.minCells === 4 ? [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }] : OBJECT_CATALOG[type].footprint?.minCells === 2 ? [{ row: 0, col: 0 }, { row: 0, col: 1 }] : [{ row: 0, col: 0 }]
  return { width: 3, height: 3, rooms: [{ id: 'r', name: 'Room' }], cellRooms: [['r', 'r', 'r'], ['r', 'r', 'r'], ['r', 'r', 'r']], objects: [{ id: `${kind}-1`, type, cells }], edgeFeatures: [] }
}

describe('decor objects (SLAY-19.1)', () => {
  it('adds 19 blocking engine types with footprint hints', () => {
    expect(NEW_TYPES).toHaveLength(19)
    for (const type of NEW_TYPES) {
      expect(OBJECT_CATALOG[type].occupiable, type).toBe(false)
      expect(OBJECT_CATALOG[type].footprint, type).toBeDefined()
    }
  })

  it('puts every new kind in its theme with the listed room allow-list and Dutch noun', () => {
    for (const k of KINDS) {
      const o = getTheme(k.theme).objects.find((x) => x.kind === k.kind)
      expect(o, `${k.theme}:${k.kind}`).toBeDefined()
      expect(o!.engineType, k.kind).toBe(k.type)
      expect(o!.nameNl, k.kind).toBe(k.nl)
      expect(roomsAllowing(k.theme, k.kind).sort(), `${k.theme}:${k.kind}`).toEqual([...k.rooms].sort())
    }
    // Every new engine type is used by at least one theme kind.
    for (const type of NEW_TYPES) expect(KINDS.some((k) => k.type === type), type).toBe(true)
  })

  it('keeps the hard rules: fridge only in the kitchen, bathtub only in wet rooms, server rack only in the server room, exercise bike only in the gym', () => {
    expect(roomsAllowing('home', 'fridge')).toEqual(['Kitchen'])
    expect(roomsAllowing('home', 'bathtub').sort()).toEqual(['Bathroom', 'Toilet'])
    expect(roomsAllowing('home', 'exerciseBike')).toEqual(['Home Gym'])
    expect(roomsAllowing('office', 'serverRack')).toEqual(['Server Room'])
    expect(roomsAllowing('school', 'gymBox')).toEqual(['Gym'])
    expect(roomsAllowing('school', 'slide')).toEqual(['Playground'])
  })

  it('names every new type in a clue in English and Dutch, and the legend says the kind word', () => {
    for (const k of KINDS) {
      const scene = sceneWith(k.kind, k.type)
      const ctx = { scene, people: [{ id: 'A', kind: 'suspect' as const, label: 'Ann' }] }
      const clue: CatalogClue = { personId: 'A', type: 'besideObject', args: { objectType: k.type } } as CatalogClue
      const o = getTheme(k.theme).objects.find((x) => x.kind === k.kind)!
      const en = renderClue(clue, ctx, 'en')
      const nl = renderClue(clue, ctx, 'nl')
      expect(en, k.kind).toContain(o.clueNoun ?? o.name)
      expect(nl, k.kind).toContain(k.nl)
      expect(`${en} ${nl}`).not.toMatch(/undefined|\[object/)
      const rowEn = legendOf(scene, 'en').objects.find((r) => r.type === k.type)!
      const rowNl = legendOf(scene, 'nl').objects.find((r) => r.type === k.type)!
      expect(rowEn.noun, k.kind).toBe(o.clueNoun ?? o.name)
      expect(rowNl.noun, k.kind).toBe(k.nl)
      expect(rowNl.occupiable).toBe(false)
    }
  })

  it('raises the distinct kinds per room in every theme against the baseline, keeps chairs at most 15% and still places the signature objects', () => {
    for (const theme of REGULAR_THEMES) {
      const s = measureVariety(theme, 12)
      expect(distinctPerRoom(s), theme).toBeGreaterThan(BASELINE_DISTINCT_PER_ROOM[theme])
      expect(chairShare(s), theme).toBeLessThanOrEqual(0.15)
      expect(s.violations, theme).toEqual([])
      const signature = new Set(getTheme(theme).rooms.flatMap((r) => r.favours))
      const placed = [...signature].filter((k) => s.kinds.has(k))
      expect(placed.length / signature.size, theme).toBeGreaterThanOrEqual(0.85)
      // The new kinds really get placed.
      const fresh = KINDS.filter((k) => k.theme === theme).map((k) => k.kind)
      expect(fresh.filter((k) => s.kinds.has(k)).length / fresh.length, theme).toBeGreaterThanOrEqual(0.8)
    }
  })

  it('generated puzzles of the five themes carry new kinds and render every clue in both languages', () => {
    const puzzles = generatedPuzzles().filter((p) => (REGULAR_THEMES as readonly string[]).includes(p.theme))
    expect(puzzles.length).toBeGreaterThanOrEqual(30)
    const fresh = new Set<ObjectType>(NEW_TYPES)
    let withNew = 0
    for (const { puzzle, id } of puzzles) {
      if (puzzle.scene.objects.some((o) => fresh.has(o.type))) withNew++
      const ctx = { scene: puzzle.scene, people: puzzle.people }
      for (const clue of puzzle.clues as CatalogClue[]) {
        for (const locale of ['en', 'nl'] as const) {
          const text = renderClue(clue, ctx, locale)
          expect(text.length, `${id} ${clue.type}`).toBeGreaterThan(5)
          expect(text, `${id} ${clue.type}`).not.toMatch(/undefined|\[object/)
        }
      }
    }
    // The sample is the first seed per theme, size and tier that passes the gates, so the count varies a little with the time budget under load.
    expect(withNew).toBeGreaterThanOrEqual(6)
  }, 120_000) // builds the shared generated sample (about 5 s alone, longer under a full run)
})
