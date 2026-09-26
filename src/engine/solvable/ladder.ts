import { evaluate } from '../clues/index.ts'
import type { Placement, Puzzle } from '../model/index.ts'
import { involved, cardAllows, cardsOf, squareIndexes } from './cards.ts'
import type { Card } from './cards.ts'
import { dependentChain } from './chain.ts'

/** The last placements are the ones the rows and columns of the others help least with: they get their own, tighter cap. */
export const LAST_STEPS = 3

export interface LadderOptions {
  /** Most cards one placement may use (rows, columns and squares of placed people are free). Default 3. */
  maxCards?: number
  /**
   * Whether cards that name another person (with, gender of who is in the room, direction, distance, diagonal ...) may be used,
   * once that person is placed. Default true. The tiers below medium turn it off.
   */
  references?: boolean
  /**
   * Most squares the cards of one placement may leave, before any row or column of a placed person is crossed off
   * (CAD-8.7: a card informative on its own). Default unlimited. The free last placement (no card) is exempt.
   */
  maxSquaresFromCards?: number
  /** The same cap for the last `LAST_STEPS` placements, when tighter. Default: `maxSquaresFromCards`. */
  lastSquaresFromCards?: number
  /**
   * Longest chain of dependent placements (see `LadderStep.chain`) a placement may have. Default unlimited.
   * The free last placement is exempt.
   */
  maxChain?: number
}

/** One placement of the ladder. */
export interface LadderStep {
  /** 1-based position. */
  index: number
  personId: string
  cell: { row: number; col: number }
  /** Indexes in `puzzle.clues` of the cards this placement used (0 when rows and columns alone were enough). */
  clues: number[]
  /** People already placed when this step is taken. */
  placedBefore: number
  /** Squares the used cards leave, before any row/column is crossed off (the whole board when no card was used). */
  squaresFromCards: number
  /** Squares the rows, columns and squares of the placed people leave, before any card is read. */
  squaresFromLines: number
  /** Squares left with cards and lines together: 1 for every step. */
  squaresAfterBoth: number
  /**
   * Length of the chain of dependent placements this one ends: 0 when the cards leave exactly one square on their own
   * (nothing else needed), else 1 + the deepest placement it needs, where it needs the people named by its cards and the
   * fewest, least dependent people whose rows and columns cross off the other squares its cards leave. 0 for the free last step.
   */
  chain: number
}

/** A person the ladder could not place, and the fewest squares that stay possible for them. */
export interface LadderStuck {
  personId: string
  squares: number
}

export interface LadderResult {
  /** Everybody could be placed, and the placements obey every card. */
  ok: boolean
  maxCards: number
  references: boolean
  /** The placements in order. Complete when `ok`; the part that worked otherwise. */
  steps: LadderStep[]
  /** People left over when the ladder stops (empty when `ok`). */
  stuck: LadderStuck[]
  /** Most squares the cards of one placement left, over the placements that used a card (0 when none did). */
  maxSquaresFromCards: number
  /** Longest chain of dependent placements (`LadderStep.chain`), over the placements that used a card. */
  chainLength: number
}

const DEFAULTS = { maxCards: 3, references: true }

/**
 * Whether a person could solve the puzzle by placing people one at a time. Each
 * placement may use at most `maxCards` cards plus the rows, columns and squares of
 * the people already placed. A card that names another person only counts once
 * that person is placed; a card of a placed person that names the one being placed
 * counts too, and so does a placed person's "alone" card (nobody else in that room).
 * No scanning, no reasoning about several people at once, no guessing.
 *
 * Optionally each placement is held to caps (CAD-8.7): the cards alone may leave at most
 * `maxSquaresFromCards` squares (`lastSquaresFromCards` for the last `LAST_STEPS`), and the chain of
 * placements it depends on may be at most `maxChain` long. Among the ways to place somebody with the
 * fewest cards the one with the shortest chain and then the fewest squares is used.
 *
 * Placing somebody never makes anybody else harder to place, so the answer does
 * not depend on the order; the order chosen is greedy (fewest cards first, then the shortest chain,
 * then people order), which also gives the fewest 2- and 3-card steps. Pure and deterministic.
 */
