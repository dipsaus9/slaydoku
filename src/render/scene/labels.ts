import { roomNameNlOf } from '../../content/themes/index.ts'
import { cellKey, cellsInRoom, type Cell, type Scene } from '../../engine/model/index.ts'
import type { Locale } from '../../locale/types.ts'

/** Room label placement in cell units (1 = one cell), independent of pixel size. */
export interface RoomLabelLayout {
  roomId: string
  lines: string[]
  /** Font size in cell units. */
  fontSize: number
  /** Centre of the label, in grid-line coordinates. */
  center: { x: number; y: number }
  /** Size of the pill behind the text, in the text's own frame (before any rotation). */
  width: number
  height: number
  /** True when the label is turned a quarter (reads bottom to top) to lie along a one-cell-wide strip (SLAY-17.5). */
  vertical: boolean
  /** The run of free cells the label sits on: one row (`line` = row, `from..to` = columns) or, when `vertical`, one column (`line` = column, `from..to` = rows). */
  run: { line: number; from: number; to: number }
}

const MAX_FONT = 0.3
const READABLE_FONT = 0.2
const MIN_FONT = 0.14
/** Average width of a bold capital, in em. */
const CHAR_WIDTH = 0.68
const PILL_PAD_X = 0.16
const PILL_PAD_Y = 0.1
const RUN_INSET = 0.1
const LINE_HEIGHT = 1.15
/** A turned label is a little harder to read, so it only wins when it gets clearly more room than a flat one. */
const VERTICAL_PENALTY = 0.85

interface Run {
  vertical: boolean
  line: number
  from: number
  to: number
}

