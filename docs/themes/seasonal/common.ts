import type { ObjectType } from '../../../src/engine/model/index.ts'
import { isOccupiableType } from '../../../src/engine/model/index.ts'
import type { FloorPattern } from '../../../src/render/scene/roomStyles.ts'
import type { RoomType, SceneTheme, ThemeId, ThemeObject, ThemeRoom } from '../../../src/content/themes/types.ts'
import type { ThemeIconId } from '../../../src/render/icons/themes/types.ts'
import type { SeasonalIconId } from './art.tsx'

/**
 * Room types the seasonal drafts need on top of the closed `RoomType` list in
 * src/content/themes/types.ts. Promotion adds exactly these to that union; nothing else changes.
 */
export type SeasonalRoomType = RoomType | 'outdoor' | 'party' | 'workshop' | 'stable' | 'market' | 'farm' | 'chapel' | 'haunted' | 'grave'

/** Existing engine theme art (src/render/icons/themes) the drafts reuse as is. */
export type ExistingThemeIcon = Extract<ThemeIconId, 'clothesRack' | 'mannequin'>

export interface SeasonalRoom extends Omit<ThemeRoom, 'roomTypes'> {
  roomTypes: SeasonalRoomType[]
  /** Floor of the room on the board (the real engine guesses it from the name; promotion adds the name hints). */
  floor: FloorPattern
}

export interface SeasonalObject extends Omit<ThemeObject, 'occupiable' | 'engineType' | 'themeIcon' | 'allowedRoomTypes' | 'excludeRoomTypes'> {
  engineType: ObjectType
  themeIcon?: SeasonalIconId | ExistingThemeIcon
  allowedRoomTypes: SeasonalRoomType[]
  excludeRoomTypes?: SeasonalRoomType[]
}

export interface SeasonalTheme {
  /** Draft id of the theme. */
  id: string
  name: string
  nameNl: string
  /** When the theme runs, for the preview header. */
  season: string
  seasonNl: string
  blurb: string
  rooms: SeasonalRoom[]
  objects: SeasonalObject[]
}

/** The theme as the generator reads it: a plain `SceneTheme`. Floors stay in the draft only. */
export function toSceneTheme(draft: SeasonalTheme): SceneTheme {
  return {
    id: draft.id as ThemeId,
    name: draft.name,
    nameNl: draft.nameNl,
    rooms: draft.rooms.map(({ floor: _floor, roomTypes, ...room }) => ({ ...room, roomTypes: roomTypes as RoomType[] })),
    objects: draft.objects.map((o) => ({
      ...o,
      occupiable: isOccupiableType(o.engineType),
      themeIcon: o.themeIcon as ThemeIconId | undefined,
      allowedRoomTypes: o.allowedRoomTypes as RoomType[],
      excludeRoomTypes: o.excludeRoomTypes as RoomType[] | undefined,
    })),
  }
}

/**
 * Dutch words for the object kinds, for the previews. Since SLAY-17.4 `ThemeObject.nameNl` is a
 * required field (Dutch clues and the Dutch Legend name the drawn kind, `docs/authoring/theme-and-icons.md`
 * job A): when a draft is promoted to `src/content/themes/`, copy each word here into its kind's
 * `nameNl` (singular, lower case, no article) and let `themes.test.ts` check them.
 */
export const OBJECT_NAMES_NL: Record<string, string> = {
  rockingChair: 'schommelstoel', hayBale: 'hooibaal', leafPile: 'bladerhoop', wovenRug: 'geweven kleed', bed: 'bed', sofa: 'bank',
  pumpkin: 'pompoen', mapleTree: 'esdoorn', appleTree: 'appelboom', mushroom: 'paddenstoel', scarecrow: 'vogelverschrikker',
  bonfire: 'kampvuur', fireplace: 'open haard', bookcase: 'boekenkast', writingDesk: 'schrijftafel', harvestCrate: 'oogstkist',
  pantryShelves: 'voorraadkast', counter: 'toonbank', farmTable: 'boerentafel', harvestTable: 'oogsttafel', bench: 'bankje',
  chrysanthemums: 'chrysanten', wardrobe: 'kledingkast', sideTable: 'bijzettafel', bicycle: 'fiets',
  barStool: 'barkruk', confettiPile: 'confettihoop', floatCart: 'praalwagen', cafeTable: 'cafétafel', frog: 'Oeteldonkse kikker',
  barrel: 'bierton', drum: 'trommel', beerCrate: 'bierkrat', clothesRack: 'kledingrek', mannequin: 'paspop', desk: 'bureau',
  longTable: 'lange tafel', stairs: 'trap', limeTree: 'lindeboom', townStatue: 'standbeeld', tv: 'televisie', pottedPlant: 'kamerplant',
  armchair: 'fauteuil', furRug: 'schapenvacht', rockingHorse: 'hobbelpaard', sleigh: 'slee', christmasTree: 'kerstboom',
  firTree: 'dennenboom', present: 'cadeau', snowman: 'sneeuwpop', reindeer: 'rendier', gingerbreadHouse: 'peperkoekhuisje',
  workbench: 'werkbank', toyShelf: 'speelgoedkast', toyChest: 'speelgoedkist', cupboard: 'kast', marketTable: 'kraam',
  poinsettia: 'kerstster', holly: 'hulst',
  creakyChair: 'krakende stoel', cobwebRug: 'spinnenwebkleed', coffin: 'doodskist', jackOLantern: 'pompoenlantaarn',
  cauldron: 'heksenketel', ghost: 'vriendelijk spook', tombstone: 'grafsteen', candyBowl: 'snoepschaal', broomstick: 'bezemsteel',
  deadTree: 'kale boom', spellShelf: 'spreukenkast', potionCabinet: 'toverdrankkast', alchemyDesk: 'alchemistenbureau',
  oldChest: 'oude kist', feastTable: 'feesttafel', graveFlowers: 'grafbloemen', thornyPlant: 'doornstruik',
}