export function ladderCheck(puzzle: Puzzle, options: LadderOptions = {}): LadderResult {
  const maxCards = options.maxCards ?? DEFAULTS.maxCards
  const references = options.references ?? DEFAULTS.references
  const maxSquares = options.maxSquaresFromCards ?? Infinity
  const lastSquares = Math.min(options.lastSquaresFromCards ?? Infinity, maxSquares)
  const maxChain = options.maxChain ?? Infinity
  const { scene, people } = puzzle
  const width = scene.width
  const cards = cardsOf(puzzle)
  const squares = squareIndexes(scene)
  const placed: Placement[] = []
  const placedIds = new Set<string>()
  const depths = new Map<string, number>()
  const steps: LadderStep[] = []
  const masks = new Map<string, Uint8Array>()

  const usable = (card: Card, person: string): boolean => {
    if (!references && card.referencing) return false
    if (card.clue.type === 'emptyRoom') return true
    const inv = involved(card)
    if (!inv.every((id) => id === person || placedIds.has(id))) return false
    return inv.includes(person) || card.exclusive
  }

  /** Squares (as a 0/1 mask) the card allows for `person`, given who is placed; cached per placement state. */
  const maskOf = (card: Card, person: string): Uint8Array => {
    const role = involved(card).includes(person) ? person : '*'
    const key = `${card.index}|${card.stateFree ? 0 : placed.length}|${role}`
    const known = masks.get(key)
    if (known) return known
    const mask = new Uint8Array(scene.width * scene.height)
    for (const s of squares) {
      if (cardAllows(puzzle, card, placed, person, { row: Math.floor(s / width), col: s % width })) mask[s] = 1
    }
    masks.set(key, mask)
    return mask
  }

  const rowsTaken = new Set<number>()
  const colsTaken = new Set<number>()

  const baseOf = (): number[] =>
    squares.filter((s) => !rowsTaken.has(Math.floor(s / width)) && !colsTaken.has(s % width))

  /** Chain of dependent placements when `person` stands on `cell` by `used`, whose cards leave `left` (see `dependentChain`). */
  const chainOf = (person: string, used: Card[], left: number[], cell: number): number => {
    const named = new Set<string>()
    for (const card of used) for (const id of involved(card)) if (id !== person && placedIds.has(id)) named.add(id)
    return dependentChain({ width, placed, depths, named, left, cell })
  }

  while (placed.length < people.length) {
    const base = baseOf()
    const cap = people.length - placed.length <= LAST_STEPS ? lastSquares : maxSquares
    // Somebody who a card pins down within a few squares can wait: the last placements are then the precise ones.
    const deferTight = people.length - placed.length > LAST_STEPS
    let best: Found | null = null
    let bestPerson = ''
    const leftOver: LadderStuck[] = []
    for (const person of people) {
      if (placedIds.has(person.id)) continue
      const found = cheapestPlacement(person.id, base, cap)
      if (found.cell !== null) {
        if (!best || precedes(found, best, deferTight)) {
          best = found
          bestPerson = person.id
        }
      } else {
        leftOver.push({ personId: person.id, squares: found.fewest })
      }
    }
    if (!best || best.cell === null) {
      return summary({ ok: false, maxCards, references, steps, stuck: leftOver })
    }
    const cell = { row: Math.floor(best.cell / width), col: best.cell % width }
    steps.push({
      index: steps.length + 1,
      personId: bestPerson,
      cell,
      clues: best.used.map((c) => c.index),
      placedBefore: placed.length,
      squaresFromCards: best.fromCards,
      squaresFromLines: base.length,
      squaresAfterBoth: 1,
      chain: best.used.length === 0 ? 0 : best.chain,
    })
    depths.set(bestPerson, best.chain)
    placed.push({ personId: bestPerson, cell })
    placedIds.add(bestPerson)
    rowsTaken.add(cell.row)
    colsTaken.add(cell.col)
  }

  const full = evaluateAll(puzzle, cards, placed)
  return summary({ ok: full, maxCards, references, steps, stuck: [] })

  function cheapestPlacement(person: string, base: number[], cap: number): Found {
    if (base.length === 1) return { cell: base[0] as number, used: [], masks: [], fewest: 1, fromCards: squares.length, chain: 0, tight: false }
    const options = cards
      .filter((card) => usable(card, person))
      .map((card) => ({ card, mask: maskOf(card, person) }))
      .filter(({ mask }) => base.some((s) => mask[s] === 0))
    let fewest = base.length
    for (let k = 1; k <= maxCards; k++) {
      const hit: { found: Found | null } = { found: null }
      let tight = false
      visit(options, k, 0, [], base, (left, chosen) => {
        fewest = Math.min(fewest, left.length)
        if (left.length !== 1) return
        const cell = left[0] as number
        const fromCards = squares.filter((s) => chosen.every((o) => o.mask[s] === 1))
        if (fromCards.length > cap) return
        const used = chosen.map((o) => o.card)
        const chain = chainOf(person, used, fromCards, cell)
        if (chain > maxChain) return
        if (fromCards.length <= lastSquares) tight = true
        const known = hit.found
        if (known && (known.chain < chain || (known.chain === chain && known.fromCards <= fromCards.length))) return
        hit.found = { cell, used, masks: chosen.map((o) => o.mask), fewest: 1, fromCards: fromCards.length, chain, tight: false }
      })
      if (hit.found) return { ...hit.found, tight }
    }
    return { cell: null, used: [], masks: [], fewest, fromCards: 0, chain: 0, tight: false }
  }

  function summary(base: Omit<LadderResult, 'maxSquaresFromCards' | 'chainLength'>): LadderResult {
    const used = base.steps.filter((s) => s.clues.length > 0)
    return {
      ...base,
      maxSquaresFromCards: Math.max(0, ...used.map((s) => s.squaresFromCards)),
      chainLength: Math.max(0, ...used.map((s) => s.chain)),
    }
  }
}

