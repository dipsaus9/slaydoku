import { DIRECT_CLUE_KINDS, bothFragments, checkClue, expandClue, isBothClue, isDirectClue, renderClue } from '../engine/clues/index.ts'
import type { CatalogClue, RenderContext } from '../engine/clues/index.ts'
import type { TierId } from '../engine/generator/tiers/index.ts'
import { tierById } from '../engine/generator/tiers/index.ts'
import type { Puzzle } from '../engine/model/index.ts'

export { DIRECT_CLUE_KINDS, isDirectClue }

/** The fixed card of the victim: not part of the share. */
const VICTIM_CARD = 'aloneWithMurderer'

/**
 * The minimum share of direct clues per tier, the ONE table. Share = direct clues / clue cards,
 * victim card excluded. Very easy to medium are decided by the human-solvability ladder (CAD-8.2, CAD-8.3), which
 * limits cards per placement, not the kind of card: a single card that leaves one square is mostly a comparison
 * ("further north than a bed"), so the ladder tiers only ask for a few plain "where" cards. Hard and expert
 * keep the floor measured on the committed packs in CAD-5.5 (see `src/validation/README.md`).
 */
export const MIN_DIRECT_CLUE_SHARE: Readonly<Record<TierId, number>> = {
  'very-easy': 0.2,
  easy: 0.2,
  'easy-medium': 0.2,
  medium: 0.15,
  hard: 0.15,
  expert: 0.15,
}

/** The share of direct clues among the cards of a puzzle (victim card excluded); 1 when there are none. */
export function directClueShare(puzzle: Pick<Puzzle, 'clues'>): number {
  const cards = puzzle.clues.filter((c) => c.type !== VICTIM_CARD)
  if (cards.length === 0) return 1
  return cards.filter(isDirectClue).length / cards.length
}

/** Very easy to medium are ladder tiers (CAD-8.3): their generator draws from every catalog kind, the negative ones only from easy-medium up and the ones that name another person only from medium up. */
const LADDER_TIERS: ReadonlySet<TierId> = new Set<TierId>(['very-easy', 'easy', 'easy-medium', 'medium'])
const NEGATIVE_KINDS: ReadonlySet<string> = new Set(['notBesideObject', 'notWith', 'differentRoom'])
/** Cards that name another person: the ladder uses them from medium up, once that person is placed. */
const PERSON_KINDS: ReadonlySet<string> = new Set(['withPerson', 'aloneWith', 'roomHasGender', 'aloneWithGender', 'sameRoom', 'differentRoom', 'notWith', 'directionOf', 'exactDistance', 'diagonal', 'quadrant'])

/**
 * Whether a puzzle of `tier` may carry a card of `kind`. A combined card (`both`) is one kind: two facts on one card
 * are drawn from easy-medium up (CAD-9.4); see `clueAllowedIn` for the card as a whole, whose parts must pass too.
 */
export function kindAllowedIn(tier: TierId, kind: string): boolean {
  if (!LADDER_TIERS.has(tier)) return (tierById(tier).allowedKinds as readonly string[]).includes(kind)
  if (kind === 'both' && (tier === 'very-easy' || tier === 'easy')) return false
  const positiveOnly = tier === 'very-easy' || tier === 'easy'
  if (tier !== 'medium' && PERSON_KINDS.has(kind)) return false
  return (tierById('medium').allowedKinds as readonly string[]).includes(kind) && !(positiveOnly && NEGATIVE_KINDS.has(kind))
}

/** Whether a puzzle of `tier` may carry this card: its kind is allowed, and for a combined card so is each part. */
export function clueAllowedIn(tier: TierId, clue: CatalogClue): boolean {
  if (!isBothClue(clue)) return kindAllowedIn(tier, clue.type)
  return kindAllowedIn(tier, 'both') && expandClue(clue).every((part) => kindAllowedIn(tier, part.type))
}

/** Words that would make a card gendered or pronoun-led: the cards name people by label and say woman/man as nouns. */
const PRONOUNS = ['he', 'she', 'him', 'her', 'hers', 'his', 'himself', 'herself']
const PRONOUN_RE = new RegExp(`(?<![\\p{L}\\d-])(?:${PRONOUNS.join('|')})(?![\\p{L}\\d-])`, 'iu')
/** A combined card is one phone-sized sentence: longer than this it is two cards written as one. */
export const MAX_COMBINED_TEXT = 200

const escapeRe = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Whole-word matcher of a label or room name as it can stand in a sentence: as stored ("the victim") or with a capital at a
 * sentence start ("The victim"). Case-sensitive, so the label "A" does not match the article "a".
 */
const nameRe = (name: string): RegExp => {
  const forms = [...new Set([name, name.charAt(0).toUpperCase() + name.slice(1)])]
  return new RegExp(`(?<![\\p{L}\\d-])(?:${forms.map(escapeRe).join('|')})(?![\\p{L}\\d-])`, 'gu')
}

/**
 * Problems with the text of a combined card: it must read as one natural sentence. The holder's name once (not
 * once per part), exactly one "and" (between the parts), no pronoun, both parts in it, one full stop at the end,
 * and short enough for a card.
 */
