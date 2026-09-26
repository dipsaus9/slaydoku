import { advancedRegistry } from '../engine/solver/advanced/registry.ts'
import type { Cell, Puzzle } from '../engine/model/index.ts'
import type { Hint1, Hint2, Hint3 } from '../game/hints.ts'
import { walkHints } from './walk.ts'
import type { HintWalk, WalkStep } from './walk.ts'

/** Length limits per hint level, in characters. A hint is read on a phone, so it stays short. */
export const HINT_LIMITS = {
  level1: { min: 12, max: 220 },
  level2: { min: 12, max: 200 },
  level3: { min: 30, max: 420 },
  /** A hard technique (level 4: rectangles and fish) names whole rows and columns, so it needs more room. */
  level3Hard: { min: 30, max: 600 },
  /** An expert technique (level 5: "Stel dat ... dan ... dat kan niet") walks through suppositions. */
  level3Expert: { min: 30, max: 800 },
} as const

/** Up to this many squares a hint spells out; more are "de gemarkeerde vakjes" on the board (same as `hintText.ts`). */
export const MAX_NAMED_CELLS = 4
/** A hint never asks the player to cross out more squares than this. */
export const MAX_CROSSED_SQUARES = 12
/** A hint about one person lists at most this many possible squares. */
export const MAX_POSSIBLE_SQUARES = 6
/** Up to this many people a level-1 hint names one by one. */
export const MAX_NAMED_PEOPLE = 3

/** Words of the solver's own vocabulary that a player must never read. */
const JARGON = [
  'kandidaat', 'kandidaten', 'eliminatie', 'elimineer', 'elimineren', 'techniek', 'technieken', 'solver', 'deductie',
  'algoritme', 'heuristiek', 'singleton', 'contradictie', 'constraint', 'naked', 'hidden', 'pair', 'triple', 'quad',
  'fish', 'chain', 'candidate', 'technique', 'rectangle', 'intersect', 'scan',
]

/** English words that give away a text nobody translated. */
const ENGLISH = [
  'the', 'and', 'you', 'cell', 'cells', 'row', 'column', 'place', 'put', 'because', 'with', 'from', 'this', 'that', 'clue',
  'card', 'hint', 'step', 'should', 'must', 'cannot', 'only', 'square', 'squares', 'person', 'room', 'next',
]

const wordRe = (words: readonly string[]): RegExp =>
  new RegExp(`(?<![\\p{L}\\d-])(?:${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\d-])`, 'iu')

const JARGON_RE = wordRe(JARGON)
const ENGLISH_RE = wordRe(ENGLISH)
/**
 * The solver's technique ids ("single-candidate", "victim-room", ...). Their Dutch titles are ordinary
 * phrases ("Nog maar één vakje") that a good hint may use, so only the ids are banned.
 */
