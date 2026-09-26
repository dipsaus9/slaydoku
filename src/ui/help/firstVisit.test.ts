import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../levels/progress.ts'
import { HELP_SEEN_KEY, markHelpSeen, shouldShowHelp } from './firstVisit.ts'

describe('first visit of the how-it-works card', () => {
  it('shows on a fresh storage, then never again for that version', () => {
    const storage = createMemoryStorage()
    expect(shouldShowHelp(storage, 1)).toBe(true)
    markHelpSeen(storage, 1)
    expect(shouldShowHelp(storage, 1)).toBe(false)
  })

  it('shows once more after the version is raised', () => {
    const storage = createMemoryStorage()
    markHelpSeen(storage, 1)
    expect(shouldShowHelp(storage, 2)).toBe(true)
    markHelpSeen(storage, 2)
    expect(shouldShowHelp(storage, 2)).toBe(false)
  })

  it('skips an unreadable value and shows again for a wrong-typed version', () => {
    const storage = createMemoryStorage()
    storage.setItem(HELP_SEEN_KEY, '{nope')
    expect(shouldShowHelp(storage, 1)).toBe(false) // unreadable: skipped, not nagged
    storage.setItem(HELP_SEEN_KEY, '{"version":"x"}')
    expect(shouldShowHelp(storage, 1)).toBe(true)
  })

  it('is silently skipped without storage or with storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
      removeItem: () => {},
    }
    expect(shouldShowHelp(null, 1)).toBe(false)
    expect(shouldShowHelp(broken, 1)).toBe(false)
    expect(() => markHelpSeen(null, 1)).not.toThrow()
    expect(() => markHelpSeen(broken, 1)).not.toThrow()
  })
})
