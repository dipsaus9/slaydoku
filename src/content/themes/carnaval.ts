import { HOME_THEME } from './home.ts'
import { PARK_THEME } from './park.ts'
import { rect, themeObject } from './define.ts'
import type { RoomType, SceneTheme, ThemeObject, ThemeRoom } from './types.ts'

/**
 * The Carnaval theme (SLAY-18.7) for 11 November, Oeteldonk style: Den Bosch as Oeteldonk, red, white and yellow, the frog, the kroeg,
 * confetti and the optocht. Built from the owner-approved draft (docs/themes/seasonal/carnaval.theme.ts, SLAY-18.5). No brand, logo or
 * beer label anywhere. Seasonal: picked by the calendar (src/schedule/calendar.ts), never part of the rotation. Registration (and regenerating 11 November) is SLAY-18.10.
 *
 * Changes against the draft, from the rules epic 17 set after it: the plain chair is the only chair (the draft's bar stool was drawn as the
 * plain chair, so it is called a chair); a kind is named after what is drawn (the kroeg counter is its own bar drawing with beer taps, the
 * beer crate its own crate; the snack bar and bakery keep the kitchen counter, "aanrecht"); a parade float is a vehicle, so it stands only in
 * `garage` rooms (the float building hall, and the optocht route, which is outdoor and garage); the costume rack and dummy are the shared
 * clothes rack and mannequin. Shared room names (Dance Floor, Cloakroom) keep the floor other themes give them.
 */

const PARTY: RoomType = 'party'
const OUTDOOR: RoomType = 'outdoor'

/** A Home object kept as it is, with the allowed rooms of this theme. */
function fromHome(kind: string, allowedRoomTypes: RoomType[]): ThemeObject {
  const found = HOME_THEME.objects.find((o) => o.kind === kind)
  if (!found) throw new Error(`no Home object "${kind}"`)
  return { ...found, allowedRoomTypes }
}

/** A Park object kept as it is, with the allowed rooms of this theme. */
function fromPark(kind: string, allowedRoomTypes: RoomType[]): ThemeObject {
  const found = PARK_THEME.objects.find((o) => o.kind === kind)
  if (!found) throw new Error(`no Park object "${kind}"`)
  return { ...found, allowedRoomTypes }
}

const room = (name: string, nameNl: string, roomTypes: RoomType[], favours: string[], extra: Pick<ThemeRoom, 'outdoor' | 'floor'> = {}): ThemeRoom => ({
  name,
  nameNl,
  roomTypes,
  favours,
  ...extra,
})

export const CARNAVAL_ROOMS: ThemeRoom[] = [
  room('Pub', 'Kroeg', [PARTY], ['barCounter', 'chair', 'beerBarrel', 'beerCrate'], { floor: 'wood' }),
  room('Dance Floor', 'Dansvloer', [PARTY], ['confettiPile', 'drum', 'cafeTable']),
  room('Parade Route', 'Optochtroute', [OUTDOOR, 'garage'], ['floatCart', 'drum', 'confettiPile', 'streetBench'], { outdoor: true, floor: 'stone' }),
  room('Market Square', 'Markt', [OUTDOOR], ['frog', 'limeTree', 'streetBench', 'cafeTable'], { outdoor: true, floor: 'stone' }),
  room('Float Building Hall', 'Wagenbouwhal', ['garage'], ['floatCart', 'beerCrate', 'bicycle'], { floor: 'stone' }),
  room('Costume Room', 'Verkleedkamer', ['storage'], ['clothesRack', 'mannequin', 'wardrobe'], { floor: 'carpet' }),
  room('Town Hall', 'Stadhuis', ['study'], ['desk', 'bookcase', 'statue', 'frog'], { floor: 'wood' }),
  room('Snack Bar', 'Snackbar', ['kitchen'], ['kitchenCounter', 'chair', 'longTable'], { floor: 'tiles' }),
  room('Bakery', 'Bakkerij', ['kitchen'], ['kitchenCounter', 'cafeTable', 'beerCrate'], { floor: 'tiles' }),
  room('Rehearsal Room', 'Repetitieruimte', [PARTY], ['drum', 'chair', 'television'], { floor: 'carpet' }),
  room('Hotel Room', 'Hotelkamer', ['sleeping'], ['singleBed', 'doubleBed', 'wardrobe', 'television'], { floor: 'carpet' }),
  room('Cloakroom', 'Garderobe', ['storage'], ['clothesRack', 'beerCrate', 'wardrobe']),
  room('Beer Garden', 'Terras', [OUTDOOR, PARTY], ['cafeTable', 'chair', 'beerBarrel', 'barCounter'], { outdoor: true, floor: 'grass' }),
  room('Club House', 'Clubhuis', ['living', PARTY], ['sofa', 'television', 'frog', 'longTable'], { floor: 'wood' }),
  room('Binnendieze Quay', 'Binnendiezekade', [OUTDOOR], ['streetBench', 'bicycle', 'limeTree'], { outdoor: true, floor: 'water' }),
  room('Cellar', 'Kelder', ['storage'], ['beerBarrel', 'beerCrate'], { floor: 'stone' }),
]

