import { cellKey, cellsInRoom, type Cell, type Scene } from '../../engine/model/index.ts'

/** Room label placement in cell units (1 = one cell), independent of pixel size. */
export interface RoomLabelLayout {
  roomId: string
  lines: string[]
  /** Font size in cell units. */
  fontSize: number
  /** Centre of the label, in grid-line coordinates. */
  center: { x: number; y: number }
  /** Size of the pill behind the text. */
  width: number
  height: number
  /** The run of cells (one row, `fromCol..toCol` inclusive) the label sits on. */
  run: { row: number; fromCol: number; toCol: number }
}

const MAX_FONT = 0.3
const READABLE_FONT = 0.2
const MIN_FONT = 0.14
/** Average width of a bold capital, in em. */
const CHAR_WIDTH = 0.68
const PILL_PAD_X = 0.16
const PILL_PAD_Y = 0.1
const RUN_INSET = 0.24
const LINE_HEIGHT = 1.15

interface Run {
  row: number
  fromCol: number
  toCol: number
}

function rowRuns(scene: Scene, roomId: string, blocked: Set<string>): Run[] {
  const runs: Run[] = []
  for (let row = 0; row < scene.height; row++) {
    let from: number | undefined
    for (let col = 0; col <= scene.width; col++) {
      const free =
        col < scene.width &&
        scene.cellRooms[row]?.[col] === roomId &&
        !blocked.has(cellKey({ row, col }))
      if (free && from === undefined) from = col
      if (!free && from !== undefined) {
        runs.push({ row, fromCol: from, toCol: col - 1 })
        from = undefined
      }
    }
  }
  return runs
}

function centroid(cells: Cell[]): { row: number; col: number } {
  const sum = cells.reduce((s, c) => ({ row: s.row + c.row, col: s.col + c.col }), { row: 0, col: 0 })
  return { row: sum.row / cells.length, col: sum.col / cells.length }
}

/** "het Fietsenhok" -> "Fietsenhok": room names carry their article, the map label does not. */
export function bareRoomName(name: string): string {
  const bare = name.replace(/^(de|het|'t)\s+/i, '').trim()
  return bare === '' ? name : bare
}

/** Best split of a name into two lines at a word boundary (shortest longest line). */
function splitInTwo(words: string[]): string[] {
  let best: string[] = [words.join(' ')]
  let bestLen = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const len = Math.max(a.length, b.length)
    if (len < bestLen) {
      bestLen = len
      best = [a, b]
    }
  }
  return best
}

function fitFont(lines: string[], available: number): number {
  const longest = Math.max(...lines.map((l) => l.length))
  return Math.min(MAX_FONT, available / (longest * CHAR_WIDTH))
}

/**
 * Where to draw a room's name so it lies inside the room. The label goes on
 * the longest row run of the room that no object covers (any run when every
 * cell is covered), nearest the room's centre; long names shrink or wrap to two
 * lines to fit the run.
 */
export function roomLabelLayout(scene: Scene, roomId: string): RoomLabelLayout | undefined {
  const room = scene.rooms.find((r) => r.id === roomId)
  const cells = cellsInRoom(scene, roomId)
  if (!room || cells.length === 0) return undefined

  const covered = new Set(scene.objects.flatMap((o) => o.cells.map(cellKey)))
  let runs = rowRuns(scene, roomId, covered)
  if (runs.length === 0) runs = rowRuns(scene, roomId, new Set())

  const mid = centroid(cells)
  const length = (r: Run) => r.toCol - r.fromCol + 1
  const distance = (r: Run) =>
    Math.abs(r.row - mid.row) + Math.abs((r.fromCol + r.toCol) / 2 - mid.col)
  const run = runs.reduce((best, r) =>
    length(r) > length(best) || (length(r) === length(best) && distance(r) < distance(best))
      ? r
      : best,
  )

  // Room names carry their article ("het Fietsenhok"); the map shows the bare noun.
  const name = bareRoomName(room.name).toUpperCase()
  const words = name.split(/\s+/).filter(Boolean)
  const available = length(run) - 2 * RUN_INSET - PILL_PAD_X
  let lines = [words.join(' ')]
  let fontSize = fitFont(lines, available)
  if (fontSize < READABLE_FONT && words.length > 1) {
    const two = splitInTwo(words)
    const twoFont = fitFont(two, available)
    if (twoFont > fontSize) {
      lines = two
      fontSize = twoFont
    }
  }
  fontSize = Math.max(fontSize, MIN_FONT)

  const longest = Math.max(...lines.map((l) => l.length))
  return {
    roomId,
    lines,
    fontSize,
    center: { x: (run.fromCol + run.toCol + 1) / 2, y: run.row + 0.5 },
    width: longest * CHAR_WIDTH * fontSize + PILL_PAD_X,
    height: lines.length * fontSize * LINE_HEIGHT + PILL_PAD_Y,
    run,
  }
}

export const LABEL_LINE_HEIGHT = LINE_HEIGHT
