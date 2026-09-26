import { SOLVABLE_TIERS } from '../solvable/tiers.ts'
import type { SolvableTierId } from '../solvable/tiers.ts'
import { PART_KEYS, combineParts } from './score.ts'
import type { ScoreV2, ScoreWeights } from './types.ts'

/**
 * Calibration of score v2 (CAD-5.6): fits the part weights so that the score orders the tiers of the
 * human-solvability scale (very-easy < easy < easy-medium < medium < hard < expert), and cuts the 0-100 score into one
 * band per tier. Pure and deterministic: the same rows give the same weights and bands, byte for byte.
 *
 * What it learns from:
 * - the tier of every puzzle (`tierFor`, exact): the committed pack puzzles, the house levels and the fixtures;
 * - the developer's judgements (`too-easy`, `good`, `too-hard`, exported from the lab), read against the tier a puzzle was MEANT for;
 * - telemetry (exported play records): how long people took per person, with hints, when it is given.
 * Without judgements or telemetry it runs on the tiers alone.
 */

export const CALIBRATION_FORMAT = 1

export const TIER_IDS: readonly SolvableTierId[] = SOLVABLE_TIERS.map((t) => t.id)

/** One puzzle to learn from. */
export interface CalibrationRow {
  id: string
  /** Where it comes from, for the reader ('pack', 'house', 'fixture'). */
  kind: string
  /** The tier the puzzle is on (`tierFor`). */
  tier: SolvableTierId
  /** The tier it was made or labelled for; what a judgement is read against. Differs from `tier` for old fixtures. */
  intended: SolvableTierId
  parts: ScoreV2['parts']
  /** People in the puzzle (telemetry time is per person). */
  people: number
}

export type Verdict = 'too-easy' | 'good' | 'too-hard'

export interface JudgementInput {
  puzzleId: string
  verdict: Verdict
  /** Ms since epoch when it was given; 0 when unknown. */
  judgedAt: number
}

export interface TelemetryInput {
  puzzleId: string
  activeSeconds: number
  /** Hints asked, as levels 1..3 used that many times each. */
  hints: number
  wrongPlacements: number
  outcome: 'solved' | 'abandoned'
}

export interface CalibrationInput {
  rows: readonly CalibrationRow[]
  judgements?: readonly JudgementInput[]
  telemetry?: readonly TelemetryInput[]
}

export interface Band {
  min: number
  max: number
}

export interface Exception {
  id: string
  kind: string
  tier: SolvableTierId
  score: number
  /** The tier whose band the score lies in. */
  band: SolvableTierId
}

export interface TierSpread {
  n: number
  min: number
  p25: number
  median: number
  p75: number
  max: number
}

export interface Calibration {
  format: typeof CALIBRATION_FORMAT
  weights: ScoreWeights
  /** One band per tier, contiguous, covering 0..100. */
  bands: Record<SolvableTierId, Band>
  /** What each tier's puzzles score under the weights. */
  spread: Record<SolvableTierId, TierSpread>
  /** Puzzles whose score lies outside their tier's band. Each needs a reason in the docs. */
  exceptions: Exception[]
  quality: {
    puzzles: number
    inBand: number
    /** 1 - mean over adjacent tiers of the chance that a random puzzle of the harder tier scores above one of the easier tier (ties half). */
    adjacentAuc: number
    /** Judgements read against the bands: how many agree. */
    judgements: { used: number; agree: number }
    /** Rank correlation of score and effort (seconds per person, hints counted), or null when telemetry gives fewer than 5 puzzles. */
    telemetry: { records: number; puzzles: number; spearman: number | null } | null
  }
}

const TIER_INDEX = new Map(TIER_IDS.map((id, i) => [id, i]))
const tierIndex = (id: SolvableTierId): number => TIER_INDEX.get(id) as number

/** Steps by which a transfer of weight is tried, in whole units of the weights (which sum to 100). */
const STEPS = [8, 4, 2, 1]
const TOTAL = 100
/** Every part keeps at least this many of the 100 units, so the score keeps reflecting all the measured aspects and not only the few that split the tiers best. */
export const MIN_WEIGHT = 2