interface Found {
  cell: number | null
  used: Card[]
  masks: Uint8Array[]
  /** Fewest squares that stay possible when no placement was found. */
  fewest: number
  /** Squares the used cards leave, before any line is crossed off. */
  fromCards: number
  /** Chain of dependent placements this placement ends (see `LadderStep.chain`). */
  chain: number
  /** Some way to place them with this many cards leaves at most `lastSquaresFromCards` squares. */
  tight: boolean
}

/** Whether placing `a` now beats placing `b`: fewer cards, then (early on) the one who cannot wait for the end, then the shorter chain. */
function precedes(a: Found, b: Found, deferTight: boolean): boolean {
  if (a.used.length !== b.used.length) return a.used.length < b.used.length
  if (deferTight && a.tight !== b.tight) return !a.tight
  return a.chain < b.chain
}

interface Option {
  card: Card
  mask: Uint8Array
}

/** Every combination of `k` options (in order), depth first, with the squares of `left` all of them allow. */
function visit(
  options: Option[],
  k: number,
  from: number,
  chosen: Option[],
  left: number[],
  seen: (left: number[], chosen: Option[]) => void,
): void {
  if (chosen.length === k) return seen(left, chosen)
  for (let i = from; i < options.length; i++) {
    const option = options[i] as Option
    const next = left.filter((s) => option.mask[s] === 1)
    // The true square is always allowed, so a branch that left nothing can only be a card the puzzle contradicts.
    if (next.length === 0) continue
    visit(options, k, i + 1, [...chosen, option], next, seen)
  }
}

/** The finished placements must obey every card: a last check on the ladder's own soundness. */
function evaluateAll(puzzle: Puzzle, cards: Card[], placements: Placement[]): boolean {
  return cards.every((card) => evaluate(card.clue, puzzle.scene, placements, puzzle.people))
}
