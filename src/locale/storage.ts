import type { Locale } from './types.ts'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** Where the chosen locale lives in localStorage. Same key-naming and guarded-access pattern as `slaydoku:help-seen` and `slaydoku:daily-results`. */
export const LOCALE_KEY = 'slaydoku:locale'

/** localStorage when the browser hands it out (it can throw or be missing), else null. */
export function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** 'nl' when the browser's language starts with 'nl' (nl, nl-NL, nl-BE, ...), else 'en'. */
export function browserLocale(language: string | undefined): Locale {
  return typeof language === 'string' && language.toLowerCase().startsWith('nl') ? 'nl' : 'en'
}

const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'nl'

/** Reads the stored locale back. Null for no storage, nothing stored, or an unusable value. */
export function readLocale(storage: StorageLike | null): Locale | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(LOCALE_KEY)
    return isLocale(raw) ? raw : null
  } catch {
    return null
  }
}

/** Writes the chosen locale. Silently does nothing when storage refuses (private mode, a full disk). */
export function writeLocale(storage: StorageLike | null, locale: Locale): void {
  if (!storage) return
  try {
    storage.setItem(LOCALE_KEY, locale)
  } catch {
    // The choice just resets next time; nothing to recover here.
  }
}

/** Where the chosen object look lives (SLAY-17.8 preview only). Same pattern as the language. */
export const LOOK_KEY = 'slaydoku:look'

/** Reads the stored look back ('now' | 'a2' | 'a3'). Null for no storage, nothing stored, or an unusable value. */
export function readLook(storage: StorageLike | null): 'now' | 'a2' | 'a3' | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(LOOK_KEY)
    return raw === 'now' || raw === 'a2' || raw === 'a3' ? raw : null
  } catch {
    return null
  }
}

/** Writes the chosen look. Silently does nothing when storage refuses. */
export function writeLook(storage: StorageLike | null, look: 'now' | 'a2' | 'a3'): void {
  if (!storage) return
  try {
    storage.setItem(LOOK_KEY, look)
  } catch {
    // The choice just resets next time.
  }
}
