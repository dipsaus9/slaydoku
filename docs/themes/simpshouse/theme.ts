import { HOME_THEME } from '../../../src/content/themes/home.ts'
import { rect, themeObject } from '../../../src/content/themes/define.ts'
import type { RoomType, SceneTheme, ThemeObject, ThemeRoom } from '../../../src/content/themes/types.ts'
import type { ThemeIconId } from '../../../src/render/icons/themes/types.ts'
import type { SimpsIconId } from './art.tsx'

/**
 * DRAFT Simpshouse theme (SLAY-18.3, round two: much more party): a friend-group house with a lot
 * of glamour, a party floor, trading cards (generic card binders and card tables, never any real
 * card brand, name or logo), salmiak sweets and a rabbit hutch on the balcony.
 *
 * Written so the theme story (SLAY-18.4) can promote it unchanged: the final `SceneTheme` shape,
 * the room rules of SLAY-17.1 (`roomTypes` per room, `allowedRoomTypes` per object). Draft-only:
 *  - the `themeIcon` ids of the new drawings (`art.tsx`, not yet in `THEME_ICON_IDS`),
 *  - two new room types, 'party' and 'outdoor' (not yet in `RoomType`, see below),
 *  - the Dutch object names (`OBJECT_NAMES_NL`),
 *  - `id: 'home'`, because `ThemeId` is a closed list; the theme story adds 'simpshouse'.
 *
 * The plain chair is the only chair look: no beanbag, no office chair.
 */

/** A draft icon id as the theme type wants it. The theme story adds the ids to THEME_ICON_IDS and drops the cast. */
const draftIcon = (id: SimpsIconId): ThemeIconId => id as unknown as ThemeIconId

/** New room types this theme needs. The theme story adds them to `RoomType` (src/content/themes/types.ts) and drops the casts. */
const PARTY = 'party' as RoomType
const OUTDOOR = 'outdoor' as RoomType

/** A Home object kept as it is, with the allowed rooms of this house. */
function fromHome(kind: string, allowedRoomTypes: RoomType[]): ThemeObject {
  const found = HOME_THEME.objects.find((o) => o.kind === kind)
  if (!found) throw new Error(`no Home object "${kind}"`)
  return { ...found, allowedRoomTypes }
}

const room = (name: string, nameNl: string, roomTypes: RoomType[], favours: string[], outdoor = false): ThemeRoom => ({
  name,
  nameNl,
  roomTypes,
  favours,
  ...(outdoor ? { outdoor: true } : {}),
})

export const SIMPSHOUSE_ROOMS: ThemeRoom[] = [
  room('Living Room', 'Woonkamer', ['living'], ['sofa', 'cornerSofa', 'television', 'coffeeTable', 'rug', 'lavaLamp']),
  room('Glam Lounge', 'Glamourlounge', ['living'], ['discoBall', 'cornerSofa', 'mannequin', 'goldMirror', 'redCarpet']),
  room('Glam Room', 'Glamourkamer', ['storage'], ['goldMirror', 'shoeWall', 'vanity', 'clothesRack']),
  room('Card Room', 'Kaartenkamer', ['study'], ['cardTable', 'cardBinderShelf', 'chair', 'photoWall']),
  room('Game Room', 'Spelkamer', ['living'], ['arcadeCabinet', 'television', 'coffeeTable', 'lavaLamp']),
  room('Karaoke Room', 'Karaokekamer', ['living'], ['karaokeStage', 'discoBall', 'sofa', 'television']),
  room('Cinema Room', 'Filmzaal', ['living'], ['sofa', 'television', 'rug', 'lavaLamp']),
  room('Dance Floor', 'Dansvloer', [PARTY], ['danceFloor', 'djBooth', 'discoBall', 'confettiCannon', 'balloons']),
  room('Cocktail Lounge', 'Cocktaillounge', [PARTY], ['cocktailBar', 'champagneTower', 'sofa', 'redCarpet']),
  room('Candy Corner', 'Snoephoek', [PARTY], ['salmiakTable', 'snackTable', 'balloons']),
  room('Photo Studio', 'Fotostudio', [PARTY], ['photoBooth', 'photoWall', 'redCarpet', 'goldMirror']),
  room('Balcony', 'Balkon', [OUTDOOR], ['rabbitHutch', 'houseplant', 'balloons', 'chair'], true),
  room('Kitchen', 'Keuken', ['kitchen'], ['kitchenCounter', 'diningTable', 'chair', 'snackTable']),
  room('Dining Room', 'Eetkamer', ['dining'], ['diningTable', 'chair', 'sideboard', 'champagneTower']),
  room('Bedroom', 'Slaapkamer', ['sleeping'], ['singleBed', 'doubleBed', 'wardrobe', 'vanity']),
  room('Guest Room', 'Logeerkamer', ['sleeping'], ['doubleBed', 'wardrobe', 'vanity']),
  room('Bathroom', 'Badkamer', ['wet'], ['shower', 'washbasin', 'toilet', 'bubbleBath']),
  room('Toilet', 'Toilet', ['wet'], ['toilet', 'washbasin']),
  room('Spa Room', 'Wellnessruimte', ['wet'], ['bubbleBath', 'washbasin', 'shower']),
  room('Dressing Room', 'Kleedkamer', ['storage'], ['clothesRack', 'mannequin', 'vanity', 'wardrobe']),
  room('Walk-in Closet', 'Inloopkast', ['storage'], ['clothesRack', 'wardrobe', 'chest', 'shoeWall']),
  room('Hall', 'Hal', ['circulation'], ['chest', 'houseplant', 'redCarpet']),
  room('Corridor', 'Gang', ['circulation'], ['chest', 'houseplant', 'cardBinderShelf', 'goldMirror']),
  room('Garage', 'Garage', ['garage'], ['car', 'chest']),
  room('Utility Room', 'Bijkeuken', ['utility'], ['washingMachine', 'dryer']),
]

