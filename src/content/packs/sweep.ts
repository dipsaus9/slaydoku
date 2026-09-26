import { missingCardText } from '../../render/cards/cardText.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { ThemeId } from '../themes/index.ts'
import { PACK_BUDGET_MS, buildEntry } from './build.ts'
import { boardKey, puzzleKey } from './gates.ts'

/**
 * The generation sweep (CAD-5.7, `bun run validate:generation`): builds puzzles on FRESH seeds per size x tier x theme and measures how
 * often the generator gives a puzzle that passes every pack gate, how long it takes and how often it repeats itself. Not imported by the
 * app (it renders the card grid to markup): the tools and the tests import it by path, `index.ts` does not export it.
 */

/**
 * First seed of a sweep. The committed pack searches seeds below 700 (`seedBase` + `SEED_WINDOW` for six tiers), so a sweep starting at 10000 or
 * higher never sees a puzzle the pack holds and measures what the next pack would get.
 */
export const SWEEP_SEED_START = 10_000

/** Cells with fewer seeds than this are reported but never fail on their success rate: a rate of 1 or 2 puzzles says nothing. */
export const MIN_SEEDS_FOR_RATE = 10

/** Success rate under which a cell is flagged (and, from `MIN_SEEDS_FOR_RATE` seeds, fails the sweep). */
export const DEFAULT_MIN_SUCCESS = 0.25

/**
 * The gates a candidate is measured against, named for the report. `defect` gates are the guarantees of the generator (one solution, solvable
 * by a person without guessing, exactly the tier it was built for): a puzzle it hands over that misses one is a bug, and the sweep fails on it.
 * `filter` gates are what the pack builder rejects a candidate for and then walks to the next seed: the score band, clue count and variety, the
 * clue and hint audit and the noun audit (text and calibration checks a generator draw can miss). They lower the success rate and the yield, and
 * the report says which gate rejected how many seeds, but a rejection is not a failure by itself: `--strict` makes every rejection one.
 * A puzzle that is accepted has passed all of them (`entryProblems`).
 */
export const GATES = {
  generation: 'filter',
  'unique-solution': 'defect',
  'human-solve': 'defect',
  tier: 'defect',
  'noun-audit': 'filter',
  'hint-audit': 'filter',
  shape: 'defect',
  'score-band': 'filter',
  'clue-audit': 'filter',
  'clue-count': 'filter',
  variety: 'filter',
} as const
export type GateName = keyof typeof GATES

/** Gate of one problem line as `entryProblems` words it. */
export function gateOf(problem: string): GateName {
  const text = problem.replace(/^\S+: /, '')
  if (/^(verify failed|invalid puzzle|murderer differs)/.test(text)) return 'unique-solution'
  if (/^the human solver/.test(text)) return 'human-solve'
  if (/^(ladderCheck|technique level|tierFor)/.test(text)) return 'tier'
  if (/^clue noun:/.test(text)) return 'noun-audit'
  if (/^hints:/.test(text)) return 'hint-audit'
  if (/^clues:/.test(text)) return 'clue-audit'
  if (/^score v2/.test(text)) return 'score-band'
  if (/^\d+ clues, expected|^clueCount/.test(text)) return 'clue-count'
  if (/clue kinds|clue kind |row\/column\/line/.test(text)) return 'variety'
  return 'shape'
}

/** Board and puzzle keys already taken (for example by the committed pack), so duplicates against them can be counted. */
export interface KnownKeys {
  boards: ReadonlySet<string>
  puzzles: ReadonlySet<string>
}

export interface CellOptions {
  /** First seed of the cell; the cell uses `start` .. `start + seeds - 1`. */
  start: number
  seeds: number
  /** Wall clock per puzzle in ms. */
  budgetMs?: number
  /** Committed puzzles of this cell's size: matches against them are counted as `packBoardClashes` / `packPuzzleClashes`. */
  known?: KnownKeys
  /** Called after every seed with one line, for progress output. */
  progress?: (line: string) => void
  /** Re-runs each accepted seed and compares the bytes. On by default; the smoke test and the tool keep it on. */
  determinism?: boolean
}

