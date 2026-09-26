import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { at, puzzle } from '../../game/fixture.ts'
import { createGameStore, isPlaced } from '../../game/index.ts'
import type { Hint } from '../../game/index.ts'
import { hardPuzzle } from '../../game/hints.fixture.ts'
import { HintBar } from './HintBar.tsx'

const noop = () => {}
const bar = (level: 1 | 2 | 3, hint: Hint | null) =>
  renderToStaticMarkup(<HintBar level={level} hint={hint} onMore={noop} onClose={noop} onPlace={noop} />)

/** A store on the tutorial: its first hint places somebody. */
function firstPlacement() {
  const store = createGameStore({ levelId: 'test', puzzle, storage: null, now: () => 0 })
  const hint = store.hint(3)
  if (hint?.level !== 3 || !hint.placement) throw new Error('no placement hint')
  return { store, hint }
}

/** The text as it appears in the markup (quotes and apostrophes are escaped). */
const inMarkup = (text: string): string => text.replaceAll('"', '&quot;').replaceAll("'", '&#x27;')

describe('<HintBar/>', () => {
  it('offers "Plaats voor mij" only on level 3 of a placement', () => {
    const { store, hint } = firstPlacement()
    expect(bar(3, hint)).toContain('Plaats voor mij')
    expect(bar(3, hint)).toContain(inMarkup(hint.text))
    for (const level of [1, 2] as const) {
      const lower = store.hint(level)
      expect(bar(level, lower)).not.toContain('Plaats voor mij')
      expect(bar(level, lower)).toContain('Meer hulp')
    }
  })

  it('has no place button when level 3 asks for a note on the possible squares', { timeout: 60_000 }, () => {
    const store = createGameStore({ levelId: 'test', puzzle: hardPuzzle(), storage: null, now: () => 0 })
    const hint = store.hint(3)
    expect(hint?.level === 3 && hint.instruction).toMatch(/^Note squares for /)
    expect(hint?.level === 3 && hint.placement).toBeFalsy()
    expect(bar(3, hint)).not.toContain('Plaats voor mij')
  })

  it('shows no technique name', () => {
    const hint = createGameStore({ levelId: 'test', puzzle, storage: null, now: () => 0 }).hint(3)
    if (hint?.level !== 3) throw new Error('level')
    expect(hint.technique.title).not.toBe('')
    expect(bar(3, hint)).not.toContain(hint.technique.title)
    expect(bar(3, hint)).not.toContain('Denkwijze')
  })

  it('the place action puts the person on the hinted square and undo takes them off again', () => {
    const { store, hint } = firstPlacement()
    const { personId, cell } = hint.placement!
    expect(cell).toEqual(at[personId as keyof typeof at])
    const before = store.getState().board
    store.dispatch({ type: 'place', personId, cell })
    expect(isPlaced(store.getState().board, personId)).toBe(true)
    store.dispatch({ type: 'undo' })
    expect(store.getState().board).toEqual(before)
  })
})
