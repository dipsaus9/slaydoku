import { drawnKinds, specificNoun } from '../../content/themes/drawn.ts'
import type { ObjectType, Person, PlacedObject, Scene, Side } from '../model/index.ts'
import { isRelationalClue } from './relational/types.ts'
import type {
  CompassSide,
  DiagonalDirection,
  Qualifiers,
  RelationalClue,
} from './relational/types.ts'
import { bothParts, isBothClue } from './types.ts'
import type { BothClue, CatalogClue, LinePosition, StructuralClue } from './types.ts'

/**
 * The ONE Dutch translation file for clue text. No other file under
 * src/engine/clues may contain Dutch words; the relational clue kinds add
 * their entries here too.
 *
 * Wording is neutral: a sentence names the person (their label) and never
 * uses a gendered pronoun.
 * The gender clues say "vrouw" and "man" as nouns (the stored gender value is the word).
 * Terms follow the Dutch Murdoku vocabulary: naast, alleen, samen met, in de hoek, bij een raam, de 3e rij.
 *
 * Objects are named by what the board draws: the theme object noun ("een tuinstoel", "een
 * poef"), never a group noun that hides differently drawn kinds. See `objectNouns`.
 */

interface ObjectWords {
  /** Singular noun, no article. */
  noun: string
  /** Where a person stands relative to it: "op een stoel", "in een auto". */
  on: string
  /** The preposition of `on`, for a theme noun in its place: "op" a chair, "in" a car. */
  prep: 'op' | 'in'
  /** Verb that fits standing/sitting there. */
  verb: 'stond' | 'zat' | 'lag'
}

export const OBJECTS_NL: Record<ObjectType, ObjectWords> = {
  chair: { noun: 'stoel', on: 'op een stoel', prep: 'op', verb: 'zat' },
  rug: { noun: 'tapijt', on: 'op een tapijt', prep: 'op', verb: 'stond' },
  bed: { noun: 'bed', on: 'op een bed', prep: 'op', verb: 'lag' },
  sofa: { noun: 'bank', on: 'op een bank', prep: 'op', verb: 'zat' },
  car: { noun: 'auto', on: 'in een auto', prep: 'in', verb: 'zat' },
  oilSlick: { noun: 'olievlek', on: 'op een olievlek', prep: 'op', verb: 'stond' },
  framedPainting: {
    noun: 'ingelijst schilderij',
    on: 'op een ingelijst schilderij', prep: 'op',
    verb: 'stond',
  },
  table: { noun: 'tafel', on: 'op een tafel', prep: 'op', verb: 'stond' },
  tv: { noun: 'tv', on: 'op een tv', prep: 'op', verb: 'stond' },
  plant: { noun: 'plant', on: 'op een plant', prep: 'op', verb: 'stond' },
  bookshelf: { noun: 'boekenkast', on: 'op een boekenkast', prep: 'op', verb: 'stond' },
  chest: { noun: 'kist', on: 'op een kist', prep: 'op', verb: 'stond' },
  tree: { noun: 'boom', on: 'op een boom', prep: 'op', verb: 'stond' },
  flowers: { noun: 'bloemperk', on: 'op een bloemperk', prep: 'op', verb: 'stond' },
  easel: { noun: 'ezel', on: 'op een ezel', prep: 'op', verb: 'stond' },
  statue: { noun: 'standbeeld', on: 'op een standbeeld', prep: 'op', verb: 'stond' },
  washingMachine: { noun: 'wasmachine', on: 'op een wasmachine', prep: 'op', verb: 'stond' },
  dryer: { noun: 'droger', on: 'op een droger', prep: 'op', verb: 'stond' },
  cabinet: { noun: 'kast', on: 'op een kast', prep: 'op', verb: 'stond' },
  stairs: { noun: 'trap', on: 'op een trap', prep: 'op', verb: 'stond' },
  toilet: { noun: 'toilet', on: 'op een toilet', prep: 'op', verb: 'zat' },
  sink: { noun: 'wastafel', on: 'op een wastafel', prep: 'op', verb: 'stond' },
  shower: { noun: 'douche', on: 'in een douche', prep: 'in', verb: 'stond' },
  desk: { noun: 'bureau', on: 'op een bureau', prep: 'op', verb: 'stond' },
  wardrobe: { noun: 'kledingkast', on: 'op een kledingkast', prep: 'op', verb: 'stond' },
  diningTable: { noun: 'eettafel', on: 'op een eettafel', prep: 'op', verb: 'stond' },
  kitchenCounter: { noun: 'aanrecht', on: 'op een aanrecht', prep: 'op', verb: 'stond' },
  bicycle: { noun: 'fiets', on: 'op een fiets', prep: 'op', verb: 'stond' },
  gardenTable: { noun: 'tuintafel', on: 'op een tuintafel', prep: 'op', verb: 'stond' },
  bench: { noun: 'bankje', on: 'op een bankje', prep: 'op', verb: 'zat' },
}

