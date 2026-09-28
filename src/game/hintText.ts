import { bothPartsText, capitalizeLabel, countWord, possessive, renderClue, roomName, upperFirst } from '../engine/clues/index.ts'
import type { CatalogClue } from '../engine/clues/index.ts'
import { cellKey, roomIdAt } from '../engine/model/index.ts'
import type { Cell, Puzzle } from '../engine/model/index.ts'
import { advancedRegistry } from '../engine/solver/advanced/registry.ts'
import type { HumanStep } from '../engine/solver/human/index.ts'
import { joinList as joinListEn } from '../engine/solver/human/en.ts'
import { joinList as joinListNl } from '../engine/solver/human/nl.ts'
import * as nlText from './hintText.nl.ts'
import type { Locale } from '../locale/types.ts'
import type { Hint, Hint3, HintLevel, NextStep } from './hints.ts'
import type { Focus } from './knowledge.ts'

/**
 * The hint bar text, in `locale` (default `'en'`, SLAY-3.3). `step.explanation` already carries
 * the solver's own wording in that language (`solveHuman`/`solveAdvanced` were given the same
 * locale); this file only has to translate the sentences it builds itself around that text — its
 * Dutch pieces live in `hintText.nl.ts`, never inline here (see that file's header). Technique
 * titles (`Hint3.technique.title`, the record kept alongside a hint, not a sentence a player reads
 * as prose) stay English: they name a technique for tooling, not the puzzle's story.
 */

/** A hint spells out at most this many squares; a hint about one person never has more possible squares. */
export const MAX_NAMED_CELLS = 4

/** More areas or people than this are not listed in a one-line hint. */
const MAX_NAMED_ROOMS = 2
const MAX_NAMED_PEOPLE = 3

const joinList = (locale: Locale, items: readonly string[], word: 'and' | 'or' = 'and', separator = ', '): string =>
  locale === 'nl' ? joinListNl(items, word, separator) : joinListEn(items, word, separator)

/** "row 3, column 4" / "rij 3, kolom 4": the same wording the solver explanations use for a square. */
const cellName = (cell: Cell, locale: Locale): string => (locale === 'nl' ? nlText.cellName(cell.row + 1, cell.col + 1) : `row ${cell.row + 1}, column ${cell.col + 1}`)

/**
 * Squares as a player says them. One square: "row 3, column 4". Several in one row or column share
 * it: "row 9, column 5, 7 and 8". Otherwise each is spelled out.
 */
export function cellsText(cells: readonly Cell[], locale: Locale = 'en'): string {
  const sorted = [...cells].sort((a, b) => a.row - b.row || a.col - b.col)
  const [first] = sorted
  if (first && sorted.length > 1 && sorted.every((c) => c.row === first.row)) {
    const cols = joinList(locale, sorted.map((c) => String(c.col + 1)))
    return locale === 'nl' ? nlText.rowCellsText(first.row + 1, cols) : `row ${first.row + 1}, column ${cols}`
  }
  if (first && sorted.length > 1 && sorted.every((c) => c.col === first.col)) {
    const rows = joinList(locale, sorted.map((c) => String(c.row + 1)))
    return locale === 'nl' ? nlText.colCellsText(first.col + 1, rows) : `column ${first.col + 1}, row ${rows}`
  }
  return joinList(locale, sorted.map((c) => cellName(c, locale)), 'and', '; ')
}

interface Card {
  owner: string
  text: string
  /** For a combined card: "Henry's card has two parts: ...", the whole explanation (the card is not quoted a second time). Null for every other card. */
  parts: string | null
  room: boolean
}

