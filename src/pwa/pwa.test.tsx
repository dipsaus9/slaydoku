import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../locale/index.ts'
import { UpdateNotice } from './UpdateNotice.tsx'
import { startOfflineSupport } from './register.ts'
import { UPDATE_STRINGS } from './strings.ts'
import type { ContainerLike, Updater } from './updater.ts'

const updaterWith = (waiting: boolean): Updater => ({
  start: () => Promise.resolve(),
  check: () => {},
  apply: () => {},
  subscribe: () => () => {},
  getSnapshot: () => waiting,
})

describe.each(['en', 'nl'] as const)('UpdateNotice (%s)', (locale) => {
  const t = UPDATE_STRINGS[locale]
  const render = (waiting: boolean) =>
    renderToStaticMarkup(
      <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
        <UpdateNotice updater={updaterWith(waiting)} />
      </LocaleProvider>,
    )

  it('says so in the chosen language, with a reload button, when a new version waits', () => {
    const html = render(true)
    expect(html).toContain(t.available)
    expect(html).toContain(t.reload)
    expect(html).toContain('role="status"')
  })

  it('renders nothing otherwise', () => {
    expect(render(false)).toBe('')
  })
})

describe('startOfflineSupport', () => {
  const container = (): ContainerLike & { register: ReturnType<typeof vi.fn> } => ({
    controller: null,
    register: vi.fn(() => Promise.resolve({ waiting: null, installing: null, addEventListener: () => {}, update: () => Promise.resolve() })),
    addEventListener: () => {},
  })

  it('registers the worker in a production build', () => {
    const c = container()
    const onVisible = vi.fn()
    startOfflineSupport({ production: true, container: c, reload: () => {}, onVisible })
    expect(c.register).toHaveBeenCalledWith('/sw.js')
    expect(onVisible).toHaveBeenCalledTimes(1)
  })

  it('does not register in dev (and so not in the lab, which only exists there)', () => {
    const c = container()
    const onVisible = vi.fn()
    const updater = startOfflineSupport({ production: false, container: c, reload: () => {}, onVisible })
    expect(c.register).not.toHaveBeenCalled()
    expect(onVisible).not.toHaveBeenCalled()
    expect(updater.getSnapshot()).toBe(false)
  })

  it('does nothing in a browser without service workers', () => {
    const onVisible = vi.fn()
    const updater = startOfflineSupport({ production: true, container: undefined, reload: () => {}, onVisible })
    expect(updater.getSnapshot()).toBe(false)
    expect(onVisible).not.toHaveBeenCalled()
  })
})
