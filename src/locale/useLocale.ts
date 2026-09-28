import { useContext } from 'react'
import { LocaleContext } from './context.ts'
import type { LocaleContextValue } from './context.ts'

/**
 * The current locale and its setter. Normally read under a `LocaleProvider` (App.tsx wraps the
 * whole game in one); outside one it falls back to whatever is already stored or the browser's
 * language, so a component that uses it can still be rendered on its own.
 */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}
