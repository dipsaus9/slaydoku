import { rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A park with a garden: lawns, playground, terrace, parking. Areas are outdoor. */
export const PARK_THEME: SceneTheme = {
  id: 'park',
  nameNl: 'Park en tuin',
  rooms: [
    { name: 'Speeltuin', favours: ['zandbak', 'bankje', 'struik'], outdoor: true },
    { name: 'Picknickweide', favours: ['picknickkleed', 'picknicktafel', 'boom'], outdoor: true },
    { name: 'Rozentuin', favours: ['bloemperk', 'bankje', 'standbeeld'], outdoor: true },
    { name: 'Moestuin', favours: ['bloemperk', 'struik', 'tuinstoel'], outdoor: true },
    { name: 'Terras', favours: ['picknicktafel', 'tuinstoel', 'loungebank'] },
    { name: 'Kinderboerderij', favours: ['boom', 'bankje', 'fiets'], outdoor: true },
    { name: 'Bloemenweide', favours: ['bloemperk', 'hangmat', 'boom'], outdoor: true },
    { name: 'Bosschage', favours: ['boom', 'struik', 'hangmat'], outdoor: true },
    { name: 'Parkeerplaats', favours: ['auto', 'fiets'], outdoor: true },
    { name: 'Fietsenstalling', favours: ['fiets'] },
    { name: 'Hertenkamp', favours: ['boom', 'bankje', 'struik'], outdoor: true },
    { name: 'Kruidentuin', favours: ['bloemperk', 'struik', 'tuinstoel'], outdoor: true },
    { name: 'Achtertuin', favours: ['picknicktafel', 'tuinstoel', 'ligbed'], outdoor: true },
    { name: 'Voortuin', favours: ['boom', 'bloemperk', 'auto'], outdoor: true },
    { name: 'Paviljoen', favours: ['loungebank', 'picknicktafel', 'tuinstoel'] },
    { name: 'Tuinhuis', favours: ['tuinstoel', 'loungebank', 'schildersezel'] },
    { name: 'Boomgaard', favours: ['boom', 'hangmat', 'picknickkleed'], outdoor: true },
    { name: 'Vijverpartij', favours: ['fontein', 'bankje', 'standbeeld'], outdoor: true },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'tuinstoel', nameNl: 'tuinstoel', engineType: 'chair', weight: 8, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'picknickkleed', nameNl: 'picknickkleed', engineType: 'rug', themeIcon: 'picnicBlanket', weight: 3, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre' }),
    themeObject({ kind: 'hangmat', nameNl: 'hangmat', engineType: 'bed', themeIcon: 'hammock', weight: 2, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'ligbed', nameNl: 'ligbed', engineType: 'bed', weight: 1.5, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'zandbak', nameNl: 'zandbak', engineType: 'rug', themeIcon: 'sandbox', weight: 1.5, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'loungebank', nameNl: 'loungebank', engineType: 'sofa', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'auto', nameNl: 'auto', engineType: 'car', weight: 2, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 3 }),
    // Blocking
    themeObject({ kind: 'boom', nameNl: 'boom', engineType: 'tree', weight: 10, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'bloemperk', nameNl: 'bloemperk', engineType: 'flowers', weight: 6, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'picknicktafel', nameNl: 'picknicktafel', engineType: 'gardenTable', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 2 }),
    themeObject({ kind: 'bankje', nameNl: 'bankje', engineType: 'bench', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall' }),
    themeObject({ kind: 'standbeeld', nameNl: 'standbeeld', engineType: 'statue', weight: 1.5, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'fontein', nameNl: 'fontein', engineType: 'statue', themeIcon: 'fountain', weight: 1, footprints: [rect(1, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'struik', nameNl: 'struik', engineType: 'plant', weight: 6, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'fiets', nameNl: 'fiets', engineType: 'bicycle', weight: 2, footprints: [rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'schildersezel', nameNl: 'schildersezel', engineType: 'easel', weight: 0.5, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1 }),
  ],
}
