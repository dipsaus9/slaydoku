import type { Elimination, Technique } from '../types.ts'
import * as en from '../en.ts'
import * as nl from '../nl.ts'

/**
 * Intersecting squares (official technique "intersect"): when every square a
 * person can still stand on shares a row or column with square X, then anybody
 * else standing on X would take away all of that person's squares. So X is
 * out for everybody else. With two squares this removes the two other corners
 * of the rectangle they form; with a bunch of squares in one line it removes
 * the crossing squares of the objects, as on the official help page.
 */
export const intersect: Technique = {
  id: 'intersect',
  title: 'Rule out crossing squares',
  level: 3,
  find(board, context) {
    const w = context.locale === 'nl' ? nl : en
    for (let a = 0; a < board.people.length; a++) {
      if (board.isPlaced(a)) continue
      const own = board.candidates(a)
      // Wider domains rarely fire and read poorly as an explanation.
      if (own.length > 4) continue
      const eliminate: Elimination[] = []
      for (let q = 0; q < board.people.length; q++) {
        if (q === a || board.isPlaced(q)) continue
        for (const c of board.candidates(q)) {
          if (own.every((o) => board.row(o) === board.row(c) || board.col(o) === board.col(c))) {
            eliminate.push({ person: q, cell: c })
          }
        }
      }
      if (eliminate.length === 0) continue
      const cells = [...new Set(eliminate.map((e) => e.cell))]
      const name = w.personName(board, a)
      const ownText = w.cellList(board, own)
      const crossText = w.cellList(board, cells)
      const explanation =
        context.locale === 'nl'
          ? nl.intersectText(name, ownText, crossText)
          : `${name} can only stand on ${ownText} now. Each of those squares shares a row or column with ${crossText}. If somebody else stood there, ${name} would have nothing left. So nobody else can stand there.`
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
