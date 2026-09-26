import { bothPartsText, capitalizeLabel, countNl, renderClue, roomName, upperFirst } from '../engine/clues/index.ts'
import type { CatalogClue } from '../engine/clues/index.ts'
import { cellKey, roomIdAt } from '../engine/model/index.ts'
import type { Cell, Puzzle } from '../engine/model/index.ts'
import { advancedRegistry } from '../engine/solver/advanced/registry.ts'
import type { HumanStep } from '../engine/solver/human/index.ts'
import { joinNl } from '../engine/solver/human/nl.ts'
import type { Hint, Hint3, HintLevel, NextStep } from './hints.ts'
import type { Focus } from './knowledge.ts'

/** A hint spells out at most this many squares; a hint about one person never has more possible squares. */
export const MAX_NAMED_CELLS = 4

/** More areas or people than this are not listed in a one-line hint. */
const MAX_NAMED_ROOMS = 2
const MAX_NAMED_PEOPLE = 3

/** "rij 3, kolom 4": the same wording the solver explanations use for a square. */
const cellName = (cell: Cell): string => `rij ${cell.row + 1}, kolom ${cell.col + 1}`

/**
 * Squares as a player says them. One square: "rij 3, kolom 4". Several in one row or column share
 * it: "rij 9, kolom 5, 7 en 8". Otherwise each is spelled out.
 */
export function cellsText(cells: readonly Cell[]): string {
  const sorted = [...cells].sort((a, b) => a.row - b.row || a.col - b.col)
  const [first] = sorted
  if (first && sorted.length > 1 && sorted.every((c) => c.row === first.row)) {
    return `rij ${first.row + 1}, kolom ${joinNl(sorted.map((c) => String(c.col + 1)))}`
  }
  if (first && sorted.length > 1 && sorted.every((c) => c.col === first.col)) {
    return `kolom ${first.col + 1}, rij ${joinNl(sorted.map((c) => String(c.row + 1)))}`
  }
  return joinNl(sorted.map(cellName), 'en', '; ')
}

interface Card {
  owner: string
  text: string
  /** For a combined card: "De kaart van Henry heeft twee delen: ...", the whole explanation (the card is not quoted a second time). Null for every other card. */
  parts: string | null
  room: boolean
}

/** A clue card: whose it is and what it says. Null when there is no such card. */
function clueCard(puzzle: Puzzle, clueIndex: number | undefined): Card | null {
  if (clueIndex === undefined) return null
  const clue = (puzzle.clues as CatalogClue[])[clueIndex]
  if (!clue) return null
  const owner = puzzle.people.find((p) => p.id === clue.personId)?.label ?? clue.personId
  const ctx = { scene: puzzle.scene, people: puzzle.people }
  return { owner, text: renderClue(clue, ctx), parts: bothPartsText(clue, ctx, `De kaart van ${owner}`), room: clue.type === 'emptyRoom' }
}

const dedupe = (cells: Cell[]): Cell[] => {
  const seen = new Set<string>()
  return cells.filter((c) => !seen.has(cellKey(c)) && seen.add(cellKey(c)))
}

/** Words and helpers every text builder of a puzzle needs. */
function wording(puzzle: Puzzle) {
  const labelOf = (id: string) => puzzle.people.find((p) => p.id === id)?.label ?? id
  const roomOf = (id: string) => roomName({ scene: puzzle.scene, people: puzzle.people }, id)
  // A person label such as "het cadeau" can start a sentence: give it a capital there.
  const gift = puzzle.people.find((p) => p.kind === 'victim')?.label ?? ''
  const sentences = (text: string) => capitalizeLabel(upperFirst(text), gift)
  const roomsOf = (cells: Cell[]) => [...new Set(cells.flatMap((c) => roomIdAt(puzzle.scene, c) ?? []))]
  return { labelOf, roomOf, sentences, roomsOf }
}

/** "één vakje", "drie vakjes". */
const squaresText = (n: number): string => `${countNl(n)} ${n === 1 ? 'vakje' : 'vakjes'}`

/** The techniques of the solver, for the record on a hint. */
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
function reasoning(next: NextStep, focus: Focus, cards: Card[], label: string, at: string): string {
  const { placement, step } = next
  if (placement && (focus.chain.length > 0 || step.technique !== 'single-candidate')) {
    const parts = [...focus.chain.map((s) => s.explanation), step.explanation]
    let used = parts
    while (used.length > 1 && used.join(' ').length > MAX_REASONING) used = used.slice(1)
    return (used.length < parts.length ? ['Eerdere stappen sloten al andere vakjes uit.', ...used] : used).join(' ')
  }
  const [first, second] = cards
  const said = first
    ? [first.room ? `Een kaart zegt: "${first.text}"` : (first.parts ?? `De kaart van ${first.owner} zegt: "${first.text}"`)]
    : []
  if (first && second && (first.parts ?? first.text).length + second.text.length <= 160 && focus.cells.length <= MAX_NAMED_CELLS) said.push(`Op een andere kaart staat: "${second.text}"`)
  const together = focus.placed ? 'Alle kaarten samen, met de rijen en kolommen van wie al staat,' : 'Alle kaarten samen'
  const left =
    placement || focus.cells.length === 1
      ? `${together} laten voor ${label} maar één vakje over: ${at}.`
      : `${together} laten voor ${label} ${countNl(focus.cells.length)} vakjes over. Welk vakje het is, weten we nog niet.`
  return [...said, left].join(' ')
}

