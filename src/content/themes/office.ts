import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A Dutch office: open plan, meeting rooms, reception, pantry. */
export const OFFICE_THEME: SceneTheme = {
  id: 'office',
  nameNl: 'Kantoor',
  rooms: [
    { name: 'Receptie', favours: ['wachtbank', 'kamerplant', 'balie'] },
    { name: 'Vergaderzaal', favours: ['vergadertafel', 'vergaderstoel', 'flipover', 'scherm'] },
    { name: 'Kantoortuin', favours: ['bureau', 'bureaustoel', 'printer'] },
    { name: 'Directiekamer', favours: ['bureau', 'bureaustoel', 'vloerkleed', 'boekenkast'] },
    { name: 'Postkamer', favours: ['archiefkast', 'printer'] },
    { name: 'Koffiehoek', favours: ['koffiehoek', 'frisdrankautomaat', 'poef'] },
    { name: 'Serverruimte', favours: ['archiefkast', 'printer'] },
    { name: 'Archief', favours: ['archiefkast', 'boekenkast'] },
    { name: 'Kantine', favours: ['vergadertafel', 'vergaderstoel', 'koffiehoek'] },
    { name: 'Wachtruimte', favours: ['wachtbank', 'kamerplant', 'poef'] },
    { name: 'Printerhoek', favours: ['printer', 'archiefkast'] },
    { name: 'Loungehoek', favours: ['loungebank', 'poef', 'vloerkleed'] },
    { name: 'Overlegruimte', favours: ['vergadertafel', 'flipover', 'vergaderstoel'] },
    { name: 'Hal', favours: ['frisdrankautomaat', 'kamerplant', 'garderobekast'] },
    { name: 'Werkkamer', favours: ['bureau', 'bureaustoel', 'boekenkast'] },
    { name: 'Personeelsruimte', favours: ['koffiehoek', 'loungebank', 'garderobekast'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'bureaustoel', nameNl: 'bureaustoel', engineType: 'chair', themeIcon: 'officeChair', weight: 10, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'vergaderstoel', nameNl: 'vergaderstoel', engineType: 'chair', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'poef', nameNl: 'poef', engineType: 'chair', themeIcon: 'beanbag', weight: 2, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'wachtbank', nameNl: 'wachtbank', engineType: 'sofa', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'loungebank', nameNl: 'loungebank', engineType: 'sofa', weight: 2, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1 }),
    themeObject({ kind: 'vloerkleed', nameNl: 'vloerkleed', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'bedrijfsauto', nameNl: 'bedrijfsauto', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    // Blocking
    themeObject({ kind: 'bureau', nameNl: 'bureau', engineType: 'desk', weight: 9, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall' }),
    themeObject({ kind: 'vergadertafel', nameNl: 'vergadertafel', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'archiefkast', nameNl: 'archiefkast', engineType: 'cabinet', weight: 5, footprints: [rect(1, 1), rect(2, 1), rect(3, 1, 0.5)], placement: 'wall' }),
    themeObject({ kind: 'boekenkast', nameNl: 'boekenkast', engineType: 'bookshelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'kamerplant', nameNl: 'kamerplant', engineType: 'plant', weight: 5, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'printer', nameNl: 'printer', engineType: 'cabinet', themeIcon: 'printer', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'frisdrankautomaat', nameNl: 'frisdrankautomaat', engineType: 'cabinet', themeIcon: 'vendingMachine', weight: 1.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'koffiehoek', nameNl: 'koffiehoek', engineType: 'kitchenCounter', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'balie', nameNl: 'balie', engineType: 'kitchenCounter', themeIcon: 'checkoutCounter', weight: 1, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'flipover', nameNl: 'flipover', engineType: 'easel', themeIcon: 'blackboard', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'scherm', nameNl: 'scherm', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'garderobekast', nameNl: 'garderobekast', engineType: 'wardrobe', weight: 2, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1 }),
  ],
}
