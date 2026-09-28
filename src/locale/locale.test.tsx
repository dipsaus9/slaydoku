import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from './LocaleProvider.tsx'
import { LOCALE_KEY, browserLocale, readLocale, writeLocale } from './storage.ts'
import type { StorageLike } from './storage.ts'
import { useLocale } from './useLocale.ts'

const memory = (initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } => {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  }
}

describe('browserLocale', () => {
  it('is nl for a Dutch language tag', () => {
    expect(browserLocale('nl')).toBe('nl')
    expect(browserLocale('nl-NL')).toBe('nl')
    expect(browserLocale('nl-BE')).toBe('nl')
    expect(browserLocale('NL-NL')).toBe('nl')
  })

  it('is en for anything else, including nothing at all', () => {
    expect(browserLocale('en')).toBe('en')
    expect(browserLocale('en-US')).toBe('en')
    expect(browserLocale('fr')).toBe('en')
    expect(browserLocale(undefined)).toBe('en')
  })
})

describe('readLocale / writeLocale', () => {
  it('round-trips a written locale', () => {
    const storage = memory()
    writeLocale(storage, 'nl')
    expect(readLocale(storage)).toBe('nl')
    expect(storage.data.get(LOCALE_KEY)).toBe('nl')
  })

  it('reads null when nothing is stored, storage is missing, or the value is unusable', () => {
    expect(readLocale(memory())).toBeNull()
    expect(readLocale(null)).toBeNull()
    expect(readLocale(memory({ [LOCALE_KEY]: 'fr' }))).toBeNull()
  })

  it('does nothing (never throws) when storage is null or refuses', () => {
    expect(() => writeLocale(null, 'nl')).not.toThrow()
    const refusing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('full disk')
      },
    }
    expect(() => writeLocale(refusing, 'nl')).not.toThrow()
  })
})

function Probe() {
  const { locale } = useLocale()
  return <span data-locale={locale}>{locale}</span>
}

const render = (over: Partial<Parameters<typeof LocaleProvider>[0]> = {}) =>
  renderToStaticMarkup(
    <LocaleProvider storage={null} {...over}>
      <Probe />
    </LocaleProvider>,
  )

describe('<LocaleProvider/>', () => {
  it('defaults to nl for a Dutch browser language', () => {
    expect(render({ browserLanguage: 'nl-NL' })).toContain('data-locale="nl"')
  })

  it('defaults to en for anything else', () => {
    expect(render({ browserLanguage: 'en-US' })).toContain('data-locale="en"')
  })

  it('a stored locale wins over the browser language', () => {
    const storage = memory({ [LOCALE_KEY]: 'nl' })
    expect(render({ storage, browserLanguage: 'en-US' })).toContain('data-locale="nl"')
  })

  it('useLocale() falls back to the browser/stored default, and never throws, outside a LocaleProvider', () => {
    expect(() => renderToStaticMarkup(<Probe />)).not.toThrow()
  })
})