/** Maximal runs of free cells of the room, along rows (horizontal) or columns (vertical). */
function runsOf(scene: Scene, roomId: string, blocked: Set<string>, vertical: boolean): Run[] {
  const runs: Run[] = []
  const lines = vertical ? scene.width : scene.height
  const steps = vertical ? scene.height : scene.width
  for (let line = 0; line < lines; line++) {
    let from: number | undefined
    for (let i = 0; i <= steps; i++) {
      const cell = vertical ? { row: i, col: line } : { row: line, col: i }
      const free = i < steps && scene.cellRooms[cell.row]?.[cell.col] === roomId && !blocked.has(cellKey(cell))
      if (free && from === undefined) from = i
      if (!free && from !== undefined) {
        runs.push({ vertical, line, from, to: i - 1 })
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

/** "the Kitchen" -> "Kitchen": a room name may carry its article, the map label never does. */
export function bareRoomName(name: string): string {
  const bare = name.replace(/^the\s+/i, '').trim()
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

/** Dutch endings of compound room names: a break goes before them (SPEELGOED-AFDELING). */
const COMPOUND_ENDINGS = ['AFDELING', 'KAMER', 'LOKAAL', 'RUIMTE', 'KANTOOR', 'BOERDERIJ', 'ZAAL', 'TUIN', 'HOEK', 'KLAS', 'WEIDE', 'PLAATS', 'KEUKEN']

/**
 * A single long word (a Dutch compound such as HANDVAARDIGHEIDSLOKAAL) split in two lines with a hyphen: at its own
 * hyphen when it has one, else before a known Dutch compound ending, else near the middle, after a vowel so the break falls between syllables.
 */
export function hyphenate(word: string): string[] {
  const dash = [...word.matchAll(/-/g)].map((m) => m.index! + 1).filter((i) => i < word.length)
  const mid = word.length / 2
  if (dash.length > 0) {
    const at = dash.reduce((b, i) => (Math.abs(i - mid) < Math.abs(b - mid) ? i : b))
    return [word.slice(0, at), word.slice(at)]
  }
  const ending = COMPOUND_ENDINGS.find((e) => word.endsWith(e) && word.length > e.length + 2)
  if (ending) return [`${word.slice(0, -ending.length)}-`, ending]
  let at = Math.round(mid)
  for (let d = 0; d <= Math.floor(word.length / 4); d++) {
    const ok = (i: number) => /[AEIOUY]/.test(word[i - 1] ?? '') && !/[AEIOUY]/.test(word[i] ?? 'A')
    if (ok(at - d)) { at -= d; break }
    if (ok(at + d)) { at += d; break }
  }
  return [`${word.slice(0, at)}-`, word.slice(at)]
}

function fitFont(lines: string[], available: number): number {
  const longest = Math.max(...lines.map((l) => l.length))
  return Math.min(MAX_FONT, available / (longest * CHAR_WIDTH))
}

/**
 * Where to draw a room's name so it lies inside the room. The label goes on the free run of
 * cells (no object on them; any run when every cell is covered) that gives it the largest
 * font: a row run, or a column run turned a quarter for a one-cell-wide strip (SLAY-17.5).
 * Ties go to the longer run, then the one nearest the room's centre; long names shrink or
 * wrap to two lines to fit the run. Dutch (SLAY-5.2) draws the same real Dutch noun the clue
 * text uses (`roomNameNlOf`, content/themes/index.ts) — never a second translation;
 * a name no theme defines falls back to the bare English noun, exactly as `'en'` does.
 */
export function roomLabelLayout(scene: Scene, roomId: string, locale: Locale = 'en'): RoomLabelLayout | undefined {
  const room = scene.rooms.find((r) => r.id === roomId)
  const cells = cellsInRoom(scene, roomId)
  if (!room || cells.length === 0) return undefined

  // A room name may carry its article ("the Kitchen"); the map shows the bare noun. Dutch
  // (`nameNl`) never carries one, so it needs no stripping.
  const nameNl = locale === 'nl' ? roomNameNlOf(room.name) : undefined
  const name = (nameNl ?? bareRoomName(room.name)).toUpperCase()
  const words = name.split(/\s+/).filter(Boolean)

  const covered = new Set(scene.objects.flatMap((o) => o.cells.map(cellKey)))
  const free = (blocked: Set<string>) => [...runsOf(scene, roomId, blocked, false), ...runsOf(scene, roomId, blocked, true)]
  let runs = free(covered)
  if (runs.length === 0) runs = free(new Set())

  const mid = centroid(cells)
  const length = (r: Run) => r.to - r.from + 1
  const distance = (r: Run) => {
    const along = (r.from + r.to) / 2
    return r.vertical ? Math.abs(along - mid.row) + Math.abs(r.line - mid.col) : Math.abs(r.line - mid.row) + Math.abs(along - mid.col)
  }

  /** The lines and the (unclamped) font size that fit a run. */
  const fit = (r: Run) => {
    const available = length(r) - 2 * RUN_INSET - PILL_PAD_X
    let lines = [words.join(' ')]
    let font = fitFont(lines, available)
    if (font < READABLE_FONT && words.length > 1) {
      const two = splitInTwo(words)
      const twoFont = fitFont(two, available)
      if (twoFont > font) {
        lines = two
        font = twoFont
      }
    }
    if (font < READABLE_FONT && words.length === 1 && name.length > 8) {
      const broken = hyphenate(name)
      const brokenFont = fitFont(broken, available)
      if (brokenFont > font) {
        lines = broken
        font = brokenFont
      }
    }
    return { run: r, lines, font }
  }
  const score = (c: { run: Run; font: number }) => c.font * (c.run.vertical ? VERTICAL_PENALTY : 1)
  const best = runs.map(fit).reduce((a, c) => {
    if (score(c) !== score(a)) return score(c) > score(a) ? c : a
    if (length(c.run) !== length(a.run)) return length(c.run) > length(a.run) ? c : a
    return distance(c.run) < distance(a.run) ? c : a
  })

  const { run, lines } = best
  const fontSize = Math.max(best.font, MIN_FONT)
  const longest = Math.max(...lines.map((l) => l.length))
  const along = (run.from + run.to + 1) / 2
  return {
    roomId,
    lines,
    fontSize,
    center: run.vertical ? { x: run.line + 0.5, y: along } : { x: along, y: run.line + 0.5 },
    width: longest * CHAR_WIDTH * fontSize + PILL_PAD_X,
    height: lines.length * fontSize * LINE_HEIGHT + PILL_PAD_Y,
    vertical: run.vertical,
    run: { line: run.line, from: run.from, to: run.to },
  }
}

export const LABEL_LINE_HEIGHT = LINE_HEIGHT