/** A clue card: whose it is and what it says. Null when there is no such card. */
function clueCard(puzzle: Puzzle, clueIndex: number | undefined, locale: Locale): Card | null {
  if (clueIndex === undefined) return null
  const clue = (puzzle.clues as CatalogClue[])[clueIndex]
  if (!clue) return null
  const owner = puzzle.people.find((p) => p.id === clue.personId)?.label ?? clue.personId
  const ctx = { scene: puzzle.scene, people: puzzle.people }
  const lead = locale === 'nl' ? nlText.cardLead(possessive(owner)) : `${possessive(owner)} card`
  return {
    owner,
    text: renderClue(clue, ctx, locale),
    parts: bothPartsText(clue, ctx, lead, locale),
    room: clue.type === 'emptyRoom',
  }
}

const dedupe = (cells: Cell[]): Cell[] => {
  const seen = new Set<string>()
  return cells.filter((c) => !seen.has(cellKey(c)) && seen.add(cellKey(c)))
}

/** Words and helpers every text builder of a puzzle needs. */
function wording(puzzle: Puzzle, locale: Locale) {
  const labelOf = (id: string) => puzzle.people.find((p) => p.id === id)?.label ?? id
  const roomOf = (id: string) => roomName({ scene: puzzle.scene, people: puzzle.people }, id, locale)
  // A person label such as "the victim" can start a sentence: give it a capital there.
  const victim = puzzle.people.find((p) => p.kind === 'victim')?.label ?? ''
  const sentences = (text: string) => capitalizeLabel(upperFirst(text), victim)
  const roomsOf = (cells: Cell[]) => [...new Set(cells.flatMap((c) => roomIdAt(puzzle.scene, c) ?? []))]
  return { labelOf, roomOf, sentences, roomsOf }
}

/** "one square", "three squares" / "één vakje", "drie vakjes". */
const squaresText = (n: number, locale: Locale): string => (locale === 'nl' ? nlText.squaresText(n) : `${countWord(n)} ${n === 1 ? 'square' : 'squares'}`)

/** The techniques of the solver, for the record on a hint. English always: see the file header. */
const techniqueOf = (id: string): { id: string; title: string } => ({
  id,
  title: advancedRegistry.list().find((t) => t.id === id)?.title ?? id,
})

/** The longest reasoning of a placement that is worked out through other steps; the instruction comes after it. */
const MAX_REASONING = 340

/**
 * Why the person stands (or may stand) where the hint says. The cards when they leave the squares on their
 * own; when the cards alone do not, the steps in between (a row that is somebody's, a room that is taken),
 * newest last and as many as fit.
 */
function reasoning(next: NextStep, focus: Focus, cards: Card[], label: string, at: string, locale: Locale): string {
  const { placement, step } = next
  if (placement && (focus.chain.length > 0 || step.technique !== 'single-candidate')) {
    const parts = [...focus.chain.map((s) => s.explanation), step.explanation]
    let used = parts
    while (used.length > 1 && used.join(' ').length > MAX_REASONING) used = used.slice(1)
    const prefix = locale === 'nl' ? nlText.earlierSteps : 'Earlier steps already ruled out other squares.'
    return (used.length < parts.length ? [prefix, ...used] : used).join(' ')
  }
  const [first, second] = cards
  const said = first
    ? [
        first.room
          ? locale === 'nl'
            ? nlText.cardSaysRoom(first.text)
            : `A card says: "${first.text}"`
          : (first.parts ?? (locale === 'nl' ? nlText.cardSays(possessive(first.owner), first.text) : `${possessive(first.owner)} card says: "${first.text}"`)),
      ]
    : []
  if (first && second && (first.parts ?? first.text).length + second.text.length <= 160 && focus.cells.length <= MAX_NAMED_CELLS) {
    said.push(locale === 'nl' ? nlText.anotherCardSays(second.text) : `Another card says: "${second.text}"`)
  }
  const together =
    locale === 'nl'
      ? nlText.together(focus.placed)
      : focus.placed
        ? 'All the cards together, with the rows and columns of the people already placed,'
        : 'All the cards together'
  const left =
    placement || focus.cells.length === 1
      ? locale === 'nl'
        ? nlText.leaveOneSquare(together, label, at)
        : `${together} leave only one square for ${label}: ${at}.`
      : locale === 'nl'
        ? nlText.leaveManySquares(together, focus.cells.length, label)
        : `${together} leave ${countWord(focus.cells.length)} possible squares for ${label}. We do not know yet which one it is.`
  return [...said, left].join(' ')
}

