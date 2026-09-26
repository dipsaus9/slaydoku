import { defaultStorage } from '../../game/persistence.ts'
import type { StorageLike } from '../../game/persistence.ts'

/** Where the judgements live in localStorage. The calibration story (CAD-5.6) reads this key or an export of it. */
export const JUDGEMENTS_KEY = 'slaydoku:lab-judgements'
/** Bump when the stored shape changes; other versions are ignored, never crashed on. */
export const JUDGEMENTS_VERSION = 1

/** Too easy, good, too hard. Machine ids stay English; the lab shows them as text. */
export const VERDICTS = ['too-easy', 'good', 'too-hard'] as const
export type Verdict = (typeof VERDICTS)[number]

/** A judgement of one puzzle's difficulty. At most one per puzzle. */
export interface Judgement {
  /** Same id the game and the telemetry use for the puzzle (house level id or pack case id). */
  puzzleId: string
  verdict: Verdict
  /** Ms since epoch when it was given. */
  judgedAt: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isVerdict = (value: unknown): value is Verdict => (VERDICTS as readonly unknown[]).includes(value)

function parseJudgement(value: unknown): Judgement | null {
  if (!isRecord(value)) return null
  const { puzzleId, verdict, judgedAt } = value
  if (typeof puzzleId !== 'string' || puzzleId === '' || !isVerdict(verdict)) return null
  if (typeof judgedAt !== 'number' || !Number.isFinite(judgedAt) || judgedAt < 0) return null
  return { puzzleId, verdict, judgedAt }
}

/** Reads `{ version, judgements: [...] }`; null when it has another shape or version. Bad entries are dropped and counted. */
function parseDocument(raw: string): { judgements: Judgement[]; skipped: number } | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data) || data.version !== JUDGEMENTS_VERSION || !Array.isArray(data.judgements)) return null
  const parsed = data.judgements.map(parseJudgement)
  return { judgements: parsed.filter((j): j is Judgement => j !== null), skipped: parsed.filter((j) => j === null).length }
}

/** One judgement per puzzle: when a list repeats an id, the later judgement wins. */
function merge(base: readonly Judgement[], extra: readonly Judgement[]): Judgement[] {
  const byId = new Map(base.map((j) => [j.puzzleId, j]))
  for (const j of extra) {
    const kept = byId.get(j.puzzleId)
    if (!kept || j.judgedAt >= kept.judgedAt) byId.set(j.puzzleId, j)
  }
  return [...byId.values()]
}

/** All stored judgements. Anything unusable (missing, corrupt, throwing storage) reads as empty. */
export function loadJudgements(storage: StorageLike | null = defaultStorage()): Judgement[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(JUDGEMENTS_KEY)
    return raw === null ? [] : (parseDocument(raw)?.judgements ?? [])
  } catch {
    return []
  }
}

function write(storage: StorageLike | null, judgements: readonly Judgement[]): boolean {
  if (!storage) return false
  try {
    storage.setItem(JUDGEMENTS_KEY, JSON.stringify({ version: JUDGEMENTS_VERSION, judgements }))
    return true
  } catch {
    return false
  }
}

export const judgementFor = (judgements: readonly Judgement[], puzzleId: string): Judgement | undefined =>
  judgements.find((j) => j.puzzleId === puzzleId)

/** Stores (or replaces) the judgement of a puzzle. Returns false when storage refuses. */
export function saveJudgement(storage: StorageLike | null, puzzleId: string, verdict: Verdict, judgedAt: number): boolean {
  return write(storage, merge(loadJudgements(storage).filter((j) => j.puzzleId !== puzzleId), [{ puzzleId, verdict, judgedAt }]))
}

/** Removes the judgement of a puzzle (the judgement is optional). Returns false when storage refuses. */
export function clearJudgement(storage: StorageLike | null, puzzleId: string): boolean {
  return write(storage, loadJudgements(storage).filter((j) => j.puzzleId !== puzzleId))
}

/** Everything judged so far as pretty JSON, same shape as the stored value, for saving to a file. Never throws. */
export function exportJudgements(storage: StorageLike | null = defaultStorage()): string {
  return JSON.stringify({ version: JUDGEMENTS_VERSION, judgements: loadJudgements(storage) }, null, 2)
}

export type ImportResult = { ok: true; imported: number; skipped: number } | { ok: false }

/**
 * Adds the judgements of an export to the stored ones. A puzzle judged on both sides keeps the
 * later judgement. A file that is not an export changes nothing; single bad entries are skipped.
 */
export function importJudgements(storage: StorageLike | null, text: string): ImportResult {
  const parsed = parseDocument(text)
  if (!parsed || !storage) return { ok: false }
  if (!write(storage, merge(loadJudgements(storage), parsed.judgements))) return { ok: false }
  return { ok: true, imported: parsed.judgements.length, skipped: parsed.skipped }
}
