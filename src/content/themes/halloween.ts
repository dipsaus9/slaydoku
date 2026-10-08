import { HOME_THEME } from './home.ts'
import { PARK_THEME } from './park.ts'
import { rect, themeObject } from './define.ts'
import type { RoomType, SceneTheme, ThemeObject, ThemeRoom } from './types.ts'

/**
 * The Halloween theme (SLAY-18.9), built from the owner-approved SLAY-18.5 draft (docs/themes/seasonal/halloween.theme.ts): a cheerful
 * haunted house party for 17-31 October. Playful, never gory: friendly ghosts, carved pumpkins, a bubbling cauldron, cobwebs and a lot of
 * candy. Seasonal: picked by the calendar (src/schedule/calendar.ts), never part of the rotation.
 *
 * Changes from the draft, each forced by a rule that came after it: the plain chair is the only chair (the draft's "creaky chair" is the
 * Home chair); every kind is named in Dutch by exactly what it draws, so a kind with engine art takes the engine noun (Home chair, sofa,
 * chest, wardrobe and kitchen counter, the Park flower bed) and a kind with a Halloween name has a drawing of its own (spell shelf, potion
 * cabinet, alchemy desk, thorny shrub, feast table, candy counter); there are no stairs (CAD-8.6), so the Bat Tower has none; and two
 * occupiable kinds (slime puddle, ghost portrait) bring the theme to the six a theme needs.
 */

const HAUNTED: RoomType = 'haunted'
const OUTDOOR: RoomType = 'outdoor'

/** An object of another theme kept as it is (a kind shared by several themes keeps its nouns and art), with the allowed rooms of this house. */
function reuse(theme: SceneTheme, kind: string, allowedRoomTypes: RoomType[], weight?: number): ThemeObject {
  const found = theme.objects.find((o) => o.kind === kind)
  if (!found) throw new Error(`no ${theme.id} object "${kind}"`)
  return { ...found, allowedRoomTypes, ...(weight === undefined ? {} : { weight }) }
}

const room = (name: string, nameNl: string, roomTypes: RoomType[], favours: string[], floor: ThemeRoom['floor'], outdoor = false): ThemeRoom => ({
  name,
  nameNl,
  roomTypes,
  favours,
  floor,
  ...(outdoor ? { outdoor: true } : {}),
})

export const HALLOWEEN_ROOMS: ThemeRoom[] = [
  room("Witch's Kitchen", 'Heksenkeuken', ['kitchen'], ['cauldron', 'kitchenCounter', 'potionCabinet', 'jackOLantern'], 'tiles'),
  room('Potion Room', 'Toverdrankkamer', ['workshop'], ['cauldron', 'alchemyDesk', 'spellShelf', 'potionCabinet', 'slimePuddle'], 'carpet'),
  room('Haunted Hall', 'Spookgang', ['circulation', HAUNTED], ['ghost', 'cobwebRug', 'chest', 'jackOLantern', 'ghostPortrait'], 'tiles'),
  room('Spooky Library', 'Spookbibliotheek', ['study', HAUNTED], ['spellShelf', 'chair', 'ghost', 'cobwebRug', 'ghostPortrait'], 'wood'),
  room('Cobweb Cellar', 'Spinnenwebkelder', ['storage', HAUNTED], ['cobwebRug', 'chest', 'potionCabinet', 'ghost', 'slimePuddle'], 'stone'),
  room('Ghost Attic', 'Spokenzolder', ['storage', HAUNTED], ['ghost', 'chest', 'cobwebRug', 'wardrobe'], 'wood'),
  room('Vampire Bedroom', 'Vampierenslaapkamer', ['sleeping'], ['coffin', 'wardrobe', 'cobwebRug', 'candyBowl'], 'carpet'),
  room('Crypt', 'Crypte', ['grave', 'sleeping', HAUNTED], ['coffin', 'cobwebRug', 'chest', 'ghost'], 'stone'),
  room('Graveyard', 'Kerkhof', ['grave', OUTDOOR], ['tombstone', 'deadTree', 'ghost', 'flowerBed'], 'grass', true),
  room("Witch's Garden", 'Heksentuin', [OUTDOOR], ['cauldron', 'thornyPlant', 'deadTree', 'gardenBench'], 'grass', true),
  room('Pumpkin Patch', 'Pompoenenveld', [OUTDOOR, 'farm'], ['jackOLantern', 'deadTree', 'ghost'], 'grass', true),
  room('Trick-or-Treat Street', 'Snoepstraat', [OUTDOOR], ['jackOLantern', 'candyBowl', 'gardenBench', 'broomstick'], 'stone', true),
  room('Candy Shop', 'Snoepwinkel', ['market'], ['candyCounter', 'candyBowl', 'jackOLantern'], 'carpet'),
  room('Party Hall', 'Feestzaal', ['party'], ['feastTable', 'candyBowl', 'ghost', 'sofa'], 'wood'),
  room('Bat Tower', 'Vleermuistoren', ['circulation', HAUNTED], ['ghost', 'spellShelf', 'ghostPortrait', 'cobwebRug'], 'stone'),
  room('Broom Shed', 'Bezemschuur', ['garage'], ['broomstick', 'chest', 'cauldron'], 'stone'),
]

