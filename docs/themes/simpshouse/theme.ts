import { HOME_THEME } from '../../../src/content/themes/home.ts'
import { rect, themeObject } from '../../../src/content/themes/define.ts'
import type { RoomType, SceneTheme, ThemeObject, ThemeRoom } from '../../../src/content/themes/types.ts'
import type { ThemeIconId } from '../../../src/render/icons/themes/types.ts'
import type { SimpsIconId } from './art.tsx'

/**
 * DRAFT Simpshouse theme (SLAY-18.3): a friend-group house with a lot of glamour, trading cards
 * (generic card binders and card tables, never any real card brand, name or logo) and other fun
 * elements. Written so the theme story (SLAY-18.4) can promote it unchanged: it uses the final
 * `SceneTheme` shape, the room rules of SLAY-17.1 (`roomTypes` per room, `allowedRoomTypes` per
 * object) and only two things are draft-only: the `themeIcon` ids of the new drawings (`art.tsx`,
 * not yet in `THEME_ICON_IDS`) and the Dutch object names (`OBJECT_NAMES_NL`).
 *
 * `id` stays 'home' here because `ThemeId` is a closed list; the theme story adds 'simpshouse'.
 */

/** A draft icon id as the theme type wants it. The theme story adds the ids to THEME_ICON_IDS and drops the cast. */
const draftIcon = (id: SimpsIconId): ThemeIconId => id as unknown as ThemeIconId

/** A Home object kept as it is, with the allowed rooms of this house. */
function fromHome(kind: string, allowedRoomTypes: RoomType[]): ThemeObject {
  const found = HOME_THEME.objects.find((o) => o.kind === kind)
  if (!found) throw new Error(`no Home object "${kind}"`)
  return { ...found, allowedRoomTypes }
}

const room = (name: string, nameNl: string, roomTypes: RoomType[], favours: string[]): ThemeRoom => ({ name, nameNl, roomTypes, favours })

export const SIMPSHOUSE_ROOMS: ThemeRoom[] = [
  room('Living Room', 'Woonkamer', ['living'], ['sofa', 'cornerSofa', 'television', 'coffeeTable', 'rug', 'discoBall']),
  room('Glam Lounge', 'Glamourlounge', ['living'], ['discoBall', 'cornerSofa', 'mannequin', 'beanbag', 'rug']),
  room('Card Room', 'Kaartenkamer', ['study'], ['cardTable', 'cardBinderShelf', 'chair', 'beanbag']),
  room('Game Room', 'Spelkamer', ['living'], ['arcadeCabinet', 'beanbag', 'television', 'coffeeTable']),
  room('Karaoke Room', 'Karaokekamer', ['living'], ['karaokeStage', 'discoBall', 'sofa', 'television']),
  room('Cinema Room', 'Filmzaal', ['living'], ['sofa', 'television', 'beanbag', 'rug']),
  room('Kitchen', 'Keuken', ['kitchen'], ['kitchenCounter', 'diningTable', 'chair']),
  room('Dining Room', 'Eetkamer', ['dining'], ['diningTable', 'chair', 'sideboard']),
  room('Bedroom', 'Slaapkamer', ['sleeping'], ['singleBed', 'doubleBed', 'wardrobe', 'vanity']),
  room('Guest Room', 'Logeerkamer', ['sleeping'], ['doubleBed', 'wardrobe', 'vanity']),
  room('Bathroom', 'Badkamer', ['wet'], ['shower', 'washbasin', 'toilet', 'bubbleBath']),
  room('Toilet', 'Toilet', ['wet'], ['toilet', 'washbasin']),
  room('Spa Room', 'Wellnessruimte', ['wet'], ['bubbleBath', 'washbasin', 'shower']),
  room('Dressing Room', 'Kleedkamer', ['storage'], ['clothesRack', 'mannequin', 'vanity', 'wardrobe']),
  room('Walk-in Closet', 'Inloopkast', ['storage'], ['clothesRack', 'wardrobe', 'chest']),
  room('Hall', 'Hal', ['circulation'], ['chest', 'houseplant']),
  room('Corridor', 'Gang', ['circulation'], ['chest', 'houseplant', 'cardBinderShelf']),
  room('Garage', 'Garage', ['garage'], ['car', 'chest']),
  room('Utility Room', 'Bijkeuken', ['utility'], ['washingMachine', 'dryer']),
]