/** What the sweep found for one (size, tier, theme); plain JSON. */
export interface CellResult {
  size: number
  tier: TierId
  theme: ThemeId
  start: number
  seeds: number
  budgetMs: number
  /** Seeds that gave a puzzle passing every gate. */
  accepted: number
  /** Accepted puzzles that are not a repeat of an earlier accepted board (or puzzle) of the cell: what the next pack could really add. */
  usable: number
  /** Seeds rejected, per gate (a seed with several problems counts once per gate). */
  rejected: Partial<Record<GateName, number>>
  duplicateBoards: number
  duplicatePuzzles: number
  packBoardClashes: number
  packPuzzleClashes: number
  /** Failures that are never acceptable: a defect gate, a repeat run that differs, a card missing on the screen, an exception. */
  failures: string[]
  /** Wall clock spent on the generation of all seeds, in ms (the determinism re-run and the screen check are not counted). */
  generationMs: number
  /** Slowest single seed. */
  maxMs: number
  /** Total time of the determinism re-runs and screen checks, in ms (not part of the rates). */
  verifyMs: number
}

/** A cell with the numbers derived from it: what the report prints. */
export interface CellRow extends CellResult {
  successRate: number
  secondsPerSeed: number
  /** Seconds of one core per usable puzzle; null when the cell gave none. */
  secondsPerPuzzle: number | null
  /** Usable puzzles one core makes per hour; 0 when the cell gave none. */
  yieldPerHour: number
  duplicateBoardRate: number
  duplicatePuzzleRate: number
  /** Success rate below the minimum. */
  lowSuccess: boolean
}

const round = (n: number, digits: number): number => Math.round(n * 10 ** digits) / 10 ** digits

/** Derived numbers of a cell result. `minSuccess` is a fraction (0.25). */
export function rowOf(cell: CellResult, minSuccess: number): CellRow {
  const successRate = cell.seeds === 0 ? 0 : cell.accepted / cell.seeds
  const seconds = cell.generationMs / 1000
  return {
    ...cell,
    successRate: Math.round(successRate * 1000) / 1000,
    secondsPerSeed: cell.seeds === 0 ? 0 : round(seconds / cell.seeds, 1),
    secondsPerPuzzle: cell.usable === 0 ? null : round(seconds / cell.usable, 1),
    yieldPerHour: seconds === 0 ? 0 : round((cell.usable / seconds) * 3600, 1),
    duplicateBoardRate: cell.accepted === 0 ? 0 : Math.round((cell.duplicateBoards / cell.accepted) * 1000) / 1000,
    duplicatePuzzleRate: cell.accepted === 0 ? 0 : Math.round((cell.duplicatePuzzles / cell.accepted) * 1000) / 1000,
    lowSuccess: successRate < minSuccess,
  }
}

/**
 * The sweep of one (size, tier, theme): every seed of the window goes through `buildEntry` (scene, generator, dressing, every gate of
 * `entryProblems`: unique solution, human solve at the tier, hint and clue audit, noun audit, score band), and each accepted puzzle is built a
 * second time (same bytes), then rendered to check that every card of every suspect is on the screen.
 */
