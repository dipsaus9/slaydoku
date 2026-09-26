import type { CatalogClue } from '../../clues/index.ts'
import type { Person, Scene } from '../../model/index.ts'
import { solveHuman } from '../human/solve-human.ts'
import type { HumanResult } from '../human/types.ts'
import { advancedRegistry } from './registry.ts'

export interface AdvancedOptions {
  /** Leave out techniques above this level (e.g. 4 = no chain reasoning). Default: use everything. */
  maxLevel?: number
}

/**
 * `solveHuman` with the advanced catalog: the basic techniques first, then the
 * hard (level 4) and expert (level 5) ones, and the five-band rating scale. The
 * result has the same shape; hard and expert puzzles score 4xx and 5xx, above
 * the medium 3xx of the basic solver.
 */
export function solveAdvanced(
  scene: Scene,
  people: readonly Person[],
  clues: readonly CatalogClue[],
  options: AdvancedOptions = {},
): HumanResult {
  const max = options.maxLevel ?? Number.POSITIVE_INFINITY
  return solveHuman(scene, people, clues, {
    techniques: advancedRegistry.list().filter((t) => t.level <= max),
    bands: advancedRegistry.listBands(),
  })
}
