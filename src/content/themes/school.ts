import { rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A Dutch primary/secondary school: classrooms, gym, staff room, playground. */
export const SCHOOL_THEME: SceneTheme = {
  id: 'school',
  nameNl: 'School',
  rooms: [
    { name: 'Klaslokaal', favours: ['schooltafel', 'schoolstoel', 'schoolbord', 'digibord'] },
    { name: 'Lerarenkamer', favours: ['lerarenbureau', 'schoolstoel', 'keukenblok'] },
    { name: 'Gymzaal', favours: ['gymmat', 'kluisjes'] },
    { name: 'Aula', favours: ['schoolstoel', 'kamerplant'] },
    { name: 'Bibliotheek', favours: ['boekenkast', 'leestapijt', 'leeshoekbank', 'zitzak'] },
    { name: 'Speelplaats', favours: ['fietsenrek', 'kamerplant'] },
    { name: 'Kantine', favours: ['keukenblok', 'schooltafel', 'schoolstoel'] },
    { name: 'Directiekamer', favours: ['lerarenbureau', 'boekenkast', 'schoolstoel'] },
    { name: 'Muzieklokaal', favours: ['schoolstoel', 'schoolbord', 'speelgoedkist'] },
    { name: 'Tekenlokaal', favours: ['schooltafel', 'schoolbord', 'wasbak'] },
    { name: 'Computerlokaal', favours: ['schooltafel', 'schoolstoel', 'digibord'] },
    { name: 'Kleuterklas', favours: ['leestapijt', 'zitzak', 'speelgoedkist'] },
    { name: 'Gang', favours: ['kluisjes', 'kamerplant'] },
    { name: 'Fietsenstalling', favours: ['fietsenrek'] },
    { name: 'Ziekenboeg', favours: ['ziekenbed', 'wasbak', 'toilet'] },
    { name: 'Handenarbeidlokaal', favours: ['schooltafel', 'wasbak', 'schoolbord'] },
    { name: 'Natuurkundelokaal', favours: ['schooltafel', 'schoolbord', 'wasbak'] },
    { name: 'Conciergehok', favours: ['lerarenbureau', 'kluisjes'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'schoolstoel', nameNl: 'schoolstoel', engineType: 'chair', weight: 12, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'zitzak', nameNl: 'zitzak', engineType: 'chair', themeIcon: 'beanbag', weight: 2, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'leeshoekbank', nameNl: 'leeshoekbank', engineType: 'sofa', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'leestapijt', nameNl: 'leestapijt', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'gymmat', nameNl: 'gymmat', engineType: 'rug', themeIcon: 'gymMat', weight: 2.5, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'ziekenbed', nameNl: 'ziekenbed', engineType: 'bed', weight: 0.7, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'schoolbus', nameNl: 'schoolbus', engineType: 'car', weight: 0.7, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    // Blocking
    themeObject({ kind: 'schooltafel', nameNl: 'schooltafel', engineType: 'desk', weight: 12, footprints: [rect(2, 1)], placement: 'centre' }),
    themeObject({ kind: 'lerarenbureau', nameNl: 'lerarenbureau', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'schoolbord', nameNl: 'schoolbord', engineType: 'easel', themeIcon: 'blackboard', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'digibord', nameNl: 'digibord', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'kluisjes', nameNl: 'kluisjes', clueNoun: 'kluisje', engineType: 'wardrobe', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall' }),
    themeObject({ kind: 'boekenkast', nameNl: 'boekenkast', engineType: 'bookshelf', weight: 4, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'kamerplant', nameNl: 'kamerplant', engineType: 'plant', weight: 4, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'fietsenrek', nameNl: 'fietsenrek', engineType: 'bicycle', weight: 1.5, footprints: [rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'speelgoedkist', nameNl: 'speelgoedkist', engineType: 'chest', weight: 2, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'wasbak', nameNl: 'wasbak', engineType: 'sink', weight: 1.5, footprints: [rect(1, 1), rect(2, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'toilet', nameNl: 'toilet', engineType: 'toilet', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'keukenblok', nameNl: 'keukenblok', engineType: 'kitchenCounter', weight: 1.5, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
  ],
}
