import type { Cell, Puzzle } from '../../engine/model/index.ts'
import { roomIdAt } from '../../engine/model/index.ts'
import type { Hint } from '../../game/index.ts'

/** The cells a hint points at: the tinted areas of level 1, the ringed cells of levels 2 and 3. */
export function hintCells(puzzle: Puzzle, hint: Hint): Cell[] {
  if (hint.level !== 1) return hint.cells
  const cells: Cell[] = []
  for (let row = 0; row < puzzle.scene.height; row++) {
    for (let col = 0; col < puzzle.scene.width; col++) {
      const room = roomIdAt(puzzle.scene, { row, col })
      if (room && hint.roomIds.includes(room)) cells.push({ row, col })
    }
  }
  return cells
}
