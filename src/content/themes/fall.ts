import { HOME_THEME } from './home.ts'
import { rect, themeObject } from './define.ts'
import type { RoomType, SceneTheme, ThemeObject, ThemeRoom } from './types.ts'

/**
 * The Fall theme (SLAY-18.6), built from the owner-approved draft of SLAY-18.5 (docs/themes/seasonal/fall.theme.ts, fall.html): an autumn
 * farm with an orchard, a pumpkin patch and a cabin in the woods. Pumpkins, hay, maple leaves, cider and a campfire; no vehicles.
 *
 * Deviations from the draft, each so a name says exactly what is drawn (docs/authoring/theme-and-icons.md, job A):
 * - the plain chair is the only chair: the draft's rocking chair is the Home `chair`;
 * - kinds that draw engine art take the Home kind of that art (bed, sofa, wardrobe, bookcase, desk, kitchen counter, dining table, coffee
 *   table, bicycle), so the counter with a hob is an "aanrecht" in the kitchen only and the Market and Cider Mill have their own pieces;
 * - the apple tree, the apple crate, the harvest table, the chrysanthemum and a cider barrel get their own drawings (the engine tree has
 *   no apples, the chest is no crate, the garden table is green metal, the flower bed no pot of mums);
 * - the hay bale and the hearth have fall-only ids (`baleOfHay`, `hearth`), because the Christmas theme draws its own hay bale and fireplace;
 * - room types tightened so no kind lands where it does not belong: the Porch is `outdoor` only (no sofa or fireplace on it), the Harvest
 *   Market is `market` only, the Greenhouse is `garden` (no trees under glass); favours follow the new kinds (Pantry and Cider Mill get the
 *   cider barrel, the Greenhouse the pumpkin).
 *
 * Seasonal: picked by the calendar (src/schedule/calendar.ts, 1-16 October and November except the 11th), never part of the rotation,
 * once SLAY-18.10 registers it (see `FALL_THEME` below).
 */

const OUTDOOR: RoomType = 'outdoor'
const FARM: RoomType = 'farm'

/** A Home object kept as it is, with the allowed rooms of the farm. */
function fromHome(kind: string, allowedRoomTypes: RoomType[]): ThemeObject {
  const found = HOME_THEME.objects.find((o) => o.kind === kind)
  if (!found) throw new Error(`no Home object "${kind}"`)
  return { ...found, allowedRoomTypes }
}

type Floor = NonNullable<ThemeRoom['floor']>

const room = (name: string, nameNl: string, roomTypes: RoomType[], floor: Floor, favours: string[], outdoor = false): ThemeRoom => ({
  name,
  nameNl,
  roomTypes,
  favours,
  floor,
  ...(outdoor ? { outdoor: true } : {}),
})

export const FALL_ROOMS: ThemeRoom[] = [
  room('Farmhouse Kitchen', 'Boerderijkeuken', ['kitchen'], 'tiles', ['kitchenCounter', 'diningTable', 'chair', 'pumpkin', 'harvestCrate']),
  room('Fireside Lounge', 'Haardkamer', ['living'], 'wood', ['hearth', 'sofa', 'chair', 'wovenRug', 'coffeeTable']),
  room('Reading Nook', 'Leeshoek', ['study'], 'carpet', ['bookcase', 'chair', 'desk', 'wovenRug']),
  room('Cabin Bedroom', 'Hutslaapkamer', ['sleeping'], 'carpet', ['singleBed', 'doubleBed', 'wardrobe', 'wovenRug']),
  room('Hayloft', 'Hooizolder', ['sleeping', FARM], 'wood', ['baleOfHay', 'singleBed', 'harvestCrate']),
  room('Barn', 'Schuur', ['storage', FARM], 'stone', ['baleOfHay', 'harvestCrate', 'scarecrow', 'bicycle']),
  room('Pantry', 'Voorraadkamer', ['storage'], 'tiles', ['pantryCupboard', 'harvestCrate', 'ciderBarrel']),
  room('Porch', 'Veranda', [OUTDOOR], 'wood', ['chair', 'pumpkin', 'gardenBench', 'chrysanthemum']),
  room('Pumpkin Patch', 'Pompoenenveld', [OUTDOOR, FARM], 'grass', ['pumpkin', 'scarecrow', 'baleOfHay'], true),
  room('Cornfield', 'Maisveld', [OUTDOOR, FARM], 'grass', ['scarecrow', 'baleOfHay', 'leafPile'], true),
  room('Apple Orchard', 'Appelboomgaard', [OUTDOOR], 'grass', ['appleTree', 'leafPile', 'gardenBench', 'harvestCrate'], true),
  room('Maple Lane', 'Esdoornlaan', [OUTDOOR], 'stone', ['mapleTree', 'leafPile', 'gardenBench'], true),
  room('Mushroom Glade', 'Paddenstoelenbos', [OUTDOOR], 'grass', ['mushroom', 'mapleTree', 'leafPile'], true),
  room('Bonfire Meadow', 'Kampvuurweide', [OUTDOOR], 'grass', ['bonfire', 'leafPile', 'gardenBench'], true),
  room('Harvest Market', 'Oogstmarkt', ['market'], 'stone', ['harvestTable', 'pumpkin', 'harvestCrate', 'gardenBench'], true),
  room('Cider Mill', 'Cidermolen', ['utility'], 'wood', ['ciderBarrel', 'harvestCrate', 'pantryCupboard']),
  room('Greenhouse', 'Kas', ['garden'], 'tiles', ['chrysanthemum', 'mushroom', 'harvestTable', 'pumpkin']),
]

