import { HOME_THEME } from './home.ts'
import { SCHOOL_THEME } from './school.ts'
import { rect, themeObject } from './define.ts'
import type { RoomType, SceneTheme, ThemeObject, ThemeRoom } from './types.ts'

/**
 * The Christmas theme (SLAY-18.8): Santa's village for all of December, built from the owner-approved draft of SLAY-18.5
 * (docs/themes/seasonal/christmas.theme.ts): a workshop, a stable, a market and a chapel under snow, with trees, presents, a sleigh, reindeer
 * and gingerbread. 18 rooms, so 31 days in a row stay varied. Seasonal: picked by the calendar (src/schedule/calendar.ts) once SLAY-18.10
 * registers it, never part of the rotation.
 *
 * Changes from the draft, each forced by a rule of the engine or epic 17:
 * - The plain chair is the only chair (SLAY-17.2): the draft's armchair is the Home `chair`.
 * - Beds, sofa, wardrobe, toy chest, dining table and kitchen counter are the existing kinds (same nouns and art), not new ones.
 * - No stairs (CAD-8.6, `themes.test.ts`); the sleigh is a vehicle, so it only stands in the garage-type Sleigh Shed (rooms.test.ts).
 * - Fir tree, poinsettia, holly, fur rug, workbench, toy shelf and market stall get their own drawing, so the Dutch noun names what is drawn;
 *   the counter of the Hot Chocolate Bar and the market is a hot chocolate counter of its own.
 * - The hay bale and the fireplace have ids of their own (`stableHay`, `stockingFireplace`) so they never clash with another seasonal theme.
 * - Dining Room and Attic, names Home already uses, keep Home's floor (a theme floor applies to every room of that name).
 */

const OUTDOOR: RoomType = 'outdoor'

/** An existing object kind kept as it is (same nouns and art), with the allowed rooms of the village. */
function reuse(theme: SceneTheme, kind: string, allowedRoomTypes: RoomType[], maxPerRoom?: number): ThemeObject {
  const found = theme.objects.find((o) => o.kind === kind)
  if (!found) throw new Error(`no ${theme.id} object "${kind}"`)
  return { ...found, allowedRoomTypes, ...(maxPerRoom === undefined ? {} : { maxPerRoom }) }
}

