import { createContext } from 'react'
import { browserLocale, defaultStorage, readLocale, writeLocale } from './storage.ts'
import type { Locale } from './types.ts'

export interface LocaleContextValue {
  locale: Locale
  /** Switches the locale and persists the choice immediately. */
  setLocale: (locale: Locale) => void
}

/**
 * Used only when `useLocale()` is called with no `LocaleProvider` ancestor — a coding slip in the
 * real app (App.tsx always wraps the game), but a normal thing for a component rendered on its own
 * (a story, an isolated test). Reads whatever is already stored, defaulting from the browser
 * language, and its setter still persists — it just cannot re-render anything, since there is no
 * provider state to update.
 */
function fallbackValue(): LocaleContextValue {
  const storage = defaultStorage()
  const locale = readLocale(storage) ?? browserLocale(typeof navigator === 'undefined' ? undefined : navigator.language)
  return { locale, setLocale: (next) => writeLocale(storage, next) }
}

/** Split from `LocaleProvider.tsx`/`useLocale.ts` (react/only-export-components): a context/hook/component each get their own file. */
export const LocaleContext = createContext<LocaleContextValue>(fallbackValue())
