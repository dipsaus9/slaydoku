import type { Puzzle, Scene } from '../../model/index.ts'
import nine from '../../solver/fixtures/synthetic-9x9.json?raw'

/** Shared 9x9 fixture scene for generate.test.ts and generate.slow.test.ts. */
export const sample9: Scene = (JSON.parse(nine) as Puzzle).scene