/**
 * The hint about one person: level 1 quotes the card and says how many squares are possible, level 2
 * lights those squares, level 3 gives the reasoning and ends with what to do: place the person when
 * only one square is left, else put a note on the few possible squares.
 */
export function focusHint(puzzle: Puzzle, next: NextStep, focus: Focus, level: HintLevel): Hint {
  const { labelOf, sentences, roomsOf } = wording(puzzle)
  const { placement } = next
  const { cells } = focus
  const label = labelOf(focus.personId)
  const Label = upperFirst(label)
  const cards = focus.cards.flatMap((i) => clueCard(puzzle, i) ?? [])
  const at = cellsText(cells)
  const base = { personIds: [focus.personId], roomIds: roomsOf(cells) }
  const squares = squaresText(cells.length)

  if (level === 1) {
    const [card] = cards
    const lead = card ? `${card.room ? 'Lees deze kaart' : `Lees de kaart van ${card.owner}`}: "${card.text}" ` : `Kijk eens naar ${label}. `
    return { level, ...base, text: sentences(`${lead}Met alle kaarten samen kan ${label} nog maar op ${squares} staan.`) }
  }
  if (level === 2) {
    const text = placement
      ? `Kijk naar ${at}. Daar moet ${label} staan.`
      : `${Label} kan alleen op ${at} staan. ${cells.length === 1 ? 'Dat vakje is' : 'Die vakjes zijn'} gemarkeerd op het bord.`
    return { level, ...base, cells, text: sentences(text) }
  }

  // Level 3: the reasoning, then what to do.
  const explanation = sentences(reasoning(next, focus, cards, label, at))
  const instruction = sentences(placement ? `Zet ${label} op ${at}.` : `Zet een notitie voor ${label} op ${at}.`)
  const hint: Hint3 = {
    level,
    ...base,
    cells,
    text: `${explanation} ${instruction}`,
    explanation,
    instruction,
    technique: placement ? techniqueOf(next.step.technique) : { id: 'candidates', title: 'Mogelijke vakjes' },
  }
  if (placement) hint.placement = placement
  return hint
}

/**
 * The hint for one step of the solver's own reasoning (a technique beyond the cards): the squares it
 * rules out, or the person it places. The lab also builds its solve trace from these.
 */
export function stepHint(puzzle: Puzzle, { step, placement, eliminations }: NextStep, level: HintLevel): Hint {
  const { labelOf, roomOf, sentences, roomsOf } = wording(puzzle)
  const crossed = placement ? [] : (eliminations ?? step.eliminated)
  const cells = placement ? [placement.cell] : dedupe(crossed.length > 0 ? crossed.map((e) => e.cell) : step.cells)
  const personIds = placement ? [placement.personId] : [...new Set(step.people)]
  const roomIds = roomsOf(cells)
  const who = joinNl(personIds.map(labelOf))
  const rooms = roomIds.length > 0 && roomIds.length <= MAX_NAMED_ROOMS ? joinNl(roomIds.map(roomOf)) : ''
  const card = stepCard(puzzle, step)

  const base = { personIds, roomIds }
  if (level === 1) {
    // The person, and the area: a person who is placed stands in it, otherwise it is where squares fall away.
    const named = personIds.length <= MAX_NAMED_PEOPLE
    const look = (lead: string): string => {
      if (placement) return `${lead} naar ${who}${rooms ? ` in ${rooms}` : ''}.`
      if (named) return `${lead} naar ${who}${rooms ? `, en let op ${rooms}` : ''}.`
      return rooms ? `Let op ${rooms}.` : `${lead} goed naar het bord.`
    }
    const text = card
      ? `${card.room ? 'Lees deze kaart' : `Lees de kaart van ${card.owner}`}: "${card.text}" ${look('Kijk dan')}`
      : look('Kijk eens')
    return { level, ...base, text: sentences(text) }
  }
  const at = cellsText(cells)
  const text2 = placement
    ? sentences(`Kijk naar ${at}. Daar moet ${who} staan.`)
    : cells.length > MAX_NAMED_CELLS
      ? 'Kijk naar de gemarkeerde vakjes op het bord.'
      : `Kijk naar ${at}. ${cells.length === 1 ? 'Dat vakje is' : 'Die vakjes zijn'} gemarkeerd op het bord.`
  if (level === 2) return { level, ...base, cells, text: text2 }

  // Level 3: why, in plain sentences, then what to do.
  const crossedWho = [...new Set(crossed.map((e) => e.personId))].map(labelOf)
  const crossedNames = crossedWho.length <= MAX_NAMED_PEOPLE ? ` voor ${joinNl(crossedWho)}` : ''
  const crossedCells = cells.length <= MAX_NAMED_CELLS ? at : 'de gemarkeerde vakjes'
  const explanation = sentences(
    card && !card.room && crossedWho.length > 0
      ? `${card.parts ?? `De kaart van ${card.owner} zegt: "${card.text}"`} Daardoor vallen er vakjes af${crossedNames}.`
      : step.explanation,
  )
  const instruction = sentences(
    placement
      ? `Zet ${who} op ${at}.`
      : crossedWho.length > MAX_NAMED_PEOPLE
        ? `Zet een kruisje op ${crossedCells}, voor iedereen die daar nog kan staan.`
        : `Zet een kruisje${crossedNames} op ${crossedCells}.`,
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
const stepCard = (puzzle: Puzzle, step: HumanStep): Card | null => clueCard(puzzle, step.clueIndex)