/**
 * The hint about one person: level 1 quotes the card and says how many squares are possible, level 2
 * lights those squares, level 3 gives the reasoning and ends with what to do: place the person when
 * only one square is left, else put a note on the few possible squares.
 */
export function focusHint(puzzle: Puzzle, next: NextStep, focus: Focus, level: HintLevel, locale: Locale = 'en'): Hint {
  const { labelOf, sentences, roomsOf } = wording(puzzle, locale)
  const { placement } = next
  const { cells } = focus
  const label = labelOf(focus.personId)
  const Label = upperFirst(label)
  const cards = focus.cards.flatMap((i) => clueCard(puzzle, i, locale) ?? [])
  const at = cellsText(cells, locale)
  const base = { personIds: [focus.personId], roomIds: roomsOf(cells) }
  const squares = squaresText(cells.length, locale)

  if (level === 1) {
    const [card] = cards
    const lead =
      locale === 'nl'
        ? nlText.focusLead(card ? { room: card.room, text: card.text, possessiveWho: possessive(card.owner) } : null, label)
        : card
          ? `${card.room ? 'Read this card' : `Read ${possessive(card.owner)} card`}: "${card.text}" `
          : `Take a look at ${label}. `
    const text = locale === 'nl' ? nlText.focusLevel1Text(lead, label, squares) : `${lead}With all the cards together, ${label} can only stand on ${squares}.`
    return { level, ...base, text: sentences(text) }
  }
  if (level === 2) {
    const text =
      locale === 'nl'
        ? placement
          ? nlText.focusPlacementText(at, Label)
          : nlText.focusNoteText(Label, at, cells.length === 1)
        : placement
          ? `Look at ${at}. ${Label} must stand there.`
          : `${Label} can only stand on ${at}. ${cells.length === 1 ? 'That square is' : 'Those squares are'} marked on the board.`
    return { level, ...base, cells, text: sentences(text) }
  }

  // Level 3: the reasoning, then what to do.
  const explanation = sentences(reasoning(next, focus, cards, label, at, locale))
  const instruction = sentences(
    locale === 'nl'
      ? placement
        ? nlText.placeInstruction(label, at)
        : nlText.noteInstruction(label, at)
      : placement
        ? `Place ${label} on ${at}.`
        : `Note squares for ${label} on ${at}.`,
  )
  const hint: Hint3 = {
    level,
    ...base,
    cells,
    text: `${explanation} ${instruction}`,
    explanation,
    instruction,
    technique: placement ? techniqueOf(next.step.technique) : { id: 'candidates', title: 'Possible squares' },
  }
  if (placement) hint.placement = placement
  return hint
}

/**
 * The hint for one step of the solver's own reasoning (a technique beyond the cards): the squares it
 * rules out, or the person it places. The lab also builds its solve trace from these.
 */
