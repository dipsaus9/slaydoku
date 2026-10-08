import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/**
 * A family home: living, sleeping, kitchen, bathroom, garage, study and gym.
 *
 * Room rules (SLAY-17.1, docs/authoring/room-rules.md): every room has `roomTypes` and every
 * object kind an `allowedRoomTypes` list, a hard rule: the generator never places a kind in a
 * room that has none of its allowed types.
 */
export const HOME_THEME: SceneTheme = {
  id: 'home',
  name: 'Family home',
  nameNl: 'Familiehuis',
  rooms: [
    { name: 'Living Room', nameNl: 'Woonkamer', favours: ['sofa', 'cornerSofa', 'television', 'coffeeTable', 'rug', 'fireplace', 'floorLamp', 'piano'], roomTypes: ['living'] },
    { name: 'Kitchen', nameNl: 'Keuken', favours: ['kitchenCounter', 'diningTable', 'chair', 'fridge', 'bin'], roomTypes: ['kitchen'] },
    { name: 'Bedroom', nameNl: 'Slaapkamer', favours: ['singleBed', 'doubleBed', 'wardrobe', 'bedsideCabinet', 'mirror'], roomTypes: ['sleeping'] },
    { name: 'Bathroom', nameNl: 'Badkamer', favours: ['shower', 'washbasin', 'toilet', 'bathtub', 'mirror'], roomTypes: ['wet'] },
    { name: 'Toilet', nameNl: 'Toilet', favours: ['toilet', 'washbasin'], roomTypes: ['wet'] },
    { name: 'Dining Room', nameNl: 'Eetkamer', favours: ['diningTable', 'chair', 'sideboard'], roomTypes: ['dining'] },
    { name: 'Hall', nameNl: 'Hal', favours: ['chest', 'coatRack', 'shoeCabinet', 'mirror'], roomTypes: ['circulation'] },
    { name: 'Corridor', nameNl: 'Gang', favours: ['chest', 'houseplant', 'coatRack'], roomTypes: ['circulation'] },
    { name: 'Study', nameNl: 'Studeerkamer', favours: ['desk', 'bookcase', 'chair', 'aquarium', 'floorLamp'], roomTypes: ['study'] },
    { name: 'Nursery', nameNl: 'Kinderkamer', favours: ['singleBed', 'rug', 'chest', 'bedsideCabinet'], roomTypes: ['sleeping'] },
    { name: 'Guest Room', nameNl: 'Logeerkamer', favours: ['doubleBed', 'wardrobe', 'floorLamp'], roomTypes: ['sleeping'] },
    { name: 'Utility Room', nameNl: 'Bijkeuken', favours: ['washingMachine', 'dryer'], roomTypes: ['utility'] },
    { name: 'Garage', nameNl: 'Garage', favours: ['car', 'chest'], roomTypes: ['garage'] },
    { name: 'Attic', nameNl: 'Zolder', favours: ['chest', 'wardrobe'], roomTypes: ['storage'] },
    { name: 'Storeroom', nameNl: 'Bergruimte', favours: ['sideboard', 'chest'], roomTypes: ['storage'] },
    { name: 'Conservatory', nameNl: 'Serre', favours: ['houseplant', 'chair', 'rug'], roomTypes: ['living'] },
    { name: 'Library', nameNl: 'Bibliotheek', favours: ['bookcase', 'chair', 'sofa', 'rug', 'floorLamp'], roomTypes: ['study'] },
    { name: 'Home Office', nameNl: 'Thuiskantoor', favours: ['desk', 'chair', 'bookcase', 'bin'], roomTypes: ['study'] },
    { name: 'Home Gym', nameNl: 'Thuisgym', favours: ['gymMat', 'bicycle', 'television', 'exerciseBike'], roomTypes: ['fitness'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'chair', name: 'chair', nameNl: 'stoel', engineType: 'chair', weight: 2.5, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['living', 'kitchen', 'dining', 'study', 'sleeping'] }),
    themeObject({ kind: 'rug', name: 'rug', nameNl: 'kleed', engineType: 'rug', weight: 5, footprints: [rect(2, 1), rect(2, 2), rect(1, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['living', 'dining', 'study', 'sleeping', 'circulation'] }),
    themeObject({ kind: 'gymMat', name: 'gym mat', nameNl: 'sportmat', engineType: 'rug', themeIcon: 'gymMat', weight: 2.5, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['fitness'] }),
    themeObject({ kind: 'singleBed', name: 'single bed', nameNl: 'eenpersoonsbed', engineType: 'bed', weight: 3, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'doubleBed', name: 'double bed', nameNl: 'tweepersoonsbed', engineType: 'bed', weight: 2, footprints: [rect(2, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'sofa', name: 'sofa', nameNl: 'bank', engineType: 'sofa', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['living', 'study'] }),
    themeObject({ kind: 'cornerSofa', name: 'corner sofa', nameNl: 'hoekbank', engineType: 'sofa', weight: 2, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'car', name: 'car', nameNl: 'auto', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage'], excludeRoomTypes: ['sleeping'] }),
    // Blocking
    themeObject({ kind: 'coffeeTable', name: 'coffee table', nameNl: 'salontafel', engineType: 'table', weight: 4, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'diningTable', name: 'dining table', nameNl: 'eettafel', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'dining'] }),
    themeObject({ kind: 'television', name: 'television', nameNl: 'televisie', engineType: 'tv', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living', 'sleeping', 'fitness'] }),
    themeObject({ kind: 'houseplant', name: 'houseplant', nameNl: 'kamerplant', engineType: 'plant', weight: 7, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['living', 'kitchen', 'dining', 'study', 'circulation', 'sleeping'] }),
    themeObject({ kind: 'bookcase', name: 'bookcase', nameNl: 'boekenkast', engineType: 'bookshelf', weight: 4, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', allowedRoomTypes: ['study', 'living', 'sleeping', 'circulation'] }),
    themeObject({ kind: 'chest', name: 'chest', nameNl: 'kist', engineType: 'chest', weight: 3, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: ['sleeping', 'storage', 'circulation', 'garage', 'living'] }),
    themeObject({ kind: 'wardrobe', name: 'wardrobe', nameNl: 'kledingkast', engineType: 'wardrobe', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping', 'storage', 'circulation'] }),
    themeObject({ kind: 'sideboard', name: 'sideboard', nameNl: 'dressoir', engineType: 'cabinet', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: ['dining', 'living', 'kitchen', 'storage', 'circulation'] }),
    themeObject({ kind: 'desk', name: 'desk', nameNl: 'bureau', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['study', 'sleeping'] }),
    themeObject({ kind: 'kitchenCounter', name: 'kitchen counter', nameNl: 'aanrecht', engineType: 'kitchenCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen'] }),
    themeObject({ kind: 'washingMachine', name: 'washing machine', nameNl: 'wasmachine', engineType: 'washingMachine', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['utility'] }),
    themeObject({ kind: 'dryer', name: 'dryer', nameNl: 'droger', engineType: 'dryer', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['utility'] }),
    themeObject({ kind: 'toilet', name: 'toilet', nameNl: 'wc', engineType: 'toilet', weight: 1.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'washbasin', name: 'washbasin', nameNl: 'wastafel', engineType: 'sink', weight: 1.5, footprints: [rect(1, 1), rect(2, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'shower', name: 'shower', nameNl: 'douche', engineType: 'shower', weight: 1, footprints: [rect(1, 1), rect(2, 2, 0.5)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'bicycle', name: 'bicycle', nameNl: 'fiets', engineType: 'bicycle', weight: 2, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['garage', 'fitness'] }),
    // Decor (SLAY-19.1). One lamp kind: every lamp draws the engine's standing lamp, so a "table lamp" would misname it.
    themeObject({ kind: 'floorLamp', name: 'floor lamp', nameNl: 'staande lamp', engineType: 'lamp', weight: 4, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 2, allowedRoomTypes: ['living', 'sleeping', 'study', 'circulation'] }),
    themeObject({ kind: 'mirror', name: 'mirror', nameNl: 'spiegel', engineType: 'mirror', weight: 2.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['circulation', 'sleeping', 'wet'] }),
    themeObject({ kind: 'coatRack', name: 'coat rack', nameNl: 'kapstok', engineType: 'coatRack', weight: 3, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['circulation'] }),
    themeObject({ kind: 'fridge', name: 'fridge', nameNl: 'koelkast', engineType: 'fridge', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen'] }),
    themeObject({ kind: 'bathtub', name: 'bathtub', nameNl: 'bad', engineType: 'bathtub', weight: 2, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'fireplace', name: 'fireplace', nameNl: 'open haard', engineType: 'fireplace', weight: 2, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'piano', name: 'piano', nameNl: 'piano', engineType: 'piano', weight: 1.5, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'aquarium', name: 'aquarium', nameNl: 'aquarium', engineType: 'aquarium', weight: 1.5, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living', 'study'] }),
    // The cabinet art is a tall painted cupboard: a bedside cabinet and a shoe cabinet are both honest names for it, a "nightstand" or "shoe rack" would not be.
    themeObject({ kind: 'bedsideCabinet', name: 'bedside cabinet', nameNl: 'nachtkastje', engineType: 'cabinet', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'shoeCabinet', name: 'shoe cabinet', nameNl: 'schoenenkast', engineType: 'cabinet', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['circulation'] }),
    themeObject({ kind: 'exerciseBike', name: 'exercise bike', nameNl: 'hometrainer', engineType: 'exerciseBike', weight: 3, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['fitness'] }),
    themeObject({ kind: 'bin', name: 'bin', nameNl: 'prullenbak', engineType: 'bin', weight: 2.5, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'wet', 'study'] }),
  ],
}
