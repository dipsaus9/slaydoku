import type { TierId } from '../engine/generator/tiers/index.ts'
import type { Puzzle } from '../engine/model/index.ts'
import { SCENE_THEMES } from './themes/index.ts'
import type { ThemeId } from './themes/index.ts'
import { buildEntry, seedBase } from './packs/build.ts'

/** A puzzle built on the spot for the tests that used to read the committed pack. */
export interface GeneratedPuzzle {
  id: string
  size: number
  tier: TierId
  theme: ThemeId
  puzzle: Puzzle
}

const SIZES = [6, 7, 9] as const
const TIERS: readonly TierId[] = ['very-easy', 'easy', 'medium']
const BUDGET_MS = 20_000
const MAX_SEEDS = 40

let cached: GeneratedPuzzle[] | null = null

/**
 * A small deterministic sample of dressed puzzles: every theme x a few sizes x three tiers, the first seed that passes every pack gate.
 * Built once per test file (about a second or two). Same code, same sample.
 */
export function generatedPuzzles(): readonly GeneratedPuzzle[] {
  if (cached) return cached
  const out: GeneratedPuzzle[] = []
  for (const theme of SCENE_THEMES) {
    for (const size of SIZES) {
      for (const tier of TIERS) {
        for (let seed = seedBase(tier); seed < seedBase(tier) + MAX_SEEDS; seed++) {
          const result = buildEntry(size, tier, theme.id, seed, BUDGET_MS)
          if (result.ok) {
            out.push({ id: result.entry.id, size, tier, theme: theme.id, puzzle: result.entry.puzzle })
            break
          }
        }
      }
    }
  }
  cached = out
  return out
}
