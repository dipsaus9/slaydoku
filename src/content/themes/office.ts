import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** An office: open plan, meeting rooms, reception, pantry. */
export const OFFICE_THEME: SceneTheme = {
  id: 'office',
  name: 'Office',
  rooms: [
    { name: 'Reception', favours: ['waitingSofa', 'houseplant', 'receptionDesk'] },
    { name: 'Meeting Room', favours: ['meetingTable', 'meetingChair', 'flipchart', 'screen'] },
    { name: 'Open Office', favours: ['desk', 'officeChair', 'printer'] },
    { name: 'Executive Office', favours: ['desk', 'officeChair', 'floorRug', 'bookcase'] },
    { name: 'Mail Room', favours: ['filingCabinet', 'printer'] },
    { name: 'Coffee Corner', favours: ['coffeeCounter', 'vendingMachine', 'poof'] },
    { name: 'Server Room', favours: ['filingCabinet', 'printer'] },
    { name: 'Archive', favours: ['filingCabinet', 'bookcase'] },
    { name: 'Canteen', favours: ['meetingTable', 'meetingChair', 'coffeeCounter'] },
    { name: 'Waiting Area', favours: ['waitingSofa', 'houseplant', 'poof'] },
    { name: 'Printer Corner', favours: ['printer', 'filingCabinet'] },
    { name: 'Lounge', favours: ['loungeSofa', 'poof', 'floorRug'] },
    { name: 'Briefing Room', favours: ['meetingTable', 'flipchart', 'meetingChair'] },
    { name: 'Lobby', favours: ['vendingMachine', 'houseplant', 'coatCabinet'] },
    { name: 'Workroom', favours: ['desk', 'officeChair', 'bookcase'] },
    { name: 'Staff Room', favours: ['coffeeCounter', 'loungeSofa', 'coatCabinet'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'officeChair', name: 'office chair', engineType: 'chair', themeIcon: 'officeChair', weight: 10, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'meetingChair', name: 'meeting chair', engineType: 'chair', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'poof', name: 'poof', engineType: 'chair', themeIcon: 'beanbag', weight: 2, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'waitingSofa', name: 'waiting sofa', engineType: 'sofa', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'loungeSofa', name: 'lounge sofa', engineType: 'sofa', weight: 2, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1 }),
    themeObject({ kind: 'floorRug', name: 'floor rug', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'companyCar', name: 'company car', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    // Blocking
    themeObject({ kind: 'desk', name: 'desk', engineType: 'desk', weight: 9, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall' }),
    themeObject({ kind: 'meetingTable', name: 'meeting table', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'filingCabinet', name: 'filing cabinet', engineType: 'cabinet', weight: 5, footprints: [rect(1, 1), rect(2, 1), rect(3, 1, 0.5)], placement: 'wall' }),
    themeObject({ kind: 'bookcase', name: 'bookcase', engineType: 'bookshelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'houseplant', name: 'houseplant', engineType: 'plant', weight: 5, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'printer', name: 'printer', engineType: 'cabinet', themeIcon: 'printer', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'vendingMachine', name: 'vending machine', engineType: 'cabinet', themeIcon: 'vendingMachine', weight: 1.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'coffeeCounter', name: 'coffee counter', engineType: 'kitchenCounter', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'receptionDesk', name: 'reception desk', engineType: 'kitchenCounter', themeIcon: 'checkoutCounter', weight: 1, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'flipchart', name: 'flipchart', engineType: 'easel', themeIcon: 'blackboard', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'screen', name: 'screen', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'coatCabinet', name: 'coat cabinet', engineType: 'wardrobe', weight: 2, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 1 }),
  ],
}
