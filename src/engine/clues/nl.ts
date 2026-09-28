import type { ObjectType, Side } from '../model/index.ts'
import { isRelationalClue } from './relational/types.ts'
import type { CompassSide, DiagonalDirection, Qualifiers, RelationalClue } from './relational/types.ts'
import { OBJECT_WORDS, objectNouns, possessive, upperFirst } from './en.ts'
import type { RenderContext } from './en.ts'
import { bothParts, isBothClue } from './types.ts'
import type { BothClue, CatalogClue, LinePosition, StructuralClue } from './types.ts'

/**
 * The Dutch counterpart of `en.ts`, function for function, so the two stay easy to compare. Same
 * house style: short sentences, no gendered pronoun (gender is a noun, "man"/"vrouw"), squares
 * counted "rij 3, kolom 4" from the top and the left, the same as the board's axis labels.
 *
 * Room and object nouns are the exact English words `en.ts` uses (`OBJECT_WORDS`, `objectNouns`,
 * a room's stored `name`): the board, the Legend and the noun audit (`objectNames.ts`) have no
 * Dutch translation of the theme content yet, so a Dutch sentence names the same noun an English
 * one would, and only the grammar around it — articles, prepositions, verbs, connectors, compass
 * and count words — changes. See the story's implementation notes (SLAY-3.2).
 */

/** Dutch preposition for a stored English preposition ("on" / "in"). */
const PREP_NL: Record<'on' | 'in', string> = { on: 'op', in: 'in' }
/** Dutch simple past for a stored English verb ("stood" / "sat" / "lay"). */
const VERB_NL: Record<'stood' | 'sat' | 'lay', string> = { stood: 'stond', sat: 'zat', lay: 'lag' }

/** The Dutch counterpart of `OBJECT_WORDS`: same noun (unchanged, see file header), translated preposition and verb. */
export const OBJECT_WORDS_NL: Record<ObjectType, { noun: string; prep: string; verb: string }> = Object.fromEntries(
  (Object.entries(OBJECT_WORDS) as [ObjectType, (typeof OBJECT_WORDS)[ObjectType]][]).map(([type, w]) => [
    type,
    { noun: w.noun, prep: PREP_NL[w.prep], verb: VERB_NL[w.verb] },
  ]),
) as Record<ObjectType, { noun: string; prep: string; verb: string }>

/** "een {noun}": Dutch has one indefinite article, never an a/an split like English. */
const withArticleNl = (noun: string): string => `een ${noun}`

/** Where a person stands relative to an object, Dutch: "op een stoel", "in een auto". */
export const objectOnNl = (type: ObjectType): string => `${OBJECT_WORDS_NL[type].prep} ${withArticleNl(OBJECT_WORDS_NL[type].noun)}`

const FEATURES_NL = { window: 'raam', door: 'deur' } as const

/** The gender values ("woman"/"man") as the Dutch noun a sentence says. */
const GENDER_NL: Record<'woman' | 'man', string> = { woman: 'vrouw', man: 'man' }

/** Row/column names for "first", "last" and "middle", Dutch. */
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

/** Edge of a room, Dutch: the line names its side. */
const EDGES_NL: Record<Side, string> = {
  north: LINES_NL.row.positions.first,
  south: LINES_NL.row.positions.last,
  west: LINES_NL.column.positions.first,
  east: LINES_NL.column.positions.last,
}

/** The victim card, Dutch. Same shape as `VICTIM_TEXT`. */
export const VICTIM_TEXT_NL = {
  noun: 'het slachtoffer',
  title: 'Het slachtoffer',
  clue: 'Was alleen met de moordenaar.',
  sentence: 'Het slachtoffer was alleen met de moordenaar.',
} as const

/** Small counts written out, Dutch; "een" doubles as the article and the number one, like in real Dutch. */
const COUNT_WORDS_NL = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf']
export const countWordNl = (n: number): string => COUNT_WORDS_NL[n] ?? String(n)

