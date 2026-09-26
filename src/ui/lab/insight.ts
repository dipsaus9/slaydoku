import type { CatalogClue } from '../../engine/clues/index.ts'
import { computeMetrics, scoreV2, DEFAULT_WEIGHTS } from '../../engine/difficulty/index.ts'
import type { DifficultyMetrics, ScoreV2, ScoreWeights } from '../../engine/difficulty/index.ts'
import type { Cell, Placement, Puzzle } from '../../engine/model/index.ts'
import { advancedRegistry, solveAdvanced } from '../../engine/solver/advanced/index.ts'
import { hintFor } from '../../game/hints.ts'
import type { NextStep } from '../../game/hints.ts'
import type { TelemetryRecord } from '../../game/telemetry/index.ts'

/** One human solving step, with the three hint texts a player would get for it. */
export interface TraceStep {
  /** 1-based position in the solution path. */
  index: number
  techniqueId: string
  /** Technique title. */
  title: string
  level: number
  /** The squares the step is about: the one it places on, or the ones it rules out. */
  cells: Cell[]
  placement?: Placement
  /** The game's hint texts for this step, level 1 (which), 2 (where) and 3 (why and what to do). */
  hints: { 1: string; 2: string; 3: string }
}

export interface Insight {
  metrics: DifficultyMetrics
  score: ScoreV2
  weights: ScoreWeights
  trace: TraceStep[]
}

/** Text of level `level` for `next`, built by the game's own `hintFor`. */
const hintText = (puzzle: Puzzle, next: NextStep, level: 1 | 2 | 3): string => hintFor(puzzle, next, level).text

/**
 * The full human walk-through of a puzzle, step by step. Each step's hints come from `hintFor`,
 * the function the game builds its hints with, so the lab shows what a player would be told.
 * Pass the puzzle with its cast names (as played) to get the names the player sees.
 */
export function buildTrace(puzzle: Puzzle): TraceStep[] {
  const titles = new Map(advancedRegistry.list().map((technique) => [technique.id, technique.title]))
  const { steps } = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
  return steps.map((step) => {
    const next: NextStep = step.placed ? { step, placement: step.placed } : { step }
    const where = hintFor(puzzle, next, 2)
    const item: TraceStep = {
      index: step.index,
      techniqueId: step.technique,
      title: titles.get(step.technique) ?? step.technique,
      level: step.level,
      cells: 'cells' in where ? where.cells : step.cells,
      hints: { 1: hintText(puzzle, next, 1), 2: where.text, 3: hintText(puzzle, next, 3) },
    }
    if (step.placed) item.placement = step.placed
    return item
  })
}

/** Score v2 with its metrics and the trace of one puzzle. */
export function buildInsight(puzzle: Puzzle, played: Puzzle = puzzle): Insight {
  const metrics = computeMetrics(puzzle)
  return { metrics, score: scoreV2(metrics), weights: DEFAULT_WEIGHTS, trace: buildTrace(played) }
}

/** "r3c4": row 3, column 4. Short enough to list a dozen squares in a line. */
export const cellLabel = (cell: Cell): string => `r${cell.row + 1}c${cell.col + 1}`

/** 75 seconds as "1:15". */
export function clock(seconds: number): string {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

export interface TelemetrySummary {
  sessions: number
  solved: number
  abandoned: number
  /** Median active seconds of the solved sessions; null when none solved. */
  medianSeconds: number | null
  /** Median hints shown per session (all levels); null without sessions. */
  medianHints: number | null
  /** Median errors per session: wrong placements plus failed checks; null without sessions. */
  medianErrors: number | null
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}

/** The records of one puzzle, oldest first. */
export const recordsFor = (records: readonly TelemetryRecord[], puzzleId: string): TelemetryRecord[] =>
  records.filter((record) => record.puzzleId === puzzleId).sort((a, b) => a.startedAt - b.startedAt)

export const hintsUsed = (record: TelemetryRecord): number => record.hints[1] + record.hints[2] + record.hints[3]
export const errorsMade = (record: TelemetryRecord): number => record.wrongPlacements + record.failedChecks

export function summarizeTelemetry(records: readonly TelemetryRecord[]): TelemetrySummary {
  const solved = records.filter((record) => record.outcome === 'solved')
  return {
    sessions: records.length,
    solved: solved.length,
    abandoned: records.length - solved.length,
    medianSeconds: median(solved.map((record) => record.activeSeconds)),
    medianHints: median(records.map(hintsUsed)),
    medianErrors: median(records.map(errorsMade)),
  }
}
