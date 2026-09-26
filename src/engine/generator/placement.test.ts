import { describe, expect, it } from 'vitest'
import { demoScene } from '../../content/demo/scene.ts'
import { deriveMurderer, isOccupiable, validatePlacement } from '../model/index.ts'
import type { Person, Placement, Scene } from '../model/index.ts'
import { randomScene, rng as testRng } from '../solver/testing.fixture.ts'
import { GeneratorError, samplePlacement } from './placement.ts'
import { Rng } from './rng.ts'

const asPlacements = (sampled: ReturnType<typeof samplePlacement>): { people: Person[]; placements: Placement[] } => {
  const people: Person[] = [
    { id: 'V', kind: 'victim', label: 'V' },
    ...sampled.suspects.map((_, i) => ({ id: `S${i}`, kind: 'suspect' as const, label: `S${i}` })),
  ]
  const placements = [
    { personId: 'V', cell: sampled.victim },
    ...sampled.suspects.map((cell, i) => ({ personId: `S${i}`, cell })),
  ]
  return { people, placements }
}

describe('samplePlacement', () => {
  const scenes: [string, Scene][] = [
    ['random 9x9', randomScene(9, 3, testRng(11))],
    ['demo house', demoScene],
  ]

  for (const [name, scene] of scenes) {
    it(`gives valid placements with a murderer on ${name}`, () => {
      for (let seed = 0; seed < 25; seed++) {
        const sampled = samplePlacement(scene, new Rng(seed))
        const { people, placements } = asPlacements(sampled)
        expect(validatePlacement({ scene, people }, placements).ok).toBe(true)
        expect(deriveMurderer({ scene, people }, placements)).not.toBeNull()
        expect(sampled.suspects).toContainEqual(sampled.murderer)
      }
    })
  }

  it('is deterministic per rng state', () => {
    const scene = demoScene
    expect(samplePlacement(scene, new Rng(9))).toEqual(samplePlacement(scene, new Rng(9)))
  })

  it('honours a pinned victim cell', () => {
    const scene = demoScene
    const pinned = { row: 8, col: 6 }
    for (let seed = 0; seed < 10; seed++) {
      expect(samplePlacement(scene, new Rng(seed), { victimCell: pinned }).victim).toEqual(pinned)
    }
  })

  it('refuses a pinned cell that is blocked or outside the grid', () => {
    const scene = demoScene
    const blocked = scene.objects.flatMap((o) => o.cells).find((c) => !isOccupiable(scene, c))
    expect(blocked).toBeDefined()
    expect(() => samplePlacement(scene, new Rng(1), { victimCell: blocked })).toThrow(GeneratorError)
    expect(() => samplePlacement(scene, new Rng(1), { victimCell: { row: 9, col: 0 } })).toThrow(/outside/)
  })

  it('refuses a non-square grid', () => {
    const scene = { ...randomScene(4, 2, testRng(1)), width: 5 }
    expect(() => samplePlacement(scene, new Rng(1))).toThrow(/square/)
  })
})
