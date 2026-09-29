import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from './memoryStorage.ts'
import type { StorageLike } from './persistence.ts'
import { recordPuzzleSolve, recordPuzzleStart } from './playCounters.ts'

function recorder() {
  const calls: { name: string; properties?: Record<string, string | number> }[] = []
  return { calls, capture: (name: string, properties?: Record<string, string | number>) => void calls.push({ name, properties }) }
}

const angry: StorageLike = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {},
}

describe('recordPuzzleStart', () => {
  it('captures one puzzle_start event with the day', () => {
    const storage = createMemoryStorage()
    const { calls, capture } = recorder()
    recordPuzzleStart(storage, '2026-09-28', capture)
    expect(calls).toEqual([{ name: 'puzzle_start', properties: { day: '2026-09-28' } }])
  })

  it('never sends a second start for the same day (a reload or revisit)', () => {
    const storage = createMemoryStorage()
    const { calls, capture } = recorder()
    recordPuzzleStart(storage, '2026-09-28', capture)
    recordPuzzleStart(storage, '2026-09-28', capture)
    recordPuzzleStart(storage, '2026-09-28', capture)
    expect(calls).toHaveLength(1)
  })

  it('sends a fresh start for a different day', () => {
    const storage = createMemoryStorage()
    const { calls, capture } = recorder()
    recordPuzzleStart(storage, '2026-09-28', capture)
    recordPuzzleStart(storage, '2026-09-29', capture)
    expect(calls.map((c) => c.properties?.day)).toEqual(['2026-09-28', '2026-09-29'])
  })

  it('no storage, or storage that throws: never throws, and still counts the play (dedup just cannot be trusted)', () => {
    const { calls: noneCalls, capture: noneCapture } = recorder()
    expect(() => recordPuzzleStart(null, '2026-09-28', noneCapture)).not.toThrow()
    expect(noneCalls).toEqual([{ name: 'puzzle_start', properties: { day: '2026-09-28' } }])

    const { calls: angryCalls, capture: angryCapture } = recorder()
    expect(() => recordPuzzleStart(angry, '2026-09-28', angryCapture)).not.toThrow()
    expect(angryCalls).toEqual([{ name: 'puzzle_start', properties: { day: '2026-09-28' } }])
  })
})

describe('recordPuzzleSolve', () => {
  it('captures one puzzle_solve event with the day and the elapsed time', () => {
    const storage = createMemoryStorage()
    const { calls, capture } = recorder()
    recordPuzzleSolve(storage, '2026-09-28', 754000, capture)
    expect(calls).toEqual([{ name: 'puzzle_solve', properties: { day: '2026-09-28', elapsedMs: 754000 } }])
  })

  it('never sends a second solve for the same day', () => {
    const storage = createMemoryStorage()
    const { calls, capture } = recorder()
    recordPuzzleSolve(storage, '2026-09-28', 754000, capture)
    recordPuzzleSolve(storage, '2026-09-28', 999000, capture)
    expect(calls).toHaveLength(1)
  })

  it('start and solve are independent flags: solving does not block a later start marker, or vice versa', () => {
    const storage = createMemoryStorage()
    const { calls, capture } = recorder()
    recordPuzzleStart(storage, '2026-09-28', capture)
    recordPuzzleSolve(storage, '2026-09-28', 754000, capture)
    expect(calls.map((c) => c.name)).toEqual(['puzzle_start', 'puzzle_solve'])
  })

  it('no storage, or storage that throws: never throws, and still counts the solve (dedup just cannot be trusted)', () => {
    const { calls: noneCalls, capture: noneCapture } = recorder()
    expect(() => recordPuzzleSolve(null, '2026-09-28', 1000, noneCapture)).not.toThrow()
    expect(noneCalls).toEqual([{ name: 'puzzle_solve', properties: { day: '2026-09-28', elapsedMs: 1000 } }])
    expect(() => recordPuzzleSolve(angry, '2026-09-28', 1000, () => {})).not.toThrow()
  })
})
