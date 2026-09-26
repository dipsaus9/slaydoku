import { describe, expect, it } from 'vitest'
import { DEFAULT_BUDGET_MS, Deadline } from './budget.ts'

describe('Deadline', () => {
  it('counts down on the injected clock and expires exactly at the budget', () => {
    let now = 1000
    const deadline = new Deadline(500, () => now)
    expect(deadline.expired()).toBe(false)
    expect(deadline.remainingMs()).toBe(500)
    now = 1499
    expect(deadline.expired()).toBe(false)
    now = 1500
    expect(deadline.expired()).toBe(true)
    expect(deadline.elapsedMs()).toBe(500)
    expect(deadline.remainingMs()).toBe(0)
  })

  it('documents a 60 second default ceiling', () => {
    expect(DEFAULT_BUDGET_MS).toBe(60_000)
  })
})
