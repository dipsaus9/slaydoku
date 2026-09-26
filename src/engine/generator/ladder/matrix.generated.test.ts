import { describe, it } from 'vitest'
import { sceneForSeed } from '../scale/measure.ts'
import { LADDER_TIER_IDS } from './generate.ts'
import { expectGood, ok } from './testing.fixture.ts'

// CAD-8.3: 20 puzzles per tier on two scenes (the demo house and this generated 9x9), each one judged by the oracle.
describe('generateLadder on a generated 9x9 scene', () => {
  const scene = sceneForSeed(9, 4)
  it.each(LADDER_TIER_IDS)('makes 20 %s puzzles that pass the ladder, are unique and name their objects', { timeout: 180_000 }, (tier) => {
    for (let seed = 1; seed <= 20; seed++) expectGood(ok(scene, tier, seed), tier)
  })
})