export const FALL_OBJECTS: ThemeObject[] = [
  // Reused from the Home theme, unchanged art (the plain chair is the only chair)
  fromHome('chair', ['living', 'kitchen', 'study', OUTDOOR]),
  fromHome('singleBed', ['sleeping']),
  fromHome('doubleBed', ['sleeping']),
  fromHome('sofa', ['living']),
  fromHome('wardrobe', ['sleeping']),
  fromHome('bookcase', ['study', 'living']),
  fromHome('desk', ['study']),
  fromHome('kitchenCounter', ['kitchen']),
  fromHome('diningTable', ['kitchen']),
  fromHome('coffeeTable', ['living', 'study']),
  fromHome('bicycle', ['storage', OUTDOOR]),
  // Engine art under a fall name
  themeObject({ kind: 'wovenRug', name: 'woven rug', nameNl: 'geweven kleed', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living', 'study', 'sleeping'] }),
  themeObject({ kind: 'pantryCupboard', name: 'pantry cupboard', nameNl: 'voorraadkast', engineType: 'cabinet', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['storage', 'kitchen', 'utility'] }),
  themeObject({ kind: 'gardenBench', name: 'garden bench', nameNl: 'tuinbank', engineType: 'bench', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [OUTDOOR, 'market'] }),
  // Own drawings (src/render/icons/themes/fallArt.ts)
  themeObject({ kind: 'baleOfHay', name: 'hay bale', nameNl: 'hooibaal', engineType: 'rug', themeIcon: 'baleOfHay', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7), rect(2, 2, 0.4)], placement: 'anywhere', allowedRoomTypes: [FARM] }),
  themeObject({ kind: 'leafPile', name: 'leaf pile', nameNl: 'bladerhoop', engineType: 'rug', themeIcon: 'leafPile', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7), rect(2, 2, 0.4)], placement: 'anywhere', allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'pumpkin', name: 'pumpkin', nameNl: 'pompoen', engineType: 'plant', themeIcon: 'pumpkin', weight: 7, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: [FARM, 'kitchen', OUTDOOR, 'market', 'garden'] }),
  themeObject({ kind: 'mapleTree', name: 'maple tree', nameNl: 'esdoorn', engineType: 'tree', themeIcon: 'mapleTree', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'appleTree', name: 'apple tree', nameNl: 'appelboom', engineType: 'tree', themeIcon: 'appleTree', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'mushroom', name: 'toadstool', nameNl: 'paddenstoel', engineType: 'plant', themeIcon: 'mushroom', weight: 5, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 2, allowedRoomTypes: [OUTDOOR, 'garden'] }),
  themeObject({ kind: 'chrysanthemum', name: 'chrysanthemum', nameNl: 'chrysant', engineType: 'flowers', themeIcon: 'chrysanthemum', weight: 4, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: [OUTDOOR, 'garden'] }),
  themeObject({ kind: 'scarecrow', name: 'scarecrow', nameNl: 'vogelverschrikker', engineType: 'statue', themeIcon: 'scarecrow', weight: 2, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [FARM] }),
  themeObject({ kind: 'bonfire', name: 'bonfire', nameNl: 'kampvuur', engineType: 'statue', themeIcon: 'bonfire', weight: 1.5, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: [OUTDOOR] }),
  themeObject({ kind: 'hearth', name: 'fireplace', nameNl: 'open haard', engineType: 'tv', themeIcon: 'hearth', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
  themeObject({ kind: 'harvestCrate', name: 'apple crate', nameNl: 'appelkist', engineType: 'chest', themeIcon: 'harvestCrate', weight: 4, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: [FARM, 'storage', 'kitchen', 'utility', 'market', OUTDOOR] }),
  themeObject({ kind: 'ciderBarrel', name: 'cider barrel', nameNl: 'ciderton', engineType: 'chest', themeIcon: 'ciderBarrel', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['utility', 'storage'] }),
  themeObject({ kind: 'harvestTable', name: 'harvest table', nameNl: 'oogsttafel', engineType: 'gardenTable', themeIcon: 'harvestTable', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 2, allowedRoomTypes: ['market', 'garden'] }),
]

/** The complete Fall theme, tested on its own (fall.rooms.test.ts). */
export const fallTheme: SceneTheme = {
  id: 'fall',
  seasonal: true,
  name: 'Autumn farm',
  nameNl: 'Herfstboerderij',
  rooms: FALL_ROOMS,
  objects: FALL_OBJECTS,
}

/** What `SCENE_THEMES` registers (index.ts `registered(...)`): registered by SLAY-24 (which took over SLAY-18.10) with the regenerated days. */
export const FALL_THEME: SceneTheme | undefined = fallTheme
