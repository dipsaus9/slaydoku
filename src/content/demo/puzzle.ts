import { parsePuzzle } from '../../engine/model/index.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import demoJson from './puzzle.json?raw'

/**
 * The demo puzzle: the demo house (`scene.ts`), ladder tier easy, seed 2, victim on the sofa, cast from `castFor`. It is not a level of
 * the game (the game plays the daily schedule, `src/content/schedule/`); the generator tools, the tests and the dev-only lab use it as
 * a stable sample. A broken file fails loudly at start-up.
 * Regenerate it with `bun tools/ladder.ts --scene demo --tier easy --seed 2 --victim 9,7 --cast --out src/content/demo/puzzle.json`.
 */
function load(): Puzzle {
  const parsed = parsePuzzle(demoJson)
  if (!parsed.ok) {
    throw new Error(`Puzzle demo is invalid: ${parsed.issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`)
  }
  return parsed.value
}

export const demoPuzzle: Puzzle = load()
