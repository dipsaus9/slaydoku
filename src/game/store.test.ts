import { describe, expect, it } from 'vitest'
import { at, puzzle } from './fixture.ts'
import { loadOptions, saveKey } from './persistence.ts'
import type { StorageLike } from './persistence.ts'
import { createGameStore } from './store.ts'

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

function setup(storage: (StorageLike & { data: Map<string, string> }) | null = memory()) {
  let clock = 1000
  const store = createGameStore({ levelId: 'lvl', puzzle, storage, now: () => clock })
  return { store, storage, advance: (ms: number) => void (clock += ms) }
}

describe('game store', () => {
  it('starts the clock, plays, notifies and saves after every change', () => {
    const { store, storage, advance } = setup()
    let calls = 0
    const off = store.subscribe(() => calls++)
    advance(500)
    store.dispatch({ type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } })
    expect(calls).toBe(1)
    expect(store.getState().board.notes).toEqual({ '1,1': ['A'] })
    expect(storage?.data.get(saveKey('lvl'))).toContain('"1,1"')
    expect(store.elapsed()).toBe(500)
    off()
    store.dispatch({ type: 'undo' })
    expect(calls).toBe(1)
  })

  it('does not notify or save for a no-op', () => {
    const { store, storage } = setup()
    let calls = 0
    store.subscribe(() => calls++)
    store.dispatch({ type: 'undo' })
    store.dispatch({ type: 'toggleNote', personId: 'A', cell: { row: 0, col: 2 } }) // blocked
    expect(calls).toBe(0)
    expect(storage?.data.size).toBe(0)
  })

  it('resumes a saved level, clock included', () => {
    const first = setup()
    first.advance(2000)
    first.store.dispatch({ type: 'place', personId: 'A', cell: at.A })
    const second = createGameStore({ levelId: 'lvl', puzzle, storage: first.storage, now: () => 50_000 })
    expect(second.getState().board.placements).toEqual({ A: at.A })
    expect(second.elapsed()).toBe(2000)
  })

  it('starts empty on a puzzle that changed under the same level id, and then replaces the old save', () => {
    const first = setup()
    first.store.dispatch({ type: 'place', personId: 'A', cell: at.A })
    const changed = { ...puzzle, clues: puzzle.clues.slice(1) }
    const second = createGameStore({ levelId: 'lvl', puzzle: changed, storage: first.storage, now: () => 50_000 })
    expect(second.getState().board.placements).toEqual({})
    expect(second.elapsed()).toBe(0)
    // the old save is overwritten by the first move on the changed puzzle, so the old board can not come back
    second.dispatch({ type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } })
    const third = createGameStore({ levelId: 'lvl', puzzle, storage: first.storage, now: () => 60_000 })
    expect(third.getState().board.placements).toEqual({})
  })

  it('freezes the time when solved and reports the check', () => {
    const { store, advance } = setup()
    for (const p of ['V', 'A', 'C'] as const) store.dispatch({ type: 'place', personId: p, cell: at[p] })
    advance(7000)
    store.dispatch({ type: 'place', personId: 'B', cell: at.B })
    expect(store.getState().check).toEqual({ solved: true, murdererId: 'A', elapsedMs: 7000 })
    advance(10_000)
    expect(store.elapsed()).toBe(7000)
  })

  it('saves options globally and reads them at the next start', () => {
    const { store, storage } = setup()
    store.dispatch({ type: 'setOption', option: 'autoXOnPlace', value: false })
    expect(loadOptions(storage).autoXOnPlace).toBe(false)
    const again = createGameStore({ levelId: 'other', puzzle, storage, now: () => 0 })
    expect(again.getState().options.autoXOnPlace).toBe(false)
  })

  it('offers hints for the current state', () => {
    const { store } = setup()
    expect(store.hint(1)?.level).toBe(1)
    expect(store.hint(3)).toHaveProperty('explanation')
  })

  it('works without any storage', () => {
    const { store } = setup(null)
    store.dispatch({ type: 'place', personId: 'A', cell: at.A })
    expect(store.getState().board.placements).toEqual({ A: at.A })
  })

  it('pause and resume drive the clock', () => {
    const { store, advance } = setup()
    advance(300)
    store.dispatch({ type: 'pause' })
    advance(5000)
    expect(store.elapsed()).toBe(300)
    store.dispatch({ type: 'resume' })
    advance(100)
    expect(store.elapsed()).toBe(400)
  })
})
