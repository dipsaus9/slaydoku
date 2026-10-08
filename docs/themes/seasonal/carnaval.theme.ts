import { rect } from '../../../src/content/themes/define.ts'
import type { SeasonalTheme } from './common.ts'

/**
 * Carnaval, Oeteldonk style (Den Bosch): red, white and yellow, the frog, the kroeg, confetti, the
 * optocht. Dutch words are the real ones; no brand logos, no real beer labels.
 */
export const CARNAVAL_THEME: SeasonalTheme = {
  id: 'carnaval',
  name: 'Carnival in Oeteldonk',
  nameNl: 'Carnaval in Oeteldonk',
  season: 'Carnival weekend (dates to be set by the owner)',
  seasonNl: 'Carnavalsweekend (data bepaalt de eigenaar)',
  blurb: 'Den Bosch as Oeteldonk: red, white and yellow, the frog, the kroeg, confetti and the optocht.',
  rooms: [
    { name: 'Kroeg', nameNl: 'Kroeg', favours: ['counter', 'barStool', 'barrel', 'beerCrate'], roomTypes: ['party'], floor: 'wood' },
    { name: 'Dance Floor', nameNl: 'Dansvloer', favours: ['confettiPile', 'drum', 'cafeTable'], roomTypes: ['party'], floor: 'carpet' },
    { name: 'Optocht Route', nameNl: 'Optochtroute', favours: ['floatCart', 'drum', 'confettiPile', 'bench'], roomTypes: ['outdoor'], outdoor: true, floor: 'stone' },
    { name: 'Market Square', nameNl: 'Markt', favours: ['frog', 'limeTree', 'bench', 'cafeTable'], roomTypes: ['outdoor'], outdoor: true, floor: 'stone' },
    { name: 'Float Building Hall', nameNl: 'Wagenbouwhal', favours: ['floatCart', 'beerCrate', 'bicycle'], roomTypes: ['garage'], floor: 'stone' },
    { name: 'Costume Room', nameNl: 'Verkleedkamer', favours: ['clothesRack', 'mannequin', 'wardrobe'], roomTypes: ['storage'], floor: 'carpet' },
    { name: 'Town Hall', nameNl: 'Stadhuis', favours: ['desk', 'bookcase', 'townStatue', 'frog'], roomTypes: ['study'], floor: 'wood' },
    { name: 'Snack Bar', nameNl: 'Snackbar', favours: ['counter', 'barStool', 'longTable'], roomTypes: ['kitchen'], floor: 'tiles' },
    { name: 'Bakery', nameNl: 'Bakkerij', favours: ['counter', 'cafeTable', 'beerCrate'], roomTypes: ['kitchen'], floor: 'tiles' },
    { name: 'Rehearsal Room', nameNl: 'Repetitieruimte', favours: ['drum', 'barStool', 'tv'], roomTypes: ['party'], floor: 'carpet' },
    { name: 'Hotel Room', nameNl: 'Hotelkamer', favours: ['bed', 'wardrobe', 'tv'], roomTypes: ['sleeping'], floor: 'carpet' },
    { name: 'Cloakroom', nameNl: 'Garderobe', favours: ['clothesRack', 'beerCrate', 'stairs'], roomTypes: ['storage'], floor: 'tiles' },
    { name: 'Beer Garden', nameNl: 'Terras', favours: ['cafeTable', 'barStool', 'barrel', 'counter'], roomTypes: ['outdoor', 'party'], outdoor: true, floor: 'grass' },
    { name: 'Club House', nameNl: 'Clubhuis', favours: ['sofa', 'tv', 'frog', 'longTable'], roomTypes: ['living', 'party'], floor: 'wood' },
    { name: 'Binnendieze Quay', nameNl: 'Binnendiezekade', favours: ['bench', 'bicycle', 'limeTree'], roomTypes: ['outdoor'], outdoor: true, floor: 'water' },
    { name: 'Cellar', nameNl: 'Kelder', favours: ['barrel', 'beerCrate', 'stairs'], roomTypes: ['storage'], floor: 'stone' },
  ],
  objects: [
    // Occupiable
    { kind: 'barStool', name: 'bar stool', engineType: 'chair', weight: 8, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['party', 'kitchen', 'living', 'study'] },
    { kind: 'confettiPile', name: 'confetti drift', engineType: 'rug', themeIcon: 'confettiPile', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7), rect(2, 2, 0.4)], placement: 'anywhere', allowedRoomTypes: ['party', 'outdoor'] },
    { kind: 'bed', name: 'bed', engineType: 'bed', weight: 3, footprints: [rect(1, 2), rect(2, 2, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping'] },
    { kind: 'sofa', name: 'sofa', engineType: 'sofa', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living'] },
    { kind: 'floatCart', name: 'parade float', engineType: 'car', themeIcon: 'floatCart', weight: 1.5, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage', 'outdoor'], excludeRoomTypes: ['sleeping'] },
    { kind: 'cafeTable', name: 'cafe table', engineType: 'table', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7), rect(2, 2, 0.4)], placement: 'centre', maxPerRoom: 2, allowedRoomTypes: ['party', 'outdoor', 'kitchen'] },
    // Blocking
    { kind: 'frog', name: 'Oeteldonk frog', clueNoun: 'frog', engineType: 'statue', themeIcon: 'frog', weight: 2, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['party', 'outdoor', 'study'] },
    { kind: 'barrel', name: 'beer barrel', engineType: 'chest', themeIcon: 'barrel', weight: 4, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: ['party', 'storage'] },
    { kind: 'drum', name: 'drum', engineType: 'statue', themeIcon: 'drum', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['party', 'outdoor'] },
    { kind: 'counter', name: 'counter', engineType: 'kitchenCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['party', 'kitchen'] },
    { kind: 'beerCrate', name: 'beer crate', engineType: 'chest', weight: 4, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: ['party', 'storage', 'kitchen', 'garage'] },
    { kind: 'clothesRack', name: 'costume rack', engineType: 'cabinet', themeIcon: 'clothesRack', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: ['storage'] },
    { kind: 'mannequin', name: 'costume dummy', engineType: 'statue', themeIcon: 'mannequin', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['storage'] },
    { kind: 'wardrobe', name: 'wardrobe', engineType: 'wardrobe', weight: 2, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping', 'storage'] },
    { kind: 'desk', name: 'desk', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['study'] },
    { kind: 'bookcase', name: 'bookcase', engineType: 'bookshelf', weight: 2, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', allowedRoomTypes: ['study', 'living'] },
    { kind: 'longTable', name: 'long table', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['party', 'kitchen'] },
    { kind: 'stairs', name: 'stairs', engineType: 'stairs', weight: 1, footprints: [rect(1, 2), rect(1, 3, 0.5), rect(2, 2, 0.4)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['storage'] },
    { kind: 'limeTree', name: 'lime tree', engineType: 'tree', weight: 5, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['outdoor'] },
    { kind: 'townStatue', name: 'statue', engineType: 'statue', weight: 1.5, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['outdoor', 'study'] },
    { kind: 'bench', name: 'bench', engineType: 'bench', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: ['outdoor'] },
    { kind: 'bicycle', name: 'bicycle', engineType: 'bicycle', weight: 2, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['outdoor', 'garage'] },
    { kind: 'tv', name: 'television', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living', 'party', 'sleeping'] },
    { kind: 'pottedPlant', name: 'potted plant', engineType: 'plant', weight: 4, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['living', 'kitchen', 'study', 'sleeping', 'party'] },
  ],
}
