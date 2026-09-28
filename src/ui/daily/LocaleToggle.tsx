import { useLocale } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'

const OPTIONS: readonly Locale[] = ['en', 'nl']
const LABEL: Record<Locale, string> = { en: 'EN', nl: 'NL' }

/**
 * Switches the app's language. Nothing downstream reads the locale yet (SLAY-3.1 is pure plumbing);
 * later stories make the daily/play screens consume `useLocale()`.
 */
export function LocaleToggle() {
  const { locale, setLocale } = useLocale()
  return (
    <div className="daily__locale" role="group" aria-label="Language">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className="daily-btn daily-btn--quiet daily__locale-option"
          aria-pressed={locale === option}
          data-locale-option={option}
          onClick={() => setLocale(option)}
        >
          {LABEL[option]}
        </button>
      ))}
    </div>
  )
}
