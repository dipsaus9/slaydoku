import type { Elimination, Technique } from '../types.ts'
import { cellList, personName, sentences } from '../nl.ts'

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
  title: 'Kruisende vakjes uitsluiten',
  level: 3,
  find(board) {
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
      const name = personName(board, a)
      return {
        eliminate,
        explanation: sentences(
          `${name} kan alleen nog op ${cellList(board, own)} staan. Elk van die vakjes deelt een rij of kolom met ${cellList(board, cells)}. Als daar iemand anders zou staan, houdt ${name} niets over. Daar kan dus niemand anders staan.`,
        ),
        people: [a],
        cells: [...own, ...cells],
      }
    }
    return null
  },
}
