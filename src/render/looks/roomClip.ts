import type { Scene } from '../../engine/model/index.ts'
import { MARGIN, type SceneGeometry } from '../scene/geometry.ts'
import { HEADROOM } from './project.ts'

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * The clip of one room, as path data in viewBox units: the squares of its cells, grown at the edges of the grid where nothing else is (up
 * by the headroom on the top row, by the margin on the other sides), so an object may rise over the top edge but never over a wall into a
 * neighbouring room.
 */
export function roomClipPath(cellRooms: Scene['cellRooms'], roomId: string, geometry: SceneGeometry): string {
  const rows = cellRooms.length
  const parts: string[] = []
  for (let row = 0; row < rows; row++) {
    const cols = cellRooms[row]!.length
    let col = 0
    while (col < cols) {
      if (cellRooms[row]![col] !== roomId) {
        col++
        continue
      }
      let end = col
      while (end + 1 < cols && cellRooms[row]![end + 1] === roomId) end++
      const a = geometry.cellRect({ row, col })
      const b = geometry.cellRect({ row, col: end })
      const left = col === 0 ? MARGIN : 0
      const right = end === cols - 1 ? MARGIN : 0
      const top = row === 0 ? HEADROOM : 0
      const bottom = row === rows - 1 ? MARGIN : 0
      const x0 = a.x - left
      const y0 = a.y - top
      const x1 = b.x + b.width + right
      const y1 = a.y + a.height + bottom
      parts.push(`M${r1(x0)} ${r1(y0)}H${r1(x1)}V${r1(y1)}H${r1(x0)}Z`)
      col = end + 1
    }
  }
  return parts.join('')
}
