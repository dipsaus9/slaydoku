import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { puzzle as tutorial } from '../../game/fixture.ts'
import { HELP_CONTENT, help } from '../../content/help/help.ts'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { LegendPanel } from './LegendPanel.tsx'
import { castFor, colorsFor, noteTags } from './people.ts'

/** The browser language `LocaleProvider` defaults from, per `Locale` (SLAY-3.4), same mapping every other test uses. */
const BROWSER_LANGUAGE: Record<Locale, string> = { en: 'en-US', nl: 'nl-NL' }
const withLocale = (locale: Locale, children: ReactNode) => (
  <LocaleProvider storage={null} browserLanguage={BROWSER_LANGUAGE[locale]}>
    {children}
  </LocaleProvider>
)

const props = {
  puzzle: tutorial,
  cast: castFor(tutorial),
  tags: noteTags(tutorial.people),
  colors: colorsFor(tutorial.people),
  onShow: () => {},
  peek: false,
  onClose: () => {},
}

describe('<LegendPanel/> (SLAY-9.4)', () => {
  it.each(['en', 'nl'] as const)('shows the modal title and close button in the active locale (%s), not the English fallback', (locale) => {
    const html = renderToStaticMarkup(withLocale(locale, <LegendPanel {...props} />))
    const t = HELP_CONTENT[locale].legend
    expect(html).toContain(t.title)
    expect(html).toContain(t.close)
  })

  it('renders different title/close text for nl than the hardcoded English fallback (regression: these used to come from a static, English-only import)', () => {
    const nl = renderToStaticMarkup(withLocale('nl', <LegendPanel {...props} />))
    // Exact tag-boundary match: "Legenda" (nl) starts with "Legend" (en), so a plain substring
    // check would pass even on the un-fixed, English-only render.
    expect(nl).toContain(`>${HELP_CONTENT.nl.legend.title}<`)
    expect(nl).not.toContain(`>${help.legend.title}<`)
    expect(nl).toContain(HELP_CONTENT.nl.legend.close)
    expect(nl).not.toContain(help.legend.close)
  })
})
