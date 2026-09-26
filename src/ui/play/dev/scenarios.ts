import { generate } from '../../../engine/generator/index.ts'
import type { Puzzle } from '../../../engine/model/index.ts'
import { puzzle as tutorialWithClues } from '../../../game/fixture.ts'
import { createGameStore, type StorageLike } from '../../../game/index.ts'
import { DEMO_GIFT_CELLS, demoRoomStyles, demoScene } from '../../../content/demo/scene.ts'
import type { FloorPattern } from '../../../render/scene/index.ts'
import { withCastNames } from '../people.ts'

/**
 * Dev data for the play screen: the tutorial (4x4, own fixture with its four clue cards) or a
 * generated 9x9 on the demo house scene. Not shipped: only the dev page imports this.
 */
export type DevLevel = 'tutorial' | 'house'

export type Scenario = 'fresh' | 'notes' | 'placed' | 'wrong' | 'solved'

export interface DevSetup {
  levelId: string
  puzzle: Puzzle
  roomStyles?: Partial<Record<string, FloorPattern>>
}

export function devLevel(level: DevLevel): DevSetup {
  if (level === 'tutorial') return { levelId: 'dev-tutorial', puzzle: tutorialWithClues }
  const puzzle = generate(demoScene, { seed: 3, victimCell: DEMO_GIFT_CELLS[0] })
  return { levelId: 'dev-house', puzzle, roomStyles: demoRoomStyles }
}

export function memoryStorage(): StorageLike {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

/** Saves a mid-game position into `storage`, so the screen opens on it. */
export function seedScenario(setup: DevSetup, scenario: Scenario, storage: StorageLike): void {
  if (scenario === 'fresh') return
  const puzzle = withCastNames(setup.puzzle)
  let clock = 0
  const store = createGameStore({ levelId: setup.levelId, puzzle, storage, now: () => clock })
  const truth = new Map(puzzle.solution.map((p) => [p.personId, p.cell]))
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const place = (id: string) => store.dispatch({ type: 'place', personId: id, cell: truth.get(id)! })

  if (scenario === 'notes' || scenario === 'placed') {
    // candidate notes for the first three suspects on their true row and a few more cells
    for (const p of suspects.slice(0, 3)) {
      const cell = truth.get(p.id)!
      for (let col = 0; col < puzzle.scene.width; col += 2) {
        store.dispatch({ type: 'toggleNote', personId: p.id, cell: { row: cell.row, col } })
      }
      store.dispatch({ type: 'toggleNote', personId: p.id, cell })
    }
    for (const p of suspects.slice(3)) {
      const cell = truth.get(p.id)!
      store.dispatch({ type: 'toggleNote', personId: p.id, cell })
      store.dispatch({ type: 'toggleMark', personId: p.id, cell: { row: (cell.row + 1) % puzzle.scene.height, col: cell.col } })
    }
  }
  if (scenario === 'placed') {
    for (const p of suspects.slice(-3)) place(p.id)
  }
  if (scenario === 'wrong' || scenario === 'solved') {
    clock = 83_000
    // wrong: the last two suspects swap squares, so everybody is placed but two are off
    const [a, b] = suspects.slice(-2) as [(typeof suspects)[number], (typeof suspects)[number]]
    const swapped = scenario === 'wrong'
    for (const p of puzzle.people) {
      if (swapped && p.id === a.id) store.dispatch({ type: 'place', personId: a.id, cell: truth.get(b.id)! })
      else if (swapped && p.id === b.id) store.dispatch({ type: 'place', personId: b.id, cell: truth.get(a.id)! })
      else place(p.id)
    }
  }
}