export function stepHint(puzzle: Puzzle, { step, placement, eliminations }: NextStep, level: HintLevel, locale: Locale = 'en'): Hint {
  const { labelOf, roomOf, sentences, roomsOf } = wording(puzzle, locale)
  const crossed = placement ? [] : (eliminations ?? step.eliminated)
  const cells = placement ? [placement.cell] : dedupe(crossed.length > 0 ? crossed.map((e) => e.cell) : step.cells)
  const personIds = placement ? [placement.personId] : [...new Set(step.people)]
  const roomIds = roomsOf(cells)
  const who = joinList(locale, personIds.map(labelOf))
  const rooms = roomIds.length > 0 && roomIds.length <= MAX_NAMED_ROOMS ? joinList(locale, roomIds.map(roomOf)) : ''
  const card = stepCard(puzzle, step, locale)

  const base = { personIds, roomIds }
  if (level === 1) {
    // The person, and the area: a person who is placed stands in it, otherwise it is where squares fall away.
    const named = personIds.length <= MAX_NAMED_PEOPLE
    const lookEn = (lead: string): string => {
      if (placement) return `${lead} at ${who}${rooms ? ` in ${rooms}` : ''}.`
      if (named) return `${lead} at ${who}${rooms ? `, and pay attention to ${rooms}` : ''}.`
      return rooms ? `Pay attention to ${rooms}.` : 'Take a good look at the board.'
    }
    const text =
      locale === 'nl'
        ? card
          ? `${nlText.stepCardLead(card.room, possessive(card.owner))}: "${card.text}" ${nlText.look(true, placement !== undefined, who, rooms, named)}`
          : nlText.look(false, placement !== undefined, who, rooms, named)
        : card
          ? `${card.room ? 'Read this card' : `Read ${possessive(card.owner)} card`}: "${card.text}" ${lookEn('Then take a look')}`
          : lookEn('Take a look')
    return { level, ...base, text: sentences(text) }
  }
  const at = cellsText(cells, locale)
  const text2 =
    locale === 'nl'
      ? placement
        ? sentences(nlText.stepPlacementText(at, upperFirst(who)))
        : cells.length > MAX_NAMED_CELLS
          ? nlText.markedSquaresText
          : nlText.stepNoteText(at, cells.length === 1)
      : placement
        ? sentences(`Look at ${at}. ${upperFirst(who)} must stand there.`)
        : cells.length > MAX_NAMED_CELLS
          ? 'Look at the marked squares on the board.'
          : `Look at ${at}. ${cells.length === 1 ? 'That square is' : 'Those squares are'} marked on the board.`
  if (level === 2) return { level, ...base, cells, text: text2 }

  // Level 3: why, in plain sentences, then what to do.
  const crossedWho = [...new Set(crossed.map((e) => e.personId))].map(labelOf)
  const crossedNames =
    crossedWho.length <= MAX_NAMED_PEOPLE
      ? locale === 'nl'
        ? nlText.forNames(joinList(locale, crossedWho))
        : ` for ${joinList(locale, crossedWho)}`
      : ''
  const crossedCells = cells.length <= MAX_NAMED_CELLS ? at : locale === 'nl' ? nlText.markedSquares : 'the marked squares'
  const explanation = sentences(
    card && !card.room && crossedWho.length > 0
      ? locale === 'nl'
        ? nlText.ruledOutText(card.parts ?? nlText.cardSays(possessive(card.owner), card.text), crossedNames)
        : `${card.parts ?? `${possessive(card.owner)} card says: "${card.text}"`} That rules out squares${crossedNames}.`
      : step.explanation,
  )
  const instruction = sentences(
    locale === 'nl'
      ? placement
        ? nlText.stepPlaceInstruction(who, at)
        : crossedWho.length > MAX_NAMED_PEOPLE
          ? nlText.crossManyInstruction(crossedCells)
          : nlText.crossInstruction(crossedNames, crossedCells)
      : placement
        ? `Place ${who} on ${at}.`
        : crossedWho.length > MAX_NAMED_PEOPLE
          ? `Put a cross on ${crossedCells}, for everyone who could still stand there.`
          : `Put a cross${crossedNames} on ${crossedCells}.`,
  )
  const hint: Hint3 = {
    level,
    ...base,
    cells,
    text: `${explanation} ${instruction}`,
    explanation,
    instruction,
    technique: techniqueOf(step.technique),
  }
  if (placement) hint.placement = placement
  return hint
}

/** The clue card that triggered a step: whose it is and what it says. Null for other steps. */
const stepCard = (puzzle: Puzzle, step: HumanStep, locale: Locale): Card | null => clueCard(puzzle, step.clueIndex, locale)
