import { HOME_THEME } from './home.ts'
import { rect, themeObject } from './define.ts'
import type { RoomType, SceneTheme, ThemeObject, ThemeRoom } from './types.ts'

/**
 * The Simpshouse theme (SLAY-18.4, promoted unchanged from the owner-approved SLAY-18.3 preview in docs/themes/simpshouse/): a
 * friend-group house with a lot of glamour, a party floor, trading cards (generic card binders and card tables, never any real card
 * brand, name or logo), a salmari (dark liquorice liqueur) shot bar and a rabbit hutch on the balcony. The Pikachu plush is the one named
 * third-party character; there is no other Pokemon wording, no Pokeball and no logo.
 *
 * The plain chair is the only chair look: no beanbag, no office chair. Seasonal: picked by the calendar (src/schedule/calendar.ts),
 * never part of the rotation.
 */

const PARTY: RoomType = 'party'
const OUTDOOR: RoomType = 'outdoor'

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
  room('Glam Room', 'Glamourkamer', ['storage'], ['goldMirror', 'shoeWall', 'vanity', 'clothesRack', 'yellowPlush']),
  room('Card Room', 'Kaartenkamer', ['study'], ['cardBinderShelf', 'cardTable', 'cardDisplayCase', 'readingNook', 'yellowPlush', 'chair']),
  room('Game Room', 'Spelkamer', ['living'], ['arcadeCabinet', 'television', 'coffeeTable', 'lavaLamp']),
  room('Karaoke Room', 'Karaokekamer', ['living'], ['karaokeStage', 'discoBall', 'sofa', 'television']),
  room('Cinema Room', 'Filmzaal', ['living'], ['sofa', 'television', 'rug', 'lavaLamp']),
  room('Dance Floor', 'Dansvloer', [PARTY], ['danceFloor', 'djBooth', 'discoBall', 'confettiCannon', 'balloons']),
  room('Cocktail Lounge', 'Cocktaillounge', [PARTY], ['cocktailBar', 'champagneTower', 'sofa', 'redCarpet']),
  room('Shot Bar', 'Shotjesbar', [PARTY], ['salmariBar', 'snackTable', 'balloons']),
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
  themeObject({ kind: 'mannequin', name: 'mannequin', nameNl: 'paspop', engineType: 'statue', themeIcon: 'mannequin', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: ['living', 'storage'] }),
  themeObject({ kind: 'clothesRack', name: 'clothes rack', nameNl: 'kledingrek', engineType: 'wardrobe', themeIcon: 'clothesRack', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['storage', 'sleeping'] }),
  // New drawings, round one: cards, glam and play
  themeObject({ kind: 'cardBinderShelf', name: 'card binder shelf', nameNl: 'mappenkast', engineType: 'bookshelf', themeIcon: 'cardBinderShelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['study', 'living', 'circulation'] }),
  themeObject({ kind: 'cardTable', name: 'card trading table', clueNoun: 'card table', nameNl: 'kaartentafel', engineType: 'table', themeIcon: 'cardTable', weight: 3, footprints: [rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['study', 'living'] }),
  themeObject({ kind: 'vanity', name: 'glam vanity', nameNl: 'kaptafel', engineType: 'desk', themeIcon: 'vanity', weight: 2.5, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping', 'storage'] }),
  themeObject({ kind: 'discoBall', name: 'disco ball', nameNl: 'discobal', engineType: 'statue', themeIcon: 'discoBall', weight: 2, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living', PARTY] }),
  themeObject({ kind: 'karaokeStage', name: 'karaoke stage', nameNl: 'karaokepodium', engineType: 'rug', themeIcon: 'karaokeStage', weight: 2.5, footprints: [rect(2, 1), rect(2, 2, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living', PARTY] }),
  themeObject({ kind: 'arcadeCabinet', name: 'arcade cabinet', nameNl: 'arcadekast', engineType: 'tv', themeIcon: 'arcadeCabinet', weight: 2.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['living', PARTY] }),
  themeObject({ kind: 'bubbleBath', name: 'bubble bath', nameNl: 'bubbelbad', engineType: 'table', themeIcon: 'bubbleBath', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
  // New drawings, round two: garden, glamour, party and sweets
  themeObject({ kind: 'rabbitHutch', name: 'rabbit hutch', nameNl: 'konijnenhok', engineType: 'chest', themeIcon: 'rabbitHutch', weight: 5, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'redCarpet', name: 'red carpet', nameNl: 'rode loper', engineType: 'rug', themeIcon: 'redCarpet', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'living', 'circulation'] }),
  themeObject({ kind: 'champagneTower', name: 'champagne tower', nameNl: 'champagnetoren', engineType: 'statue', themeIcon: 'champagneTower', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'dining'] }),
  themeObject({ kind: 'goldMirror', name: 'gold mirror', nameNl: 'gouden spiegel', engineType: 'cabinet', themeIcon: 'goldMirror', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: [PARTY, 'storage', 'sleeping', 'living', 'circulation'] }),
  themeObject({ kind: 'shoeWall', name: 'glitter shoe wall', clueNoun: 'shoe wall', nameNl: 'schoenenwand', engineType: 'bookshelf', themeIcon: 'shoeWall', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['storage'] }),
  themeObject({ kind: 'photoWall', name: 'photo wall', nameNl: 'fotowand', engineType: 'easel', themeIcon: 'photoWall', weight: 2.5, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'living', 'study'] }),
  themeObject({ kind: 'djBooth', name: 'DJ booth', nameNl: 'dj-booth', engineType: 'table', themeIcon: 'djBooth', weight: 4, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY] }),
  themeObject({ kind: 'danceFloor', name: 'dance floor', nameNl: 'dansvloer', engineType: 'rug', themeIcon: 'danceFloor', weight: 4, footprints: [rect(2, 2), rect(3, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY] }),
  themeObject({ kind: 'confettiCannon', name: 'confetti cannon', nameNl: 'confettikanon', engineType: 'statue', themeIcon: 'confettiCannon', weight: 2, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 2, allowedRoomTypes: [PARTY, 'living'] }),
  themeObject({ kind: 'balloons', name: 'balloons', clueNoun: 'balloon bunch', nameNl: 'tros ballonnen', engineType: 'plant', themeIcon: 'balloons', weight: 3, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: [PARTY, 'living', 'dining', OUTDOOR] }),
  themeObject({ kind: 'snackTable', name: 'snack table', nameNl: 'snacktafel', engineType: 'table', themeIcon: 'snackTable', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'dining', 'kitchen'] }),
  themeObject({ kind: 'cocktailBar', name: 'cocktail bar', nameNl: 'cocktailbar', engineType: 'kitchenCounter', themeIcon: 'cocktailBar', weight: 4, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY] }),
  themeObject({ kind: 'photoBooth', name: 'photo booth', nameNl: 'fotohokje', engineType: 'wardrobe', themeIcon: 'photoBooth', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'living', 'circulation'] }),
  themeObject({ kind: 'lavaLamp', name: 'lava lamp', nameNl: 'lavalamp', engineType: 'plant', themeIcon: 'lavaLamp', weight: 2.5, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: ['living', PARTY, 'sleeping', 'study'] }),
  themeObject({ kind: 'cardDisplayCase', name: 'card display case', nameNl: 'kaartenvitrine', engineType: 'cabinet', themeIcon: 'cardDisplayCase', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['study', 'living', 'circulation'] }),
  themeObject({ kind: 'readingNook', name: 'reading corner', nameNl: 'leeshoek', engineType: 'rug', themeIcon: 'readingNook', weight: 3, footprints: [rect(2, 2), rect(2, 1, 0.5)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['study', 'living'] }),
  themeObject({ kind: 'yellowPlush', name: 'Pikachu plush', clueNoun: 'plush toy', nameNl: 'knuffel', engineType: 'statue', themeIcon: 'yellowPlush', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: ['study', 'sleeping', 'storage'] }),
  themeObject({ kind: 'salmariBar', name: 'Salmari', clueNoun: 'shot tray', nameNl: 'shotjesblad', engineType: 'table', themeIcon: 'salmariBar', weight: 4, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [PARTY, 'kitchen', 'dining'] }),
]

export const SIMPSHOUSE_THEME: SceneTheme = {
  id: 'simpshouse',
  seasonal: true,
  name: 'Simpshouse',
  nameNl: 'Simpshuis',
  rooms: SIMPSHOUSE_ROOMS,
  objects: SIMPSHOUSE_OBJECTS,
}
