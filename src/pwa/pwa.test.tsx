import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { UpdateNotice } from './UpdateNotice.tsx'
import { startOfflineSupport } from './register.ts'
import { UPDATE_EN } from './strings.ts'
import type { ContainerLike, Updater } from './updater.ts'

const updaterWith = (waiting: boolean): Updater => ({
  start: () => Promise.resolve(),
  check: () => {},
  apply: () => {},
  subscribe: () => () => {},
  getSnapshot: () => waiting,
})

describe('UpdateNotice', () => {
  it('says so in English, with a reload button, when a new version waits', () => {
    const html = renderToStaticMarkup(<UpdateNotice updater={updaterWith(true)} />)
    expect(html).toContain('New version available')
    expect(html).toContain('Reload')
    expect(html).toContain('role="status"')
    expect(UPDATE_EN).toEqual({ available: 'New version available', reload: 'Reload' })
  })

  it('renders nothing otherwise', () => {
    expect(renderToStaticMarkup(<UpdateNotice updater={updaterWith(false)} />)).toBe('')
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