export const CHRISTMAS_ROOMS: ThemeRoom[] = [
  { name: 'Elf Workshop', nameNl: 'Elfenwerkplaats', favours: ['workbench', 'toyShelf', 'present', 'toyChest'], roomTypes: ['workshop'], floor: 'wood' },
  { name: 'Toy Room', nameNl: 'Speelgoedkamer', favours: ['rockingHorse', 'toyShelf', 'toyChest', 'furRug'], roomTypes: ['workshop'], floor: 'carpet' },
  { name: 'Wrapping Room', nameNl: 'Inpakkamer', favours: ['present', 'workbench', 'chair'], roomTypes: ['workshop'], floor: 'carpet' },
  { name: 'Letter Room', nameNl: 'Brievenkamer', favours: ['workbench', 'chair', 'toyShelf', 'cupboard'], roomTypes: ['study'], floor: 'wood' },
  { name: 'Gingerbread Kitchen', nameNl: 'Peperkoekkeuken', favours: ['kitchenCounter', 'gingerbreadHouse', 'diningTable', 'cupboard'], roomTypes: ['kitchen'], floor: 'tiles' },
  { name: 'Dining Room', nameNl: 'Eetkamer', favours: ['diningTable', 'chair', 'christmasTree', 'stockingFireplace'], roomTypes: ['dining'] },
  { name: 'Fireside Lounge', nameNl: 'Haardkamer', favours: ['stockingFireplace', 'sofa', 'christmasTree', 'furRug'], roomTypes: ['living'], floor: 'wood' },
  { name: "Children's Bedroom", nameNl: 'Kinderslaapkamer', favours: ['singleBed', 'toyChest', 'rockingHorse', 'wardrobe'], roomTypes: ['sleeping'], floor: 'carpet' },
  { name: 'Elf Dormitory', nameNl: 'Elfenslaapzaal', favours: ['singleBed', 'wardrobe', 'toyChest'], roomTypes: ['sleeping'], floor: 'carpet' },
  { name: 'Attic', nameNl: 'Zolder', favours: ['toyChest', 'present', 'wardrobe'], roomTypes: ['storage'] },
  { name: 'Reindeer Stable', nameNl: 'Rendierstal', favours: ['reindeer', 'stableHay', 'woodBench'], roomTypes: ['stable'], floor: 'stone' },
  { name: 'Sleigh Shed', nameNl: 'Sleeschuur', favours: ['sleigh', 'present', 'stableHay'], roomTypes: ['garage'], floor: 'stone' },
  { name: 'Snowy Garden', nameNl: 'Besneeuwde tuin', favours: ['snowman', 'firTree', 'holly', 'woodBench'], roomTypes: [OUTDOOR], outdoor: true, floor: 'water' },
  { name: 'Snowman Meadow', nameNl: 'Sneeuwpoppenweide', favours: ['snowman', 'firTree', 'reindeer'], roomTypes: [OUTDOOR], outdoor: true, floor: 'water' },
  { name: 'Ice Rink', nameNl: 'IJsbaan', favours: ['woodBench', 'christmasTree', 'snowman'], roomTypes: [OUTDOOR], outdoor: true, floor: 'water' },
  { name: 'Christmas Market', nameNl: 'Kerstmarkt', favours: ['marketStall', 'christmasTree', 'gingerbreadHouse', 'cocoaCounter'], roomTypes: ['market', OUTDOOR], outdoor: true, floor: 'stone' },
  { name: 'Hot Chocolate Bar', nameNl: 'Chocolademelkbar', favours: ['cocoaCounter', 'chair', 'marketStall', 'christmasTree'], roomTypes: ['party'], floor: 'tiles' },
  { name: 'Chapel', nameNl: 'Kapel', favours: ['woodBench', 'christmasTree', 'poinsettia'], roomTypes: ['chapel'], floor: 'stone' },
]

