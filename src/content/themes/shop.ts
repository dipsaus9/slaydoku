import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A department store / mall: departments, tills, storeroom, parking. */
export const SHOP_THEME: SceneTheme = {
  id: 'shop',
  nameNl: 'Winkel en winkelcentrum',
  rooms: [
    { name: 'Kassa', favours: ['kassa', 'reclamescherm', 'krukje'] },
    { name: 'Magazijn', favours: ['schap', 'kratten', 'bezorgbus'] },
    { name: 'Pashokjes', favours: ['krukje', 'kledingrek', 'showroomkleed'] },
    { name: 'Etalage', favours: ['etalagepop', 'presentatietafel', 'kamerplant'] },
    { name: 'Herenafdeling', favours: ['kledingrek', 'etalagepop', 'krukje'] },
    { name: 'Damesafdeling', favours: ['kledingrek', 'etalagepop', 'poef'] },
    { name: 'Kinderafdeling', favours: ['kledingrek', 'poef', 'schap'] },
    { name: 'Elektronica', favours: ['vitrine', 'reclamescherm', 'presentatietafel'] },
    { name: 'Speelgoedafdeling', favours: ['schap', 'poef', 'kratten'] },
    { name: 'Boekenafdeling', favours: ['schap', 'presentatietafel', 'wachtbank'] },
    { name: 'Kantoor', favours: ['presentatietafel', 'vitrine', 'krukje'] },
    { name: 'Personeelsruimte', favours: ['wachtbank', 'frisdrankautomaat', 'krukje'] },
    { name: 'Restaurant', favours: ['presentatietafel', 'krukje', 'frisdrankautomaat'] },
    { name: 'Ingang', favours: ['kamerplant', 'loper'] },
    { name: 'Parkeergarage', favours: ['bezorgbus', 'kratten'] },
    { name: 'Uitgiftebalie', favours: ['kassa', 'schap', 'krukje'] },
    { name: 'Woonafdeling', favours: ['showroombed', 'showroomhoekbank', 'showroomkleed'] },
    { name: 'Slaapkamerafdeling', favours: ['showroombed', 'showroomkleed', 'vitrine'] },
    { name: 'Groenteafdeling', favours: ['schap', 'kratten', 'kamerplant'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'krukje', nameNl: 'paskrukje', engineType: 'chair', weight: 8, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'poef', nameNl: 'poef', engineType: 'chair', themeIcon: 'beanbag', weight: 2, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'wachtbank', nameNl: 'wachtbank', engineType: 'sofa', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'showroomhoekbank', nameNl: 'showroomhoekbank', engineType: 'sofa', weight: 1, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1 }),
    themeObject({ kind: 'loper', nameNl: 'loper', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(1, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'showroomkleed', nameNl: 'showroomkleed', engineType: 'rug', weight: 2, footprints: [rect(2, 2), rect(2, 1)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'showroombed', nameNl: 'showroombed', engineType: 'bed', weight: 1, footprints: [rect(1, 2), rect(2, 2, 0.5)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'bezorgbus', nameNl: 'bezorgbus', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    // Blocking
    themeObject({ kind: 'kassa', nameNl: 'kassa', engineType: 'kitchenCounter', themeIcon: 'checkoutCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'schap', nameNl: 'schap', engineType: 'bookshelf', weight: 10, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'vitrine', nameNl: 'vitrine', engineType: 'cabinet', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1, 0.5)], placement: 'wall' }),
    themeObject({ kind: 'kledingrek', nameNl: 'kledingrek', engineType: 'wardrobe', themeIcon: 'clothesRack', weight: 6, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'etalagepop', nameNl: 'etalagepop', engineType: 'statue', themeIcon: 'mannequin', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'presentatietafel', nameNl: 'presentatietafel', engineType: 'table', weight: 4, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'kamerplant', nameNl: 'kamerplant', engineType: 'plant', weight: 3, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'reclamescherm', nameNl: 'reclamescherm', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'kratten', nameNl: 'kratten', clueNoun: 'krat', engineType: 'chest', weight: 3, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'frisdrankautomaat', nameNl: 'frisdrankautomaat', engineType: 'cabinet', themeIcon: 'vendingMachine', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
  ],
}
