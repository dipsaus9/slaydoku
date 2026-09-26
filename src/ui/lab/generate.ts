import { dress, titleFor } from '../../content/packs/build.ts'
import { entryProblems } from '../../content/packs/gates.ts'
import { packId } from '../../content/packs/ids.ts'
import type { PackEntry } from '../../content/packs/types.ts'
import { buildCastForBoard } from '../../render/cards/procedural/index.ts'
import type { FoundPuzzle, GenerateRequest, GenerationOutcome, LabPhase, SearchOutcome } from './protocol.ts'
import { failureOf, searchPuzzle } from './search.ts'

/** The request with the genders of the board's cast, so the search can draw gender cards for the people the pack dresses them as. */
export function withCastGenders(request: GenerateRequest): GenerateRequest {
  const { size, tier, theme, seed } = request
  return { ...request, genders: buildCastForBoard(size, packId(size, tier, theme, seed)).genders }
}

/**
 * The light half, run on the page after the worker found a puzzle: dresses it the way the pack
 * does (cast names, "het cadeau", room articles, Dutch title) and runs the pack checks. A check
 * that fails does not throw the puzzle away: it comes back as a warning, so the developer can still
 * open and judge it.
 */
export function finishPuzzle(request: GenerateRequest, found: FoundPuzzle): GenerationOutcome {
  const started = performance.now()
  try {
    const { size, tier, theme, seed } = request
    const id = packId(size, tier, theme, seed)
    const built = buildCastForBoard(size, id)
    const cast = built.names
    const puzzle = dress(found.puzzle, cast, built.genders)
    const victimId = puzzle.people.find((p) => p.kind === 'victim')!.id
    const victim = puzzle.solution.find((p) => p.personId === victimId)!.cell
    const entry: PackEntry = {
      id, size, tier, theme, seed,
      title: titleFor(puzzle.scene, theme, victim.row, victim.col, seed),
      clueCount: puzzle.clues.length,
      rating: { score: found.score, level: found.level, steps: found.steps },
      cast: [...cast],
      puzzle,
    }
    return { ok: true, puzzle: { ...entry, attempts: found.attempts, elapsedMs: found.elapsedMs, warnings: entryProblems(entry) } }
  } catch (error) {
    return failureOf(error instanceof Error ? error.message : String(error), Math.round(performance.now() - started))
  }
}

/** Both halves in one go, without a worker (tests, scripts). */
export function runGeneration(request: GenerateRequest, onPhase: (phase: LabPhase) => void = () => {}): GenerationOutcome {
  const searched: SearchOutcome = searchPuzzle(withCastGenders(request), onPhase)
  if (!searched.ok) return searched
  onPhase('check')
  return finishPuzzle(request, searched.found)
}
