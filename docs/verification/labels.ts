// Data check for room labels (SLAY-17.5): over every scheduled day, in en and nl, does a label pill cover a cell that holds an object,
// or stick out of its run's room? Prints the offenders. Usage: bun docs/verification/labels.ts
import { cellKey } from '../../src/engine/model/index.ts'
import { roomLabelLayout } from '../../src/render/scene/labels.ts'
import { DAYS } from './daily.ts'

let bad = 0
let total = 0
for (const day of DAYS) {
  const scene = day.puzzle.scene
  const objCells = new Map(scene.objects.flatMap((o) => o.cells.map((c) => [cellKey(c), o.type] as const)))
  for (const locale of ['en', 'nl'] as const) {
    for (const room of scene.rooms) {
      const l = roomLabelLayout(scene, room.id, locale)
      if (!l) continue
      total++
      const hw = (l.vertical ? l.height : l.width) / 2, hh = (l.vertical ? l.width : l.height) / 2
      const x0 = l.center.x - hw, x1 = l.center.x + hw
      const y0 = l.center.y - hh, y1 = l.center.y + hh
      const hits: string[] = []
      for (let r = Math.floor(y0); r < y1; r++)
        for (let c = Math.floor(x0); c < x1; c++) {
          const o = objCells.get(cellKey({ row: r, col: c }))
          if (o && Math.min(x1, c + 1) - Math.max(x0, c) > 0.02 && Math.min(y1, r + 1) - Math.max(y0, r) > 0.02) hits.push(`${o}@R${r + 1}C${c + 1}`)
        }
      const outside = x0 < -0.05 || x1 > scene.width + 0.05 || y0 < -0.05 || y1 > scene.height + 0.05
      if (hits.length || outside) {
        bad++
        console.log(day.date, locale, room.id, l.lines.join('/'), `w=${l.width.toFixed(2)}`, hits.join(','), outside ? 'OUTSIDE' : '')
      }
    }
  }
}
console.log(`${bad} of ${total} labels cover an object`)