export function sweepCell(size: number, tier: TierId, theme: ThemeId, options: CellOptions): CellResult {
  const { start, seeds, budgetMs = PACK_BUDGET_MS, known, progress = () => {}, determinism = true } = options
  const cell: CellResult = {
    size, tier, theme, start, seeds, budgetMs, accepted: 0, usable: 0, rejected: {}, duplicateBoards: 0, duplicatePuzzles: 0,
    packBoardClashes: 0, packPuzzleClashes: 0, failures: [], generationMs: 0, maxMs: 0, verifyMs: 0,
  }
  const boards = new Set<string>()
  const puzzles = new Set<string>()
  for (let seed = start; seed < start + seeds; seed++) {
    const id = `${size}-${tier}-${theme}-${seed}`
    const started = performance.now()
    let built: ReturnType<typeof buildEntry>
    try {
      built = buildEntry(size, tier, theme, seed, budgetMs)
    } catch (error) {
      cell.generationMs += performance.now() - started
      cell.failures.push(`${id}: threw ${error instanceof Error ? error.message : String(error)}`)
      progress(`${id}: THREW`)
      continue
    }
    const ms = performance.now() - started
    cell.generationMs += ms
    cell.maxMs = Math.max(cell.maxMs, ms)
    if (!built.ok) {
      const gates = new Set<GateName>(built.problems ? built.problems.map(gateOf) : ['generation'])
      for (const gate of gates) cell.rejected[gate] = (cell.rejected[gate] ?? 0) + 1
      for (const gate of gates) {
        if (GATES[gate] === 'defect') cell.failures.push(`${id}: ${gate}: ${built.problems!.filter((p) => gateOf(p) === gate).join('; ').replace(`${id}: `, '').slice(0, 300)}`)
      }
      progress(`${id}: rejected (${[...gates].join(', ')}), ${Math.round(ms)} ms`)
      continue
    }

    cell.accepted++
    const board = boardKey(built.entry.puzzle)
    const key = puzzleKey(built.entry.puzzle)
    const repeatBoard = boards.has(board)
    const repeatPuzzle = puzzles.has(key)
    if (repeatBoard) cell.duplicateBoards++
    if (repeatPuzzle) cell.duplicatePuzzles++
    if (!repeatBoard && !repeatPuzzle) cell.usable++
    boards.add(board)
    puzzles.add(key)
    if (known?.boards.has(board)) cell.packBoardClashes++
    if (known?.puzzles.has(key)) cell.packPuzzleClashes++

    const verifyStarted = performance.now()
    if (determinism) {
      try {
        // Twice the budget: a re-run that only lost the race against the wall clock on a busy machine is not a change of bytes.
        const again = buildEntry(size, tier, theme, seed, budgetMs * 2)
        if (!again.ok) cell.failures.push(`${id}: not deterministic: the second run is rejected (${again.reason.slice(0, 160)})`)
        else if (JSON.stringify(again.entry) !== JSON.stringify(built.entry)) cell.failures.push(`${id}: not deterministic: the second run differs`)
      } catch (error) {
        cell.failures.push(`${id}: not deterministic: the second run threw ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    for (const missing of missingCardText(built.entry.puzzle)) cell.failures.push(`${id}: screen: ${missing}`)
    cell.verifyMs += performance.now() - verifyStarted
    progress(`${id}: ok (${built.entry.clueCount} clues, score ${built.entry.rating.score}, ${Math.round(ms)} ms)`)
  }
  cell.generationMs = Math.round(cell.generationMs)
  cell.maxMs = Math.round(cell.maxMs)
  cell.verifyMs = Math.round(cell.verifyMs)
  return cell
}

/** Sweep-wide totals. */
export interface SweepSummary {
  cells: number
  seeds: number
  accepted: number
  usable: number
  failures: number
  lowCells: number
  successRate: number
}

export interface SweepReport {
  /** Arguments of the run, so a report says how to reproduce it. */
  args: { sizes: number[]; tiers: TierId[]; themes: ThemeId[]; seeds: number; start: number; budgetMs: number; minSuccess: number; strict: boolean }
  summary: SweepSummary
  cells: CellRow[]
}

/**
 * Whether a cell breaks the gate: a failure listed, a strict run with any rejection, or a success rate under the minimum on a cell that
 * has enough seeds for the rate to mean something.
 */
export function cellProblems(row: CellRow, strict: boolean): string[] {
  const problems = [...row.failures]
  if (strict) {
    const rejected = Object.values(row.rejected).reduce((n, v) => n + (v ?? 0), 0)
    if (rejected > 0) problems.push(`${row.size}-${row.tier}-${row.theme}: strict: ${rejected} rejected seeds (${JSON.stringify(row.rejected)})`)
  }
  if (row.lowSuccess && row.seeds >= MIN_SEEDS_FOR_RATE) {
    problems.push(`${row.size}-${row.tier}-${row.theme}: success rate ${(row.successRate * 100).toFixed(0)}% is under the minimum`)
  }
  return problems
}

/** Cells in report order: size, tier (easiest first), theme. */
export function sortCells<T extends { size: number; tier: TierId; theme: ThemeId }>(cells: readonly T[], tiers: readonly TierId[], themes: readonly ThemeId[]): T[] {
  return [...cells].sort((a, b) => a.size - b.size || tiers.indexOf(a.tier) - tiers.indexOf(b.tier) || themes.indexOf(a.theme) - themes.indexOf(b.theme))
}

/** Builds the report of a finished sweep. */
export function buildReport(args: SweepReport['args'], results: readonly CellResult[]): SweepReport {
  const cells = sortCells(results.map((r) => rowOf(r, args.minSuccess)), args.tiers, args.themes)
  const seeds = cells.reduce((n, c) => n + c.seeds, 0)
  const accepted = cells.reduce((n, c) => n + c.accepted, 0)
  return {
    args,
    summary: {
      cells: cells.length,
      seeds,
      accepted,
      usable: cells.reduce((n, c) => n + c.usable, 0),
      failures: cells.reduce((n, c) => n + c.failures.length, 0),
      lowCells: cells.filter((c) => c.lowSuccess).length,
      successRate: seeds === 0 ? 0 : Math.round((accepted / seeds) * 1000) / 1000,
    },
    cells,
  }
}

const pct = (n: number): string => `${(n * 100).toFixed(0)}%`
const hours = (perHour: number): string => (perHour === 0 ? '0' : perHour >= 100 ? String(Math.round(perHour)) : String(perHour))
const rejects = (rejected: CellResult['rejected']): string =>
  Object.entries(rejected).map(([gate, n]) => `${gate} ${n}`).join(', ') || '-'

/** The report as markdown: totals, one table per size x tier x theme, the rejection reasons and every failure. */
export function renderMarkdown(report: SweepReport, strict = report.args.strict): string {
  const { args, summary } = report
  const lines: string[] = []
  lines.push('# Generation sweep', '')
  lines.push(
    `Sizes ${args.sizes.join(', ')}; tiers ${args.tiers.join(', ')}; themes ${args.themes.join(', ')}; ${args.seeds} seeds per cell from seed ${args.start}; ` +
      `budget ${args.budgetMs / 1000} s per puzzle; minimum success rate ${pct(args.minSuccess)}${strict ? '; strict (every rejection fails)' : ''}.`,
    '',
  )
  lines.push(
    `${summary.cells} cells, ${summary.seeds} seeds: ${summary.accepted} passed every gate (${pct(summary.successRate)}), ${summary.usable} usable (no repeat inside the cell), ` +
      `${summary.failures} failures, ${summary.lowCells} cells under the minimum success rate.`,
    '',
  )
  const failing = report.cells.flatMap((c) => c.failures)
  lines.push('## Failures', '')
  if (failing.length === 0) lines.push('None.', '')
  else lines.push(...failing.map((f) => `- ${f}`), '')
  const flagged = report.cells.filter((c) => c.lowSuccess)
  lines.push(`## Cells under the minimum success rate (${pct(args.minSuccess)})`, '')
  if (flagged.length === 0) lines.push('None.', '')
  else lines.push(...flagged.map((c) => `- ${c.size}x${c.size} ${c.tier} ${c.theme}: ${pct(c.successRate)} (${c.accepted} of ${c.seeds}); rejected: ${rejects(c.rejected)}`), '')
  lines.push('## Per cell', '')
  lines.push('| size | tier | theme | seeds | ok | success | s per seed | s per puzzle | yield/h | dup boards | dup puzzles | pack clashes | rejected by |')
  lines.push('|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|')
  for (const c of report.cells) {
    lines.push(
      `| ${c.size} | ${c.tier} | ${c.theme} | ${c.seeds} | ${c.accepted} | ${pct(c.successRate)}${c.lowSuccess ? ' (low)' : ''} | ${c.secondsPerSeed} | ${c.secondsPerPuzzle ?? '-'} | ${hours(c.yieldPerHour)} | ` +
        `${c.duplicateBoards} (${pct(c.duplicateBoardRate)}) | ${c.duplicatePuzzles} (${pct(c.duplicatePuzzleRate)}) | ${c.packBoardClashes}/${c.packPuzzleClashes} | ${rejects(c.rejected)} |`,
    )
  }
  lines.push('')
  lines.push('"s per puzzle" and "yield/h" count one core and only usable puzzles (passing every gate, not a repeat of an earlier board in the cell). "pack clashes" are boards / whole puzzles equal to a committed pack puzzle.', '')
  return lines.join('\n')
}
