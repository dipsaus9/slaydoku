import { rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A primary/secondary school: classrooms, gym, staff room, playground. Room rules: docs/authoring/room-rules.md. */
export const SCHOOL_THEME: SceneTheme = {
  id: 'school',
  name: 'School',
  nameNl: 'School',
  rooms: [
    { name: 'Classroom', nameNl: 'Klaslokaal', favours: ['schoolDesk', 'schoolChair', 'blackboard', 'smartBoard'], roomTypes: ['study'] },
    { name: 'Staff Room', nameNl: 'Personeelskamer', favours: ['teacherDesk', 'schoolChair', 'kitchenUnit'], roomTypes: ['study', 'kitchen'] },
    { name: 'Gym', nameNl: 'Gymzaal', favours: ['gymMat', 'lockers'], roomTypes: ['fitness'] },
    { name: 'Assembly Hall', nameNl: 'Aula', favours: ['schoolChair', 'houseplant'], roomTypes: ['circulation'] },
    { name: 'Library', nameNl: 'Bibliotheek', favours: ['bookcase', 'readingRug', 'readingSofa'], roomTypes: ['study', 'living'] },
    { name: 'Playground', nameNl: 'Speeltuin', favours: ['toyChest', 'houseplant'], roomTypes: ['circulation'] },
    { name: 'Canteen', nameNl: 'Kantine', favours: ['kitchenUnit', 'schoolDesk', 'schoolChair'], roomTypes: ['dining', 'kitchen'] },
    { name: 'Principal Office', nameNl: 'Directeurskamer', favours: ['teacherDesk', 'bookcase', 'schoolChair'], roomTypes: ['study'] },
    { name: 'Music Room', nameNl: 'Muzieklokaal', favours: ['schoolChair', 'blackboard', 'bookcase'], roomTypes: ['study'] },
    { name: 'Art Room', nameNl: 'Tekenlokaal', favours: ['schoolDesk', 'blackboard', 'schoolChair'], roomTypes: ['study'] },
    { name: 'Computer Room', nameNl: 'Computerlokaal', favours: ['schoolDesk', 'schoolChair', 'smartBoard'], roomTypes: ['study'] },
    { name: 'Kindergarten', nameNl: 'Kleuterklas', favours: ['readingRug', 'schoolChair', 'toyChest'], roomTypes: ['living'] },
    { name: 'Corridor', nameNl: 'Gang', favours: ['lockers', 'houseplant'], roomTypes: ['circulation'] },
    { name: 'Bike Shed', nameNl: 'Fietsenstalling', favours: ['bikeRack'], roomTypes: ['garage'] },
    { name: 'Sick Bay', nameNl: 'Ziekenboeg', favours: ['infirmaryBed', 'sink', 'toilet'], roomTypes: ['sleeping', 'wet'] },
    { name: 'Craft Room', nameNl: 'Handvaardigheidslokaal', favours: ['schoolDesk', 'schoolChair', 'blackboard'], roomTypes: ['study'] },
    { name: 'Science Room', nameNl: 'Scheikundelokaal', favours: ['schoolDesk', 'blackboard', 'schoolChair'], roomTypes: ['study'] },
    { name: 'Caretaker Room', nameNl: 'Conciërgekamer', favours: ['teacherDesk', 'lockers'], roomTypes: ['study', 'storage'] },
    { name: 'Toilets', nameNl: 'Toiletten', favours: ['toilet', 'sink'], roomTypes: ['wet'] },
    { name: 'Changing Room', nameNl: 'Kleedkamer', favours: ['lockers', 'sink'], roomTypes: ['wet', 'storage'] },
    { name: 'Parking Lot', nameNl: 'Parkeerplaats', favours: ['schoolBus', 'bikeRack'], roomTypes: ['garage'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'schoolChair', name: 'school chair', engineType: 'chair', weight: 14, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['study', 'dining', 'circulation', 'living', 'kitchen'] }),
    themeObject({ kind: 'readingSofa', name: 'reading sofa', engineType: 'sofa', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'readingRug', name: 'reading rug', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living', 'study'] }),
    themeObject({ kind: 'gymMat', name: 'gym mat', engineType: 'rug', themeIcon: 'gymMat', weight: 2.5, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['fitness'] }),
    themeObject({ kind: 'infirmaryBed', name: 'infirmary bed', engineType: 'bed', weight: 0.7, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'schoolBus', name: 'school bus', engineType: 'car', weight: 0.7, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage'] }),
    // Blocking
    themeObject({ kind: 'schoolDesk', name: 'school desk', engineType: 'desk', weight: 12, footprints: [rect(2, 1)], placement: 'centre', allowedRoomTypes: ['study', 'dining'] }),
    themeObject({ kind: 'teacherDesk', name: 'teacher desk', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['study'] }),
    themeObject({ kind: 'blackboard', name: 'blackboard', engineType: 'easel', themeIcon: 'blackboard', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['study'] }),
    themeObject({ kind: 'smartBoard', name: 'smart board', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['study'] }),
    themeObject({ kind: 'lockers', name: 'lockers', clueNoun: 'locker', engineType: 'wardrobe', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', allowedRoomTypes: ['circulation', 'fitness', 'storage'] }),
    themeObject({ kind: 'bookcase', name: 'bookcase', engineType: 'bookshelf', weight: 4, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', allowedRoomTypes: ['study', 'storage'] }),
    themeObject({ kind: 'houseplant', name: 'houseplant', engineType: 'plant', weight: 4, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['circulation', 'living', 'study', 'dining'] }),
    themeObject({ kind: 'bikeRack', name: 'bike rack', engineType: 'bicycle', weight: 1.5, footprints: [rect(2, 1)], placement: 'wall', allowedRoomTypes: ['garage'] }),
    themeObject({ kind: 'toyChest', name: 'toy chest', engineType: 'chest', weight: 2, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: ['living', 'storage', 'circulation'] }),
    themeObject({ kind: 'sink', name: 'sink', engineType: 'sink', weight: 1.5, footprints: [rect(1, 1), rect(2, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'toilet', name: 'toilet', engineType: 'toilet', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['wet'] }),
    themeObject({ kind: 'kitchenUnit', name: 'kitchen unit', engineType: 'kitchenCounter', weight: 1.5, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen'] }),
  ],
}
