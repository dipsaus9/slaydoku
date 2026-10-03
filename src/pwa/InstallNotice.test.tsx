import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../locale/index.ts'
import { InstallNotice } from './InstallNotice.tsx'
import { showsInstallNotice } from './installPath.ts'
import type { InstallPlatform, InstallStore } from './install.ts'
import { INSTALL_STRINGS } from './strings.ts'

const storeWith = (platform: InstallPlatform | null): InstallStore => ({
  subscribe: () => () => {},
  getSnapshot: () => platform,
  install: vi.fn(),
  dismiss: vi.fn(),
})

describe.each(['en', 'nl'] as const)('InstallNotice (%s)', (locale) => {
  const t = INSTALL_STRINGS[locale]
  const render = (platform: InstallPlatform | null) =>
    renderToStaticMarkup(
      <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
        <InstallNotice store={storeWith(platform)} />
      </LocaleProvider>,
    )

  it('offers a one-tap install button on Android', () => {
    const html = render('android')
    expect(html).toContain(t.androidText)
    expect(html).toContain(t.androidInstall)
    expect(html).toContain('role="status"')
    expect(html).toContain('data-install-notice="android"')
  })

  it('explains the manual Share steps on iOS, with no install button', () => {
    const html = render('ios')
    expect(html).toContain(t.iosText)
    expect(html).not.toContain('install-notice__button')
    expect(html).toContain('data-install-notice="ios"')
  })

  it('both variants carry a dismiss control', () => {
    expect(render('android')).toContain(t.dismiss)
    expect(render('ios')).toContain(t.dismiss)
  })

  it('renders nothing when the store offers neither platform', () => {
    expect(render(null)).toBe('')
  })
})

describe('showsInstallNotice', () => {
  it('shows on the start screen and About, never on the puzzle', () => {
    expect(showsInstallNotice('/')).toBe(true)
    expect(showsInstallNotice('/about')).toBe(true)
    expect(showsInstallNotice('/about/')).toBe(true)
    expect(showsInstallNotice('/play')).toBe(false)
    expect(showsInstallNotice('/play/12')).toBe(false)
  })
})
