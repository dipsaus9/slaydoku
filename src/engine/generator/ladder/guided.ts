import { evaluate } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { isOccupiable, occupiableCells, roomIdAt } from '../../model/index.ts'
import type { Cell, Scene } from '../../model/index.ts'
import { cardsOf } from '../../solvable/cards.ts'
import { enumerateTrueClues } from '../pool.ts'
import type { Rng } from '../rng.ts'
import { isLineClue } from './plan.ts'

/** The holder every table card is written for; the real people replace it later. */
const HOLDER = 'H'
const NODE_BUDGET = 4000

/** A card about the holder alone (no person named, nobody else's whereabouts asked) and the squares that make it true. */
export interface TableCard {
  clue: CatalogClue
  /** 1 for a square of the board where the card is true, else 0; index `row * width + col`. */
  mask: Uint8Array
  /** Squares of the whole board the card leaves. */
  count: number
}

const tables = new WeakMap<Scene, Map<string, TableCard[]>>()

/**
 * Every card about one person alone that the scene allows (all the "state free" catalog kinds:
 * what the card says never depends on where anybody else stands), with the squares each leaves.
 * `allowed` filters by clue (tier kinds, object names); the table is cached per scene and filter key.
 */
export function stateFreeTable(scene: Scene, key: string, allowed: (clue: CatalogClue) => boolean): TableCard[] {
  let byKey = tables.get(scene)
  if (!byKey) tables.set(scene, (byKey = new Map()))
  const known = byKey.get(key)
  if (known) return known

  const width = scene.width
  const holder = { id: HOLDER, kind: 'suspect' as const, label: HOLDER }
  const seen = new Map<string, CatalogClue>()
  for (const cell of occupiableCells(scene)) {
    // Combined cards are not drawn for the very easy tier (one fact per card), and nobody has a gender here.
    for (const { clue } of enumerateTrueClues(scene, [holder], [{ personId: HOLDER, cell }], { newKinds: true, combinedPerHolder: 0 })) {
      if (!allowed(clue)) continue
      seen.set(`${clue.type}|${JSON.stringify(clue.args ?? {})}`, clue)
    }
  }
  const clues = [...seen.values()]
  const table: TableCard[] = []
  cardsOf({ clues }).forEach((card) => {
    if (!card.stateFree) return
    const mask = new Uint8Array(width * scene.height)
    let count = 0
    for (const at of occupiableCells(scene)) {
      if (evaluate(card.clue, scene, [{ personId: HOLDER, cell: at }])) {
        mask[at.row * width + at.col] = 1
        count++
      }
    }
    if (count > 0) table.push({ clue: card.clue, mask, count })
  })
  byKey.set(key, table)
  return table
}

export interface GuidedOptions {
  /** Pin the victim to this cell. */
  victimCell?: Cell
  /** People who must be placeable from their own card alone (the first placements). */
  entries: number
  /** Most row/column/line cards on the path. */
  lineCap: number
  /** Squares tried in all before giving up. */
  nodeBudget: number
  /** Most squares a card may leave on the whole board (the tier cap, CAD-8.7). */
  maxSquares?: number
  /** The same for the last two suspects (the free last placement is the victim). */
  lastSquares?: number
}

/**
 * Chooses the solution along a solving path where every placement is done by ONE card about the
 * person alone: the cells are picked one at a time, each on a square that some single card leaves
 * alone once the rows and columns of the people placed before are crossed off. The first `entries`
 * squares are ones a card leaves alone on the empty board. The victim takes the last row and column
 * (or the pinned cell, whose row and column the suspects then avoid) and its room ends up with exactly
 * one suspect. Depth first with a budget: a dead end backs up. Returns the victim's cell and the suspect
 * cells in the order they were chosen, or null when the path dead-ends. The ids are handed out by the caller.
 *
 * This only decides WHERE people stand, so that a one-card path exists; `planLadder` then picks the
 * real cards (the same rules, plus room-exclusive cards) on the finished solution.
 */
