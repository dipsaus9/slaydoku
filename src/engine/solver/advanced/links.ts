import { evaluate } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { isOccupiable } from '../../model/index.ts'
import type { BoardView } from '../human/board.ts'
import type { HumanContext } from '../human/types.ts'

/**
 * A clue that ties two people together (it names `otherId`), turned into
 * lookup tables once per solve. `compat` says for every pair of squares
 * whether the clue holds when its holder stands on the first and the other
 * person on the second (judged with just those two placed, exactly like the
 * basic clue technique, so it can only ever be too generous, never too strict)
 * and the two squares share no row or column. The bit masks answer "which
 * squares of the other person support this square?" with a few word operations.
 */
export interface Link {
  clue: number
  holder: number
  other: number
  /** `compat[holderCell * cellCount + otherCell]`. */
  compat: Uint8Array
  /** Indexed by an `other` cell: the holder cells that fit it, as a bit mask of `words` words. */
  forOther: Uint32Array
  /** Indexed by a holder cell: the `other` cells that fit it. */
  forHolder: Uint32Array
}

export interface LinkModel {
  links: Link[]
  /** 32-bit words per cell set. */
  words: number
  cellCount: number
}

const key = 'advanced:links'

/**
 * Builds (once per solve, kept in the context memo) the links of every clue
 * that names another person. Only squares somebody can still stand on are
 * tabulated: candidates only ever shrink, so nothing else is asked later.
 */
export function linkModel(board: BoardView, context: HumanContext): LinkModel {
  const known = context.memo.get(key) as LinkModel | undefined
  if (known) return known
  const cellCount = board.cellCount
  const words = Math.ceil(cellCount / 32)
  const open: boolean[] = []
  for (let c = 0; c < cellCount; c++) open.push(isOccupiable(board.scene, board.cell(c)))
  const links: Link[] = []
  context.clues.forEach((clue, index) => {
    const link = buildLink(board, clue, index, open, words)
    if (link) links.push(link)
  })
  const model = { links, words, cellCount }
  context.memo.set(key, model)
  return model
}

function buildLink(board: BoardView, clue: CatalogClue, index: number, open: boolean[], words: number): Link | null {
  const otherId = (clue.args as Record<string, unknown>).otherId
  if (typeof otherId !== 'string') return null
  const holder = board.people.findIndex((p) => p.id === clue.personId)
  const other = board.people.findIndex((p) => p.id === otherId)
  if (holder < 0 || other < 0 || holder === other) return null
  const n = board.cellCount
  const compat = new Uint8Array(n * n)
  const forOther = new Uint32Array(n * words)
  const forHolder = new Uint32Array(n * words)
  const holderCells = board.candidates(holder).filter((c) => open[c])
  const otherCells = board.candidates(other).filter((c) => open[c])
  for (const h of holderCells) {
    for (const o of otherCells) {
      if (board.row(h) === board.row(o) || board.col(h) === board.col(o)) continue
      const ok = evaluate(clue, board.scene, [
        { personId: clue.personId, cell: board.cell(h) },
        { personId: otherId, cell: board.cell(o) },
      ])
      if (!ok) continue
      compat[h * n + o] = 1
      forOther[o * words + (h >> 5)] = (forOther[o * words + (h >> 5)] as number) | (1 << (h & 31))
      forHolder[h * words + (o >> 5)] = (forHolder[h * words + (o >> 5)] as number) | (1 << (o & 31))
    }
  }
  return { clue: index, holder, other, compat, forOther, forHolder }
}
