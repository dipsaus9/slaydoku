import { rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A park with a garden: lawns, playground, terrace, parking. Areas are outdoor. Room rules: docs/authoring/room-rules.md. */
export const PARK_THEME: SceneTheme = {
  id: 'park',
  name: 'Park and garden',
  nameNl: 'Park en tuin',
  rooms: [
    { name: 'Playground', nameNl: 'Speeltuin', favours: ['sandbox', 'slide', 'bench', 'bush', 'bin'], outdoor: true, roomTypes: ['garden', 'play'] },
    { name: 'Picnic Meadow', nameNl: 'Picknickweide', favours: ['picnicBlanket', 'picnicTable', 'tree', 'partyTent'], outdoor: true, roomTypes: ['garden'] },
    { name: 'Rose Garden', nameNl: 'Rozentuin', favours: ['flowerBed', 'bench', 'statue'], outdoor: true, roomTypes: ['garden'] },
    { name: 'Vegetable Garden', nameNl: 'Moestuin', favours: ['flowerBed', 'bush', 'gardenChair'], outdoor: true, roomTypes: ['garden'] },
    { name: 'Terrace', nameNl: 'Terras', favours: ['picnicTable', 'gardenChair', 'loungeSofa', 'barbecue', 'pottedPlant'], roomTypes: ['garden', 'living'] },
    { name: 'Petting Zoo', nameNl: 'Kinderboerderij', favours: ['tree', 'bench', 'bush'], outdoor: true, roomTypes: ['garden'] },
    { name: 'Flower Meadow', nameNl: 'Bloemenweide', favours: ['flowerBed', 'hammock', 'tree'], outdoor: true, roomTypes: ['garden', 'sleeping'] },
    { name: 'Grove', nameNl: 'Bosje', favours: ['tree', 'bush', 'hammock'], outdoor: true, roomTypes: ['garden', 'sleeping'] },
    { name: 'Parking Lot', nameNl: 'Parkeerplaats', favours: ['car', 'bicycle', 'lantern'], outdoor: true, roomTypes: ['garage'] },
    { name: 'Bicycle Shelter', nameNl: 'Fietsenstalling', favours: ['bicycle'], roomTypes: ['garage'] },
    { name: 'Deer Park', nameNl: 'Hertenkamp', favours: ['tree', 'bench', 'bush'], outdoor: true, roomTypes: ['garden'] },
    { name: 'Herb Garden', nameNl: 'Kruidentuin', favours: ['flowerBed', 'bush', 'gardenChair'], outdoor: true, roomTypes: ['garden'] },
    { name: 'Back Garden', nameNl: 'Achtertuin', favours: ['picnicTable', 'gardenChair', 'sunLounger'], outdoor: true, roomTypes: ['garden', 'sleeping'] },
    { name: 'Front Garden', nameNl: 'Voortuin', favours: ['tree', 'flowerBed', 'car', 'lantern'], outdoor: true, roomTypes: ['garden', 'garage'] },
    { name: 'Pavilion', nameNl: 'Paviljoen', favours: ['loungeSofa', 'picnicTable', 'gardenChair', 'pottedPlant'], roomTypes: ['garden', 'living'] },
    { name: 'Garden Shed', nameNl: 'Tuinschuur', favours: ['gardenChair', 'bicycle', 'paintingEasel'], roomTypes: ['garden', 'storage'] },
    { name: 'Orchard', nameNl: 'Boomgaard', favours: ['tree', 'hammock', 'picnicBlanket'], outdoor: true, roomTypes: ['garden', 'sleeping'] },
    { name: 'Pond Garden', nameNl: 'Vijvertuin', favours: ['fountain', 'bench', 'statue'], outdoor: true, roomTypes: ['garden', 'water'] },
    { name: 'Duck Pond', nameNl: 'Eendenvijver', favours: ['fountain', 'bench', 'bush'], outdoor: true, roomTypes: ['garden', 'water'] },
    { name: 'Sandpit', nameNl: 'Zandbak', favours: ['sandbox', 'bench', 'bush'], outdoor: true, roomTypes: ['garden', 'play'] },
    { name: 'Sunbathing Lawn', nameNl: 'Ligweide', favours: ['sunLounger', 'tree', 'picnicBlanket'], outdoor: true, roomTypes: ['garden', 'sleeping'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'gardenChair', name: 'garden chair', nameNl: 'tuinstoel', engineType: 'chair', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['garden', 'living'] }),
    themeObject({ kind: 'picnicBlanket', name: 'picnic blanket', nameNl: 'picknickkleed', engineType: 'rug', themeIcon: 'picnicBlanket', weight: 4, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', allowedRoomTypes: ['garden'] }),
    themeObject({ kind: 'hammock', name: 'hammock', nameNl: 'hangmat', engineType: 'bed', themeIcon: 'hammock', weight: 2, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'sunLounger', name: 'sun lounger', nameNl: 'ligbed', engineType: 'bed', weight: 1.5, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'sandbox', name: 'sandbox', nameNl: 'zandbak', engineType: 'rug', themeIcon: 'sandbox', weight: 1.5, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['play'] }),
    themeObject({ kind: 'loungeSofa', name: 'lounge sofa', nameNl: 'loungebank', engineType: 'sofa', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'car', name: 'car', nameNl: 'auto', engineType: 'car', weight: 2, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 3, allowedRoomTypes: ['garage'] }),
    // Blocking
    themeObject({ kind: 'tree', name: 'tree', nameNl: 'boom', engineType: 'tree', weight: 8, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['garden'] }),
    themeObject({ kind: 'flowerBed', name: 'flower bed', nameNl: 'bloemperk', engineType: 'flowers', weight: 6, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: ['garden'] }),
    themeObject({ kind: 'picnicTable', name: 'picnic table', nameNl: 'picknicktafel', engineType: 'gardenTable', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 2, allowedRoomTypes: ['garden', 'living'] }),
    themeObject({ kind: 'bench', name: 'bench', nameNl: 'parkbank', engineType: 'bench', weight: 5, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: ['garden'] }),
    themeObject({ kind: 'statue', name: 'statue', nameNl: 'standbeeld', engineType: 'statue', weight: 2.5, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['garden'] }),
    themeObject({ kind: 'fountain', name: 'fountain', nameNl: 'fontein', engineType: 'statue', themeIcon: 'fountain', weight: 1, footprints: [rect(1, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['water'] }),
    themeObject({ kind: 'bush', name: 'bush', nameNl: 'struik', engineType: 'plant', weight: 6, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['garden'] }),
    themeObject({ kind: 'bicycle', name: 'bicycle', nameNl: 'fiets', engineType: 'bicycle', weight: 2, footprints: [rect(2, 1)], placement: 'wall', allowedRoomTypes: ['garage', 'storage'] }),
    themeObject({ kind: 'paintingEasel', name: 'painting easel', nameNl: 'schildersezel', engineType: 'easel', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: ['garden', 'living'] }),
    // Decor (SLAY-19.1). The engine lamp is a post with a lit shade: outdoors that is a lantern. The plant art is a potted plant, named so here.
    themeObject({ kind: 'lantern', name: 'lantern', nameNl: 'lantaarn', engineType: 'lamp', weight: 4, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garden', 'garage'] }),
    themeObject({ kind: 'barbecue', name: 'barbecue', nameNl: 'barbecue', engineType: 'barbecue', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'bin', name: 'bin', nameNl: 'prullenbak', engineType: 'bin', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['garden', 'play', 'garage'] }),
    themeObject({ kind: 'slide', name: 'slide', nameNl: 'glijbaan', engineType: 'playEquipment', weight: 3, footprints: [rect(2, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['play'] }),
    themeObject({ kind: 'partyTent', name: 'party tent', nameNl: 'partytent', engineType: 'tent', weight: 1, footprints: [rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['garden'] }),
    themeObject({ kind: 'pottedPlant', name: 'potted plant', nameNl: 'potplant', engineType: 'plant', weight: 3, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 2, allowedRoomTypes: ['living'] }),
  ],
}