export const SIMPSHOUSE_OBJECTS: ThemeObject[] = [
  // Reused from the Home theme, unchanged art
  fromHome('chair', ['living', 'kitchen', 'dining', 'study', PARTY, OUTDOOR]),
  fromHome('rug', ['living', 'dining', 'circulation']),
  fromHome('singleBed', ['sleeping']),
  fromHome('doubleBed', ['sleeping']),
  fromHome('sofa', ['living', PARTY]),
  fromHome('cornerSofa', ['living', PARTY]),
  fromHome('car', ['garage']),
  fromHome('coffeeTable', ['living']),
  fromHome('diningTable', ['kitchen', 'dining']),
  fromHome('television', ['living']),
  fromHome('houseplant', ['living', 'dining', 'study', 'circulation', OUTDOOR]),
  fromHome('chest', ['sleeping', 'storage', 'circulation', 'garage']),
  fromHome('wardrobe', ['sleeping', 'storage']),
  fromHome('sideboard', ['dining', 'living', 'kitchen', 'circulation']),
  fromHome('kitchenCounter', ['kitchen']),
  fromHome('washingMachine', ['utility']),
  fromHome('dryer', ['utility']),
  fromHome('toilet', ['wet']),
  fromHome('washbasin', ['wet']),
  fromHome('shower', ['wet']),
  // Art other themes already draw
  themeObject({ kind: 'mannequin', name: 'mannequin', engineType: 'statue', themeIcon: 'mannequin', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: ['living', 'storage'] }),
  themeObject({ kind: 'clothesRack', name: 'clothes rack', engineType: 'wardrobe', themeIcon: 'clothesRack', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['storage', 'sleeping'] }),
  // New drawings, round one: cards, glam and play
  themeObject({ kind: 'cardBinderShelf', name: 'card binder shelf', engineType: 'bookshelf', themeIcon: draftIcon('cardBinderShelf'), weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['study', 'living', 'circulation'] }),
  themeObject({ kind: 'cardTable', name: 'card trading table', clueNoun: 'card table', engineType: 'table', themeIcon: draftIcon('cardTable'), weight: 3, footprints: [rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['study', 'living'] }),
  themeObject({ kind: 'vanity', name: 'glam vanity', engineType: 'desk', themeIcon: draftIcon('vanity'), weight: 2.5, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping', 'storage'] }),
  themeObject({ kind: 'discoBall', name: 'disco ball', engineType: 'statue', themeIcon: draftIcon('discoBall'), weight: 2, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living', PARTY] }),
  themeObject({ kind: 'karaokeStage', name: 'karaoke stage', engineType: 'rug', themeIcon: draftIcon('karaokeStage'), weight: 2.5, footprints: [rect(2, 1), rect(2, 2, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living', PARTY] }),
  themeObject({ kind: 'arcadeCabinet', name: 'arcade cabinet', engineType: 'tv', themeIcon: draftIcon('arcadeCabinet'), weight: 2.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['living', PARTY] }),
  themeObject({ kind: 'bubbleBath', name: 'bubble bath', engineType: 'table', themeIcon: draftIcon('bubbleBath'), weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
  // New drawings, round two: garden, glamour, party and sweets
  themeObject({ kind: 'rabbitHutch', name: 'rabbit hutch', engineType: 'chest', themeIcon: draftIcon('rabbitHutch'), weight: 5, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'redCarpet', name: 'red carpet', engineType: 'rug', themeIcon: draftIcon('redCarpet'), weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'living', 'circulation'] }),
  themeObject({ kind: 'champagneTower', name: 'champagne tower', engineType: 'statue', themeIcon: draftIcon('champagneTower'), weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'dining'] }),
  themeObject({ kind: 'goldMirror', name: 'gold mirror', engineType: 'cabinet', themeIcon: draftIcon('goldMirror'), weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: [PARTY, 'storage', 'sleeping', 'living', 'circulation'] }),
  themeObject({ kind: 'shoeWall', name: 'glitter shoe wall', clueNoun: 'shoe wall', engineType: 'bookshelf', themeIcon: draftIcon('shoeWall'), weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['storage'] }),
  themeObject({ kind: 'photoWall', name: 'photo wall', engineType: 'easel', themeIcon: draftIcon('photoWall'), weight: 2.5, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'living', 'study'] }),
  themeObject({ kind: 'djBooth', name: 'DJ booth', engineType: 'table', themeIcon: draftIcon('djBooth'), weight: 4, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY] }),
  themeObject({ kind: 'danceFloor', name: 'dance floor', engineType: 'rug', themeIcon: draftIcon('danceFloor'), weight: 4, footprints: [rect(2, 2), rect(3, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY] }),
  themeObject({ kind: 'confettiCannon', name: 'confetti cannon', engineType: 'statue', themeIcon: draftIcon('confettiCannon'), weight: 2, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 2, allowedRoomTypes: [PARTY, 'living'] }),
  themeObject({ kind: 'balloons', name: 'balloons', clueNoun: 'balloon bunch', engineType: 'plant', themeIcon: draftIcon('balloons'), weight: 3, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: [PARTY, 'living', 'dining', OUTDOOR] }),
  themeObject({ kind: 'snackTable', name: 'snack table', engineType: 'table', themeIcon: draftIcon('snackTable'), weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'dining', 'kitchen'] }),
  themeObject({ kind: 'cocktailBar', name: 'cocktail bar', engineType: 'kitchenCounter', themeIcon: draftIcon('cocktailBar'), weight: 4, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY] }),
  themeObject({ kind: 'photoBooth', name: 'photo booth', engineType: 'wardrobe', themeIcon: draftIcon('photoBooth'), weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'living', 'circulation'] }),
  themeObject({ kind: 'lavaLamp', name: 'lava lamp', engineType: 'plant', themeIcon: draftIcon('lavaLamp'), weight: 2.5, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: ['living', PARTY, 'sleeping', 'study'] }),
  themeObject({ kind: 'salmiakTable', name: 'salmiak candy table', clueNoun: 'candy table', engineType: 'table', themeIcon: draftIcon('salmiakTable'), weight: 4, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'kitchen', 'dining'] }),
]

export const SIMPSHOUSE_THEME: SceneTheme = {
  id: 'home',
  name: 'Simpshouse',
  nameNl: 'Simpshuis',
  rooms: SIMPSHOUSE_ROOMS,
  objects: SIMPSHOUSE_OBJECTS,
}

/** Dutch object names for the preview legend. Draft-only; the theme story decides where they live. */
export const OBJECT_NAMES_NL: Record<string, string> = {
  chair: 'stoel', rug: 'vloerkleed', singleBed: 'eenpersoonsbed', doubleBed: 'tweepersoonsbed', sofa: 'bank', cornerSofa: 'hoekbank',
  car: 'auto', coffeeTable: 'salontafel', diningTable: 'eettafel', television: 'televisie', houseplant: 'kamerplant',
  chest: 'kist', wardrobe: 'kledingkast', sideboard: 'dressoir', kitchenCounter: 'keukenblok', washingMachine: 'wasmachine', dryer: 'droger',
  toilet: 'toilet', washbasin: 'wastafel', shower: 'douche', mannequin: 'paskop', clothesRack: 'kledingrek',
  cardBinderShelf: 'kaartenmappenkast', cardTable: 'ruiltafel voor kaarten', vanity: 'make-uptafel', discoBall: 'discobal',
  karaokeStage: 'karaokepodium', arcadeCabinet: 'arcadekast', bubbleBath: 'bubbelbad',
  rabbitHutch: 'konijnenhok', redCarpet: 'rode loper', champagneTower: 'champagnetoren', goldMirror: 'gouden spiegel',
  shoeWall: 'glitterschoenenwand', photoWall: 'fotowand', djBooth: 'dj-booth', danceFloor: 'dansvloer', confettiCannon: 'confettikanon',
  balloons: 'ballonnen', snackTable: 'snacktafel', cocktailBar: 'cocktailbar', photoBooth: 'fotohokje', lavaLamp: 'lavalamp',
  salmiakTable: 'salmiaktafel',
}

/** The room types the theme story must add to `RoomType`. */
export const NEW_ROOM_TYPES = ['party', 'outdoor'] as const