const TECHNIQUE_ID_RE = wordRe(advancedRegistry.list().map((t) => t.id).filter((id) => id.length > 5))
/** Ids and code the player must not see: r3k4, "undefined", "[object Object]", braces, snake_case. */
const CODE_RE = /\br\d+k\d+\b|undefined|NaN|\bnull\b|\[object|[{}<>_]|=>/
/** "62 vakjes", "nog 13 andere vakjes": a count of squares as a number, above what a hint spells out. */
const CELL_COUNT_RE = /\b(\d+)\s+(?:andere\s+)?vakjes\b/g
/** The Dutch words a hint of any level is built from; at least one must be there. */
const DUTCH_RE = /\b(de|het|een|naar|kijk|zet|op|in|kaart|vakje|vakjes|kruisje|bord|staan|rij|kolom)\b/i

/** Numbers of a spelled list: "5, 7 en 8" gives 5, 7 and 8. */
const numbersOf = (list: string): number[] => (list.match(/\d+/g) ?? []).map(Number)

/**
 * True when `text` names `cell` the way the hints do: "rij 3, kolom 4", or several squares of one row or
 * column together: "rij 9, kolom 5, 7 en 8" and "kolom 6, rij 8 en 9".
 */
function namesCell(text: string, cell: Cell): boolean {
  const row = cell.row + 1
  const col = cell.col + 1
  const inRow = [...text.matchAll(/rij (\d+), kolom ((?:\d+(?:, | en )?)+)/g)]
  const inColumn = [...text.matchAll(/kolom (\d+), rij ((?:\d+(?:, | en )?)+)/g)]
  return (
    inRow.some((m) => Number(m[1]) === row && numbersOf(m[2] as string).includes(col)) ||
    inColumn.some((m) => Number(m[1]) === col && numbersOf(m[2] as string).includes(row))
  )
}

const cellName = (cell: Cell): string => `rij ${cell.row + 1}, kolom ${cell.col + 1}`

/** Problems any hint text has, whatever its level. */
function textProblems(text: string): string[] {
  const problems: string[] = []
  if (text.trim() === '') return ['empty text']
  if (text !== text.trim() || /\s{2,}/.test(text)) problems.push('stray whitespace')
  if (!/^\p{Lu}/u.test(text)) problems.push('does not start with a capital')
  if (!/[.!?]["”]?$/.test(text)) problems.push('does not end in a full stop')
  if (!DUTCH_RE.test(text) || ENGLISH_RE.test(text)) problems.push(`is not plain Dutch (${ENGLISH_RE.exec(text)?.[0] ?? 'no Dutch words'})`)
  const jargon = JARGON_RE.exec(text)?.[0]
  if (jargon) problems.push(`uses the solver word "${jargon}"`)
  const technique = TECHNIQUE_ID_RE.exec(text)?.[0]
  if (technique) problems.push(`names the technique "${technique}"`)
  const code = CODE_RE.exec(text)?.[0]
  if (code) problems.push(`shows code "${code}"`)
  for (const match of text.matchAll(CELL_COUNT_RE)) {
    if (Number(match[1]) > MAX_NAMED_CELLS) problems.push(`spells a count of ${match[1]} squares as a number; say "de gemarkeerde vakjes"`)
  }
  return problems
}

/** The length limit of a level-3 hint: the harder the technique, the longer its explanation may be. */
function level3Limit(techniqueId: string): { min: number; max: number } {
  const level = advancedRegistry.list().find((t) => t.id === techniqueId)?.level ?? 1
  if (level >= 5) return HINT_LIMITS.level3Expert
  return level >= 4 ? HINT_LIMITS.level3Hard : HINT_LIMITS.level3
}

const lengthProblem = (text: string, { min, max }: { min: number; max: number }): string | null =>
  text.length < min || text.length > max ? `${text.length} characters, expected ${min}-${max}` : null

function level1Problems(puzzle: Puzzle, hint: Hint1): string[] {
  const problems = textProblems(hint.text)
  const length = lengthProblem(hint.text, HINT_LIMITS.level1)
  if (length) problems.push(length)
  const labels = hint.personIds.map((id) => puzzle.people.find((p) => p.id === id)?.label)
  if (hint.personIds.length === 0) problems.push('names nobody')
  else if (labels.some((l) => l === undefined)) problems.push('points at a person that does not exist')
  else if (hint.personIds.length <= MAX_NAMED_PEOPLE) {
    for (const label of labels as string[]) if (!hint.text.includes(label)) problems.push(`does not name ${label}`)
  }
  if (hint.roomIds.some((id) => !puzzle.scene.rooms.some((r) => r.id === id))) problems.push('points at an area that does not exist')
  return problems
}

function level2Problems(puzzle: Puzzle, hint: Hint2, step: WalkStep): string[] {
  const problems = textProblems(hint.text)
  const length = lengthProblem(hint.text, HINT_LIMITS.level2)
  if (length) problems.push(length)
  const { cells } = hint
  if (cells.length === 0) return [...problems, 'points at no square']
  const { width, height } = puzzle.scene
  if (cells.some((c) => c.row < 0 || c.col < 0 || c.row >= height || c.col >= width)) problems.push('points at a square outside the board')
  // A hint about one person names all their possible squares; a crossing names a handful and points at the rest.
  const named = step.next.focus ? MAX_POSSIBLE_SQUARES : MAX_NAMED_CELLS
  if (cells.length <= named) {
    for (const cell of cells) {
      if (!namesCell(hint.text, cell)) problems.push(`does not name the square ${cellName(cell)}`)
    }
  } else if (!/gemarkeerde vakjes/.test(hint.text)) {
    problems.push(`${cells.length} squares but the text does not point at the marked squares`)
  }
  if (cells.length > MAX_CROSSED_SQUARES) problems.push(`asks for ${cells.length} squares, at most ${MAX_CROSSED_SQUARES}`)
  const { placement, focus } = step.next
  if (focus && !placement && cells.length > MAX_POSSIBLE_SQUARES) {
    problems.push(`lists ${cells.length} possible squares, at most ${MAX_POSSIBLE_SQUARES}`)
  }
  // A hint about one person names them (a label may open a sentence with a capital).
  const about = placement?.personId ?? focus?.personId
  if (about !== undefined) {
    const label = puzzle.people.find((p) => p.id === about)?.label ?? ''
    if (!hint.text.toLowerCase().includes(label.toLowerCase())) problems.push(`does not name ${label}`)
  }
  return problems
}

function level3Problems(puzzle: Puzzle, hint: Hint3, step: WalkStep): string[] {
  const problems = textProblems(hint.text)
  const length = lengthProblem(hint.text, level3Limit(hint.technique.id))
  if (length) problems.push(length)
  if (hint.explanation.trim() === '') problems.push('has no explanation')
  if (hint.text !== `${hint.explanation} ${hint.instruction}`) problems.push('text is not the explanation followed by the instruction')
  if (!hint.text.endsWith(hint.instruction) || hint.instruction.trim() === '') problems.push('does not end with the instruction')
  const { placement } = step.next
  if (placement) {
    const label = puzzle.people.find((p) => p.id === placement.personId)?.label ?? ''
    const expected = `Zet ${label} op ${cellName(placement.cell)}.`
    if (hint.instruction.toLowerCase() !== expected.toLowerCase()) problems.push(`instruction "${hint.instruction}" is not "${expected}"`)
    if (!hint.placement) problems.push('a placement step without a placement')
  } else if (step.next.focus) {
    const label = puzzle.people.find((p) => p.id === step.next.focus?.personId)?.label ?? ''
    if (!hint.instruction.toLowerCase().startsWith(`zet een notitie voor ${label.toLowerCase()} op `) || !hint.instruction.endsWith('.')) {
      problems.push(`instruction "${hint.instruction}" does not say where to note ${label}`)
    }
    for (const cell of step.next.focus.cells) {
      if (!namesCell(hint.instruction, cell)) problems.push(`instruction does not name the square ${cellName(cell)}`)
    }
  } else {
    if (!/^Zet een kruisje\b.*\.$/.test(hint.instruction)) problems.push(`instruction "${hint.instruction}" does not say where to put a cross`)
    if (!/gemarkeerde vakjes|rij \d|kolom \d/.test(hint.instruction)) problems.push('instruction names no square')
  }
  if (hint.instruction.split(/(?<=[.!?])\s+/).length !== 1) problems.push('the instruction is more than one sentence')
  return problems
}

/**
 * Walks a full human solve of `puzzle` (see `walkHints`) and checks the three hint levels of every
 * step. Returns the problems, empty when the hints are good. Works for any puzzle: a house level,
 * a pack entry or a freshly generated one.
 *
 * - The walk itself must finish: every step has a hint at all three levels and everybody ends
 *   up on their true square.
 * - Every level: plain Dutch (no English, no stray whitespace, starts with a capital, ends in a full
 *   stop), no solver jargon or technique names, no ids or code, no count of squares as a number.
 * - Level 1 names the person (all of them up to three) and only points at areas that exist.
 * - Level 2 names the square (up to four; more are "de gemarkeerde vakjes") and, for a placement, the person.
 * - Level 3 is the explanation followed by one explicit instruction: "Zet <naam> op rij X, kolom Y."
 *   or "Zet een kruisje ...".
 * - Length limits per level (`HINT_LIMITS`).
 */
export const auditHints = (puzzle: Puzzle): string[] => auditWalk(puzzle, walkHints(puzzle))

/** The checks of `auditHints` on a walk that was made already (tests feed it deliberately broken hints). */
export function auditWalk(puzzle: Puzzle, walk: HintWalk): string[] {
  const problems: string[] = []
  if (!walk.solved) {
    problems.push(`the hints stop after ${walk.steps.length} steps with ${walk.unplaced} people not placed`)
  }
  for (const step of walk.steps) {
    const at = (level: number, msg: string) => problems.push(`hint ${step.index + 1}, level ${level}: ${msg}`)
    for (const p of level1Problems(puzzle, step.level1)) at(1, p)
    for (const p of level2Problems(puzzle, step.level2, step)) at(2, p)
    for (const p of level3Problems(puzzle, step.level3, step)) at(3, p)
  }
  return problems
}