export const HALLOWEEN_OBJECTS: ThemeObject[] = [
  // Occupiable
  reuse(HOME_THEME, 'chair', ['kitchen', 'study', 'party', 'workshop']),
  reuse(HOME_THEME, 'sofa', ['party', 'study']),
  themeObject({ kind: 'cobwebRug', name: 'cobweb rug', nameNl: 'spinnenwebkleed', engineType: 'rug', themeIcon: 'cobwebRug', weight: 5, footprints: [rect(1, 1), rect(2, 1, 0.7), rect(2, 2, 0.4)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: [HAUNTED, 'sleeping', 'party'] }),
  themeObject({ kind: 'coffin', name: 'coffin', nameNl: 'doodskist', engineType: 'bed', themeIcon: 'coffin', weight: 3, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['sleeping'] }),
  themeObject({ kind: 'slimePuddle', name: 'slime puddle', nameNl: 'slijmplas', engineType: 'oilSlick', themeIcon: 'slimePuddle', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 1, allowedRoomTypes: [HAUNTED, 'workshop', 'kitchen'] }),
  themeObject({ kind: 'ghostPortrait', name: 'ghost portrait', nameNl: 'spookportret', engineType: 'framedPainting', themeIcon: 'ghostPortrait', weight: 3, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [HAUNTED, 'study', 'party'] }),
  // Blocking
  themeObject({ kind: 'jackOLantern', name: 'jack-o-lantern', nameNl: 'pompoenlantaarn', engineType: 'plant', themeIcon: 'jackOLantern', weight: 8, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['farm', OUTDOOR, 'party', 'kitchen', 'market', 'circulation'] }),
  themeObject({ kind: 'cauldron', name: 'cauldron', nameNl: 'heksenketel', engineType: 'chest', themeIcon: 'cauldron', weight: 3, footprints: [rect(1, 1)], placement: 'centre', maxPerRoom: 2, allowedRoomTypes: ['kitchen', 'workshop', OUTDOOR, 'garage'] }),
  themeObject({ kind: 'ghost', name: 'friendly ghost', clueNoun: 'ghost', nameNl: 'spook', engineType: 'statue', themeIcon: 'ghost', weight: 4, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: [HAUNTED, 'party', 'grave', OUTDOOR] }),
  themeObject({ kind: 'tombstone', name: 'tombstone', nameNl: 'grafsteen', engineType: 'statue', themeIcon: 'tombstone', weight: 7, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['grave'] }),
  themeObject({ kind: 'candyBowl', name: 'candy bowl', nameNl: 'snoepschaal', engineType: 'plant', themeIcon: 'candyBowl', weight: 4, footprints: [rect(1, 1)], placement: 'anywhere', maxPerRoom: 2, allowedRoomTypes: ['market', 'party', 'kitchen', 'sleeping', OUTDOOR] }),
  themeObject({ kind: 'broomstick', name: "witch's broom", clueNoun: 'broom', nameNl: 'heksenbezem', engineType: 'bicycle', themeIcon: 'broomstick', weight: 3, footprints: [rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage', OUTDOOR] }),
  themeObject({ kind: 'deadTree', name: 'bare tree', nameNl: 'kale boom', engineType: 'tree', themeIcon: 'deadTree', weight: 6, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['grave', OUTDOOR] }),
  themeObject({ kind: 'thornyPlant', name: 'thorny shrub', nameNl: 'doornstruik', engineType: 'plant', themeIcon: 'thornyPlant', weight: 4, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: [OUTDOOR, HAUNTED] }),
  themeObject({ kind: 'spellShelf', name: 'spell book shelf', clueNoun: 'spell shelf', nameNl: 'toverboekenkast', engineType: 'bookshelf', themeIcon: 'spellShelf', weight: 3, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['study', 'workshop', HAUNTED] }),
  themeObject({ kind: 'potionCabinet', name: 'potion cabinet', nameNl: 'toverdrankkast', engineType: 'cabinet', themeIcon: 'potionCabinet', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['workshop', 'kitchen', 'storage'] }),
  themeObject({ kind: 'alchemyDesk', name: 'alchemy desk', nameNl: 'alchemistentafel', engineType: 'desk', themeIcon: 'alchemyDesk', weight: 2, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['workshop', 'study'] }),
  themeObject({ kind: 'candyCounter', name: 'candy counter', nameNl: 'snoeptoonbank', engineType: 'kitchenCounter', themeIcon: 'candyCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['market'] }),
  themeObject({ kind: 'feastTable', name: 'feast table', nameNl: 'feesttafel', engineType: 'diningTable', themeIcon: 'feastTable', weight: 3, footprints: [rect(2, 1), rect(3, 1), rect(2, 2)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['party', 'kitchen'] }),
  themeObject({ kind: 'gardenBench', name: 'garden bench', nameNl: 'tuinbank', engineType: 'bench', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: [OUTDOOR, 'grave'] }),
  reuse(HOME_THEME, 'chest', ['storage', 'grave', HAUNTED, 'garage']),
  reuse(HOME_THEME, 'wardrobe', ['sleeping', 'storage']),
  reuse(HOME_THEME, 'kitchenCounter', ['kitchen']),
  reuse(PARK_THEME, 'flowerBed', ['grave', OUTDOOR]),
]

export const HALLOWEEN_THEME: SceneTheme | undefined = {
  id: 'halloween',
  seasonal: true,
  name: 'Haunted house party',
  nameNl: 'Spookhuisfeest',
  rooms: HALLOWEEN_ROOMS,
  objects: HALLOWEEN_OBJECTS,
}
