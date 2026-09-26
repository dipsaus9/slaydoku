import type { CatalogClue } from '../clues/index.ts'
import { difficultyScore } from '../generator/tiers/index.ts'
import type { Puzzle } from '../model/index.ts'
import { solveAdvanced } from '../solver/advanced/index.ts'
import { computeMetrics } from './metrics.ts'
import { DEFAULT_WEIGHTS, scoreV2 } from './score.ts'
import type { DifficultyMetrics, ScoreV2, ScoreWeights } from './types.ts'

/** Bumped when the layout of the report changes. */
export const REPORT_FORMAT = 1

/** The current 0-100 score (`difficultyScore`), kept next to score v2 to compare the two. */
export interface OldRating {
  score: number
  level: number
  steps: number
}

/** One puzzle in the report: what it is, its old rating, the v2 metrics and score. */
export interface ReportRow {
  id: string
  /** Free text: where the puzzle comes from. */
  source: string
  /** Tier the puzzle was made for (packs, house levels) or null. */
  tier: string | null
  old: OldRating
  metrics: DifficultyMetrics
  scoreV2: ScoreV2
}

export interface DifficultyReport {
  format: typeof REPORT_FORMAT
  /** The calibrated weights (CAD-5.6). */
  weights: ScoreWeights
  /** The registered levels, in play order. */
  houseLevels: ReportRow[]
  /** Puzzles kept as fixtures: puzzles whose score and judged difficulty disagreed. */
  fixtures: ReportRow[]
  /** Every committed pack puzzle, in index order. */
  packs: ReportRow[]
}

export interface NamedPuzzle {
  id: string
  source: string
  tier: string | null
  puzzle: Puzzle
}

/** The old 0-100 rating of a puzzle, measured with the advanced human solver (what the pack gates use). */
export function oldRating(puzzle: Puzzle): OldRating {
  const human = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
  return {
    score: difficultyScore(human, puzzle.people.length),
    level: human.maxTechnique?.level ?? 0,
    steps: human.steps.length,
  }
}

export function reportRow(item: NamedPuzzle, weights: ScoreWeights = DEFAULT_WEIGHTS): ReportRow {
  const metrics = computeMetrics(item.puzzle)
  const cells = item.puzzle.scene.width * item.puzzle.scene.height
  return {
    id: item.id,
    source: item.source,
    tier: item.tier,
    old: oldRating(item.puzzle),
    metrics,
    scoreV2: scoreV2(metrics, weights, cells),
  }
}

export function buildReport(
  input: { houseLevels: readonly NamedPuzzle[]; fixtures: readonly NamedPuzzle[]; packs: readonly NamedPuzzle[] },
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): DifficultyReport {
  return {
    format: REPORT_FORMAT,
    weights,
    houseLevels: input.houseLevels.map((p) => reportRow(p, weights)),
    fixtures: input.fixtures.map((p) => reportRow(p, weights)),
    packs: input.packs.map((p) => reportRow(p, weights)),
  }
}

/** Report text: one row per line so a regenerated report diffs by puzzle. Same input, same bytes. */
export function serializeReport(report: DifficultyReport): string {
  const rows = (list: readonly ReportRow[]) => `[\n${list.map((r) => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]`
  return (
    `{\n  "format": ${report.format},\n  "weights": ${JSON.stringify(report.weights)},\n` +
    `  "houseLevels": ${rows(report.houseLevels)},\n  "fixtures": ${rows(report.fixtures)},\n  "packs": ${rows(report.packs)}\n}\n`
  )
}
