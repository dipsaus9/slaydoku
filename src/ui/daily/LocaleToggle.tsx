import { useLocale } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
// Owns its `daily__locale`/`daily-btn` styling itself (this file's own CSS), so it renders the
// same wherever it is mounted -- the start screen (StartScreen.tsx) or, since SLAY-9.4, the play
// screen's Options modal (OptionsPanel.tsx) -- without either host having to remember to import
// daily.css. A duplicate import across hosts is a no-op: the bundler loads a CSS file once.
import './daily.css'

const OPTIONS: readonly Locale[] = ['en', 'nl']
const LABEL: Record<Locale, string> = { en: 'EN', nl: 'NL' }

/**
 * Switches the app's language. Consumed by the start screen (StartScreen.tsx) and, since SLAY-9.4,
 * the play screen's Options modal (OptionsPanel.tsx) so a player can switch mid-puzzle too.
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