/** A puzzle with a judgement, resolved against the rows. */
interface Judged {
  row: number
  verdict: Verdict
}

const scoreOf = (parts: ScoreV2['parts'], weights: ScoreWeights): number => combineParts(parts, weights)

/** The cuts between neighbouring tiers with the fewest misplaced puzzles, strictly increasing, each in the middle of the plateau where it costs the same. */
export function chooseCuts(scores: readonly number[], tiers: readonly number[], tierCount: number): number[] {
  const cuts = tierCount - 1
  // errors[k][c]: puzzles misplaced by a cut after score c between tier k and k+1 (tier <= k above c, or tier > k at or below c).
  const positions = 101
  const count = (k: number, c: number): number => {
    let wrong = 0
    for (let i = 0; i < scores.length; i++) {
      const t = tiers[i] as number
      const s = scores[i] as number
      if (t <= k && s > c) wrong++
      else if (t > k && s <= c) wrong++
    }
    return wrong
  }
  const cost: number[][] = Array.from({ length: cuts }, (_, k) => Array.from({ length: positions }, (_, c) => count(k, c)))
  // Dynamic programme: best[k][c] = fewest errors for cuts 0..k with cut k at c and every cut above the one before.
  const best: number[][] = Array.from({ length: cuts }, () => new Array<number>(positions).fill(Infinity))
  const from: number[][] = Array.from({ length: cuts }, () => new Array<number>(positions).fill(-1))
  for (let c = 0; c < positions; c++) best[0]![c] = cost[0]![c] as number
  for (let k = 1; k < cuts; k++) {
    let run = Infinity
    let runAt = -1
    for (let c = 0; c < positions; c++) {
      // Best of the previous cut at any position below c (a band holds at least one score).
      const prev = best[k - 1]![c - 1]
      if (c > 0 && (prev as number) < run) {
        run = prev as number
        runAt = c - 1
      }
      if (run < Infinity) {
        best[k]![c] = run + (cost[k]![c] as number)
        from[k]![c] = runAt
      }
    }
  }
  let end = 0
  for (let c = 0; c < positions; c++) if ((best[cuts - 1]![c] as number) < (best[cuts - 1]![end] as number)) end = c
  const chosen: number[] = new Array<number>(cuts).fill(0)
  chosen[cuts - 1] = end
  for (let k = cuts - 1; k > 0; k--) chosen[k - 1] = from[k]![chosen[k] as number] as number
  // Move each cut to the middle of the plateau where it costs the same, so a band edge sits in the gap between the tiers.
  for (let k = 0; k < cuts; k++) {
    const at = chosen[k] as number
    const here = cost[k]![at] as number
    const floor = k === 0 ? 0 : (chosen[k - 1] as number) + 1
    const ceil = k === cuts - 1 ? positions - 2 : (chosen[k + 1] as number) - 1
    let lo = at
    let hi = at
    while (lo - 1 >= floor && cost[k]![lo - 1] === here) lo--
    while (hi + 1 <= ceil && cost[k]![hi + 1] === here) hi++
    chosen[k] = Math.floor((lo + hi) / 2)
  }
  return chosen
}

/** The bands a list of cuts makes: tier k holds scores after the previous cut up to its own. */
export function bandsFromCuts(cuts: readonly number[]): Record<SolvableTierId, Band> {
  return Object.fromEntries(
    TIER_IDS.map((id, k) => [id, { min: k === 0 ? 0 : (cuts[k - 1] as number) + 1, max: k === TIER_IDS.length - 1 ? 100 : (cuts[k] as number) }]),
  ) as Record<SolvableTierId, Band>
}

/** The tier whose band holds a score. */
export function bandOf(bands: Record<SolvableTierId, Band>, score: number): SolvableTierId {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  return TIER_IDS.find((id) => clamped >= bands[id].min && clamped <= bands[id].max) as SolvableTierId
}

/** Chance that a random puzzle of `higher` scores above one of `lower` (ties count half). 1 when either is empty. */
function auc(lower: readonly number[], higher: readonly number[]): number {
  if (lower.length === 0 || higher.length === 0) return 1
  let wins = 0
  for (const h of higher) for (const l of lower) wins += h > l ? 1 : h === l ? 0.5 : 0
  return wins / (lower.length * higher.length)
}

