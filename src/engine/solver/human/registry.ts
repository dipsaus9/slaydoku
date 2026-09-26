import type { DifficultyBand, Technique } from './types.ts'
import { clueEliminations } from './techniques/clue.ts'
import { intersect } from './techniques/intersect.ts'
import { overload } from './techniques/overload.ts'
import { scan } from './techniques/scan.ts'
import { singleCandidate } from './techniques/single.ts'
import { victimRoom } from './techniques/victim-room.ts'

/**
 * The technique catalog and the rating scale, as data. A registry holds
 * technique objects; adding an advanced technique (story CAD-4.22) is
 * `registry.register(myTechnique)` from its own file, with no edit to the
 * techniques below.
 */
export class TechniqueRegistry {
  private readonly techniques: Technique[] = []
  private readonly bands: DifficultyBand[] = []

  register(...techniques: Technique[]): this {
    for (const technique of techniques) {
      if (this.techniques.some((t) => t.id === technique.id)) {
        throw new Error(`Technique "${technique.id}" is already registered.`)
      }
      this.techniques.push(technique)
    }
    return this
  }

  registerBand(...bands: DifficultyBand[]): this {
    for (const band of bands) {
      if (this.bands.some((b) => b.minLevel === band.minLevel || b.id === band.id)) {
        throw new Error(`Difficulty band "${band.id}" (level ${band.minLevel}) is already registered.`)
      }
      this.bands.push(band)
    }
    return this
  }

  /** Techniques easiest first; same level keeps registration order. */
  list(): Technique[] {
    return sortTechniques(this.techniques)
  }

  /** Bands by ascending `minLevel`. */
  listBands(): DifficultyBand[] {
    return sortBands(this.bands)
  }
}

export const sortTechniques = (techniques: readonly Technique[]): Technique[] =>
  techniques
    .map((technique, order) => ({ technique, order }))
    .sort((a, b) => a.technique.level - b.technique.level || a.order - b.order)
    .map((entry) => entry.technique)

export const sortBands = (bands: readonly DifficultyBand[]): DifficultyBand[] =>
  [...bands].sort((a, b) => a.minLevel - b.minLevel)

/** The basic techniques of the official game, in the order they are tried within a level. */
export const BASIC_TECHNIQUES: readonly Technique[] = [
  clueEliminations,
  singleCandidate,
  scan,
  victimRoom,
  overload,
  intersect,
]

/** Rating scale for the basic techniques. Story CAD-4.22 adds the hard and expert bands. */
export const BASIC_BANDS: readonly DifficultyBand[] = [
  { minLevel: 1, id: 'very-easy', label: 'Very easy' },
  { minLevel: 2, id: 'easy', label: 'Easy' },
  { minLevel: 3, id: 'medium', label: 'Medium' },
]

/** What `solveHuman` uses when it is given no techniques of its own. */
export const defaultRegistry = new TechniqueRegistry().register(...BASIC_TECHNIQUES).registerBand(...BASIC_BANDS)
