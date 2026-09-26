import { parsePuzzle } from '../engine/model/index.ts'
import type { Puzzle } from '../engine/model/index.ts'
import { registerLevels } from '../ui/levels/registry.ts'
import type { Level } from '../ui/levels/registry.ts'
import { demoRoomStyles } from './demo/scene.ts'
import demoJson from './demo/puzzle.json?raw'

/** Parses one committed puzzle file; a broken file fails loudly at start-up, never mid-game. */
function load(name: string, text: string): Puzzle {
  const parsed = parsePuzzle(text)
  if (!parsed.ok) {
    throw new Error(`Puzzle ${name} is invalid: ${parsed.issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`)
  }
  return parsed.value
}

/**
 * The registered levels, in play order (level N + 1 unlocks when level N is solved). For now one demo
 * level: the demo house (`demo/scene.ts`), ladder tier easy, seed 2, victim on the sofa, cast from `castFor`.
 * Regenerate it with `bun tools/ladder.ts --scene demo --tier easy --seed 2 --victim 9,7 --cast --out src/content/demo/puzzle.json`.
 */
export const demoLevels: readonly Level[] = [
  { id: 'demo', title: 'Demo', puzzle: load('demo', demoJson), roomStyles: demoRoomStyles },
]

registerLevels(demoLevels)
