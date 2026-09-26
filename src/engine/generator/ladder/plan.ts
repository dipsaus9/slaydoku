import { expandClue } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import type { Cell, Person, Placement, Scene } from '../../model/index.ts'
import { cardAllows, involved, squareIndexes } from '../../solvable/cards.ts'
import type { Card } from '../../solvable/cards.ts'
import { dependentChain } from '../../solvable/chain.ts'
import { LAST_STEPS } from '../../solvable/ladder.ts'
import type { Rng } from '../rng.ts'

/**
 * Kinds that name a row, a column or a line: giveaways when they dominate, so they are drawn last and capped.
 *
 * `inRoomEdge` (top/bottom row, left/right column OF A ROOM, CAD-9.2) is deliberately NOT one of them: it names no
 * number, the player has to find the room first, and it leaves the few squares of one side of a room like a corner
 * card does. It is a structural card that gets the normal 1/(1 + times used) weight, plus the variety boost below.
 */
export const LINE_KINDS: ReadonlySet<string> = new Set(['inRow', 'inColumn', 'onLine'])
const LINE_WEIGHT = 0.15

/** Whether a card is a line card: its kind is one, or (combined card) one of its parts is. */
export const isLineClue = (clue: CatalogClue): boolean => expandClue(clue).some((part) => LINE_KINDS.has(part.type))

/**
 * Variety weights (CAD-9.4): the kinds the catalog gained (and the distance card that should be seen more often) are
 * drawn more often than a plain kind, so a puzzle reads varied instead of being nothing but "in the kitchen" and
 * "beside a chair". Multiplied with the 1/(1 + times used) weight, so a boosted kind still gives way once it is used.
 * The oracle (`ladderCheck`, the tier, `verifyPuzzle`) still decides what is accepted; this only steers what is tried.
 */
export const KIND_BOOST: Readonly<Record<string, number>> = {
  exactDistance: 6,
  inRoomEdge: 2,
  roomHasGender: 8,
  aloneWithGender: 8,
  both: 0.8,
}
/** Most pair / triple probes per step, so one hopeless step cannot eat the time budget. */
const PROBE_LIMIT = 300_000

/** What one placement of the solving path is allowed to look like. */
export interface PlanRules {
  /** Most cards one placement may use. */
  maxCards: number
  /** Cards naming another person may be used, once that person is placed. */
  references: boolean
  /** Largest number of placements that may use the top count of cards, or `Infinity` (the tier's `maxTopShare`, as a count). */
  maxTopSteps: number
  /** People who must be placeable from their own card alone, before anything else is placed. */
  minPlaceableAlone: number
  /** Most row/column/line cards in the puzzle. */
  lineCap: number
  /** Most squares the cards of one placement may leave before any line is crossed off (tier cap, CAD-8.7). */
  maxSquares: number
  /** The same for the last placements (the last `LAST_STEPS`, the free last one aside). */
  lastSquares: number
  /** Longest chain of dependent placements (see `dependentChain`). */
  maxChain: number
  /** Wanted cards per suspect placement, in the order of placement slots (the plan follows it where the cards allow). */
  schedule: readonly number[]
}

/** One placement of the solving path: who, where, and the cards that leave exactly one square. */
export interface PlannedStep {
  personId: string
  cell: Cell
  cards: Card[]
  /** Squares left by the rows and columns of the people placed before, before any card is read. */
  squaresFromLines: number
}

export interface PlanInput {
  scene: Scene
  people: readonly Person[]
  solution: readonly Placement[]
  /** True cards of the suspects (the victim's own card is added by the caller). `Card.index` is the index in `cards`. */
  cards: readonly Card[]
  rules: PlanRules
  rng: Rng
}

interface Candidate {
  card: Card
  mask: Uint32Array
  count: number
  weight: number
}

/** A way to place one person: the cards, the chain of dependent placements it ends, and how much the kinds vary. */
interface Combo {
  cards: Card[]
  chain: number
  weight: number
}

/** Most valid combos looked at for one person and card count: enough to choose among, cheap to scan. */
const COMBO_LIMIT = 200

interface Group {
  mask: Uint32Array
  count: number
  cards: Candidate[]
}

