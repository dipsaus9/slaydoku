import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A family home: living, sleeping, kitchen, bathroom, garage. */
export const HOME_THEME: SceneTheme = {
  id: 'home',
  name: 'Family home',
  nameNl: 'Familiehuis',
  rooms: [
    { name: 'Living Room', nameNl: 'Woonkamer', favours: ['sofa', 'cornerSofa', 'television', 'coffeeTable', 'rug'] },
    { name: 'Kitchen', nameNl: 'Keuken', favours: ['kitchenCounter', 'diningTable', 'chair'] },
    { name: 'Bedroom', nameNl: 'Slaapkamer', favours: ['singleBed', 'doubleBed', 'wardrobe'] },
    { name: 'Bathroom', nameNl: 'Badkamer', favours: ['shower', 'washbasin', 'toilet'] },
    { name: 'Toilet', nameNl: 'Toilet', favours: ['toilet', 'washbasin'] },
    { name: 'Dining Room', nameNl: 'Eetkamer', favours: ['diningTable', 'chair', 'sideboard'] },
    { name: 'Hall', nameNl: 'Hal', favours: ['chest'] },
    { name: 'Corridor', nameNl: 'Gang', favours: ['chest', 'houseplant'] },
    { name: 'Study', nameNl: 'Studeerkamer', favours: ['desk', 'bookcase', 'chair'] },
    { name: 'Nursery', nameNl: 'Kinderkamer', favours: ['singleBed', 'rug', 'chest'] },
    { name: 'Guest Room', nameNl: 'Logeerkamer', favours: ['doubleBed', 'wardrobe'] },
    { name: 'Utility Room', nameNl: 'Bijkeuken', favours: ['washingMachine', 'dryer', 'washbasin'] },
    { name: 'Garage', nameNl: 'Garage', favours: ['car', 'chest'] },
    { name: 'Attic', nameNl: 'Zolder', favours: ['chest', 'wardrobe'] },
    { name: 'Storeroom', nameNl: 'Bergruimte', favours: ['sideboard', 'chest'] },
    { name: 'Conservatory', nameNl: 'Serre', favours: ['houseplant', 'chair', 'rug'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'chair', name: 'chair', engineType: 'chair', weight: 9, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'rug', name: 'rug', engineType: 'rug', weight: 4, footprints: [rect(2, 1), rect(2, 2), rect(1, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'singleBed', name: 'single bed', engineType: 'bed', weight: 3, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'doubleBed', name: 'double bed', engineType: 'bed', weight: 2, footprints: [rect(2, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'sofa', name: 'sofa', engineType: 'sofa', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'cornerSofa', name: 'corner sofa', engineType: 'sofa', weight: 2, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1 }),
    themeObject({ kind: 'car', name: 'car', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    // Blocking
    themeObject({ kind: 'coffeeTable', name: 'coffee table', engineType: 'table', weight: 4, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'diningTable', name: 'dining table', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'television', name: 'television', engineType: 'tv', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'houseplant', name: 'houseplant', engineType: 'plant', weight: 6, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'bookcase', name: 'bookcase', engineType: 'bookshelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'chest', name: 'chest', engineType: 'chest', weight: 2, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'wardrobe', name: 'wardrobe', engineType: 'wardrobe', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'sideboard', name: 'sideboard', engineType: 'cabinet', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall' }),
    themeObject({ kind: 'desk', name: 'desk', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'kitchenCounter', name: 'kitchen counter', engineType: 'kitchenCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'washingMachine', name: 'washing machine', engineType: 'washingMachine', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'dryer', name: 'dryer', engineType: 'dryer', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'toilet', name: 'toilet', engineType: 'toilet', weight: 1.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'washbasin', name: 'washbasin', engineType: 'sink', weight: 1.5, footprints: [rect(1, 1), rect(2, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'shower', name: 'shower', engineType: 'shower', weight: 1, footprints: [rect(1, 1), rect(2, 2, 0.5)], placement: 'corner', maxPerRoom: 1 }),
  ],
}
