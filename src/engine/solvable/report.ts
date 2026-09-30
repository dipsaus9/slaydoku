import type { Puzzle } from '../model/index.ts'
import { assessTier, SOLVABLE_TIERS } from './tiers.ts'
import type { SizeBandId, SolvableTierId } from './tiers.ts'
import { precision } from './precision.ts'
import { readingsBeforeFirstPlacement } from './readings.ts'

export interface NamedPuzzle {
  id: string
  /** Where the puzzle lives, for the reader. */
  source: string
  /** The tier label the puzzle carries today (old scale, by the hint solver's technique level). */
  label: string
  puzzle: Puzzle
}

const LADDER_IDS = ['very-easy', 'easy', 'easy-medium', 'medium'] as const

export interface ReportRow {
  id: string
  source: string
  /** Tier the puzzle carries today. */
  label: string
  /** Tier on the new scale: the easiest whose rules the puzzle meets. */
  tier: SolvableTierId
  /** Ladder tiers whose rules the puzzle meets. */
  meets: Record<(typeof LADDER_IDS)[number], boolean>
  /** Everybody could be placed with at most 3 cards per placement, person references allowed. */
  ladderOk: boolean
  people: number
  /** Ladder of the easiest tier met (of medium when none), the cards per placement in order. */
  cardsPerStep: number[]
  /** Most squares the cards of one placement of that ladder leave before the lines are crossed off (CAD-8.7; the free last placement aside). */
  maxSquaresFromCards: number
  /** Longest chain of dependent placements on that ladder (CAD-8.7). */
  chainLength: number
  /** Cards the first placement of that ladder uses. */
  firstPlacementCards: number | null
  /** People placeable from their own card alone. */
  placeableAlone: number
  /** Card readings the hint solver does before its first placement (what a person would have to hold in their head). */
  readingsBeforeFirstPlacement: number | null
  /** Cards whose identical holders cannot all fit; should be 0. */
  cardMisfits: number
  /** Hard/expert only: the hint solver's verdict. */
  advanced?: { solved: boolean; level: number }
}

export interface Summary {
  puzzles: number
  /** How many puzzles meet each ladder tier's rules (easy fits easy-medium fits medium; very-easy puzzles are counted where they meet them). */
  meets: Record<(typeof LADDER_IDS)[number], number>
  /** How many puzzles have each tier as their tier (the easiest they meet). */
  exact: Record<SolvableTierId, number>
}

export interface SolvabilityReport {
  version: 1
  tiers: {
    id: SolvableTierId
    maxCards: number
    references: boolean
    maxTopShare: number
    minPlaceableAlone: number
    /** The CAD-8.7 caps per size band (SLAY-13.1): `small` is {6,7}, `large` is {9,12}. */
    bySize: Record<SizeBandId, { maxSquaresFromCards: number; lastSquaresFromCards: number; maxChain: number }>
    method: string
  }[]
  houseLevels: ReportRow[]
  packs: ReportRow[]
  summary: { houseLevels: Summary; packs: Summary; all: Summary }
  /** Old label (rows) by new tier (columns) for the pack puzzles. */
  packMatrix: Record<string, Record<SolvableTierId, number>>
}

const emptyCounts = (): Record<SolvableTierId, number> => ({ 'very-easy': 0, easy: 0, 'easy-medium': 0, medium: 0, hard: 0, expert: 0 })

function rowOf(named: NamedPuzzle): ReportRow {
  const assessment = assessTier(named.puzzle)
  const { ladder } = assessment
  const row: ReportRow = {
    id: named.id,
    source: named.source,
    label: named.label,
    tier: assessment.tier,
    meets: assessment.meets,
    ladderOk: LADDER_IDS.some((id) => assessment.meets[id]),
    people: named.puzzle.people.length,
    cardsPerStep: ladder.steps.map((s) => s.clues.length),
    maxSquaresFromCards: ladder.maxSquaresFromCards,
    chainLength: ladder.chainLength,
    firstPlacementCards: ladder.steps[0]?.clues.length ?? null,
    placeableAlone: precision(named.puzzle).placeableAlone.length,
    readingsBeforeFirstPlacement: readingsBeforeFirstPlacement(named.puzzle),
    cardMisfits: precision(named.puzzle).misfits.length,
  }
  if (assessment.advanced) row.advanced = assessment.advanced
  return row
}

