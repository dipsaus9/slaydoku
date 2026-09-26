import { LADDER_TIER_IDS, generateLadder } from '../../engine/generator/ladder/index.ts'
import type { LadderTierId } from '../../engine/generator/ladder/index.ts'
import { tryGenerateForScene } from '../../engine/generator/scale/index.ts'
import { difficultyScore } from '../../engine/generator/tiers/index.ts'
import { solveAdvanced } from '../../engine/solver/advanced/index.ts'
import type { CatalogClue } from '../../engine/clues/index.ts'
import { generateScene } from '../../engine/scenegen/index.ts'
import type { GenerateRequest, LabFailure, LabPhase, SearchOutcome } from './protocol.ts'

/*
 * The heavy half of a lab generation, and the only half the Web Worker runs. It imports the
 * engine alone: the card art (`render/cards`, .tsx) must stay out of the worker, because the
 * dev server gives .tsx modules a React Refresh preamble that needs `window`.
 */

export const failureOf = (reason: string, elapsedMs: number): { ok: false; failure: LabFailure } => ({
  ok: false,
  failure: { reason, timedOut: false, attempts: 0, elapsedMs, rejections: {} },
})

/** Random scene plus the tier generator (the ladder generator for very easy to medium, the advanced one for hard and expert). Same request, same puzzle. Never throws. */
export function searchPuzzle(request: GenerateRequest, onPhase: (phase: LabPhase) => void = () => {}): SearchOutcome {
  const started = performance.now()
  const { size, tier, theme, seed } = request
  try {
    onPhase('scene')
    const scene = generateScene({ width: size, height: size, theme, seed })
    onPhase('search')
    if ((LADDER_TIER_IDS as readonly string[]).includes(tier)) {
      // Very easy to medium are built on the human-solvability ladder, like the pack (CAD-8.5).
      const outcome = generateLadder(scene, tier as LadderTierId, seed, { victimCell: request.victim, budgetMs: request.budgetMs, genders: request.genders })
      if (!outcome.ok) {
        return { ok: false, failure: { reason: outcome.message, timedOut: outcome.reason === 'budget', attempts: outcome.attempts, elapsedMs: outcome.elapsedMs, rejections: outcome.rejections } }
      }
      const { puzzle } = outcome
      const human = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
      return {
        ok: true,
        found: {
          puzzle,
          attempts: outcome.attempts,
          score: difficultyScore(human, puzzle.people.length),
          level: human.maxTechnique?.level ?? 0,
          steps: human.steps.length,
          elapsedMs: Math.round(performance.now() - started),
        },
      }
    }
    const result = tryGenerateForScene(scene, { seed, tier, budgetMs: request.budgetMs, victimCell: request.victim })
    if (!result.ok) {
      const { failure } = result
      return {
        ok: false,
        failure: { reason: failure.message, timedOut: failure.timedOut, attempts: failure.attempts, elapsedMs: failure.elapsedMs, rejections: failure.rejections },
      }
    }
    const { report } = result
    return {
      ok: true,
      found: {
        puzzle: report.puzzle,
        attempts: report.attempts,
        score: report.score,
        level: report.human.maxTechnique?.level ?? 0,
        steps: report.human.steps.length,
        elapsedMs: Math.round(performance.now() - started),
      },
    }
  } catch (error) {
    return failureOf(error instanceof Error ? error.message : String(error), Math.round(performance.now() - started))
  }
}
