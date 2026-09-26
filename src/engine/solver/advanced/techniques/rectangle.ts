import { countNl } from '../../../clues/index.ts'
import { cellList, lineNames, personName, sentences } from '../../human/nl.ts'
import type { Deduction, Elimination, Technique } from '../../human/types.ts'
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
    find(board) {
      const snap = snapshot(board)
      if (!snap.square) return null
      for (let size = min; size <= max; size++) {
        for (const rows of [true, false]) {
          const found = pattern(snap, rows, size)
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

function pattern(snap: Snapshot, rows: boolean, size: number): Deduction | null {
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
    const corners = lines.flatMap((l) =>
      (rows ? snap.rowCells : snap.colCells)[l]?.filter((c) => opposite.has(rows ? board.col(c) : board.row(c))) ?? [],
    )
    const own = lineNames(rows, lines)
    const cross = lineNames(!rows, [...opposite])
    const noun = rows ? 'rijen' : 'kolommen'
    const crossNoun = rows ? 'kolommen' : 'rijen'
    const first = eliminate[0] as Elimination
    return {
      eliminate,
      explanation: sentences(
        `In ${own} zijn alleen nog deze vakjes vrij: ${cellList(board, corners)}. Ze liggen allemaal in ${cross}. ${countNl(size)} ${noun} hebben dus ${countNl(size)} ${crossNoun} nodig: samen nemen ze ${cross} in beslag. Buiten ${own} kan daarom niemand in ${cross} staan, ook ${personName(board, first.person)} niet.`,
      ),
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
  title: 'Kruisende vakjes uitsluiten (ruim)',
  level: 4,
  find(board) {
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
      const cells = [...new Set(eliminate.map((e) => e.cell))]
      const name = personName(board, a)
      return {
        eliminate,
        explanation: sentences(
          `${name} kan nog op ${countNl(own.length)} vakjes staan, en elk daarvan ligt in dezelfde rij of kolom als ${cellList(board, cells)}. Als daar iemand anders zou staan, houdt ${name} niets over. Daar kan dus niemand anders staan.`,
        ),
        people: [a],
        cells: [...own, ...cells],
      }
    }
    return null
  },
}