export const CARNAVAL_OBJECTS: ThemeObject[] = [
  // Occupiable
  fromHome('chair', [PARTY, 'kitchen', 'living', 'study', OUTDOOR]),
  themeObject({ kind: 'confettiPile', name: 'confetti drift', nameNl: 'hoop confetti', engineType: 'rug', themeIcon: 'confettiPile', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7), rect(2, 2, 0.4)], placement: 'anywhere', allowedRoomTypes: [PARTY, OUTDOOR] }),
  fromHome('singleBed', ['sleeping']),
  fromHome('doubleBed', ['sleeping']),
  fromHome('sofa', ['living']),
  themeObject({ kind: 'floatCart', name: 'parade float', nameNl: 'praalwagen', engineType: 'car', themeIcon: 'floatCart', weight: 1.5, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage'] }),
  // Blocking: own drawings
  themeObject({ kind: 'frog', name: 'Oeteldonk frog', clueNoun: 'frog', nameNl: 'kikker', engineType: 'statue', themeIcon: 'frog', weight: 2, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, OUTDOOR, 'study'] }),
  themeObject({ kind: 'beerBarrel', name: 'beer barrel', nameNl: 'biervat', engineType: 'chest', themeIcon: 'beerBarrel', weight: 4, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: [PARTY, 'storage'] }),
  themeObject({ kind: 'drum', name: 'drum', nameNl: 'trommel', engineType: 'statue', themeIcon: 'drum', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: [PARTY, OUTDOOR] }),
  themeObject({ kind: 'beerCrate', name: 'beer crate', nameNl: 'bierkrat', engineType: 'chest', themeIcon: 'beerCrate', weight: 4, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: [PARTY, 'storage', 'kitchen', 'garage'] }),
  themeObject({ kind: 'barCounter', name: 'bar counter', nameNl: 'bar', engineType: 'kitchenCounter', themeIcon: 'barCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY] }),
  // Blocking: engine art
  fromHome('kitchenCounter', ['kitchen']),
  themeObject({ kind: 'cafeTable', name: 'cafe table', nameNl: 'cafétafel', engineType: 'table', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7), rect(2, 2, 0.4)], placement: 'centre', maxPerRoom: 2, allowedRoomTypes: [PARTY, OUTDOOR, 'kitchen'] }),
  themeObject({ kind: 'longTable', name: 'long table', nameNl: 'lange tafel', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'kitchen'] }),
  themeObject({ kind: 'clothesRack', name: 'clothes rack', nameNl: 'kledingrek', engineType: 'wardrobe', themeIcon: 'clothesRack', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['storage'] }),
  themeObject({ kind: 'mannequin', name: 'mannequin', nameNl: 'paspop', engineType: 'statue', themeIcon: 'mannequin', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: ['storage'] }),
  fromHome('wardrobe', ['sleeping', 'storage']),
  fromHome('desk', ['study']),
  fromHome('bookcase', ['study', 'living']),
  themeObject({ kind: 'limeTree', name: 'lime tree', nameNl: 'lindeboom', engineType: 'tree', weight: 5, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: [OUTDOOR] }),
  fromPark('statue', [OUTDOOR, 'study']),
  themeObject({ kind: 'streetBench', name: 'bench', nameNl: 'bankje', engineType: 'bench', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: [OUTDOOR] }),
  fromHome('bicycle', [OUTDOOR, 'garage']),
  fromHome('television', ['living', PARTY, 'sleeping']),
]

/** The finished theme. Not registered yet: SLAY-18.10 registers it (sets `CARNAVAL_THEME` below to it) and regenerates 11 November. */
export const carnavalTheme: SceneTheme = {
  id: 'carnaval',
  seasonal: true,
  name: 'Carnival in Oeteldonk',
  nameNl: 'Carnaval in Oeteldonk',
  rooms: CARNAVAL_ROOMS,
  objects: CARNAVAL_OBJECTS,
}

/** What `index.ts` registers: nothing until SLAY-18.10, so `SCENE_THEMES`, the picker and every scheduled day stay as they are. */
export const CARNAVAL_THEME: SceneTheme | undefined = undefined // registered by SLAY-18.10 (set to carnavalTheme)