const quantile = (sorted: readonly number[], q: number): number => {
  if (sorted.length === 0) return 0
  const at = (sorted.length - 1) * q
  const lo = Math.floor(at)
  const hi = Math.ceil(at)
  return (sorted[lo] as number) + ((sorted[hi] as number) - (sorted[lo] as number)) * (at - lo)
}

/** Rank correlation (Spearman, mid-ranks for ties) of two lists; null when either has no spread. */
export function spearman(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length
  if (n < 2) return null
  const ranks = (values: readonly number[]): number[] => {
    const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
    const out = new Array<number>(n).fill(0)
    for (let i = 0; i < n; ) {
      let j = i
      while (j + 1 < n && (order[j + 1] as { v: number }).v === (order[i] as { v: number }).v) j++
      for (let k = i; k <= j; k++) out[(order[k] as { i: number }).i] = (i + j) / 2
      i = j + 1
    }
    return out
  }
  const rx = ranks(xs)
  const ry = ranks(ys)
  const mean = (n - 1) / 2
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = (rx[i] as number) - mean
    const b = (ry[i] as number) - mean
    num += a * b
    dx += a * a
    dy += b * b
  }
  return dx === 0 || dy === 0 ? null : num / Math.sqrt(dx * dy)
}

/** Effort of one solved play: seconds per person, each hint level counted as 30 s. Abandoned plays say nothing about the puzzle's length. */
export const EFFORT_HINT_SECONDS = 30

/** Median effort per puzzle over the solved records; puzzles without a solved record are absent. */
export function effortPerPuzzle(telemetry: readonly TelemetryInput[], people: ReadonlyMap<string, number>): Map<string, number> {
  const by = new Map<string, number[]>()
  for (const r of telemetry) {
    const n = people.get(r.puzzleId)
    if (r.outcome !== 'solved' || n === undefined) continue
    by.set(r.puzzleId, [...(by.get(r.puzzleId) ?? []), (r.activeSeconds + EFFORT_HINT_SECONDS * r.hints) / n])
  }
  return new Map([...by].map(([id, list]) => [id, quantile([...list].sort((a, b) => a - b), 0.5)]))
}

/** How well weights order the tiers, as one number to minimise, and what it is made of. */
function evaluate(input: Prepared, weights: ScoreWeights): { loss: number; scores: number[]; cuts: number[] } {
  const scores = input.rows.map((r) => scoreOf(r.parts, weights))
  const cuts = chooseCuts(scores, input.tiers, TIER_IDS.length)
  const bands = bandsFromCuts(cuts)
  let errors = 0
  input.rows.forEach((_, i) => {
    if (bandOf(bands, scores[i] as number) !== TIER_IDS[input.tiers[i] as number]) errors++
  })
  let ranking = 0
  for (let k = 0; k + 1 < TIER_IDS.length; k++) ranking += 1 - auc(input.byTier[k]!.map((i) => scores[i] as number), input.byTier[k + 1]!.map((i) => scores[i] as number))
  let judged = 0
  for (const j of input.judged) {
    const band = bands[TIER_IDS[input.intended[j.row] as number] as SolvableTierId]
    const s = scores[j.row] as number
    if (j.verdict === 'too-hard') judged += Math.max(0, band.max + 1 - s)
    else if (j.verdict === 'too-easy') judged += Math.max(0, s - (band.min - 1))
    else judged += Math.max(0, band.min - s, s - band.max)
  }
  let telemetry = 0
  if (input.effort.length >= 5) {
    const rho = spearman(input.effort.map((e) => scores[e.row] as number), input.effort.map((e) => e.effort))
    telemetry = rho === null ? 0 : 1 - rho
  }
  return { loss: errors + 40 * ranking + 2 * judged + 30 * telemetry, scores, cuts }
}

interface Prepared {
  rows: readonly CalibrationRow[]
  tiers: number[]
  intended: number[]
  byTier: number[][]
  judged: Judged[]
  effort: { row: number; effort: number }[]
  telemetryPuzzles: number
  telemetryRecords: number
}

