import { countWord } from '../../../clues/index.ts'
import * as en from '../../human/en.ts'
import * as nl from '../../human/nl.ts'
import type { Deduction, Elimination, HumanContext, Technique } from '../../human/types.ts'
import * as advNl from '../nl.ts'
import { snapshot, subsets } from '../snapshot.ts'
import type { Snapshot } from '../snapshot.ts'

/**
 * Rectangle elimination and its bigger cousins. Look at squares only, not at
 * who can stand on them: when k free rows can only be filled through the same
 * k columns, those rows use up those columns, so nobody can stand elsewhere in
 * them (and the same the other way round). k = 2 is the rectangle: two rows
 * whose squares sit in the same two columns. k = 3 and 4 are the same idea
 * with a 3x3 or 4x4 pattern.
 */
export function fish(min: number, max: number, id: string, level: number, title: string): Technique {
  return {
    id,
    title,
    level,
    find(board, context) {
      const snap = snapshot(board)
      if (!snap.square) return null
      for (let size = min; size <= max; size++) {
        for (const rows of [true, false]) {
          const found = pattern(snap, context, rows, size)
          if (found) return found
        }
      }
      return null
    },
  }
}

/** Distinct lines of the other direction that the squares of `line` sit on. */
function across(snap: Snapshot, rows: boolean, line: number): Set<number> {
  const cells = (rows ? snap.rowCells : snap.colCells)[line] as number[]
  return new Set(cells.map((c) => (rows ? snap.board.col(c) : snap.board.row(c))))
}

function pattern(snap: Snapshot, context: HumanContext, rows: boolean, size: number): Deduction | null {
  const { board } = snap
  const free = rows ? snap.freeRows : snap.freeCols
  const other = new Map<number, Set<number>>()
  for (const l of free) {
    const set = across(snap, rows, l)
    if (set.size <= size) other.set(l, set)
  }
  for (const lines of subsets([...other.keys()], size)) {
    const opposite = new Set(lines.flatMap((l) => [...(other.get(l) as Set<number>)]))
    if (opposite.size !== size) continue
    const inside = new Set(lines)
    const eliminate: Elimination[] = []
    for (const p of snap.unplaced) {
      for (const c of snap.cand[p] as number[]) {
        const line = rows ? board.row(c) : board.col(c)
        const cross = rows ? board.col(c) : board.row(c)
        if (opposite.has(cross) && !inside.has(line)) eliminate.push({ person: p, cell: c })
      }
    }
    if (eliminate.length === 0) continue
    const w = context.locale === 'nl' ? nl : en
    const corners = lines.flatMap((l) =>
      (rows ? snap.rowCells : snap.colCells)[l]?.filter((c) => opposite.has(rows ? board.col(c) : board.row(c))) ?? [],
    )
    const own = w.lineNames(rows, lines)
    const cross = w.lineNames(!rows, [...opposite])
    const first = eliminate[0] as Elimination
    const cornersText = w.cellList(board, corners)
    const personText = w.personName(board, first.person)
    const explanation =
      context.locale === 'nl'
        ? advNl.rectangleText(own, cornersText, cross, rows, size, personText)
        : `In ${own}, only these squares are still free: ${cornersText}. They all lie in ${cross}. So ${countWord(size)} ${rows ? 'rows' : 'columns'} need ${countWord(size)} ${rows ? 'columns' : 'rows'}: together they use up ${cross}. Outside ${own}, nobody can stand in ${cross}, and that includes ${personText}.`
    return {
      eliminate,
      explanation: w.sentences(explanation),
      people: [...new Set(eliminate.map((e) => e.person))],
      cells: [...new Set([...corners, ...eliminate.map((e) => e.cell)])],
    }
  }
  return null
}

/**
 * Wide intersect: the basic `intersect` only looks at people with up to four
 * squares left. This one takes any number: if every square a person can still
 * use lies in row r or in column c, then a second person on the square (r, c)
 * would leave them nothing, so that square is out for everybody else.
 */
export const intersectWide: Technique = {
  id: 'intersect-wide',
  title: 'Rule out crossing squares (wide)',
  level: 4,
  find(board, context) {
    const snap = snapshot(board)
    const { width, height } = snap
    for (const a of snap.unplaced) {
      const own = snap.cand[a] as number[]
      if (own.length < 2) continue
      const inRow = new Array<number>(height).fill(0)
      const inCol = new Array<number>(width).fill(0)
      for (const c of own) {
        inRow[board.row(c)] = (inRow[board.row(c)] as number) + 1
        inCol[board.col(c)] = (inCol[board.col(c)] as number) + 1
      }
      const mine = new Set(own)
      const eliminate: Elimination[] = []
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const x = r * width + c
          const covered = (inRow[r] as number) + (inCol[c] as number) - (mine.has(x) ? 1 : 0)
          if (covered !== own.length) continue
          for (const q of snap.unplaced) {
            if (q !== a && (snap.cand[q] as number[]).includes(x)) eliminate.push({ person: q, cell: x })
          }
        }
      }
      if (eliminate.length === 0) continue
      const w = context.locale === 'nl' ? nl : en
      const cells = [...new Set(eliminate.map((e) => e.cell))]
      const name = w.personName(board, a)
      const cellListText = w.cellList(board, cells)
      const explanation =
        context.locale === 'nl'
          ? advNl.intersectWideText(name, own.length, cellListText)
          : `${name} can still stand on ${countWord(own.length)} squares, and each of them lies in the same row or column as ${cellListText}. If somebody else stood there, ${name} would have nothing left. So nobody else can stand there.`
      return {
        eliminate,
        explanation: w.sentences(explanation),
        people: [a],
        cells: [...own, ...cells],
      }
    }
    return null
  },
}
