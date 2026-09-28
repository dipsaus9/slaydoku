import { rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A park with a garden: lawns, playground, terrace, parking. Areas are outdoor. */
export const PARK_THEME: SceneTheme = {
  id: 'park',
  name: 'Park and garden',
  nameNl: 'Park en tuin',
  rooms: [
    { name: 'Playground', nameNl: 'Speeltuin', favours: ['sandbox', 'bench', 'bush'], outdoor: true },
    { name: 'Picnic Meadow', nameNl: 'Picknickweide', favours: ['picnicBlanket', 'picnicTable', 'tree'], outdoor: true },
    { name: 'Rose Garden', nameNl: 'Rozentuin', favours: ['flowerBed', 'bench', 'statue'], outdoor: true },
    { name: 'Vegetable Garden', nameNl: 'Moestuin', favours: ['flowerBed', 'bush', 'gardenChair'], outdoor: true },
    { name: 'Terrace', nameNl: 'Terras', favours: ['picnicTable', 'gardenChair', 'loungeSofa'] },
    { name: 'Petting Zoo', nameNl: 'Kinderboerderij', favours: ['tree', 'bench', 'bicycle'], outdoor: true },
    { name: 'Flower Meadow', nameNl: 'Bloemenweide', favours: ['flowerBed', 'hammock', 'tree'], outdoor: true, roomTypes: ['sleeping'] },
    { name: 'Grove', nameNl: 'Bosje', favours: ['tree', 'bush', 'hammock'], outdoor: true, roomTypes: ['sleeping'] },
    { name: 'Parking Lot', nameNl: 'Parkeerplaats', favours: ['car', 'bicycle'], outdoor: true },
    { name: 'Bicycle Shelter', nameNl: 'Fietsenstalling', favours: ['bicycle'] },
    { name: 'Deer Park', nameNl: 'Hertenkamp', favours: ['tree', 'bench', 'bush'], outdoor: true },
    { name: 'Herb Garden', nameNl: 'Kruidentuin', favours: ['flowerBed', 'bush', 'gardenChair'], outdoor: true },
    { name: 'Back Garden', nameNl: 'Achtertuin', favours: ['picnicTable', 'gardenChair', 'sunLounger'], outdoor: true, roomTypes: ['sleeping'] },
    { name: 'Front Garden', nameNl: 'Voortuin', favours: ['tree', 'flowerBed', 'car'], outdoor: true },
    { name: 'Pavilion', nameNl: 'Paviljoen', favours: ['loungeSofa', 'picnicTable', 'gardenChair'] },
    { name: 'Garden Shed', nameNl: 'Tuinschuur', favours: ['gardenChair', 'loungeSofa', 'paintingEasel'] },
    { name: 'Orchard', nameNl: 'Boomgaard', favours: ['tree', 'hammock', 'picnicBlanket'], outdoor: true, roomTypes: ['sleeping'] },
    { name: 'Pond Garden', nameNl: 'Vijvertuin', favours: ['fountain', 'bench', 'statue'], outdoor: true },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'gardenChair', name: 'garden chair', engineType: 'chair', weight: 8, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'picnicBlanket', name: 'picnic blanket', engineType: 'rug', themeIcon: 'picnicBlanket', weight: 3, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre' }),
    themeObject({ kind: 'hammock', name: 'hammock', engineType: 'bed', themeIcon: 'hammock', weight: 2, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'sunLounger', name: 'sun lounger', engineType: 'bed', weight: 1.5, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'sandbox', name: 'sandbox', engineType: 'rug', themeIcon: 'sandbox', weight: 1.5, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'loungeSofa', name: 'lounge sofa', engineType: 'sofa', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'car', name: 'car', engineType: 'car', weight: 2, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 3, excludeRoomTypes: ['sleeping'] }),
    // Blocking
    themeObject({ kind: 'tree', name: 'tree', engineType: 'tree', weight: 10, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'flowerBed', name: 'flower bed', engineType: 'flowers', weight: 6, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'picnicTable', name: 'picnic table', engineType: 'gardenTable', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 2 }),
    themeObject({ kind: 'bench', name: 'bench', engineType: 'bench', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall' }),
    themeObject({ kind: 'statue', name: 'statue', engineType: 'statue', weight: 1.5, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'fountain', name: 'fountain', engineType: 'statue', themeIcon: 'fountain', weight: 1, footprints: [rect(1, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'bush', name: 'bush', engineType: 'plant', weight: 6, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'bicycle', name: 'bicycle', engineType: 'bicycle', weight: 2, footprints: [rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'paintingEasel', name: 'painting easel', engineType: 'easel', weight: 0.5, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1 }),
  ],
}
