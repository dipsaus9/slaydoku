import { rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A primary/secondary school: classrooms, gym, staff room, playground. */
export const SCHOOL_THEME: SceneTheme = {
  id: 'school',
  name: 'School',
  nameNl: 'School',
  rooms: [
    { name: 'Classroom', nameNl: 'Klaslokaal', favours: ['schoolDesk', 'schoolChair', 'blackboard', 'smartBoard'] },
    { name: 'Staff Room', nameNl: 'Personeelskamer', favours: ['teacherDesk', 'schoolChair', 'kitchenUnit'] },
    { name: 'Gym', nameNl: 'Gymzaal', favours: ['gymMat', 'lockers'] },
    { name: 'Assembly Hall', nameNl: 'Aula', favours: ['schoolChair', 'houseplant'] },
    { name: 'Library', nameNl: 'Bibliotheek', favours: ['bookcase', 'readingRug', 'readingSofa', 'beanbag'] },
    { name: 'Playground', nameNl: 'Speeltuin', favours: ['bikeRack', 'houseplant'] },
    { name: 'Canteen', nameNl: 'Kantine', favours: ['kitchenUnit', 'schoolDesk', 'schoolChair'] },
    { name: 'Principal Office', nameNl: 'Directeurskamer', favours: ['teacherDesk', 'bookcase', 'schoolChair'] },
    { name: 'Music Room', nameNl: 'Muzieklokaal', favours: ['schoolChair', 'blackboard', 'toyChest'] },
    { name: 'Art Room', nameNl: 'Tekenlokaal', favours: ['schoolDesk', 'blackboard', 'sink'] },
    { name: 'Computer Room', nameNl: 'Computerlokaal', favours: ['schoolDesk', 'schoolChair', 'smartBoard'] },
    { name: 'Kindergarten', nameNl: 'Kleuterklas', favours: ['readingRug', 'beanbag', 'toyChest'] },
    { name: 'Corridor', nameNl: 'Gang', favours: ['lockers', 'houseplant'] },
    { name: 'Bike Shed', nameNl: 'Fietsenstalling', favours: ['bikeRack'] },
    { name: 'Sick Bay', nameNl: 'Ziekenboeg', favours: ['infirmaryBed', 'sink', 'toilet'], roomTypes: ['sleeping'] },
    { name: 'Craft Room', nameNl: 'Handvaardigheidslokaal', favours: ['schoolDesk', 'sink', 'blackboard'] },
    { name: 'Science Room', nameNl: 'Scheikundelokaal', favours: ['schoolDesk', 'blackboard', 'sink'] },
    { name: 'Caretaker Room', nameNl: 'Conciërgekamer', favours: ['teacherDesk', 'lockers'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'schoolChair', name: 'school chair', engineType: 'chair', weight: 12, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'beanbag', name: 'beanbag', engineType: 'chair', themeIcon: 'beanbag', weight: 2, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'readingSofa', name: 'reading sofa', engineType: 'sofa', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'readingRug', name: 'reading rug', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'gymMat', name: 'gym mat', engineType: 'rug', themeIcon: 'gymMat', weight: 2.5, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'infirmaryBed', name: 'infirmary bed', engineType: 'bed', weight: 0.7, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'schoolBus', name: 'school bus', engineType: 'car', weight: 0.7, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, excludeRoomTypes: ['sleeping'] }),
    // Blocking
    themeObject({ kind: 'schoolDesk', name: 'school desk', engineType: 'desk', weight: 12, footprints: [rect(2, 1)], placement: 'centre' }),
    themeObject({ kind: 'teacherDesk', name: 'teacher desk', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'blackboard', name: 'blackboard', engineType: 'easel', themeIcon: 'blackboard', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'smartBoard', name: 'smart board', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'lockers', name: 'lockers', clueNoun: 'locker', engineType: 'wardrobe', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall' }),
    themeObject({ kind: 'bookcase', name: 'bookcase', engineType: 'bookshelf', weight: 4, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'houseplant', name: 'houseplant', engineType: 'plant', weight: 4, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'bikeRack', name: 'bike rack', engineType: 'bicycle', weight: 1.5, footprints: [rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'toyChest', name: 'toy chest', engineType: 'chest', weight: 2, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'sink', name: 'sink', engineType: 'sink', weight: 1.5, footprints: [rect(1, 1), rect(2, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'toilet', name: 'toilet', engineType: 'toilet', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'kitchenUnit', name: 'kitchen unit', engineType: 'kitchenCounter', weight: 1.5, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
  ],
}
