import { describe, it } from 'vitest'
import { demoScene } from '../../../content/demo/scene.ts'
import { LADDER_TIER_IDS } from './generate.ts'
import { expectGood, ok } from './testing.fixture.ts'

// 20 puzzles per tier on the demo house (gift on the sofa r9c7), each one judged by the oracle.
describe('generateLadder on the demo house (gift on the sofa r9c7)', () => {
  const gift = { row: 8, col: 6 }
  it.each(LADDER_TIER_IDS)('makes 20 %s puzzles that pass the ladder, are unique and name their objects', { timeout: 180_000 }, (tier) => {
    for (let seed = 1; seed <= 20; seed++) expectGood(ok(demoScene, tier, seed, gift), tier, gift)
  })
})
