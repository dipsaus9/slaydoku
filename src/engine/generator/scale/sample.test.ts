import { describe, expect, it } from 'vitest'
import type { ClueCandidate } from '../pool.ts'
import { Rng } from '../rng.ts'
import { PER_KIND_CAP, samplePool } from './sample.ts'

const candidate = (personId: string, type: string, n: number): ClueCandidate =>
  ({ clue: { personId, type, args: { n } } as never, holder: 0 })

describe('samplePool', () => {
  const pool = [
    ...Array.from({ length: 100 }, (_, n) => candidate('A', 'directionOf', n)),
    ...Array.from({ length: 100 }, (_, n) => candidate('B', 'directionOf', n)),
    ...Array.from({ length: 3 }, (_, n) => candidate('A', 'inRoom', n)),
  ]

  it('caps every (holder, kind) and keeps every kind represented for every holder', () => {
    const sampled = samplePool(pool, new Rng(1))
    const count = (id: string, type: string) => sampled.filter((c) => c.clue.personId === id && c.clue.type === type).length
    expect(count('A', 'directionOf')).toBe(PER_KIND_CAP)
    expect(count('B', 'directionOf')).toBe(PER_KIND_CAP)
    expect(count('A', 'inRoom')).toBe(3)
  })

  it('leaves small pools untouched and keeps the original order', () => {
    const small = pool.slice(0, 10)
    expect(samplePool(small, new Rng(1))).toEqual(small)
    const sampled = samplePool(pool, new Rng(2))
    const positions = sampled.map((c) => pool.indexOf(c))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('is deterministic per seed and varies between seeds', () => {
    expect(samplePool(pool, new Rng(5))).toEqual(samplePool(pool, new Rng(5)))
    expect(samplePool(pool, new Rng(5))).not.toEqual(samplePool(pool, new Rng(6)))
  })

  it('honours an explicit cap', () => {
    expect(samplePool(pool, new Rng(1), 5).filter((c) => c.clue.personId === 'B')).toHaveLength(5)
  })
})
