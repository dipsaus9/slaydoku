import { describe, expect, it } from 'vitest'
import { Rng } from './rng.ts'

describe('Rng', () => {
  it('repeats the same sequence for the same seed and differs for another', () => {
    const a = Array.from({ length: 8 }, ((r) => () => r.next())(new Rng(42)))
    const b = Array.from({ length: 8 }, ((r) => () => r.next())(new Rng(42)))
    const c = Array.from({ length: 8 }, ((r) => () => r.next())(new Rng(43)))
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  it('keeps floats in [0,1) and ints in range', () => {
    const rng = new Rng(7)
    for (let i = 0; i < 500; i++) {
      const f = rng.next()
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1)
      expect(rng.int(5)).toBeLessThan(5)
    }
  })

  it('shuffles without losing or inventing items, leaving the input alone', () => {
    const rng = new Rng(3)
    const input = [1, 2, 3, 4, 5, 6]
    const out = rng.shuffle(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6])
    expect([...out].sort()).toEqual(input)
  })
})
