import { generateLadder } from '../../engine/generator/ladder/index.ts'
import type { LadderTierId } from '../../engine/generator/ladder/index.ts'
import { tryGenerateForScene } from '../../engine/generator/scale/index.ts'
import type { ScaleFailure } from '../../engine/generator/scale/index.ts'
import { TIERS } from '../../engine/generator/tiers/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { Gender, Person, Puzzle, Scene } from '../../engine/model/index.ts'
import { roomName } from '../../engine/clues/index.ts'
import { generateScene } from '../../engine/scenegen/index.ts'
import { castFor } from '../cast/index.ts'
import type { Cast } from '../cast/index.ts'
import { getTheme } from '../themes/index.ts'
import type { ThemeId } from '../themes/index.ts'
import { boardKey, entryProblems, isLadderTier, puzzleKey, ratingOf } from './gates.ts'
import { VICTIM_LABEL, packId } from './ids.ts'
import type { PackEntry } from './types.ts'

/** Board sizes of the pack, and the size of the seed window one (size, tier, theme) may search. */
export const PACK_SIZES = [6, 7, 8, 9, 12, 16] as const
export const SEED_WINDOW = 100

/** Wall clock per puzzle. Above the 60 s default so a busy machine cannot cut a search short and change the result. */
export const PACK_BUDGET_MS = 180_000

/** First seed of a tier: tiers get their own window, so scenes never repeat across tiers of one theme and size. */
export const seedBase = (tier: TierId): number => (TIERS.findIndex((t) => t.id === tier) + 1) * SEED_WINDOW

const TITLE_TEMPLATES = [
  'The victim in {room}',
  'Foul play in {room}',
  'Mystery in {room}',
  'A riddle in {room}',
  'Detective work in {room}',
] as const

/** Title: theme, then a template on the room where the victim lies, e.g. "Family home: Foul play in the Kitchen". */
export function titleFor(scene: Scene, theme: ThemeId, victimRow: number, victimCol: number, seed: number): string {
  const roomId = scene.cellRooms[victimRow]![victimCol]!
  const room = roomName({ scene, people: [] }, roomId)
  const template = TITLE_TEMPLATES[seed % TITLE_TEMPLATES.length]!
  return `${getTheme(theme).name}: ${template.replace('{room}', room)}`
}

/**
 * The generator's puzzle dressed for the pack: cast names as labels (and their genders, see `castFor`), "the victim" as victim
 * (no gender). Room names stay bare ("Kitchen"); clue text adds "the". A puzzle the ladder generator built with these
 * genders already carries them.
 */
export function dress(puzzle: Puzzle, cast: readonly string[], genders: readonly Gender[] = []): Puzzle {
  let next = 0
  const people: Person[] = puzzle.people.map((p) => {
    if (p.kind === 'victim') return { ...p, label: VICTIM_LABEL }
    const at = next++
    const gender = genders[at]
    return gender === undefined ? { ...p, label: cast[at]! } : { ...p, label: cast[at]!, gender }
  })
  return { ...puzzle, people }
}

/** A failed candidate: `problems` lists what the gates found in a puzzle the generator did build; without it the generator itself found no puzzle inside the budget. */
export type BuildResult = { ok: true; entry: PackEntry; ms: number } | { ok: false; reason: string; failure?: ScaleFailure; problems?: string[] }

/**
 * One candidate: random scene, tier puzzle, dressing, all gates. Same arguments give the same entry. The cast comes from `castFor`
 * (seeded by the puzzle id; `previousCast` is the day before's, whose names are not used again). The daily schedule passes a `cast` of its
 * own instead, decided per day (SLAY-1.4); `previousCast` is then not used.
 */
export function buildEntry(size: number, tier: TierId, theme: ThemeId, seed: number, budgetMs = PACK_BUDGET_MS, previousCast?: readonly string[], cast?: Cast): BuildResult {
  const started = performance.now()
  const scene = generateScene({ width: size, height: size, theme, seed })
  const id = packId(size, tier, theme, seed)
  // The cast (names AND genders) first: the ladder generator needs the genders to draw the gender cards.
  const built = cast ?? castFor(size, id, previousCast)
  const names = built.names
  let generated: Puzzle
  if (isLadderTier(tier)) {
    // Very easy to medium: built on the human-solvability ladder (CAD-8.3); the tier is exact (tierFor gives it).
    const outcome = generateLadder(scene, tier as LadderTierId, seed, { budgetMs, genders: built.genders })
    if (!outcome.ok) return { ok: false, reason: outcome.message }
    generated = outcome.puzzle
  } else {
    const result = tryGenerateForScene(scene, { seed, tier, budgetMs })
    if (!result.ok) return { ok: false, reason: result.failure.message, failure: result.failure }
    generated = result.report.puzzle
  }
  const puzzle = dress(generated, names, built.genders)
  const victim = puzzle.solution.find((p) => p.personId === puzzle.people.find((q) => q.kind === 'victim')!.id)!.cell
  const entry: PackEntry = {
    id, size, tier, theme, seed,
    title: titleFor(puzzle.scene, theme, victim.row, victim.col, seed),
    clueCount: puzzle.clues.length,
    rating: ratingOf(puzzle, tier).rating,
    cast: [...names],
    puzzle,
  }
  const problems = entryProblems(entry)
  if (problems.length > 0) return { ok: false, reason: problems.join('; '), problems }
  return { ok: true, entry, ms: Math.round(performance.now() - started) }
}

export interface Progress {
  (line: string): void
}

/**
 * The `count` puzzles of one (size, tier, theme): walks the seed window in
 * order and keeps every candidate that passes the gates and is not a duplicate
 * board or puzzle of anything in `seen`. Deterministic: same arguments, same
 * entries. Throws when the window runs out before `count` puzzles.
 */
export function buildCell(
  size: number, tier: TierId, theme: ThemeId, count: number,
  seen: { boards: Set<string>; puzzles: Set<string> },
  progress: Progress = () => {},
): PackEntry[] {
  const entries: PackEntry[] = []
  const start = seedBase(tier)
  for (let seed = start; seed < start + SEED_WINDOW && entries.length < count; seed++) {
    const built = buildEntry(size, tier, theme, seed)
    if (!built.ok) {
      progress(`${size}-${tier}-${theme}-${seed}: rejected: ${built.reason.slice(0, 160)}`)
      continue
    }
    const board = boardKey(built.entry.puzzle)
    const key = puzzleKey(built.entry.puzzle)
    if (seen.boards.has(board) || seen.puzzles.has(key)) {
      progress(`${built.entry.id}: rejected: duplicate board or puzzle`)
      continue
    }
    seen.boards.add(board)
    seen.puzzles.add(key)
    entries.push(built.entry)
    progress(`${built.entry.id}: ok (${built.entry.clueCount} clues, score ${built.entry.rating.score}, ${built.ms} ms)`)
  }
  if (entries.length < count) throw new Error(`${size}-${tier}-${theme}: only ${entries.length} of ${count} puzzles inside seeds ${start}..${start + SEED_WINDOW - 1}`)
  return entries
}