const FEATURES_NL = { window: 'raam', door: 'deur' } as const

/** Row/column names for "first", "last" and "middle". */
const LINES_NL: Record<'row' | 'column', { noun: string; positions: Record<LinePosition, string> }> = {
  row: {
    noun: 'rij',
    positions: { first: 'bovenste rij', last: 'onderste rij', middle: 'middelste rij' },
  },
  column: {
    noun: 'kolom',
    positions: { first: 'meest linkse kolom', last: 'meest rechtse kolom', middle: 'middelste kolom' },
  },
}

/** Edge of a room: the line names its side ("bovenste rij", "meest rechtse kolom"). */
const EDGES_NL: Record<Side, string> = {
  north: LINES_NL.row.positions.first,
  south: LINES_NL.row.positions.last,
  west: LINES_NL.column.positions.first,
  east: LINES_NL.column.positions.last,
}

/**
 * The victim is the gift ("Het cadeau"): the wording is about a gift, not a crime. The
 * victim card shows `title` above `clue`; `renderClue` joins them in one sentence.
 */
export const GIFT_NL = {
  /** Mid-sentence: "dan het cadeau". The victim carries this as its label. */
  noun: 'het cadeau',
  title: 'Het cadeau',
  clue: 'Was alleen met de dader.',
  sentence: 'Het cadeau was alleen met de dader.',
} as const

/** "3e": ordinal of a 1-based number. */
export function ordinalNl(n: number): string {
  return `${n}e`
}

/** Upper-cases the first letter: a sentence that starts with a label such as "het cadeau". */
export function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Upper-cases `label` wherever it starts a sentence in `text` (at the start, or after ". ",
 * "! " or "? "). Uses in the middle of a sentence stay as they are: "Het cadeau staat op
 * r1k2. Dan kan Alice niet naast het cadeau staan."
 */
export function capitalizeLabel(text: string, label: string): string {
  if (label.trim() === '') return text
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(^|[.!?]\\s+)${escaped}(?![\\p{L}\\d])`, 'gu')
  return text.replace(pattern, (_, lead: string) => `${lead}${upperFirst(label)}`)
}

/** Small counts are written out ("precies drie kolommen"), larger ones stay digits. */
const COUNT_WORDS = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf']
export const countNl = (n: number): string => COUNT_WORDS[n] ?? String(n)

/**
 * What a renderer needs to know about the puzzle. `objects` lets a clue name the kinds the board
 * draws; without it (a bare test scene) a clue uses the engine noun of the type.
 */
export interface RenderContext {
  scene: Pick<Scene, 'rooms'> & { objects?: readonly Pick<PlacedObject, 'id' | 'type'>[] }
  people: Person[]
}

/**
 * The nouns that name the objects of engine type `type` on the board, one per differently drawn
 * kind: ["tuinstoel", "poef"]. A group of kinds that look alike (tuinstoel and schoolstoel both draw
 * the plain chair) is named by the engine noun ("stoel"). A clue about a type is true for every
 * object of the type, so it names every drawn kind. A scene with no object of the type gets the
 * engine noun.
 */
export function objectNouns(objects: RenderContext['scene']['objects'], type: ObjectType): string[] {
  const generic = OBJECTS_NL[type].noun
  const nouns = drawnKinds(objects ?? [], type).map((group) => specificNoun(group) ?? generic)
  return nouns.length > 0 ? [...new Set(nouns)] : [generic]
}

/** "tuinstoel", "tuinstoel of poef", "bureaustoel, vergaderstoel of poef". */
function joinOr(words: string[]): string {
  return words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} of ${words[words.length - 1]}`
}

