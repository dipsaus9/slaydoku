import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** An office: open plan, meeting rooms, reception, pantry. Room rules: docs/authoring/room-rules.md. */
export const OFFICE_THEME: SceneTheme = {
  id: 'office',
  name: 'Office',
  nameNl: 'Kantoor',
  rooms: [
    { name: 'Reception', nameNl: 'Receptie', favours: ['waitingSofa', 'houseplant', 'receptionDesk', 'coatRack'], roomTypes: ['circulation'] },
    { name: 'Meeting Room', nameNl: 'Vergaderzaal', favours: ['meetingTable', 'meetingChair', 'flipchart', 'screen'], roomTypes: ['meeting'] },
    { name: 'Open Office', nameNl: 'Open kantoor', favours: ['desk', 'meetingChair', 'printer', 'bin'], roomTypes: ['study'] },
    { name: 'Executive Office', nameNl: 'Directiekantoor', favours: ['desk', 'meetingChair', 'floorRug', 'bookcase', 'floorLamp'], roomTypes: ['study'] },
    { name: 'Mail Room', nameNl: 'Postkamer', favours: ['filingCabinet', 'printer'], roomTypes: ['storage'] },
    { name: 'Coffee Corner', nameNl: 'Koffiehoek', favours: ['coffeeCounter', 'vendingMachine', 'meetingChair', 'waterCooler'], roomTypes: ['kitchen'] },
    // The only `utility` room of the office, so the server rack (allowed there alone) never leaves it.
    { name: 'Server Room', nameNl: 'Serverruimte', favours: ['serverRack', 'filingCabinet'], roomTypes: ['storage', 'utility'] },
    { name: 'Archive', nameNl: 'Archief', favours: ['filingCabinet', 'bookcase'], roomTypes: ['storage'] },
    { name: 'Canteen', nameNl: 'Kantine', favours: ['meetingTable', 'meetingChair', 'coffeeCounter'], roomTypes: ['dining', 'kitchen'] },
    { name: 'Waiting Area', nameNl: 'Wachtruimte', favours: ['waitingSofa', 'houseplant', 'meetingChair'], roomTypes: ['living', 'circulation'] },
    { name: 'Printer Corner', nameNl: 'Printerhoek', favours: ['printer', 'filingCabinet'], roomTypes: ['storage'] },
    { name: 'Lounge', nameNl: 'Lounge', favours: ['loungeSofa', 'meetingChair', 'floorRug'], roomTypes: ['living'] },
    { name: 'Briefing Room', nameNl: 'Briefingruimte', favours: ['meetingTable', 'flipchart', 'meetingChair'], roomTypes: ['meeting'] },
    { name: 'Lobby', nameNl: 'Lobby', favours: ['vendingMachine', 'houseplant', 'coatCabinet', 'runner', 'waterCooler'], roomTypes: ['circulation'] },
    { name: 'Workroom', nameNl: 'Werkkamer', favours: ['desk', 'meetingChair', 'bookcase'], roomTypes: ['study'] },
    { name: 'Staff Room', nameNl: 'Personeelskamer', favours: ['coffeeCounter', 'loungeSofa', 'vendingMachine'], roomTypes: ['kitchen', 'living'] },
    { name: 'Car Park', nameNl: 'Parkeerterrein', favours: ['companyCar'], roomTypes: ['garage'] },
    { name: 'Training Room', nameNl: 'Opleidingsruimte', favours: ['flipchart', 'meetingTable', 'meetingChair', 'screen'], roomTypes: ['meeting'] },
    { name: 'Cloakroom', nameNl: 'Garderobe', favours: ['coatCabinet', 'filingCabinet'], roomTypes: ['storage'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'meetingChair', name: 'meeting chair', nameNl: 'vergaderstoel', engineType: 'chair', weight: 1.5, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['meeting', 'study', 'dining', 'living', 'circulation', 'kitchen'] }),
    themeObject({ kind: 'waitingSofa', name: 'waiting sofa', nameNl: 'wachtbank', engineType: 'sofa', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['living', 'circulation'] }),
    themeObject({ kind: 'loungeSofa', name: 'lounge sofa', nameNl: 'loungebank', engineType: 'sofa', weight: 2, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['living'] }),
    themeObject({ kind: 'runner', name: 'runner', nameNl: 'loper', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(1, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['circulation', 'meeting'] }),
    themeObject({ kind: 'floorRug', name: 'floor rug', nameNl: 'vloerkleed', engineType: 'rug', weight: 4, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['living', 'study', 'meeting', 'circulation'] }),
    themeObject({ kind: 'companyCar', name: 'company car', nameNl: 'bedrijfsauto', engineType: 'car', weight: 3, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage'] }),
    // Blocking
    themeObject({ kind: 'desk', name: 'desk', nameNl: 'bureau', engineType: 'desk', weight: 8, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', allowedRoomTypes: ['study'] }),
    themeObject({ kind: 'meetingTable', name: 'meeting table', nameNl: 'vergadertafel', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['meeting', 'dining'] }),
    themeObject({ kind: 'filingCabinet', name: 'filing cabinet', nameNl: 'archiefkast', engineType: 'cabinet', weight: 5, footprints: [rect(1, 1), rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', allowedRoomTypes: ['storage', 'study'] }),
    themeObject({ kind: 'bookcase', name: 'bookcase', nameNl: 'boekenkast', engineType: 'bookshelf', weight: 4, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', allowedRoomTypes: ['study', 'storage'] }),
    themeObject({ kind: 'houseplant', name: 'houseplant', nameNl: 'kamerplant', engineType: 'plant', weight: 6, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['circulation', 'living', 'study', 'meeting', 'dining'] }),
    themeObject({ kind: 'printer', name: 'printer', nameNl: 'printer', engineType: 'cabinet', themeIcon: 'printer', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['study', 'storage', 'circulation'] }),
    themeObject({ kind: 'vendingMachine', name: 'vending machine', nameNl: 'snackautomaat', engineType: 'cabinet', themeIcon: 'vendingMachine', weight: 1.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'circulation', 'dining'] }),
    themeObject({ kind: 'coffeeCounter', name: 'coffee counter', nameNl: 'koffiebar', engineType: 'kitchenCounter', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'dining'] }),
    themeObject({ kind: 'receptionDesk', name: 'reception desk', nameNl: 'receptiebalie', engineType: 'kitchenCounter', themeIcon: 'checkoutCounter', weight: 1, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['circulation'] }),
    themeObject({ kind: 'flipchart', name: 'flipchart', nameNl: 'flipover', engineType: 'easel', themeIcon: 'blackboard', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['meeting'] }),
    themeObject({ kind: 'screen', name: 'screen', nameNl: 'scherm', engineType: 'tv', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['meeting', 'living'] }),
    themeObject({ kind: 'coatCabinet', name: 'coat cabinet', nameNl: 'garderobekast', engineType: 'wardrobe', weight: 2, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['storage', 'circulation'] }),
    // Decor (SLAY-19.1). The lamp is the engine's standing lamp, so it is a floor lamp here too (not a "desk lamp").
    themeObject({ kind: 'waterCooler', name: 'water cooler', nameNl: 'waterkoeler', engineType: 'waterCooler', weight: 3, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'circulation'] }),
    themeObject({ kind: 'serverRack', name: 'server rack', nameNl: 'serverrek', engineType: 'serverRack', weight: 4, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 3, allowedRoomTypes: ['utility'] }),
    themeObject({ kind: 'floorLamp', name: 'floor lamp', nameNl: 'staande lamp', engineType: 'lamp', weight: 3, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['study'] }),
    themeObject({ kind: 'bin', name: 'bin', nameNl: 'prullenbak', engineType: 'bin', weight: 3, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['study', 'meeting', 'kitchen', 'storage'] }),
    themeObject({ kind: 'coatRack', name: 'coat rack', nameNl: 'kapstok', engineType: 'coatRack', weight: 2.5, footprints: [rect(1, 1)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['circulation'] }),
  ],
}