function combinedTextProblems(clue: CatalogClue & { type: 'both' }, text: string, ctx: RenderContext): string[] {
  const problems: string[] = []
  const holder = ctx.people.find((p) => p.id === clue.personId)?.label
  if (holder !== undefined && holder.trim() !== '') {
    const named = text.match(nameRe(holder))?.length ?? 0
    if (named !== 1) problems.push(`names the holder ${named} times, a combined card names them once: "${text}"`)
  }
  // Names and area names can hold an "and" of their own ("Wash and Iron Room"): leave them out before counting.
  const names = [...ctx.people.map((p) => p.label), ...ctx.scene.rooms.map((r) => r.name)].filter((n) => n.trim() !== '')
  const bare = names.reduce((left, name) => left.replace(nameRe(name), ''), text)
  const joins = bare.match(/ and /g)?.length ?? 0
  if (joins !== 1) problems.push(`has ${joins} times "and", a combined card has exactly one between its parts: "${text}"`)
  if (PRONOUN_RE.test(text)) problems.push(`uses a pronoun: "${text}"`)
  if (text.slice(0, -1).includes('.')) problems.push(`is more than one sentence: "${text}"`)
  const { first, second } = bothFragments(clue, ctx)
  if (!text.includes(first) || !text.includes(second)) problems.push(`does not say both parts: "${text}"`)
  if (text.length > MAX_COMBINED_TEXT) problems.push(`is ${text.length} characters, a combined card takes at most ${MAX_COMBINED_TEXT}`)
  return problems
}

const wholeNumber = (n: number): boolean => Number.isInteger(n) && n >= 0

/**
 * Checks the clue cards of `puzzle` for a puzzle of `tier`. Returns the problems, empty when the
 * cards are good:
 *
 * - every card renders as one English sentence: non-empty, capital first, full stop last, no ids or code;
 * - every card is unambiguous: rooms, people and objects it points at exist, a room name or person label
 *   is not shared with another one of the board, and no two cards say the same (two object types never
 *   share a noun, which `clues.test.ts` pins);
 * - the share of direct clues (`DIRECT_CLUE_KINDS`) reaches the tier's minimum (`MIN_DIRECT_CLUE_SHARE`);
 * - every kind is one the tier allows.
 */
export function auditClues(puzzle: Puzzle, tier: TierId): string[] {
  const problems: string[] = []
  const ctx = { scene: puzzle.scene, people: puzzle.people }

  const labels = puzzle.people.map((p) => p.label.trim().toLowerCase())
  if (new Set(labels).size !== labels.length) problems.push('two people share a label, so a card naming one is ambiguous')
  const roomNames = puzzle.scene.rooms.map((r) => r.name.trim().toLowerCase())
  const dupRooms = roomNames.filter((n, i) => roomNames.indexOf(n) !== i)
  if (dupRooms.length > 0) problems.push(`two areas are called "${dupRooms[0]}", so a card naming one is ambiguous`)

  const seen = new Map<string, number>()
  puzzle.clues.forEach((clue, i) => {
    const at = (msg: string) => problems.push(`card ${i + 1}: ${msg}`)
    const c = clue as CatalogClue
    if (!puzzle.people.some((p) => p.id === c.personId)) at(`holder ${c.personId} does not exist`)
    // A combined card: the parts are checked one by one (they carry the args), and the card as a whole.
    if (isBothClue(c)) {
      const broken = checkClue(c, puzzle)
      for (const message of broken) at(message)
      if (broken.length > 0) return // a broken card has no text worth judging
    }
    for (const part of isBothClue(c) ? expandClue(c) : [c]) {
      const args = (part.args ?? {}) as Record<string, unknown>
      const otherIds = [args.otherId].filter((v): v is string => typeof v === 'string')
      for (const id of otherIds) if (!puzzle.people.some((p) => p.id === id)) at(`names ${id}, who does not exist`)
      const roomIds = [args.roomId, ...(Array.isArray(args.roomIds) ? args.roomIds : [])].filter((v): v is string => typeof v === 'string')
      for (const id of roomIds) if (!puzzle.scene.rooms.some((r) => r.id === id)) at(`names area ${id}, which does not exist`)
      if (typeof args.objectType === 'string' && !puzzle.scene.objects.some((o) => o.type === args.objectType)) {
        at(`names a ${String(args.objectType)}, but the board has none`)
      }
      if (typeof args.index === 'number' && (!wholeNumber(args.index) || args.index >= puzzle.scene.width)) at(`row or column ${String(args.index)} is off the board`)
    }
    if (!clueAllowedIn(tier, c)) at(`kind ${c.type} is not used in ${tier} puzzles`)

    const text = renderClue(c, ctx)
    if (text.trim() === '') return at('empty text')
    if (!/^\p{Lu}/u.test(text)) at('does not start with a capital')
    if (!text.endsWith('.')) at('does not end in a full stop')
    if (/\s{2,}|\b(?:undefined|NaN|null)\b|\[object|[{}<>_]|\br\d+[kc]\d+\b/.test(text)) at(`shows code or stray characters: "${text}"`)
    if (isBothClue(c)) for (const message of combinedTextProblems(c, text, ctx)) at(message)
    const first = seen.get(text)
    if (first !== undefined) at(`says the same as card ${first + 1}: "${text}"`)
    else seen.set(text, i)
  })

  const share = directClueShare(puzzle)
  const min = MIN_DIRECT_CLUE_SHARE[tier]
  if (share < min) problems.push(`${Math.round(share * 100)}% direct clues, ${tier} needs at least ${Math.round(min * 100)}%`)
  return problems
}
