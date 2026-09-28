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
 * The English text of clue wording: every sentence an English clue card shows comes from here,
 * the relational clue kinds included. `nl.ts` is the Dutch counterpart, function for function;
 * `render.ts` is the locale-aware entry point a call site uses to pick between them (SLAY-3.2).
 * This file stays importable on its own (as the existing tests and every locale-unaware caller —
 * the solver's step text, the generator's ladder format, the puzzle-quality audits — still do):
 * it renders English only, and knows nothing about `nl.ts`.
 *
 * Wording is neutral: a sentence names the person (their label) and never uses a gendered
 * pronoun. The gender clues say "woman" and "man" as nouns (the stored gender value is the word).
 * Squares are counted the way the board's axis labels do: "row 3", "column 4", from the top and
 * from the left.
 *
 * Objects are named by what the board draws: the theme object noun ("a garden chair", "a
 * poof"), never a group noun that hides differently drawn kinds. See `objectNouns`. Both
 * locales use the same noun — see `nl.ts`'s header for why.
 */

interface ObjectWords {
  /** Singular noun, no article. */
  noun: string
  /** The preposition that fits a person on it: "on" a chair, "in" a car. */
  prep: 'on' | 'in'
  /** Verb that fits standing/sitting there. */
  verb: 'stood' | 'sat' | 'lay'
}

export const OBJECT_WORDS: Record<ObjectType, ObjectWords> = {
  chair: { noun: 'chair', prep: 'on', verb: 'sat' },
  rug: { noun: 'rug', prep: 'on', verb: 'stood' },
  bed: { noun: 'bed', prep: 'on', verb: 'lay' },
  sofa: { noun: 'sofa', prep: 'on', verb: 'sat' },
  car: { noun: 'car', prep: 'in', verb: 'sat' },
  oilSlick: { noun: 'oil slick', prep: 'on', verb: 'stood' },
  framedPainting: { noun: 'framed painting', prep: 'on', verb: 'stood' },
  table: { noun: 'table', prep: 'on', verb: 'stood' },
  tv: { noun: 'TV', prep: 'on', verb: 'stood' },
  plant: { noun: 'plant', prep: 'on', verb: 'stood' },
  bookshelf: { noun: 'bookshelf', prep: 'on', verb: 'stood' },
  chest: { noun: 'chest', prep: 'on', verb: 'stood' },
  tree: { noun: 'tree', prep: 'on', verb: 'stood' },
  flowers: { noun: 'flower bed', prep: 'on', verb: 'stood' },
  easel: { noun: 'easel', prep: 'on', verb: 'stood' },
  statue: { noun: 'statue', prep: 'on', verb: 'stood' },
  washingMachine: { noun: 'washing machine', prep: 'on', verb: 'stood' },
  dryer: { noun: 'dryer', prep: 'on', verb: 'stood' },
  cabinet: { noun: 'cabinet', prep: 'on', verb: 'stood' },
  stairs: { noun: 'staircase', prep: 'on', verb: 'stood' },
  toilet: { noun: 'toilet', prep: 'on', verb: 'sat' },
  sink: { noun: 'sink', prep: 'on', verb: 'stood' },
  shower: { noun: 'shower', prep: 'in', verb: 'stood' },
  desk: { noun: 'desk', prep: 'on', verb: 'stood' },
  wardrobe: { noun: 'wardrobe', prep: 'on', verb: 'stood' },
  diningTable: { noun: 'dining table', prep: 'on', verb: 'stood' },
  kitchenCounter: { noun: 'kitchen counter', prep: 'on', verb: 'stood' },
  bicycle: { noun: 'bicycle', prep: 'on', verb: 'stood' },
  gardenTable: { noun: 'garden table', prep: 'on', verb: 'stood' },
  bench: { noun: 'bench', prep: 'on', verb: 'sat' },
}

/** "a table", "an easel", "a TV": the noun with its indefinite article. */
export function withArticle(noun: string): string {
  const vowel = /^[aeiou]/i.test(noun) && !/^(uni|use|eu|one)/i.test(noun)
  return `${vowel ? 'an' : 'a'} ${noun}`
}

/** Where a person stands relative to an object: "on a chair", "in a car". Uses the engine noun of the type. */
export const objectOn = (type: ObjectType): string => `${OBJECT_WORDS[type].prep} ${withArticle(OBJECT_WORDS[type].noun)}`

const FEATURES = { window: 'window', door: 'door' } as const

/** Row/column names for "first", "last" and "middle". */
const LINES: Record<'row' | 'column', { noun: string; positions: Record<LinePosition, string> }> = {
  row: {
    noun: 'row',
    positions: { first: 'top row', last: 'bottom row', middle: 'middle row' },
  },
  column: {
    noun: 'column',
    positions: { first: 'leftmost column', last: 'rightmost column', middle: 'middle column' },
  },
}

/** Edge of a room: the line names its side ("top row", "rightmost column"). */
const EDGES: Record<Side, string> = {
  north: LINES.row.positions.first,
  south: LINES.row.positions.last,
  west: LINES.column.positions.first,
  east: LINES.column.positions.last,
}

/**
 * The victim card. The victim's rule is that the murderer ends up alone with them. The victim card
 * shows `title` above `clue`; `renderClue` joins them in one sentence.
 */
export const VICTIM_TEXT = {
  /** Mid-sentence: "then the victim". The victim carries this as its label. */
  noun: 'the victim',
  title: 'The victim',
  clue: 'Was alone with the murderer.',
  sentence: 'The victim was alone with the murderer.',
} as const

/** Upper-cases the first letter: a sentence that starts with a label such as "the victim". */
export function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Upper-cases `label` wherever it starts a sentence in `text` (at the start, or after ". ",
 * "! " or "? "). Uses in the middle of a sentence stay as they are: "The victim stood on
 * row 1, column 2. Then Alice cannot stand next to the victim."
 */
export function capitalizeLabel(text: string, label: string): string {
  if (label.trim() === '') return text
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(^|[.!?]\\s+)${escaped}(?![\\p{L}\\d])`, 'gu')
  return text.replace(pattern, (_, lead: string) => `${lead}${upperFirst(label)}`)
}

/** Small counts are written out ("exactly three columns"), larger ones stay digits. */
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
export const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n)

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
 * kind: ["garden chair", "poof"]. A group of kinds that look alike (garden chair and school chair
 * both draw the plain chair) is named by the engine noun ("chair"). A clue about a type is true for
 * every object of the type, so it names every drawn kind. A scene with no object of the type gets
 * the engine noun.
 */
export function objectNouns(objects: RenderContext['scene']['objects'], type: ObjectType): string[] {
  const generic = OBJECT_WORDS[type].noun
  const nouns = drawnKinds(objects ?? [], type).map((group) => specificNoun(group) ?? generic)
  return nouns.length > 0 ? [...new Set(nouns)] : [generic]
}

/** "garden chair", "garden chair or poof", "office chair, meeting chair or poof". */
function joinOr(words: string[]): string {
  return words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`
}

/** "a garden chair", "a garden chair or a poof": every drawn kind of the type, each with its article. */
const anObject = (ctx: RenderContext, type: ObjectType): string =>
  joinOr(objectNouns(ctx.scene.objects, type).map(withArticle))

/** The nouns without an article, for "exactly one garden chair or poof". */
const bareObject = (ctx: RenderContext, type: ObjectType): string => joinOr(objectNouns(ctx.scene.objects, type))

function nameOf(ctx: RenderContext, personId: string): string {
  return ctx.people.find((p) => p.id === personId)?.label ?? personId
}

/** "Alice's": a label with its possessive ending. */
export const possessive = (label: string): string => (label.endsWith("'s") ? label : `${label}'s`)

/**
 * "the Kitchen", "the Meeting Room". Room names are stored bare ("Kitchen"); a name that already
 * starts with "the" keeps it. The map labels show the bare noun.
 */
export function roomName(ctx: RenderContext, roomId: string): string {
  const name = ctx.scene.rooms.find((r) => r.id === roomId)?.name ?? roomId
  return /^the\s/i.test(name) ? `the ${name.slice(4)}` : `the ${name}`
}

const inRoom = (ctx: RenderContext, roomId: string): string => `in ${roomName(ctx, roomId)}`

const withRoom = (ctx: RenderContext, roomId: string | undefined): string =>
  roomId === undefined ? '' : ` ${inRoom(ctx, roomId)}`

const SIDES: Record<CompassSide, { comparative: string; unit: [string, string] }> = {
  north: { comparative: 'further north', unit: ['row', 'rows'] },
  south: { comparative: 'further south', unit: ['row', 'rows'] },
  east: { comparative: 'further east', unit: ['column', 'columns'] },
  west: { comparative: 'further west', unit: ['column', 'columns'] },
}

const DIAGONALS: Record<DiagonalDirection, string> = {
  northwest: 'to the northwest of',
  northeast: 'to the northeast of',
  southwest: 'to the southwest of',
  southeast: 'to the southeast of',
}

/**
 * Where something stands relative to a person, in the words of the plan: north is up. Only used
 * with a unit ("exactly one row above B") so "above" never reads as upstairs.
 */
const PLAN_SIDES: Record<CompassSide, string> = {
  north: 'above',
  south: 'below',
  east: 'right of',
  west: 'left of',
}

/** The square next to an object: "the square directly above a bed". */
const SQUARE_SIDES: Record<CompassSide, string> = {
  north: 'directly above',
  south: 'directly below',
  east: 'directly right of',
  west: 'directly left of',
}

/** "exactly one row", "exactly three rows". */
function exactly(count: number, [one, many]: [string, string]): string {
  return count === 1 ? `exactly one ${one}` : `exactly ${countWord(count)} ${many}`
}

/**
 * One sentence around a relation phrase. Qualifiers put the room and
 * "alone" first: "A was alone in the Gallery, exactly one row above B."
 */
function relation(ctx: RenderContext, who: string, q: Qualifiers, phrase: string): string {
  const room = withRoom(ctx, q.roomId)
  if (q.alone) return `${who} was alone${room}, ${phrase}.`
  if (q.roomId !== undefined) return `${who} was${room}, ${phrase}.`
  return `${who} stood ${phrase}.`
}

/** Turns a relational clue into one English sentence (same conventions as `renderClue`). */
function renderRelational(clue: RelationalClue, ctx: RenderContext): string {
  const who = nameOf(ctx, clue.personId)
  switch (clue.type) {
    case 'directionOf':
      return relation(
        ctx,
        who,
        clue.args,
        `${SIDES[clue.args.side].comparative} than ${nameOf(ctx, clue.args.otherId)}`,
      )
    case 'directionOfObject':
      return relation(
        ctx,
        who,
        clue.args,
        `${SIDES[clue.args.side].comparative} than ${anObject(ctx, clue.args.objectType)}`,
      )
    case 'exactDistance': {
      const side = SIDES[clue.args.side]
      return relation(
        ctx,
        who,
        clue.args,
        `${exactly(clue.args.count, side.unit)} ${PLAN_SIDES[clue.args.side]} ${nameOf(ctx, clue.args.otherId)}`,
      )
    }
    case 'directlyNextToObject':
      return `${who} stood on the square ${SQUARE_SIDES[clue.args.side]} ${anObject(ctx, clue.args.objectType)}.`
    case 'diagonal': {
      const { direction, steps, otherId } = clue.args
      const other = nameOf(ctx, otherId)
      let phrase = `on the same diagonal as ${other}`
      if (steps !== undefined) {
        const where = direction === undefined ? `from ${other}` : `${DIAGONALS[direction]} ${other}`
        phrase = `${exactly(steps, ['square', 'squares'])} diagonally ${where}`
      } else if (direction !== undefined) phrase = `on the diagonal ${DIAGONALS[direction]} ${other}`
      return relation(ctx, who, clue.args, phrase)
    }
    case 'quadrant':
      return relation(
        ctx,
        who,
        clue.args,
        `somewhere ${DIAGONALS[clue.args.direction]} ${nameOf(ctx, clue.args.otherId)}`,
      )
    case 'sameRoom':
      return `${who} was in the same room as ${nameOf(ctx, clue.args.otherId)}.`
    case 'differentRoom':
      return `${who} was in a different room from ${nameOf(ctx, clue.args.otherId)}.`
    case 'notWith':
      return `${who} was not with ${nameOf(ctx, clue.args.otherId)}.`
    case 'notBesideObject':
      return `${who} did not stand next to ${anObject(ctx, clue.args.objectType)}.`
  }
}

/** Turns a clue (structural or relational) into one English sentence. */
export function renderClue(clue: CatalogClue, ctx: RenderContext): string {
  // A person label such as "the victim" can start the sentence: it still gets a capital.
  return upperFirst(renderSentence(clue, ctx))
}

/**
 * What one structural fact says, worded so it can stand alone or share a sentence:
 * - a predicate follows the holder ("stood next to a table"): "<who> <predicate>.";
 * - an existential is a sentence of its own that points at the holder only in passing ("there was at least one
 *   woman in <who>'s room"). Given no name it points back to the holder some other way ("in the same
 *   room"), which is how it reads as the second part of a combined card.
 */
type Phrase = { predicate: string } | { existential: (who: string | undefined) => string }

/** The words of one structural kind. `emptyRoom` and `aloneWithMurderer` are whole sentences without a holder. */
function structuralPhrase(clue: Exclude<StructuralClue, BothClue>, ctx: RenderContext): Phrase {
  switch (clue.type) {
    case 'onObject': {
      const o = OBJECT_WORDS[clue.args.objectType]
      return { predicate: `${o.verb} ${o.prep} ${anObject(ctx, clue.args.objectType)}` }
    }
    case 'squareWithObject':
      return {
        existential: (who) =>
          `there was ${anObject(ctx, clue.args.objectType)} on ${who === undefined ? 'the same square' : `${possessive(who)} square`}`,
      }
    case 'besideObject':
      return {
        predicate: clue.args.exactlyOne
          ? `stood next to exactly one ${bareObject(ctx, clue.args.objectType)}`
          : `stood next to ${anObject(ctx, clue.args.objectType)}`,
      }
    case 'onlyOnObject':
      return {
        predicate: `was the only person ${OBJECT_WORDS[clue.args.objectType].prep} ${anObject(ctx, clue.args.objectType)}`,
      }
    case 'inRoom':
      return { predicate: `was ${inRoom(ctx, clue.args.roomId)}` }
    case 'inRoomOr': {
      const [a, b] = clue.args.roomIds
      return { predicate: `was ${inRoom(ctx, a)} or ${roomName(ctx, b)}` }
    }
    case 'inCorner':
      return {
        predicate: clue.args.roomId === undefined ? 'stood in a corner' : `stood in a corner of ${roomName(ctx, clue.args.roomId)}`,
      }
    case 'besideFeature':
      return { predicate: `stood next to a ${FEATURES[clue.args.feature]}` }
    case 'inFrontOfDoor':
      return { predicate: `stood in front of a ${FEATURES.door}` }
    case 'alone':
      return { predicate: `was alone${withRoom(ctx, clue.args.roomId)}` }
    case 'withPerson':
      return { predicate: `was with ${nameOf(ctx, clue.args.otherId)}${withRoom(ctx, clue.args.roomId)}` }
    case 'aloneWith':
      return { predicate: `was alone with ${nameOf(ctx, clue.args.otherId)}${withRoom(ctx, clue.args.roomId)}` }
    case 'roomHasGender':
      return {
        existential: (who) =>
          `there was at least one ${clue.args.gender} in ${who === undefined ? 'the same room' : `${possessive(who)} room`}`,
      }
    case 'aloneWithGender':
      return { predicate: `was alone with a ${clue.args.gender}` }
    case 'emptyRoom':
      return { existential: () => `there was nobody ${inRoom(ctx, clue.args.roomId)}` }
    case 'inRow':
      return { predicate: `stood in ${LINES.row.noun} ${clue.args.index + 1}` }
    case 'inColumn':
      return { predicate: `stood in ${LINES.column.noun} ${clue.args.index + 1}` }
    case 'onLine':
      return { predicate: `stood in the ${LINES[clue.args.axis].positions[clue.args.position]}` }
    case 'inRoomEdge':
      return {
        predicate: `stood in the ${EDGES[clue.args.edge]} of ${clue.args.roomId === undefined ? 'the room' : roomName(ctx, clue.args.roomId)}`,
      }
    case 'aloneWithMurderer':
      return { existential: () => VICTIM_TEXT.sentence.replace(/\.$/, '') }
  }
}

/**
 * The two parts of a combined card as the pieces of its sentence: the part that names the holder as
 * predicate ("stood next to a table") comes first and the one that needs no name ("there was at least one
 * woman in the same room") second. Two predicates keep the order of the card. `text` is the sentence the card reads as.
 */
export function bothFragments(clue: BothClue, ctx: RenderContext): { first: string; second: string; text: string } {
  const who = nameOf(ctx, clue.personId)
  const [a, b] = bothParts(clue)
  const phrases = [structuralPhrase(a, ctx), structuralPhrase(b, ctx)] as const
  const [one, two] = 'predicate' in phrases[1] && !('predicate' in phrases[0]) ? [phrases[1], phrases[0]] : phrases
  if ('predicate' in one) {
    const second = 'predicate' in two ? two.predicate : two.existential(undefined)
    return { first: one.predicate, second, text: `${who} ${one.predicate} and ${second}.` }
  }
  // Two parts without a predicate: the first names the holder, the second points back at them.
  const first = one.existential(who)
  const second = 'predicate' in two ? two.predicate : two.existential(undefined)
  return { first, second, text: `${first} and ${second}.` }
}

/**
 * One line that spells out a combined card as its two parts, each a sentence of its own: for a hint that
 * explains the card. `lead` is how the line names the card ("This card"; a hint that has not quoted the card
 * yet says "Henry's card"). `null` for any other card.
 */
export function bothPartsText(clue: CatalogClue, ctx: RenderContext, lead = 'This card'): string | null {
  if (!isBothClue(clue)) return null
  const [a, b] = bothParts(clue).map((part) => renderClue(part, ctx).replace(/\.$/, ''))
  return `${lead} has two parts: "${a}" and "${b}". Both parts must be true.`
}

function renderSentence(clue: CatalogClue, ctx: RenderContext): string {
  if (isRelationalClue(clue)) return renderRelational(clue, ctx)
  if (isBothClue(clue)) return bothFragments(clue, ctx).text
  const phrase = structuralPhrase(clue, ctx)
  const who = nameOf(ctx, clue.personId)
  if ('predicate' in phrase) return `${who} ${phrase.predicate}.`
  return `${phrase.existential(who)}.`
}