function summarize(rows: readonly ReportRow[]): Summary {
  const meets = { 'very-easy': 0, easy: 0, 'easy-medium': 0, medium: 0 }
  const exact = emptyCounts()
  for (const row of rows) {
    exact[row.tier]++
    for (const id of LADDER_IDS) if (row.meets[id]) meets[id]++
  }
  return { puzzles: rows.length, meets, exact }
}

/** Runs the solvability check over the house levels and the pack puzzles. Deterministic. */
export function buildSolvabilityReport(input: { houseLevels: NamedPuzzle[]; packs: NamedPuzzle[] }): SolvabilityReport {
  const houseLevels = input.houseLevels.map(rowOf)
  const packs = input.packs.map(rowOf)
  const packMatrix: SolvabilityReport['packMatrix'] = {}
  for (const row of packs) {
    packMatrix[row.label] ??= emptyCounts()
    ;(packMatrix[row.label] as Record<SolvableTierId, number>)[row.tier]++
  }
  return {
    version: 1,
    tiers: SOLVABLE_TIERS.map(({ id, maxCards, references, maxTopShare, minPlaceableAlone, bySize, method }) => ({
      id,
      maxCards,
      references,
      maxTopShare: Math.round(maxTopShare * 1000) / 1000,
      minPlaceableAlone,
      bySize,
      method,
    })),
    houseLevels,
    packs,
    summary: { houseLevels: summarize(houseLevels), packs: summarize(packs), all: summarize([...houseLevels, ...packs]) },
    packMatrix,
  }
}

export const serializeSolvabilityReport = (report: SolvabilityReport): string => `${JSON.stringify(report, null, 2)}\n`

const TIER_IDS: SolvableTierId[] = ['very-easy', 'easy', 'easy-medium', 'medium', 'hard', 'expert']

/** A short readable summary of the report (the JSON has every puzzle). */
export function renderSolvabilityMarkdown(report: SolvabilityReport): string {
  const lines: string[] = ['# Solvability report', '', 'Generated by `bun run solvability:report`. Rules: `README.md`. Every puzzle: `report.json`.', '']
  const table = (title: string, summary: Summary) => {
    lines.push(`## ${title} (${summary.puzzles} puzzles)`, '', '| Tier | Meets its rules | Has it as its tier |', '|---|---:|---:|')
    for (const id of TIER_IDS) {
      const meets = id === 'hard' || id === 'expert' ? '-' : String(summary.meets[id])
      lines.push(`| ${id} | ${meets} | ${summary.exact[id]} |`)
    }
    lines.push('')
  }
  table('House levels', report.summary.houseLevels)
  table('Pack', report.summary.packs)
  lines.push(
    '## House levels', '',
    '| Level | Today | New tier | Cards per placement | Most squares a card leaves | Longest chain | First placement | Hint-solver readings before first placement |',
    '|---|---|---|---|---|---|---|---|',
  )
  for (const row of report.houseLevels) {
    lines.push(`| ${row.id} | ${row.label} | ${row.tier} | ${row.cardsPerStep.join(' ') || '-'} | ${row.maxSquaresFromCards} | ${row.chainLength} | ${row.firstPlacementCards ?? '-'} cards | ${row.readingsBeforeFirstPlacement ?? '-'} |`)
  }
  lines.push('', '## Pack: tier today (rows) by new tier (columns)', '', `| Today | ${TIER_IDS.join(' | ')} |`, `|---|${TIER_IDS.map(() => '---:').join('|')}|`)
  for (const [label, counts] of Object.entries(report.packMatrix)) {
    lines.push(`| ${label} | ${TIER_IDS.map((id) => counts[id]).join(' | ')} |`)
  }
  const readings = report.packs.map((r) => r.readingsBeforeFirstPlacement).filter((n): n is number => n !== null).sort((a, b) => a - b)
  if (readings.length > 0) {
    const at = (q: number) => readings[Math.min(readings.length - 1, Math.floor(q * readings.length))]
    lines.push('', `Pack, hint-solver card readings before the first placement: min ${readings[0]}, median ${at(0.5)}, p90 ${at(0.9)}, max ${readings[readings.length - 1]}.`)
  }
  lines.push('')
  return lines.join('\n')
}
