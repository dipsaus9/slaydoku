import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { AboutScreen } from './AboutScreen.tsx'
import { ABOUT_PATH, isAboutPath } from './route.ts'
import { ABOUT_STRINGS } from './strings.ts'

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const render = (locale: Locale) =>
  renderToStaticMarkup(
    <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
      <AboutScreen />
    </LocaleProvider>,
  )

describe('isAboutPath', () => {
  it('matches /about, with or without a trailing slash', () => {
    expect(ABOUT_PATH).toBe('/about')
    expect(isAboutPath('/about')).toBe(true)
    expect(isAboutPath('/about/')).toBe(true)
  })

  it('matches no other path', () => {
    for (const path of ['/', '', '/level/demo', '/about/us', '/aboutus', '/lab', '/level/about', '/%E0%A4%A']) expect(isAboutPath(path), path).toBe(false)
  })
})

describe.each(['en', 'nl'] as const)('<AboutScreen/> (%s)', (locale) => {
  const t = ABOUT_STRINGS[locale]
  const html = render(locale)

  it('explains how it works in four short lines', () => {
    expect(t.how.lines).toHaveLength(4)
    for (const line of t.how.lines) expect(html).toContain(line)
  })

  it('credits Murdoku and says the puzzles are original', () => {
    expect(html).toContain(t.credit.inspired)
    expect(html).toContain(t.credit.original)
  })

  it('says everything stays on the device', () => {
    expect(html).toContain(t.privacy.text)
  })

  it('names the license', () => {
    expect(html).toContain(t.openSource.text)
  })

  it('links back to the puzzles with a real href, and shows the tagline', () => {
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*class="about__back"|<a[^>]*class="about__back"[^>]*href="\/"/)
    expect(html).toContain(t.tagline)
  })

  it('has one h1, one main landmark and labelled sections', () => {
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html.match(/<main/g)).toHaveLength(1)
    expect(html.match(/<section[^>]*aria-labelledby=/g)).toHaveLength(4)
  })

  it('shows every section title and the back link text', () => {
    const text = strip(html)
    expect(text).toContain(t.title)
    expect(text).toContain(t.how.title)
    expect(text).toContain(t.credit.title)
    expect(text).toContain(t.privacy.title)
    expect(text).toContain(t.openSource.title)
    expect(text).toContain(t.back)
  })
})
