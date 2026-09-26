import { describe, expect, it } from 'vitest'
import { checkCompletion, resultMessage } from './check.ts'
import { at, puzzle } from './fixture.ts'
import { elapsedMs, initialState, reduce } from './reducer.ts'
import type { GameAction, GameState } from './types.ts'

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce((s, a) => reduce(puzzle, s, a), state)
const place = (personId: string, cell: { row: number; col: number }): GameAction => ({ type: 'place', personId, cell })
const start = () => run(initialState(), { type: 'resume', at: 1000 })

describe('checkCompletion', () => {
  it('says nothing until everybody is placed', () => {
    expect(checkCompletion(puzzle, { notes: {}, marks: {}, placements: { A: at.A } }, 0)).toBeNull()
    expect(checkCompletion(puzzle, { notes: {}, marks: {}, placements: {} }, 0)).toBeNull()
  })

  it('reports solved with the murderer (alone with the gift) and the time', () => {
    const placements = { V: at.V, A: at.A, B: at.B, C: at.C }
    expect(checkCompletion(puzzle, { notes: {}, marks: {}, placements }, 4200)).toEqual({
      solved: true,
      murdererId: 'A',
      elapsedMs: 4200,
    })
  })

  it('reports only the count when wrong, with no per-person detail', () => {
    // B and C swapped rows: V and A right, B and C wrong.
    const placements = { V: at.V, A: at.A, B: { row: 3, col: 3 }, C: { row: 2, col: 1 } }
    const result = checkCompletion(puzzle, { notes: {}, marks: {}, placements }, 1)
    expect(result).toEqual({ solved: false, correctCount: 2, total: 4 })
    expect(Object.keys(result as object).sort()).toEqual(['correctCount', 'solved', 'total'])
  })

  it('accepts another answer that satisfies every card (a puzzle with two solutions)', () => {
    // Only A and the gift card are left, so B and C are free to swap: both arrangements are valid answers.
    const loose = { ...puzzle, clues: puzzle.clues.filter((c) => c.personId === 'A' || c.type === 'aloneWithMurderer') }
    const swapped = { V: at.V, A: at.A, B: at.C, C: at.B }
    expect(checkCompletion(loose, { notes: {}, marks: {}, placements: swapped }, 900)).toEqual({ solved: true, murdererId: 'A', elapsedMs: 900 })
    // With all four cards the same swap breaks a card, so it stays wrong.
    expect(checkCompletion(puzzle, { notes: {}, marks: {}, placements: swapped }, 900)).toEqual({ solved: false, correctCount: 2, total: 4 })
  })

  it('counts zero when everything is wrong', () => {
    const placements = { V: at.A, A: at.V, B: at.C, C: at.B }
    expect(checkCompletion(puzzle, { notes: {}, marks: {}, placements }, 1)).toEqual({
      solved: false,
      correctCount: 0,
      total: 4,
    })
  })
})

describe('auto-check in the reducer', () => {
  it('solves on the last correct placement, freezes the clock and locks the grid', () => {
    let s = start()
    s = run(s, place('V', at.V), place('A', at.A), place('C', at.C))
    expect(s.check).toBeNull()
    s = run(s, { ...place('B', at.B), at: 6000 })
    expect(s.status).toBe('solved')
    expect(s.check).toEqual({ solved: true, murdererId: 'A', elapsedMs: 5000 })
    expect(elapsedMs(s, 99999)).toBe(5000)
    expect(run(s, { type: 'remove', personId: 'A' })).toBe(s)
    expect(run(s, { type: 'undo' })).toBe(s)
  })

  it('reports wrong once, keeps playing, and clears the report when a person is lifted', () => {
    let s = start()
    s = run(s, place('V', at.V), place('A', at.A), place('C', at.C), place('B', { row: 3, col: 0 }))
    expect(s.status).toBe('playing')
    expect(s.check).toEqual({ solved: false, correctCount: 3, total: 4 })
    s = run(s, { type: 'remove', personId: 'B' })
    expect(s.check).toBeNull()
    s = run(s, place('B', at.B))
    expect(s.check?.solved).toBe(true)
  })

  it('undo out of a wrong report clears it', () => {
    let s = start()
    s = run(s, place('V', at.V), place('A', at.A), place('C', at.C), place('B', { row: 3, col: 0 }))
    expect(run(s, { type: 'undo' }).check).toBeNull()
  })

  it('restart unlocks a solved level', () => {
    let s = start()
    s = run(s, place('V', at.V), place('A', at.A), place('C', at.C), place('B', at.B))
    const again = run(s, { type: 'restart', at: 10 })
    expect(again.status).toBe('playing')
    expect(again.check).toBeNull()
  })
})

describe('resultMessage', () => {
  it('words the gift, not a victim', () => {
    const win = resultMessage(puzzle, { solved: true, murdererId: 'A', elapsedMs: 1 })
    expect(win).toContain('het cadeau')
    expect(win).toContain('A')
    expect(win.toLowerCase()).not.toContain('slachtoffer')
    expect(resultMessage(puzzle, { solved: false, correctCount: 2, total: 4 })).toContain('2 van 4')
  })
})

describe('resultMessage wording', () => {
  const gifted = { ...puzzle, people: puzzle.people.map((p) => (p.kind === 'victim' ? { ...p, label: 'het cadeau' } : p)) }

  it('says the gift once, never "het cadeau (het cadeau)", whatever the victim is labelled', () => {
    for (const p of [puzzle, gifted]) {
      const win = resultMessage(p, { solved: true, murdererId: 'A', elapsedMs: 1 })
      expect(win).toBe('Je hebt de dader gevonden! A was alleen met het cadeau.')
      expect(win).not.toContain('(')
    }
  })

  it('names the murderer by label', () => {
    const named = { ...puzzle, people: puzzle.people.map((p) => (p.id === 'A' ? { ...p, label: 'Alice' } : p)) }
    expect(resultMessage(named, { solved: true, murdererId: 'A', elapsedMs: 1 })).toBe(
      'Je hebt de dader gevonden! Alice was alleen met het cadeau.',
    )
  })
})