function prepare(input: CalibrationInput): Prepared {
  const rows = input.rows
  const byId = new Map(rows.map((r, i) => [r.id, i]))
  const judged: Judged[] = []
  for (const j of input.judgements ?? []) {
    const row = byId.get(j.puzzleId)
    if (row !== undefined) judged.push({ row, verdict: j.verdict })
  }
  const people = new Map(rows.map((r) => [r.id, r.people]))
  const telemetry = (input.telemetry ?? []).filter((r) => byId.has(r.puzzleId))
  const effort = [...effortPerPuzzle(telemetry, people)].map(([id, e]) => ({ row: byId.get(id) as number, effort: e }))
  return {
    rows,
    tiers: rows.map((r) => tierIndex(r.tier)),
    intended: rows.map((r) => tierIndex(r.intended)),
    byTier: TIER_IDS.map((_, k) => rows.flatMap((r, i) => (tierIndex(r.tier) === k ? [i] : []))),
    judged,
    effort,
    telemetryPuzzles: effort.length,
    telemetryRecords: telemetry.length,
  }
}

const weightsOf = (values: readonly number[]): ScoreWeights => Object.fromEntries(PART_KEYS.map((k, i) => [k, values[i] as number])) as unknown as ScoreWeights

/** Starting points of the search: equal weights, the ladder parts alone, and the metrics of the hint solver alone. */
function starts(): number[][] {
  const groups: (readonly (keyof ScoreWeights)[])[] = [
    PART_KEYS,
    ["cards", "references", "squares", "ladderChain", "scarcity"],
    ["level", "steps", "chain", "cluesPerStep", "indirectClues", "candidates"],
    ["level", "cards", "squares", "ladderChain"],
  ]
  return groups.map((keys) => {
    // Everybody has the minimum; the rest is shared out over the group.
    const rest = TOTAL - MIN_WEIGHT * PART_KEYS.length
    const share = Math.floor(rest / keys.length)
    const out = PART_KEYS.map((k) => MIN_WEIGHT + (keys.includes(k) ? share : 0))
    const first = PART_KEYS.indexOf(keys[0] as keyof ScoreWeights)
    out[first] = (out[first] as number) + rest - share * keys.length
    return out
  })
}

/**
 * Coordinate search over whole-number weights that always sum to 100: move `step` units from one part to another while the loss falls,
 * from several fixed starting points, biggest steps first. Deterministic (no randomness); ties keep the earlier candidate.
 */
function search(input: Prepared): number[] {
  let best: { values: number[]; loss: number } | null = null
  for (const start of starts()) {
    let values = start
    let loss = evaluate(input, weightsOf(values)).loss
    for (const step of STEPS) {
      for (let pass = 0; pass < 200; pass++) {
        let improved = false
        for (let from = 0; from < values.length; from++) {
          for (let to = 0; to < values.length; to++) {
            if (from === to || (values[from] as number) - step < MIN_WEIGHT) continue
            const next = [...values]
            next[from] = (next[from] as number) - step
            next[to] = (next[to] as number) + step
            const l = evaluate(input, weightsOf(next)).loss
            if (l < loss - 1e-9) {
              values = next
              loss = l
              improved = true
            }
          }
        }
        if (!improved) break
      }
    }
    if (best === null || loss < best.loss - 1e-9) best = { values, loss }
  }
  return (best as { values: number[] }).values
}