const popcount = (mask: Uint32Array): number => {
  let n = 0
  for (let i = 0; i < mask.length; i++) {
    let v = mask[i] as number
    v -= (v >>> 1) & 0x55555555
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333)
    n += (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
  }
  return n
}

const andCount = (a: Uint32Array, b: Uint32Array): number => {
  let n = 0
  for (let i = 0; i < a.length; i++) {
    let v = ((a[i] as number) & (b[i] as number)) >>> 0
    v -= (v >>> 1) & 0x55555555
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333)
    n += (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
  }
  return n
}

const and3Count = (a: Uint32Array, b: Uint32Array, c: Uint32Array): number => {
  let n = 0
  for (let i = 0; i < a.length; i++) {
    let v = ((a[i] as number) & (b[i] as number) & (c[i] as number)) >>> 0
    v -= (v >>> 1) & 0x55555555
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333)
    n += (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
  }
  return n
}

/**
 * Builds the solving path of a planted solution, solve-path first: picks an order of the suspects and,
 * for each, the cards that leave exactly one square once the rows and columns of the people placed
 * before are crossed off. The victim (whose card is "alone with the murderer") comes last and needs no
 * card: it takes the last row and column. Cards that name a person only name someone placed earlier.
 *
 * The squares a card leaves are judged with `cardAllows`, the very function the human-solvability
 * ladder uses, so what a step promises is what `ladderCheck` later finds. Returns null when the
 * search ends in a state where nobody can be placed within the rules.
 */
