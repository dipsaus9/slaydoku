import { describe, expect, it, vi } from 'vitest'
import { startOfflineSupport } from './register.ts'
import type { ContainerLike } from './updater.ts'

describe('startOfflineSupport', () => {
  const container = (): ContainerLike & { register: ReturnType<typeof vi.fn> } => ({
    controller: null,
    register: vi.fn(() => Promise.resolve({ update: () => Promise.resolve() })),
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
    startOfflineSupport({ production: false, container: c, reload: () => {}, onVisible })
    expect(c.register).not.toHaveBeenCalled()
    expect(onVisible).not.toHaveBeenCalled()
  })

  it('does nothing in a browser without service workers', () => {
    const onVisible = vi.fn()
    startOfflineSupport({ production: true, container: undefined, reload: () => {}, onVisible })
    expect(onVisible).not.toHaveBeenCalled()
  })
})
