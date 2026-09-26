import { puzzle as tutorialWithClues } from '../../game/fixture.ts'
import type { Level } from './registry.ts'

/**
 * Dev sample: the tutorial puzzle from engine/model/tutorial.fixture.ts plus its four clue
 * cards, so the app is playable before the house puzzles exist. Story 4.18 replaces the default
 * registration in App.tsx with the real levels from src/content/levels.ts.
 */
export const devSampleLevel: Level = {
  id: 'oefenkamer',
  title: 'Oefenkamer',
  puzzle: tutorialWithClues,
}
