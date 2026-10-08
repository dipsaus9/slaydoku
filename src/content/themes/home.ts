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
    { name: 'Living Room', nameNl: 'Woonkamer', favours: ['sofa', 'cornerSofa', 'television', 'coffeeTable', 'rug'], roomTypes: ['living'] },
    { name: 'Kitchen', nameNl: 'Keuken', favours: ['kitchenCounter', 'diningTable', 'chair'], roomTypes: ['kitchen'] },
    { name: 'Bedroom', nameNl: 'Slaapkamer', favours: ['singleBed', 'doubleBed', 'wardrobe'], roomTypes: ['sleeping'] },
    { name: 'Bathroom', nameNl: 'Badkamer', favours: ['shower', 'washbasin', 'toilet'], roomTypes: ['wet'] },
    { name: 'Toilet', nameNl: 'Toilet', favours: ['toilet', 'washbasin'], roomTypes: ['wet'] },
    { name: 'Dining Room', nameNl: 'Eetkamer', favours: ['diningTable', 'chair', 'sideboard'], roomTypes: ['dining'] },
    { name: 'Hall', nameNl: 'Hal', favours: ['chest'], roomTypes: ['circulation'] },
    { name: 'Corridor', nameNl: 'Gang', favours: ['chest', 'houseplant'], roomTypes: ['circulation'] },
    { name: 'Study', nameNl: 'Studeerkamer', favours: ['desk', 'bookcase', 'chair'], roomTypes: ['study'] },
    { name: 'Nursery', nameNl: 'Kinderkamer', favours: ['singleBed', 'rug', 'chest'], roomTypes: ['sleeping'] },
    { name: 'Guest Room', nameNl: 'Logeerkamer', favours: ['doubleBed', 'wardrobe'], roomTypes: ['sleeping'] },
    { name: 'Utility Room', nameNl: 'Bijkeuken', favours: ['washingMachine', 'dryer'], roomTypes: ['utility'] },
    { name: 'Garage', nameNl: 'Garage', favours: ['car', 'chest'], roomTypes: ['garage'] },
    { name: 'Attic', nameNl: 'Zolder', favours: ['chest', 'wardrobe'], roomTypes: ['storage'] },
    { name: 'Storeroom', nameNl: 'Bergruimte', favours: ['sideboard', 'chest'], roomTypes: ['storage'] },
    { name: 'Conservatory', nameNl: 'Serre', favours: ['houseplant', 'chair', 'rug'], roomTypes: ['living'] },
    { name: 'Library', nameNl: 'Bibliotheek', favours: ['bookcase', 'chair', 'sofa', 'rug'], roomTypes: ['study'] },
    { name: 'Home Office', nameNl: 'Thuiskantoor', favours: ['desk', 'chair', 'bookcase'], roomTypes: ['study'] },
    { name: 'Home Gym', nameNl: 'Thuisgym', favours: ['gymMat', 'bicycle', 'television'], roomTypes: ['fitness'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'chair', name: 'chair', engineType: 'chair', weight: 9, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['living', 'kitchen', 'dining', 'study', 'sleeping'] }),
    themeObject({ kind: 'rug', name: 'rug', engineType: 'rug', weight: 4, footprints: [rect(2, 1), rect(2, 2), rect(1, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['living', 'dining', 'study', 'sleeping', 'circulation'] }),
    themeObject({ kind: 'gymMat', name: 'gym mat', engineType: 'rug', themeIcon: 'gymMat', weight: 2.5, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['fitness'] }),
    themeObject({ kind: 'singleBed', name: 'single bed', engineType: 'bed', weight: 3, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'doubleBed', name: 'double bed', engineType: 'bed', weight: 2, footprints: [rect(2, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'sofa', name: 'sofa', engineType: 'sofa', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['living', 'study'] }),
    themeObject({ kind: 'cornerSofa', name: 'corner sofa', engineType: 'sofa', weight: 2, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'car', name: 'car', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage'], excludeRoomTypes: ['sleeping'] }),
    // Blocking
    themeObject({ kind: 'coffeeTable', name: 'coffee table', engineType: 'table', weight: 4, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'diningTable', name: 'dining table', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'dining'] }),
    themeObject({ kind: 'television', name: 'television', engineType: 'tv', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living', 'sleeping', 'fitness'] }),
    themeObject({ kind: 'houseplant', name: 'houseplant', engineType: 'plant', weight: 6, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['living', 'kitchen', 'dining', 'study', 'circulation', 'sleeping'] }),
    themeObject({ kind: 'bookcase', name: 'bookcase', engineType: 'bookshelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', allowedRoomTypes: ['study', 'living', 'sleeping', 'circulation'] }),
    themeObject({ kind: 'chest', name: 'chest', engineType: 'chest', weight: 2, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: ['sleeping', 'storage', 'circulation', 'garage', 'living'] }),
    themeObject({ kind: 'wardrobe', name: 'wardrobe', engineType: 'wardrobe', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping', 'storage', 'circulation'] }),
    themeObject({ kind: 'sideboard', name: 'sideboard', engineType: 'cabinet', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: ['dining', 'living', 'kitchen', 'storage', 'circulation'] }),
    themeObject({ kind: 'desk', name: 'desk', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['study', 'sleeping'] }),
    themeObject({ kind: 'kitchenCounter', name: 'kitchen counter', engineType: 'kitchenCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen'] }),
    themeObject({ kind: 'washingMachine', name: 'washing machine', engineType: 'washingMachine', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['utility'] }),
    themeObject({ kind: 'dryer', name: 'dryer', engineType: 'dryer', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['utility'] }),
    themeObject({ kind: 'toilet', name: 'toilet', engineType: 'toilet', weight: 1.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'washbasin', name: 'washbasin', engineType: 'sink', weight: 1.5, footprints: [rect(1, 1), rect(2, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'shower', name: 'shower', engineType: 'shower', weight: 1, footprints: [rect(1, 1), rect(2, 2, 0.5)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'bicycle', name: 'bicycle', engineType: 'bicycle', weight: 2, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['garage', 'fitness'] }),
  ],
}