/** Fits the weights and cuts the bands. */
export function calibrate(input: CalibrationInput): Calibration {
  const prepared = prepare(input)
  const values = search(prepared)
  const weights = weightsOf(values)
  const { scores, cuts } = evaluate(prepared, weights)
  const bands = bandsFromCuts(cuts)

  const spread = Object.fromEntries(
    TIER_IDS.map((id, k) => {
      const list = prepared.byTier[k]!.map((i) => scores[i] as number).sort((a, b) => a - b)
      return [id, { n: list.length, min: list[0] ?? 0, p25: quantile(list, 0.25), median: quantile(list, 0.5), p75: quantile(list, 0.75), max: list.at(-1) ?? 0 }]
    }),
  ) as Record<SolvableTierId, TierSpread>

  const exceptions: Exception[] = input.rows.flatMap((r, i) => {
    const band = bandOf(bands, scores[i] as number)
    return band === r.tier ? [] : [{ id: r.id, kind: r.kind, tier: r.tier, score: scores[i] as number, band }]
  })

  let aucSum = 0
  let aucCount = 0
  for (let k = 0; k + 1 < TIER_IDS.length; k++) {
    if (prepared.byTier[k]!.length === 0 || prepared.byTier[k + 1]!.length === 0) continue
    aucSum += auc(prepared.byTier[k]!.map((i) => scores[i] as number), prepared.byTier[k + 1]!.map((i) => scores[i] as number))
    aucCount++
  }

  const agree = prepared.judged.filter((j) => {
    const band = bandOf(bands, scores[j.row] as number)
    const intended = tierIndex(prepared.rows[j.row]!.intended)
    const at = tierIndex(band)
    return j.verdict === 'too-hard' ? at > intended : j.verdict === 'too-easy' ? at < intended : at === intended
  }).length

  let telemetry: Calibration['quality']['telemetry'] = null
  if (prepared.telemetryRecords > 0) {
    telemetry = {
      records: prepared.telemetryRecords,
      puzzles: prepared.telemetryPuzzles,
      spearman: prepared.effort.length >= 5 ? round(spearman(prepared.effort.map((e) => scores[e.row] as number), prepared.effort.map((e) => e.effort)) ?? 0, 3) : null,
    }
  }

  return {
    format: CALIBRATION_FORMAT,
    weights,
    bands,
    spread,
    exceptions,
    quality: {
      puzzles: input.rows.length,
      inBand: input.rows.length - exceptions.length,
      adjacentAuc: round(aucCount === 0 ? 1 : aucSum / aucCount, 4),
      judgements: { used: prepared.judged.length, agree },
      telemetry,
    },
  }
}

const round = (value: number, digits: number): number => Math.round(value * 10 ** digits) / 10 ** digits

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Reads an export of the lab's judgements (`{ version: 1, judgements: [...] }`, or the bare list) and returns the usable
 * entries; anything else reads as empty. Same rules as the lab (`src/ui/lab/judgements.ts`): a bad entry is skipped, and
 * when a puzzle is judged twice the later judgement wins.
 */
export function parseJudgementsExport(text: string): JudgementInput[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return []
  }
  const list = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data.judgements) ? data.judgements : []
  const latest = new Map<string, { verdict: Verdict; at: number }>()
  for (const entry of list) {
    if (!isRecord(entry)) continue
    const { puzzleId, verdict, judgedAt } = entry
    if (typeof puzzleId !== 'string' || puzzleId === '' || (verdict !== 'too-easy' && verdict !== 'good' && verdict !== 'too-hard')) continue
    const at = typeof judgedAt === 'number' && Number.isFinite(judgedAt) ? judgedAt : 0
    const kept = latest.get(puzzleId)
    if (!kept || at >= kept.at) latest.set(puzzleId, { verdict, at })
  }
  return [...latest].map(([puzzleId, { verdict, at }]) => ({ puzzleId, verdict, judgedAt: at }))
}

/**
 * Reads an export of the telemetry (`{ version: 1, records: [...] }`, or the bare list) into plays. Same shape as
 * `TelemetryRecord` (`src/game/telemetry`); a record without a session id or puzzle id is skipped, counts are made safe.
 */
export function parseTelemetryExport(text: string): TelemetryInput[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return []
  }
  const list = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data.records) ? data.records : []
  const count = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0)
  const out: TelemetryInput[] = []
  for (const entry of list) {
    if (!isRecord(entry) || typeof entry.puzzleId !== 'string' || entry.puzzleId === '') continue
    const hints = isRecord(entry.hints) ? entry.hints : {}
    out.push({
      puzzleId: entry.puzzleId,
      activeSeconds: count(entry.activeSeconds),
      hints: count(hints[1]) + count(hints[2]) + count(hints[3]),
      wrongPlacements: count(entry.wrongPlacements),
      outcome: entry.outcome === 'solved' ? 'solved' : 'abandoned',
    })
  }
  return out
}
