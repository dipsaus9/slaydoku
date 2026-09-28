import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LocaleContext } from './context.ts'
import type { LocaleContextValue } from './context.ts'
import { browserLocale, defaultStorage, readLocale, writeLocale } from './storage.ts'
import type { StorageLike } from './storage.ts'
import type { Locale } from './types.ts'

export interface LocaleProviderProps {
  children: ReactNode
  /** Where the choice is persisted. Default localStorage, or memory (nothing survives reload) when there is none. Pass `null` to disable persistence, e.g. in tests. */
  storage?: StorageLike | null
  /** The browser's language string used for the default when nothing is stored yet. Default: `navigator.language`. */
  browserLanguage?: string
}

/**
 * Supplies the current `Locale` and its setter to everything under it. The default, when nothing is
 * stored yet, is 'nl' for a Dutch browser language and 'en' otherwise; a stored choice always wins.
 */
export function LocaleProvider({ children, storage: givenStorage, browserLanguage }: LocaleProviderProps) {
  const storage = useMemo(() => (givenStorage === undefined ? defaultStorage() : givenStorage), [givenStorage])
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = readLocale(storage)
    if (stored) return stored
    const language = browserLanguage ?? (typeof navigator === 'undefined' ? undefined : navigator.language)
    return browserLocale(language)
  })
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        setLocaleState(next)
        writeLocale(storage, next)
      },
    }),
    [locale, storage],
  )
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