/** "garden chair of poof": the nouns a clue about `type` uses, joined the Dutch way. */
function joinOrNl(words: string[]): string {
  return words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} of ${words[words.length - 1]}`
}

/** "een garden chair", "een garden chair of een poof": every drawn kind of the type, each with its article. */
const anObjectNl = (ctx: RenderContext, type: ObjectType): string =>
  joinOrNl(objectNouns(ctx.scene.objects, type).map(withArticleNl))

/** The nouns without an article, for "precies één garden chair of poof". */
const bareObjectNl = (ctx: RenderContext, type: ObjectType): string => joinOrNl(objectNouns(ctx.scene.objects, type))

function nameOf(ctx: RenderContext, personId: string): string {
  return ctx.people.find((p) => p.id === personId)?.label ?? personId
}

/**
 * "de Kitchen", "de Meeting Room": the room's stored name (English, unchanged) with the Dutch
 * definite article. A stored "the ..." keeps its bare name before the article is added, exactly
 * as `roomName` (en.ts) does for "the".
 */
export function roomNameNl(ctx: RenderContext, roomId: string): string {
  const name = ctx.scene.rooms.find((r) => r.id === roomId)?.name ?? roomId
  const bare = /^the\s/i.test(name) ? name.slice(4) : name
  return `de ${bare}`
}

const inRoomNl = (ctx: RenderContext, roomId: string): string => `in ${roomNameNl(ctx, roomId)}`

const withRoomNl = (ctx: RenderContext, roomId: string | undefined): string =>
  roomId === undefined ? '' : ` ${inRoomNl(ctx, roomId)}`

const COMPASS_NL: Record<CompassSide, string> = { north: 'noorden', south: 'zuiden', east: 'oosten', west: 'westen' }

const DIAGONALS_NL: Record<DiagonalDirection, string> = {
  northwest: 'ten noordwesten van',
  northeast: 'ten noordoosten van',
  southwest: 'ten zuidwesten van',
  southeast: 'ten zuidoosten van',
}

/** Rows/columns unit words for "precies één rij", "precies drie kolommen". */
const UNITS_NL: Record<CompassSide, [string, string]> = {
  north: ['rij', 'rijen'],
  south: ['rij', 'rijen'],
  east: ['kolom', 'kolommen'],
  west: ['kolom', 'kolommen'],
}

/** Where something stands relative to a person, plan words: north is up. Only used with a unit. */
const PLAN_SIDES_NL: Record<CompassSide, string> = { north: 'boven', south: 'onder', east: 'rechts van', west: 'links van' }

/** The square next to an object, Dutch: "het vakje direct boven een bed". */
const SQUARE_SIDES_NL: Record<CompassSide, string> = {
  north: 'direct boven',
  south: 'direct onder',
  east: 'direct rechts van',
  west: 'direct links van',
}

/** "precies één rij", "precies drie kolommen". */
function exactlyNl(count: number, [one, many]: [string, string]): string {
  return count === 1 ? `precies één ${one}` : `precies ${countWordNl(count)} ${many}`
}

/** One sentence around a relation phrase, Dutch: same shape as `relation` (en.ts). */
function relationNl(ctx: RenderContext, who: string, q: Qualifiers, phrase: string): string {
  const room = withRoomNl(ctx, q.roomId)
  if (q.alone) return `${who} was alleen${room}, ${phrase}.`
  if (q.roomId !== undefined) return `${who} was${room}, ${phrase}.`
  return `${who} stond ${phrase}.`
}

/** Turns a relational clue into one Dutch sentence (same conventions as `renderClueNl`). */
function renderRelationalNl(clue: RelationalClue, ctx: RenderContext): string {
  const who = nameOf(ctx, clue.personId)
  switch (clue.type) {
    case 'directionOf':
      return relationNl(
        ctx,
        who,
        clue.args,
        `verder naar het ${COMPASS_NL[clue.args.side]} dan ${nameOf(ctx, clue.args.otherId)}`,
      )
    case 'directionOfObject':
      return relationNl(
        ctx,
        who,
        clue.args,
        `verder naar het ${COMPASS_NL[clue.args.side]} dan ${anObjectNl(ctx, clue.args.objectType)}`,
      )
    case 'exactDistance': {
      return relationNl(
        ctx,
        who,
        clue.args,
        `${exactlyNl(clue.args.count, UNITS_NL[clue.args.side])} ${PLAN_SIDES_NL[clue.args.side]} ${nameOf(ctx, clue.args.otherId)}`,
      )
    }
    case 'directlyNextToObject':
      return `${who} stond op het vakje ${SQUARE_SIDES_NL[clue.args.side]} ${anObjectNl(ctx, clue.args.objectType)}.`
    case 'diagonal': {
      const { direction, steps, otherId } = clue.args
      const other = nameOf(ctx, otherId)
      let phrase = `op dezelfde diagonaal als ${other}`
      if (steps !== undefined) {
        const where = direction === undefined ? `vanaf ${other}` : `${DIAGONALS_NL[direction]} ${other}`
        phrase = `${exactlyNl(steps, ['vakje', 'vakjes'])} diagonaal ${where}`
      } else if (direction !== undefined) phrase = `op de diagonaal ${DIAGONALS_NL[direction]} ${other}`
      return relationNl(ctx, who, clue.args, phrase)
    }
    case 'quadrant':
      return relationNl(
        ctx,
        who,
        clue.args,
        `ergens ${DIAGONALS_NL[clue.args.direction]} ${nameOf(ctx, clue.args.otherId)}`,
      )
    case 'sameRoom':
      return `${who} was in dezelfde kamer als ${nameOf(ctx, clue.args.otherId)}.`
    case 'differentRoom':
      return `${who} was in een andere kamer dan ${nameOf(ctx, clue.args.otherId)}.`
    case 'notWith':
      return `${who} was niet samen met ${nameOf(ctx, clue.args.otherId)}.`
    case 'notBesideObject':
      return `${who} stond niet naast ${anObjectNl(ctx, clue.args.objectType)}.`
  }
}

/** Turns a clue (structural or relational) into one Dutch sentence. */
export function renderClueNl(clue: CatalogClue, ctx: RenderContext): string {
  return upperFirst(renderSentenceNl(clue, ctx))
}

type Phrase = { predicate: string } | { existential: (who: string | undefined) => string }

/** The Dutch words of one structural kind. Same shape and cases as `structuralPhrase` (en.ts). */
function structuralPhraseNl(clue: Exclude<StructuralClue, BothClue>, ctx: RenderContext): Phrase {
  switch (clue.type) {
    case 'onObject': {
      const o = OBJECT_WORDS_NL[clue.args.objectType]
      return { predicate: `${o.verb} ${o.prep} ${anObjectNl(ctx, clue.args.objectType)}` }
    }
    case 'squareWithObject':
      return {
        existential: (who) =>
          `er lag ${anObjectNl(ctx, clue.args.objectType)} op ${who === undefined ? 'hetzelfde vakje' : `${possessive(who)} vakje`}`,
      }
    case 'besideObject':
      return {
        predicate: clue.args.exactlyOne
          ? `stond naast precies één ${bareObjectNl(ctx, clue.args.objectType)}`
          : `stond naast ${anObjectNl(ctx, clue.args.objectType)}`,
      }
    case 'onlyOnObject':
      return {
        predicate: `was de enige persoon ${OBJECT_WORDS_NL[clue.args.objectType].prep} ${anObjectNl(ctx, clue.args.objectType)}`,
      }
    case 'inRoom':
      return { predicate: `was ${inRoomNl(ctx, clue.args.roomId)}` }
    case 'inRoomOr': {
      const [a, b] = clue.args.roomIds
      return { predicate: `was ${inRoomNl(ctx, a)} of ${roomNameNl(ctx, b)}` }
    }
    case 'inCorner':
      return {
        predicate: clue.args.roomId === undefined ? 'stond in een hoek' : `stond in een hoek van ${roomNameNl(ctx, clue.args.roomId)}`,
      }
    case 'besideFeature':
      return { predicate: `stond naast een ${FEATURES_NL[clue.args.feature]}` }
    case 'inFrontOfDoor':
      return { predicate: `stond voor een ${FEATURES_NL.door}` }
    case 'alone':
      return { predicate: `was alleen${withRoomNl(ctx, clue.args.roomId)}` }
    case 'withPerson':
      return { predicate: `was samen met ${nameOf(ctx, clue.args.otherId)}${withRoomNl(ctx, clue.args.roomId)}` }
    case 'aloneWith':
      return { predicate: `was alleen met ${nameOf(ctx, clue.args.otherId)}${withRoomNl(ctx, clue.args.roomId)}` }
    case 'roomHasGender':
      return {
        existential: (who) =>
          `er was minstens één ${GENDER_NL[clue.args.gender]} in ${who === undefined ? 'dezelfde kamer' : `${possessive(who)} kamer`}`,
      }
    case 'aloneWithGender':
      return { predicate: `was alleen met een ${GENDER_NL[clue.args.gender]}` }
    case 'emptyRoom':
      return { existential: () => `er was niemand ${inRoomNl(ctx, clue.args.roomId)}` }
    case 'inRow':
      return { predicate: `stond in ${LINES_NL.row.noun} ${clue.args.index + 1}` }
    case 'inColumn':
      return { predicate: `stond in ${LINES_NL.column.noun} ${clue.args.index + 1}` }
    case 'onLine':
      return { predicate: `stond in de ${LINES_NL[clue.args.axis].positions[clue.args.position]}` }
    case 'inRoomEdge':
      return {
        predicate: `stond in de ${EDGES_NL[clue.args.edge]} van ${clue.args.roomId === undefined ? 'de kamer' : roomNameNl(ctx, clue.args.roomId)}`,
      }
    case 'aloneWithMurderer':
      return { existential: () => VICTIM_TEXT_NL.sentence.replace(/\.$/, '') }
  }
}

/** The two parts of a combined card, Dutch: same shape as `bothFragments` (en.ts). */
export function bothFragmentsNl(clue: BothClue, ctx: RenderContext): { first: string; second: string; text: string } {
  const who = nameOf(ctx, clue.personId)
  const [a, b] = bothParts(clue)
  const phrases = [structuralPhraseNl(a, ctx), structuralPhraseNl(b, ctx)] as const
  const [one, two] = 'predicate' in phrases[1] && !('predicate' in phrases[0]) ? [phrases[1], phrases[0]] : phrases
  if ('predicate' in one) {
    const second = 'predicate' in two ? two.predicate : two.existential(undefined)
    return { first: one.predicate, second, text: `${who} ${one.predicate} en ${second}.` }
  }
  const first = one.existential(who)
  const second = 'predicate' in two ? two.predicate : two.existential(undefined)
  return { first, second, text: `${first} en ${second}.` }
}

/** One line that spells out a combined card as its two parts, Dutch: same shape as `bothPartsText` (en.ts). */
export function bothPartsTextNl(clue: CatalogClue, ctx: RenderContext, lead = 'Dit kaartje'): string | null {
  if (!isBothClue(clue)) return null
  const [a, b] = bothParts(clue).map((part) => renderClueNl(part, ctx).replace(/\.$/, ''))
  return `${lead} heeft twee delen: "${a}" en "${b}". Beide delen moeten waar zijn.`
}

function renderSentenceNl(clue: CatalogClue, ctx: RenderContext): string {
  if (isRelationalClue(clue)) return renderRelationalNl(clue, ctx)
  if (isBothClue(clue)) return bothFragmentsNl(clue, ctx).text
  const phrase = structuralPhraseNl(clue, ctx)
  const who = nameOf(ctx, clue.personId)
  if ('predicate' in phrase) return `${who} ${phrase.predicate}.`
  return `${phrase.existential(who)}.`
}
