import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A Dutch family home: living, sleeping, kitchen, bathroom, garage. */
export const HOME_THEME: SceneTheme = {
  id: 'home',
  nameNl: 'Woonhuis',
  rooms: [
    { name: 'Woonkamer', favours: ['bank', 'hoekbank', 'televisie', 'salontafel', 'tapijt'] },
    { name: 'Keuken', favours: ['aanrecht', 'eettafel', 'stoel'] },
    { name: 'Slaapkamer', favours: ['eenpersoonsbed', 'tweepersoonsbed', 'kledingkast'] },
    { name: 'Badkamer', favours: ['douche', 'wastafel', 'toilet'] },
    { name: 'Toilet', favours: ['toilet', 'wastafel'] },
    { name: 'Eetkamer', favours: ['eettafel', 'stoel', 'dressoir'] },
    { name: 'Hal', favours: ['kist'] },
    { name: 'Gang', favours: ['kist', 'kamerplant'] },
    { name: 'Studeerkamer', favours: ['bureau', 'boekenkast', 'stoel'] },
    { name: 'Kinderkamer', favours: ['eenpersoonsbed', 'tapijt', 'kist'] },
    { name: 'Logeerkamer', favours: ['tweepersoonsbed', 'kledingkast'] },
    { name: 'Bijkeuken', favours: ['wasmachine', 'droger', 'wastafel'] },
    { name: 'Garage', favours: ['auto', 'kist'] },
    { name: 'Vliering', favours: ['kist', 'kledingkast'] },
    { name: 'Berging', favours: ['dressoir', 'kist'] },
    { name: 'Serre', favours: ['kamerplant', 'stoel', 'tapijt'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'stoel', nameNl: 'stoel', engineType: 'chair', weight: 9, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'tapijt', nameNl: 'tapijt', engineType: 'rug', weight: 4, footprints: [rect(2, 1), rect(2, 2), rect(1, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'eenpersoonsbed', nameNl: 'eenpersoonsbed', engineType: 'bed', weight: 3, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'tweepersoonsbed', nameNl: 'tweepersoonsbed', engineType: 'bed', weight: 2, footprints: [rect(2, 2)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'bank', nameNl: 'bank', engineType: 'sofa', weight: 4, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'hoekbank', nameNl: 'hoekbank', engineType: 'sofa', weight: 2, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1 }),
    themeObject({ kind: 'auto', nameNl: 'auto', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    // Blocking
    themeObject({ kind: 'salontafel', nameNl: 'salontafel', engineType: 'table', weight: 4, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'eettafel', nameNl: 'eettafel', engineType: 'diningTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'televisie', nameNl: 'televisie', engineType: 'tv', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'kamerplant', nameNl: 'kamerplant', engineType: 'plant', weight: 6, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'boekenkast', nameNl: 'boekenkast', engineType: 'bookshelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'kist', nameNl: 'kist', engineType: 'chest', weight: 2, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'kledingkast', nameNl: 'kledingkast', engineType: 'wardrobe', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'dressoir', nameNl: 'dressoir', engineType: 'cabinet', weight: 2, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall' }),
    themeObject({ kind: 'bureau', nameNl: 'bureau', engineType: 'desk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'aanrecht', nameNl: 'aanrecht', engineType: 'kitchenCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'wasmachine', nameNl: 'wasmachine', engineType: 'washingMachine', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'droger', nameNl: 'droger', engineType: 'dryer', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'toilet', nameNl: 'toilet', engineType: 'toilet', weight: 1.5, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'wastafel', nameNl: 'wastafel', engineType: 'sink', weight: 1.5, footprints: [rect(1, 1), rect(2, 1, 0.5)], placement: 'wall', maxPerRoom: 1 }),
    themeObject({ kind: 'douche', nameNl: 'douche', engineType: 'shower', weight: 1, footprints: [rect(1, 1), rect(2, 2, 0.5)], placement: 'corner', maxPerRoom: 1 }),
  ],
}
