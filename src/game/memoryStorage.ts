import { defaultStorage } from './persistence.ts'
import type { StorageLike } from './persistence.ts'

/** Storage that lives as long as the page: for tests and for browsers that hand out no localStorage. */
export function createMemoryStorage(): StorageLike {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, String(value)),
    removeItem: (key) => void data.delete(key),
  }
}

/** localStorage when available, else an in-memory stand-in (what is saved then lasts until reload). */
export function progressStorage(): StorageLike {
  return defaultStorage() ?? createMemoryStorage()
}