export function guidedSolution(
  scene: Scene,
  table: readonly TableCard[],
  rng: Rng,
  options: GuidedOptions,
): { victim: Cell; suspects: Cell[] } | null {
  const size = scene.width
  const width = scene.width
  const squares = occupiableCells(scene).map((c) => c.row * width + c.col)
  const pinned = options.victimCell
  if (pinned && !isOccupiable(scene, pinned)) return null
  const roomOfCell = (row: number, col: number) => roomIdAt(scene, { row, col })

  const rowsTaken = new Set<number>()
  const colsTaken = new Set<number>()
  const chosen: Cell[] = []
  let nodes = 0
  const chosenLines = { count: 0 }
  let victim: Cell | null = pinned ?? null

  const free = (taken: Set<number>, blocked: number | undefined) =>
    [...Array(size).keys()].filter((i) => !taken.has(i) && i !== blocked)

  /** Suspects in the pinned victim's room so far. */
  const inVictimRoom = (): number =>
    victim ? chosen.filter((c) => roomOfCell(c.row, c.col) === roomOfCell(victim!.row, victim!.col)).length : 0

  const walk = (step: number): boolean => {
    if (step === size - 1) {
      if (victim) return inVictimRoom() === 1
      const row = free(rowsTaken, undefined)[0] as number
      const col = free(colsTaken, undefined)[0] as number
      const cell = { row, col }
      if (!isOccupiable(scene, cell)) return false
      const room = roomOfCell(row, col)
      if (chosen.filter((c) => roomOfCell(c.row, c.col) === room).length !== 1) return false
      victim = cell
      return true
    }
    if (++nodes > options.nodeBudget) return false
    const base = squares.filter((s) => !rowsTaken.has(Math.floor(s / width)) && !colsTaken.has(s % width))
    const entry = step < options.entries
    const cap = step >= size - 3 ? Math.min(options.lastSquares ?? Infinity, options.maxSquares ?? Infinity) : (options.maxSquares ?? Infinity)
    // Every square some card leaves alone in the base; `plain` when a card that is no line card does it.
    const found = new Map<number, { plain: boolean }>()
    for (const card of table) {
      if ((entry && card.count !== 1) || card.count > cap) continue
      let only = -1
      let n = 0
      for (const s of base) {
        if (card.mask[s] !== 1) continue
        only = s
        if (++n > 1) break
      }
      if (n !== 1) continue
      const line = isLineClue(card.clue)
      const known = found.get(only)
      if (known) known.plain ||= !line
      else found.set(only, { plain: !line })
    }
    const lines = chosenLines
    for (const [cell, { plain }] of rng.shuffle([...found.entries()])) {
      const row = Math.floor(cell / width)
      const col = cell % width
      if (!plain && lines.count >= options.lineCap) continue
      if (pinned && (row === pinned.row || col === pinned.col)) continue
      const room = roomOfCell(row, col)
      if (pinned && room === roomOfCell(pinned.row, pinned.col) && inVictimRoom() >= 1) continue
      const rows = free(rowsTaken, pinned?.row).filter((r) => r !== row)
      const cols = free(colsTaken, pinned?.col).filter((c) => c !== col)
      const pinnedRoom = pinned ? roomOfCell(pinned.row, pinned.col) : undefined
      const need = pinned ? 1 - inVictimRoom() - (room === pinnedRoom ? 1 : 0) : null
      // With no victim yet its row and column stay in the game: one more row and column to match.
      if (!completable(scene, rows, cols, pinnedRoom, need)) continue
      rowsTaken.add(row)
      colsTaken.add(col)
      chosen.push({ row, col })
      if (!plain) lines.count++
      if (walk(step + 1)) return true
      if (!plain) lines.count--
      chosen.pop()
      rowsTaken.delete(row)
      colsTaken.delete(col)
    }
    return false
  }
  return walk(0) && victim ? { victim, suspects: [...chosen] } : null
}

/**
 * Whether the rows can be given one column each on occupiable squares; with `need` set, exactly that many
 * of them in `room` (the pinned victim's room).
 */
function completable(scene: Scene, rows: number[], cols: number[], room: string | undefined, need: number | null): boolean {
  if (need !== null && (need < 0 || need > rows.length)) return false
  let nodes = 0
  const colsLeft = new Set(cols)
  const rowsLeft = new Set(rows)
  const dfs = (inRoom: number): boolean => {
    if (rowsLeft.size === 0) return need === null || inRoom === need
    if (++nodes > NODE_BUDGET) return true
    let bestRow = -1
    let bestOptions: number[] = []
    for (const row of rowsLeft) {
      const options = [...colsLeft].filter((col) => isOccupiable(scene, { row, col }))
      if (options.length === 0) return false
      if (bestRow < 0 || options.length < bestOptions.length) {
        bestRow = row
        bestOptions = options
      }
    }
    rowsLeft.delete(bestRow)
    for (const col of bestOptions) {
      const here = roomIdAt(scene, { row: bestRow, col }) === room ? 1 : 0
      if (need !== null && inRoom + here > need) continue
      colsLeft.delete(col)
      if (dfs(inRoom + here)) return true
      colsLeft.add(col)
    }
    rowsLeft.add(bestRow)
    return false
  }
  return dfs(0)
}
