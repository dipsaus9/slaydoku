import { describe, expect, it } from 'vitest'
import { demoScene } from '../../../content/demo/scene.ts'
import { isOccupiable, roomIdAt } from '../../model/index.ts'
import type { Scene } from '../../model/index.ts'
import { sceneForSeed } from '../scale/measure.ts'
import { Rng } from '../rng.ts'
import { guidedSolution, stateFreeTable } from './guided.ts'

const table = (scene: Scene) => stateFreeTable(scene, 'test', (clue) => clue.type !== 'aloneWithMurderer')

describe('stateFreeTable', () => {
  it('lists cards about one person alone with the squares each leaves, cached per scene', () => {
    const cards = table(demoScene)
    expect(cards.length).toBeGreaterThan(20)
    for (const card of cards) {
      expect(card.count).toBe(card.mask.reduce((a, b) => a + b, 0))
      expect(card.count).toBeGreaterThan(0)
      expect((card.clue.args as { otherId?: string } | undefined)?.otherId).toBeUndefined()
    }
    expect(table(demoScene)).toBe(cards)
  })
})

describe('guidedSolution', () => {
  it('places everybody in their own row and column, on free squares, with one suspect in the gift room', () => {
    for (const scene of [demoScene, sceneForSeed(9, 4), sceneForSeed(6, 2)]) {
      const found = guidedSolution(scene, table(scene), new Rng(1), { entries: 2, lineCap: 3, nodeBudget: 2000 })
      if (!found) continue
      const cells = [found.victim, ...found.suspects]
      expect(new Set(cells.map((c) => c.row)).size).toBe(scene.width)
      expect(new Set(cells.map((c) => c.col)).size).toBe(scene.width)
      for (const cell of cells) expect(isOccupiable(scene, cell)).toBe(true)
      const room = roomIdAt(scene, found.victim)
      expect(found.suspects.filter((c) => roomIdAt(scene, c) === room)).toHaveLength(1)
    }
  })

  it('finds a path on at least one scene, and pins the victim when asked', () => {
    const victim = { row: 8, col: 6 }
    const scene = demoScene
    const found = guidedSolution(scene, table(scene), new Rng(2), { victimCell: victim, entries: 2, lineCap: 3, nodeBudget: 2000 })
    expect(found?.victim).toEqual(victim)
    expect(guidedSolution(scene, table(scene), new Rng(2), { victimCell: { row: 0, col: 1 }, entries: 2, lineCap: 3, nodeBudget: 2000 })).toBeNull()
  })

  it('gives up when no card leaves a square alone', () => {
    expect(guidedSolution(demoScene, [], new Rng(1), { entries: 0, lineCap: 3, nodeBudget: 100 })).toBeNull()
  })
})