export function planLadder(input: PlanInput): PlannedStep[] | null {
  const { scene, people, solution, cards, rules, rng } = input
  const width = scene.width
  const squares = squareIndexes(scene)
  const puzzle = { scene, people: [...people] }
  const suspects = people.filter((p) => p.kind === 'suspect').map((p) => p.id)
  const cellOf = new Map(solution.map((p) => [p.personId, p.cell]))
  const held = new Map<string, Card[]>()
  for (const card of cards) held.set(card.holder, [...(held.get(card.holder) ?? []), card])

  const placed: Placement[] = []
  const placedIds = new Set<string>()
  const rowsTaken = new Set<number>()
  const colsTaken = new Set<number>()
  const steps: PlannedStep[] = []
  const usedKinds = new Map<string, number>()
  const usedKeys = new Set<string>()
  let lineCards = 0
  let topSteps = 0
  let entriesLeft = rules.minPlaceableAlone
  const depths = new Map<string, number>()

  /** Squares of the whole board a card leaves its holder with nobody placed (state free cards only). */
  const fullMasks = new Map<number, Uint8Array>()
  const fullMask = (card: Card): Uint8Array => {
    const known = fullMasks.get(card.index)
    if (known) return known
    const mask = new Uint8Array(width * scene.height)
    for (const s of squares) {
      if (cardAllows(puzzle, card, [], card.holder, { row: Math.floor(s / width), col: s % width })) mask[s] = 1
    }
    fullMasks.set(card.index, mask)
    return mask
  }
  const fullCounts = new Map<number, number>()
  const fullCount = (card: Card): number => {
    let n = fullCounts.get(card.index)
    if (n === undefined) {
      n = fullMask(card).reduce((a, b) => a + b, 0)
      fullCounts.set(card.index, n)
    }
    return n
  }

  /** Squares of the whole board a card leaves its holder given who is placed (what the ladder reports as squares from cards). */
  const boardMasks = new Map<string, Uint8Array>()
  const boardMask = (card: Card): Uint8Array => {
    if (card.stateFree) return fullMask(card)
    const key = `${card.index}|${placed.length}`
    const known = boardMasks.get(key)
    if (known) return known
    const mask = new Uint8Array(width * scene.height)
    for (const s of squares) {
      if (cardAllows(puzzle, card, placed, card.holder, { row: Math.floor(s / width), col: s % width })) mask[s] = 1
    }
    boardMasks.set(key, mask)
    return mask
  }

  /** The chain of dependent placements of `person` placed by `cards`, or null when the cards leave too many squares or the chain is too long. */
  const validate = (person: string, cards: Card[], cap: number): number | null => {
    const masks = cards.map(boardMask)
    const left = squares.filter((s) => masks.every((m) => m[s] === 1))
    if (left.length > cap) return null
    const named = cards.flatMap((c) => involved(c)).filter((id) => id !== person && placedIds.has(id))
    const at = cellOf.get(person) as Cell
    const chain = dependentChain({ width, placed, depths, named, left, cell: at.row * width + at.col })
    return chain > rules.maxChain ? null : chain
  }

  const weightOf = (card: Card): number => {
    const base = isLineClue(card.clue) ? LINE_WEIGHT : 1
    return ((base * (KIND_BOOST[card.clue.type] ?? 1)) / (1 + (usedKinds.get(card.clue.type) ?? 0)))
  }
  const keyOf = (card: Card): string => `${card.clue.type}|${JSON.stringify(card.clue.args ?? {})}`

  /** The cards of `person` that are usable now, with the squares of `base` each leaves. */
  const prepare = (person: string, base: number[], entry: boolean): Candidate[] => {
    const out: Candidate[] = []
    const true_ = cellOf.get(person) as Cell
    const trueBit = base.indexOf(true_.row * width + true_.col)
    if (trueBit < 0) return out
    const words = Math.ceil(base.length / 32)
    for (const card of held.get(person) ?? []) {
      // A card that names people (by id, or every other person of a gender) needs all of them placed first.
      if (card.referencing && (!rules.references || !card.named.every((id) => placedIds.has(id)))) continue
      if (isLineClue(card.clue) && lineCards >= rules.lineCap) continue
      if (card.clue.type === 'emptyRoom' && usedKeys.has(keyOf(card))) continue
      if (entry && (!card.stateFree || fullCount(card) !== 1)) continue
      const mask = new Uint32Array(words)
      if (card.stateFree) {
        const full = fullMask(card)
        base.forEach((s, i) => {
          if (full[s] === 1) mask[i >>> 5] = ((mask[i >>> 5] as number) | (1 << (i & 31))) >>> 0
        })
      } else {
        base.forEach((s, i) => {
          if (cardAllows(puzzle, card, placed, person, { row: Math.floor(s / width), col: s % width })) {
            mask[i >>> 5] = ((mask[i >>> 5] as number) | (1 << (i & 31))) >>> 0
          }
        })
      }
      if (((mask[trueBit >>> 5] as number) & (1 << (trueBit & 31))) === 0) continue
      const count = popcount(mask)
      if (count === base.length) continue
      out.push({ card, mask, count, weight: weightOf(card) })
    }
    return out
  }

  const grouped = (cands: Candidate[]): Group[] => {
    const groups = new Map<string, Group>()
    for (const c of cands) {
      const key = c.mask.join(',')
      const group = groups.get(key)
      if (group) group.cards.push(c)
      else groups.set(key, { mask: c.mask, count: c.count, cards: [c] })
    }
    return rng.shuffle([...groups.values()])
  }

  /**
   * The ways to place `person` with `k` cards, none of which (nor any smaller part of them) leaves one square by itself in the
   * board that is left, that together leave exactly one there, leave at most `cap` squares before the lines and make a chain that is
   * not too long. Scans groups in random order and stops at COMBO_LIMIT.
   */
  const combosFor = (person: string, groups: Group[], k: number, cap: number): Combo[] => {
    const out: Combo[] = []
    const add = (picked: Candidate[]): void => {
      const chain = validate(person, picked.map((c) => c.card), cap)
      if (chain !== null) out.push({ cards: picked.map((c) => c.card), chain, weight: picked.reduce((w, c) => w * c.weight, 1) })
    }
    if (k === 1) {
      for (const g of groups) if (g.count === 1) for (const c of g.cards) add([c])
      return out
    }
    const many = groups.filter((g) => g.count > 1)
    let probes = 0
    if (k === 2) {
      for (let i = 0; i < many.length && out.length < COMBO_LIMIT; i++) {
        const a = many[i] as Group
        for (let j = i + 1; j < many.length && out.length < COMBO_LIMIT; j++) {
          if (++probes > PROBE_LIMIT) return out
          const b = many[j] as Group
          if (andCount(a.mask, b.mask) !== 1) continue
          for (const ca of a.cards) for (const cb of b.cards) add([ca, cb])
        }
      }
      return out
    }
    for (let i = 0; i < Math.min(many.length, 40) && out.length < COMBO_LIMIT; i++) {
      const a = many[i] as Group
      for (let j = 0; j < many.length; j++) {
        if (j === i) continue
        const b = many[j] as Group
        if (andCount(a.mask, b.mask) === 1) continue
        for (let l = j + 1; l < many.length; l++) {
          if (l === i) continue
          if (++probes > PROBE_LIMIT) return out
          const c = many[l] as Group
          if (andCount(a.mask, c.mask) === 1 || andCount(b.mask, c.mask) === 1) continue
          if (and3Count(a.mask, b.mask, c.mask) !== 1) continue
          for (const ca of a.cards) for (const cb of b.cards) for (const cc of c.cards) add([ca, cb, cc])
        }
      }
    }
    return out
  }

  /**
   * One of the combos with a short chain, the less used kinds more likely: the shortest chain, and where person references are allowed
   * (medium) one more, because a card that names a person always makes a chain of at least 1 and those kinds should still be drawn.
   */
  const pickCombo = (combos: Combo[]): Combo => {
    const shortest = Math.min(...combos.map((c) => c.chain))
    const pool = combos.filter((c) => c.chain <= shortest + (rules.references ? 1 : 0))
    const total = pool.reduce((sum, c) => sum + c.weight, 0)
    let r = rng.next() * total
    for (const c of pool) {
      r -= c.weight
      if (r <= 0) return c
    }
    return pool[pool.length - 1] as Combo
  }

  /** Card counts to try for the next placement: the scheduled one, then fewer, then more (within the rules). */
  const countsToTry = (slot: number, entry: boolean): number[] => {
    if (entry) return [1]
    const wanted = Math.min(rules.schedule[slot] ?? 1, rules.maxCards)
    const order = [wanted]
    for (let k = wanted - 1; k >= 1; k--) order.push(k)
    for (let k = wanted + 1; k <= rules.maxCards; k++) order.push(k)
    return order.filter((k) => k < rules.maxCards || topSteps < rules.maxTopSteps)
  }

  const remaining = new Set(suspects)
  while (remaining.size > 0) {
    const base = squares.filter((s) => !rowsTaken.has(Math.floor(s / width)) && !colsTaken.has(s % width))
    const entry = entriesLeft > 0
    const slot = steps.length
    const order = rng.shuffle([...remaining])
    const prepared = new Map<string, Group[]>()
    const groupsOf = (person: string): Group[] => {
      let g = prepared.get(person)
      if (!g) {
        g = grouped(prepare(person, base, entry))
        prepared.set(person, g)
      }
      return g
    }
    // The last placements are held to the tighter cap; the free last one (the victim) is not planned here.
    const cap = remaining.size < LAST_STEPS ? Math.min(rules.lastSquares, rules.maxSquares) : rules.maxSquares
    let chosen: { person: string; cards: Card[]; chain: number } | null = null
    for (const k of countsToTry(slot, entry)) {
      // The person whose placement makes the shortest chain (ties: the first in the shuffled order).
      for (const person of order) {
        const combos = combosFor(person, groupsOf(person), k, cap)
        if (combos.length === 0) continue
        const combo = pickCombo(combos)
        if (!chosen || combo.chain < chosen.chain) chosen = { person, cards: combo.cards, chain: combo.chain }
        if (chosen.chain === 0) break
      }
      if (chosen) break
    }
    if (!chosen) return null
    depths.set(chosen.person, chosen.chain)

    const cell = cellOf.get(chosen.person) as Cell
    steps.push({ personId: chosen.person, cell, cards: chosen.cards, squaresFromLines: base.length })
    placed.push({ personId: chosen.person, cell })
    placedIds.add(chosen.person)
    rowsTaken.add(cell.row)
    colsTaken.add(cell.col)
    remaining.delete(chosen.person)
    if (entry) entriesLeft--
    if (chosen.cards.length === rules.maxCards && rules.maxCards > 1) topSteps++
    for (const card of chosen.cards) {
      usedKinds.set(card.clue.type, (usedKinds.get(card.clue.type) ?? 0) + 1)
      if (isLineClue(card.clue)) lineCards++
      if (card.clue.type === 'emptyRoom') usedKeys.add(keyOf(card))
    }
  }
  return steps
}
