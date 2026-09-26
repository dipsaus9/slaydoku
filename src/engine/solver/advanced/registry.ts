import { BASIC_BANDS, BASIC_TECHNIQUES, TechniqueRegistry } from '../human/registry.ts'
import type { DifficultyBand, Technique } from '../human/types.ts'
import { chain } from './techniques/chain.ts'
import { combinedClues } from './techniques/combined.ts'
import { hiddenLines, nakedLines } from './techniques/lines.ts'
import { fish, intersectWide } from './techniques/rectangle.ts'
import { clueRoomCount, roomCapacity, roomHiddenSingle, victimCount } from './techniques/rooms.ts'

/** Hard (level 4): the techniques a strong player uses on a hard puzzle. */
export const HARD_LEVEL = 4
/** Expert (level 5): bigger patterns and chains. */
export const EXPERT_LEVEL = 5

/**
 * The advanced technique catalog, cheapest first within a level. Level 3 is the
 * basic `overload` (pairs) and `intersect`; these continue from there.
 */
export const ADVANCED_TECHNIQUES: readonly Technique[] = [
  // hard
  hiddenLines(1, 2, 'hidden-lines', HARD_LEVEL, 'Hidden pairs in rows and columns'),
  nakedLines(3, 'naked-triple', HARD_LEVEL, 'Triple across rows and columns'),
  roomHiddenSingle,
  roomCapacity,
  victimCount,
  fish(2, 2, 'rectangle', HARD_LEVEL, 'Rule out a rectangle'),
  intersectWide,
  combinedClues,
  // expert
  hiddenLines(3, 4, 'hidden-lines-large', EXPERT_LEVEL, 'Hidden triples in rows and columns'),
  nakedLines(4, 'naked-quad', EXPERT_LEVEL, 'Quad across rows and columns'),
  fish(3, 4, 'fish', EXPERT_LEVEL, 'Rule out a large rectangle'),
  clueRoomCount,
  chain,
]

/** Rating bands above medium: hard puzzles need a level-4 technique, expert ones a level-5 technique. */
export const ADVANCED_BANDS: readonly DifficultyBand[] = [
  { minLevel: HARD_LEVEL, id: 'hard', label: 'Hard' },
  { minLevel: EXPERT_LEVEL, id: 'expert', label: 'Expert' },
]

/** Adds the advanced techniques and bands to a registry, without touching what is already in it. */
export function registerAdvanced(registry: TechniqueRegistry): TechniqueRegistry {
  return registry.register(...ADVANCED_TECHNIQUES).registerBand(...ADVANCED_BANDS)
}

/**
 * Basic plus advanced techniques and the full five-band scale. A separate
 * registry rather than a change to `defaultRegistry`, so everything built on
 * the basic solver (the generator, the tiers) keeps its behaviour until it
 * opts in.
 */
export const advancedRegistry: TechniqueRegistry = registerAdvanced(
  new TechniqueRegistry().register(...BASIC_TECHNIQUES).registerBand(...BASIC_BANDS),
)
