import { describe, expect, it } from 'vitest'
import type { StorageLike } from '../../game/index.ts'
import { AXIS_LABELS_KEY, loadAxisLabels, saveAxisLabels } from './axisLabels.ts'

function memory(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

describe('axis labels setting', () => {
  it('defaults to on without storage or a saved value', () => {
    expect(loadAxisLabels(null)).toBe(true)
    expect(loadAxisLabels(memory())).toBe(true)
  })

  it('round-trips through storage', () => {
    const storage = memory()
    expect(saveAxisLabels(storage, false)).toBe(true)
    expect(loadAxisLabels(storage)).toBe(false)
    saveAxisLabels(storage, true)
    expect(loadAxisLabels(storage)).toBe(true)
  })

  it('falls back to on for corrupt or non-boolean values', () => {
    expect(loadAxisLabels(memory({ [AXIS_LABELS_KEY]: '{oops' }))).toBe(true)
    expect(loadAxisLabels(memory({ [AXIS_LABELS_KEY]: '"no"' }))).toBe(true)
  })

  it('survives a storage that throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {},
    }
    expect(loadAxisLabels(broken)).toBe(true)
    expect(saveAxisLabels(broken, false)).toBe(false)
  })

  it('saveAxisLabels reports false without storage', () => {
    expect(saveAxisLabels(null, false)).toBe(false)
  })
})
