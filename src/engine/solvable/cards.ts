import { evaluate, expandClue, isGenderClue, isRelationalClue, isStructuralClue } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import type { Person, Placement, Puzzle, Scene } from '../model/index.ts'
import { occupiableCells } from '../model/index.ts'

/** Card kinds that also say something about the OTHER people: who may stand in the holder's room / on the object. */
const EXCLUSIVE_KINDS: readonly string[] = ['alone', 'aloneWith', 'onlyOnObject', 'aloneWithMurderer', 'emptyRoom', 'aloneWithGender']

/** One clue card with what the solvability check needs to know about it. */
export interface Card {
  /** Index in `puzzle.clues`. */
  index: number
  clue: CatalogClue
  holder: string
  /** The person the card compares the holder with, if any. */
  other: string | undefined
  /**
   * The people the card is about besides the holder: `other`, or for a gender card everyone else of that gender
   * (empty when the people are not known, see `cardsOf`).
   */
  named: string[]
  /**
   * Depends on other people: it names one (`otherId`) or asks about the gender of those in the holder's room.
   * Only usable once every person it is about is placed, so from the medium tier up.
   */
  referencing: boolean
  /** Also constrains people other than the holder (room exclusivity), or is holder-independent (`emptyRoom`). */
  exclusive: boolean
  /** True when what the card says about a square never depends on where anybody else stands. */
  stateFree: boolean
}

/** What the solvability check needs to know about one plain clue: the card of a single fact. */
function describe(index: number, clue: CatalogClue, people: readonly Person[]): Card {
  const args = (clue.args ?? {}) as Record<string, unknown>
  const other = typeof args.otherId === 'string' ? args.otherId : undefined
  const exclusive = EXCLUSIVE_KINDS.includes(clue.type) || args.alone === true
  const named = isGenderClue(clue)
    ? people.filter((p) => p.id !== clue.personId && p.gender === clue.args.gender).map((p) => p.id)
    : other === undefined
      ? []
      : [other]
  const referencing = other !== undefined || isGenderClue(clue)
  return { index, clue, holder: clue.personId, other, named, referencing, exclusive, stateFree: !exclusive && !referencing }
}

/**
 * The catalog cards of a puzzle; a stored clue of an unknown kind is skipped (it can never help). `people` gives
 * the genders the gender cards need: without it such a card is about nobody and never allows a square.
 *
 * A combined card (`both`) is ONE card: it needs everybody either part is about, is exclusive when either part is,
 * and names another person when either part does (the first one is `other`).
 */
export function cardsOf(puzzle: Pick<Puzzle, 'clues'> & { people?: readonly Person[] }): Card[] {
  const cards: Card[] = []
  const people = puzzle.people ?? []
  puzzle.clues.forEach((stored, index) => {
    if (!isRelationalClue(stored) && !isStructuralClue(stored)) return
    const clue = stored as CatalogClue
    const parts = partCards(describe(index, clue, people), people)
    if (parts.length === 1) return void cards.push(parts[0] as Card)
    const exclusive = parts.some((p) => p.exclusive)
    const referencing = parts.some((p) => p.referencing)
    cards.push({
      index,
      clue,
      holder: clue.personId,
      other: parts.find((p) => p.other !== undefined)?.other,
      named: [...new Set(parts.flatMap((p) => p.named))],
      referencing,
      exclusive,
      stateFree: !exclusive && !referencing,
    })
  })
  return cards
}

/** The cards of the facts a card is made of: the two parts of a combined card, else just the card. */
export function partCards(card: Card, people: readonly Person[]): Card[] {
  const parts = expandClue(card.clue)
  return parts.length === 1 ? [card] : parts.map((part) => describe(card.index, part, people))
}

/** People a card is about: the holder and the ones it names. */
export const involved = (card: Card): string[] => [card.holder, ...card.named]

/**
 * The victim card ("alone with the murderer") says the victim's room holds exactly one suspect.
 * Judged on the people placed so far it can only rule out a room that already holds two suspects,
 * so it gets its own test instead of `evaluate` (which wants everyone placed).
 */
function murdererRoomOk(puzzle: Pick<Puzzle, 'scene' | 'people'>, placements: readonly Placement[]): boolean {
  const victim = puzzle.people.find((p) => p.kind === 'victim')
  const at = placements.find((p) => p.personId === victim?.id)
  if (!victim || !at) return true
  const room = puzzle.scene.cellRooms[at.cell.row]?.[at.cell.col]
  const suspects = placements.filter((p) => {
    if (p.personId === victim.id) return false
    return puzzle.scene.cellRooms[p.cell.row]?.[p.cell.col] === room
  })
  return suspects.length <= 1
}

/**
 * Whether the card allows `person` on `cell`, given the people already placed.
 * People not placed yet are ignored: a fact about them can only rule a square out
 * once they stand somewhere, so this never rules out a square that is really possible.
 */
export function cardAllows(
  puzzle: Pick<Puzzle, 'scene' | 'people'>,
  card: Card,
  placed: Placement[],
  person: string,
  cell: { row: number; col: number },
): boolean {
  placed.push({ personId: person, cell })
  try {
    if (card.clue.type === 'aloneWithMurderer') return murdererRoomOk(puzzle, placed)
    return evaluate(card.clue, puzzle.scene, placed, puzzle.people)
  } finally {
    placed.pop()
  }
}

/** Every occupiable square of the scene as an index `row * width + col`. */
export function squareIndexes(scene: Scene): number[] {
  return occupiableCells(scene).map((c) => c.row * scene.width + c.col)
}