export const SIMPSHOUSE_OBJECTS: ThemeObject[] = [
  // Reused from the Home theme, unchanged art
  fromHome('chair', ['living', 'kitchen', 'dining', 'study']),
  fromHome('rug', ['living', 'dining', 'circulation']),
  fromHome('singleBed', ['sleeping']),
  fromHome('doubleBed', ['sleeping']),
  fromHome('sofa', ['living']),
  fromHome('cornerSofa', ['living']),
  fromHome('car', ['garage']),
  fromHome('coffeeTable', ['living']),
  fromHome('diningTable', ['kitchen', 'dining']),
  fromHome('television', ['living']),
  fromHome('houseplant', ['living', 'dining', 'study', 'circulation']),
  fromHome('bookcase', ['study', 'living']),
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
  themeObject({ kind: 'beanbag', name: 'beanbag', engineType: 'chair', themeIcon: 'beanbag', weight: 2, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['living', 'study'] }),
  themeObject({ kind: 'mannequin', name: 'mannequin', engineType: 'statue', themeIcon: 'mannequin', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: ['living', 'storage'] }),
  themeObject({ kind: 'clothesRack', name: 'clothes rack', engineType: 'wardrobe', themeIcon: 'clothesRack', weight: 4, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['storage', 'sleeping'] }),
  // New drawings (art.tsx): the fun objects
  themeObject({ kind: 'cardBinderShelf', name: 'card binder shelf', engineType: 'bookshelf', themeIcon: draftIcon('cardBinderShelf'), weight: 4, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['study', 'living', 'circulation'] }),
  themeObject({ kind: 'cardTable', name: 'card trading table', clueNoun: 'card table', engineType: 'table', themeIcon: draftIcon('cardTable'), weight: 3, footprints: [rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['study', 'living'] }),
  themeObject({ kind: 'vanity', name: 'glam vanity', engineType: 'desk', themeIcon: draftIcon('vanity'), weight: 2.5, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping', 'storage'] }),
  themeObject({ kind: 'discoBall', name: 'disco ball', engineType: 'statue', themeIcon: draftIcon('discoBall'), weight: 2, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
  themeObject({ kind: 'karaokeStage', name: 'karaoke stage', engineType: 'rug', themeIcon: draftIcon('karaokeStage'), weight: 2.5, footprints: [rect(2, 1), rect(2, 2, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
  themeObject({ kind: 'arcadeCabinet', name: 'arcade cabinet', engineType: 'tv', themeIcon: draftIcon('arcadeCabinet'), weight: 2.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['living'] }),
  themeObject({ kind: 'bubbleBath', name: 'bubble bath', engineType: 'table', themeIcon: draftIcon('bubbleBath'), weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
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
  car: 'auto', coffeeTable: 'salontafel', diningTable: 'eettafel', television: 'televisie', houseplant: 'kamerplant', bookcase: 'boekenkast',
  chest: 'kist', wardrobe: 'kledingkast', sideboard: 'dressoir', kitchenCounter: 'keukenblok', washingMachine: 'wasmachine', dryer: 'droger',
  toilet: 'toilet', washbasin: 'wastafel', shower: 'douche', beanbag: 'zitzak', mannequin: 'paskop', clothesRack: 'kledingrek',
  cardBinderShelf: 'kaartenmappenkast', cardTable: 'ruiltafel voor kaarten', vanity: 'make-uptafel', discoBall: 'discobal',
  karaokeStage: 'karaokepodium', arcadeCabinet: 'arcadekast', bubbleBath: 'bubbelbad',
}