export const CHRISTMAS_OBJECTS: ThemeObject[] = [
  // Occupiable
  reuse(HOME_THEME, 'chair', ['dining', 'kitchen', 'study', 'workshop', 'party', 'living']),
  themeObject({ kind: 'rockingHorse', name: 'rocking horse', nameNl: 'hobbelpaard', engineType: 'chair', themeIcon: 'rockingHorse', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: ['workshop', 'sleeping', 'living'] }),
  reuse(HOME_THEME, 'singleBed', ['sleeping']),
  reuse(HOME_THEME, 'doubleBed', ['sleeping']),
  reuse(HOME_THEME, 'sofa', ['living', 'party'], 1),
  themeObject({ kind: 'furRug', name: 'fur rug', nameNl: 'schapenvacht', engineType: 'rug', themeIcon: 'furRug', weight: 4, footprints: [rect(2, 1), rect(2, 2, 0.5), rect(1, 1, 0.4)], placement: 'centre', allowedRoomTypes: ['living', 'sleeping', 'dining', 'workshop'] }),
  themeObject({ kind: 'stableHay', name: 'hay bale', nameNl: 'hooibaal', engineType: 'rug', themeIcon: 'stableHay', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7)], placement: 'anywhere', allowedRoomTypes: ['stable', 'garage'] }),
  themeObject({ kind: 'sleigh', name: 'sleigh', nameNl: 'slee', engineType: 'car', themeIcon: 'sleigh', weight: 2, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['garage'], excludeRoomTypes: ['sleeping'] }),
  // Blocking
  themeObject({ kind: 'christmasTree', name: 'Christmas tree', nameNl: 'kerstboom', engineType: 'tree', themeIcon: 'christmasTree', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: ['living', 'dining', 'market', 'chapel', 'party', OUTDOOR] }),
  themeObject({ kind: 'firTree', name: 'fir tree', nameNl: 'dennenboom', engineType: 'tree', themeIcon: 'firTree', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'present', name: 'present', nameNl: 'cadeau', engineType: 'chest', themeIcon: 'present', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['living', 'workshop', 'sleeping', 'dining', 'storage', 'garage', 'chapel'] }),
  themeObject({ kind: 'snowman', name: 'snowman', nameNl: 'sneeuwpop', engineType: 'statue', themeIcon: 'snowman', weight: 3, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 2, allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'reindeer', name: 'reindeer', nameNl: 'rendier', engineType: 'statue', themeIcon: 'reindeer', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 3, allowedRoomTypes: ['stable', OUTDOOR] }),
  themeObject({ kind: 'gingerbreadHouse', name: 'gingerbread house', nameNl: 'peperkoekhuisje', engineType: 'plant', themeIcon: 'gingerbreadHouse', weight: 2, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'market', 'party'] }),
  themeObject({ kind: 'stockingFireplace', name: 'fireplace', nameNl: 'open haard', engineType: 'tv', themeIcon: 'stockingFireplace', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living', 'dining', 'party'] }),
  themeObject({ kind: 'workbench', name: 'workbench', nameNl: 'werkbank', engineType: 'desk', themeIcon: 'workbench', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.6)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['workshop', 'study'] }),
  themeObject({ kind: 'toyShelf', name: 'toy shelf', nameNl: 'speelgoedkast', engineType: 'bookshelf', themeIcon: 'toyShelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['workshop', 'sleeping', 'study', 'living'] }),
  reuse(SCHOOL_THEME, 'toyChest', ['workshop', 'sleeping', 'storage']),
  reuse(HOME_THEME, 'wardrobe', ['sleeping', 'storage']),
  themeObject({ kind: 'cupboard', name: 'cupboard', nameNl: 'kast', engineType: 'cabinet', weight: 2, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'dining', 'storage', 'study'] }),
  reuse(HOME_THEME, 'kitchenCounter', ['kitchen']),
  themeObject({ kind: 'cocoaCounter', name: 'hot chocolate counter', clueNoun: 'cocoa counter', nameNl: 'chocoladetoonbank', engineType: 'kitchenCounter', themeIcon: 'cocoaCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['party', 'market'] }),
  reuse(HOME_THEME, 'diningTable', ['dining', 'kitchen']),
  themeObject({ kind: 'marketStall', name: 'market stall', nameNl: 'marktkraam', engineType: 'gardenTable', themeIcon: 'marketStall', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'centre', maxPerRoom: 3, allowedRoomTypes: ['market', 'party'] }),
  themeObject({ kind: 'woodBench', name: 'bench', nameNl: 'bankje', engineType: 'bench', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: ['chapel', 'market', OUTDOOR, 'stable'] }),
  themeObject({ kind: 'poinsettia', name: 'poinsettia', nameNl: 'kerstster', engineType: 'flowers', themeIcon: 'poinsettia', weight: 5, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['living', 'dining', 'chapel', 'party'] }),
  themeObject({ kind: 'holly', name: 'holly bush', clueNoun: 'holly bush', nameNl: 'hulststruik', engineType: 'plant', themeIcon: 'holly', weight: 5, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: [OUTDOOR, 'chapel', 'market'] }),
]

/** The finished theme, registered by SLAY-24 (which took over SLAY-18.10) with the regenerated December days. */
export const christmasTheme: SceneTheme = {
  id: 'christmas',
  seasonal: true,
  name: "Santa's village",
  nameNl: 'Kerstdorp',
  rooms: CHRISTMAS_ROOMS,
  objects: CHRISTMAS_OBJECTS,
}

/** What index.ts registers (SLAY-24, which took over SLAY-18.10, with the regenerated December days). */
export const CHRISTMAS_THEME: SceneTheme | undefined = christmasTheme