/** What follows "een" for an object type: the noun of every drawn kind of it. */
const anObject = (ctx: RenderContext, type: ObjectType): string => joinOr(objectNouns(ctx.scene.objects, type))

function nameOf(ctx: RenderContext, personId: string): string {
  return ctx.people.find((p) => p.id === personId)?.label ?? personId
}

/**
 * "de Woonkamer", "het Fietsenhok". Room names are stored with their article (the scenes say
 * "het Fietsenhok", "de Gang"); a name without one gets "de". The map labels show the bare noun.
 */
export function roomName(ctx: RenderContext, roomId: string): string {
  const name = ctx.scene.rooms.find((r) => r.id === roomId)?.name ?? roomId
  return /^(de|het|'t)\s/i.test(name) ? name : `de ${name}`
}

const inRoom = (ctx: RenderContext, roomId: string): string => `in ${roomName(ctx, roomId)}`

const withRoom = (ctx: RenderContext, roomId: string | undefined): string =>
  roomId === undefined ? '' : ` ${inRoom(ctx, roomId)}`

const SIDES_NL: Record<CompassSide, { comparative: string; unit: [string, string] }> = {
  north: { comparative: 'noordelijker', unit: ['rij', 'rijen'] },
  south: { comparative: 'zuidelijker', unit: ['rij', 'rijen'] },
  east: { comparative: 'oostelijker', unit: ['kolom', 'kolommen'] },
  west: { comparative: 'westelijker', unit: ['kolom', 'kolommen'] },
}

const DIAGONALS_NL: Record<DiagonalDirection, string> = {
  northwest: 'ten noordwesten',
  northeast: 'ten noordoosten',
  southwest: 'ten zuidwesten',
  southeast: 'ten zuidoosten',
}

/**
 * Where something stands relative to a person or object, in the words of the plan: north is
 * up. Only used with a unit ("één rij boven B") or a square ("het vakje direct onder een
 * bed"), so "boven" never reads as upstairs and "onder" never as underneath.
 */
const PLAN_SIDES_NL: Record<CompassSide, string> = {
  north: 'boven',
  south: 'onder',
  east: 'rechts van',
  west: 'links van',
}

/** "precies één rij", "precies drie rijen". */
function exactly(count: number, [one, many]: [string, string]): string {
  return count === 1 ? `precies één ${one}` : `precies ${countNl(count)} ${many}`
}

/**
 * One sentence around a relation phrase. Qualifiers put the room and
 * "alleen" first: "A was alleen in de Galerij, precies één rij boven B."
 */
function relation(ctx: RenderContext, who: string, q: Qualifiers, phrase: string): string {
  const room = withRoom(ctx, q.roomId)
  if (q.alone) return `${who} was alleen${room}, ${phrase}.`
  if (q.roomId !== undefined) return `${who} was${room}, ${phrase}.`
  return `${who} stond ${phrase}.`
}

/** Turns a relational clue into one Dutch sentence (same conventions as `renderClue`). */
function renderRelational(clue: RelationalClue, ctx: RenderContext): string {
  const who = nameOf(ctx, clue.personId)
  switch (clue.type) {
    case 'directionOf':
      return relation(
        ctx,
        who,
        clue.args,
        `${SIDES_NL[clue.args.side].comparative} dan ${nameOf(ctx, clue.args.otherId)}`,
      )
    case 'directionOfObject':
      return relation(
        ctx,
        who,
        clue.args,
        `${SIDES_NL[clue.args.side].comparative} dan een ${anObject(ctx, clue.args.objectType)}`,
      )
    case 'exactDistance': {
      const side = SIDES_NL[clue.args.side]
      return relation(
        ctx,
        who,
        clue.args,
        `${exactly(clue.args.count, side.unit)} ${PLAN_SIDES_NL[clue.args.side]} ${nameOf(ctx, clue.args.otherId)}`,
      )
    }
    case 'directlyNextToObject':
      return `${who} stond op het vakje direct ${PLAN_SIDES_NL[clue.args.side]} een ${anObject(ctx, clue.args.objectType)}.`
    case 'diagonal': {
      const { direction, steps, otherId } = clue.args
      const other = nameOf(ctx, otherId)
      const where = direction === undefined ? `van ${other}` : `${DIAGONALS_NL[direction]} van ${other}`
      let phrase = `op dezelfde diagonaal als ${other}`
      if (steps !== undefined) phrase = `${exactly(steps, ['vakje', 'vakjes'])} diagonaal ${where}`
      else if (direction !== undefined) phrase = `op de diagonaal ${where}`
      return relation(ctx, who, clue.args, phrase)
    }
    case 'quadrant':
      return relation(
        ctx,
        who,
        clue.args,
        `ergens ${DIAGONALS_NL[clue.args.direction]} van ${nameOf(ctx, clue.args.otherId)}`,
      )
    case 'sameRoom':
      return `${who} was in dezelfde kamer als ${nameOf(ctx, clue.args.otherId)}.`
    case 'differentRoom':
      return `${who} was in een andere kamer dan ${nameOf(ctx, clue.args.otherId)}.`
    case 'notWith':
      return `${who} was niet samen met ${nameOf(ctx, clue.args.otherId)}.`
    case 'notBesideObject':
      return `${who} stond niet naast een ${anObject(ctx, clue.args.objectType)}.`
  }
}

/** Turns a clue (structural or relational) into one Dutch sentence. */
export function renderClue(clue: CatalogClue, ctx: RenderContext): string {
  // A person label such as "het cadeau" can start the sentence: it still gets a capital.
  return upperFirst(renderSentence(clue, ctx))
}

/**
 * What one structural fact says, worded so it can stand alone or share a sentence:
 * - a predicate follows the holder ("stond naast een tafel"): "<who> <predicate>.";
 * - an existential is a sentence of its own that points at the holder only in passing ("er was minstens één
 *   vrouw in de ruimte van <who>"). Given no name it points back to the holder some other way ("in dezelfde
 *   ruimte"), which is how it reads as the second part of a combined card.
 */
type Phrase = { predicate: string } | { existential: (who: string | undefined) => string }

/** The words of one structural kind. `emptyRoom` and `aloneWithMurderer` are whole sentences without a holder. */
function structuralPhrase(clue: Exclude<StructuralClue, BothClue>, ctx: RenderContext): Phrase {
  switch (clue.type) {
    case 'onObject': {
      const o = OBJECTS_NL[clue.args.objectType]
      return { predicate: `${o.verb} ${o.prep} een ${anObject(ctx, clue.args.objectType)}` }
    }
    case 'squareWithObject':
      return {
        existential: (who) =>
          `er stond een ${anObject(ctx, clue.args.objectType)} op ${who === undefined ? 'hetzelfde vakje' : `het vakje van ${who}`}`,
      }
    case 'besideObject': {
      const noun = anObject(ctx, clue.args.objectType)
      return { predicate: clue.args.exactlyOne ? `stond naast precies één ${noun}` : `stond naast een ${noun}` }
    }
    case 'onlyOnObject':
      return { predicate: `was de enige persoon ${OBJECTS_NL[clue.args.objectType].prep} een ${anObject(ctx, clue.args.objectType)}` }
    case 'inRoom':
      return { predicate: `was ${inRoom(ctx, clue.args.roomId)}` }
    case 'inRoomOr': {
      const [a, b] = clue.args.roomIds
      return { predicate: `was ${inRoom(ctx, a)} of ${inRoom(ctx, b)}` }
    }
    case 'inCorner':
      return {
        predicate: clue.args.roomId === undefined ? 'stond in de hoek' : `stond in de hoek van ${roomName(ctx, clue.args.roomId)}`,
      }
    case 'besideFeature':
      return { predicate: `stond bij een ${FEATURES_NL[clue.args.feature]}` }
    case 'inFrontOfDoor':
      return { predicate: `stond voor een ${FEATURES_NL.door}` }
    case 'alone':
      return { predicate: `was alleen${withRoom(ctx, clue.args.roomId)}` }
    case 'withPerson':
      return { predicate: `was samen met ${nameOf(ctx, clue.args.otherId)}${withRoom(ctx, clue.args.roomId)}` }
    case 'aloneWith':
      return { predicate: `was alleen met ${nameOf(ctx, clue.args.otherId)}${withRoom(ctx, clue.args.roomId)}` }
    case 'roomHasGender':
      return {
        existential: (who) =>
          `er was minstens één ${clue.args.gender} in ${who === undefined ? 'dezelfde ruimte' : `de ruimte van ${who}`}`,
      }
    case 'aloneWithGender':
      return { predicate: `was alleen met een ${clue.args.gender}` }
    case 'emptyRoom':
      return { existential: () => `er was niemand ${inRoom(ctx, clue.args.roomId)}` }
    case 'inRow':
      return { predicate: `stond in de ${ordinalNl(clue.args.index + 1)} ${LINES_NL.row.noun}` }
    case 'inColumn':
      return { predicate: `stond in de ${ordinalNl(clue.args.index + 1)} ${LINES_NL.column.noun}` }
    case 'onLine':
      return { predicate: `stond in de ${LINES_NL[clue.args.axis].positions[clue.args.position]}` }
    case 'inRoomEdge':
      return {
        predicate: `stond in de ${EDGES_NL[clue.args.edge]} van ${clue.args.roomId === undefined ? 'de ruimte' : roomName(ctx, clue.args.roomId)}`,
      }
    case 'aloneWithMurderer':
      return { existential: () => GIFT_NL.sentence.replace(/\.$/, '') }
  }
}

/**
 * The two parts of a combined card as the pieces of its sentence: the part that names the holder as
 * predicate ("stond naast een tafel") comes first and the one that needs no name second ("er was minstens één vrouw in
 * dezelfde ruimte"). Two predicates keep the order of the card. `text` is the sentence the card reads as.
 */
export function bothFragments(clue: BothClue, ctx: RenderContext): { first: string; second: string; text: string } {
  const who = nameOf(ctx, clue.personId)
  const [a, b] = bothParts(clue)
  const phrases = [structuralPhrase(a, ctx), structuralPhrase(b, ctx)] as const
  const [one, two] = 'predicate' in phrases[1] && !('predicate' in phrases[0]) ? [phrases[1], phrases[0]] : phrases
  if ('predicate' in one) {
    const second = 'predicate' in two ? two.predicate : two.existential(undefined)
    return { first: one.predicate, second, text: `${who} ${one.predicate} en ${second}.` }
  }
  // Two parts without a predicate: the first names the holder, the second points back at them.
  const first = one.existential(who)
  const second = 'predicate' in two ? two.predicate : two.existential(undefined)
  return { first, second, text: `${first} en ${second}.` }
}

/**
 * One line that spells out a combined card as its two parts, each a sentence of its own: for a hint that
 * explains the card. `lead` is how the line names the card ("Deze kaart"; a hint that has not quoted the card
 * yet says "De kaart van Henry"). `null` for any other card.
 */
export function bothPartsText(clue: CatalogClue, ctx: RenderContext, lead = 'Deze kaart'): string | null {
  if (!isBothClue(clue)) return null
  const [a, b] = bothParts(clue).map((part) => renderClue(part, ctx).replace(/\.$/, ''))
  return `${lead} heeft twee delen: "${a}" en "${b}". Beide delen moeten kloppen.`
}

function renderSentence(clue: CatalogClue, ctx: RenderContext): string {
  if (isRelationalClue(clue)) return renderRelational(clue, ctx)
  if (isBothClue(clue)) return bothFragments(clue, ctx).text
  const phrase = structuralPhrase(clue, ctx)
  const who = nameOf(ctx, clue.personId)
  if ('predicate' in phrase) return `${who} ${phrase.predicate}.`
  return `${phrase.existential(who)}.`
}
