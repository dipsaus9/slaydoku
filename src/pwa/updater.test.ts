import { describe, expect, it, vi } from 'vitest'
import { createUpdater } from './updater.ts'
import type { ContainerLike, RegistrationLike } from './updater.ts'

class FakeRegistration implements RegistrationLike {
  updates = 0
  update() {
    this.updates++
    return Promise.resolve()
  }
}

class FakeContainer implements ContainerLike {
  registration = new FakeRegistration()
  registered: string[] = []
  private changes: (() => void)[] = []
  fail = false
  controller: unknown
  constructor(controller: unknown = null) {
    this.controller = controller
  }
  register(url: string) {
    this.registered.push(url)
    return this.fail ? Promise.reject(new Error('blocked')) : Promise.resolve(this.registration)
  }
  addEventListener(_type: 'controllerchange', listener: () => void) {
    this.changes.push(listener)
  }
  /** A worker (the first one, or a new build after skipWaiting) claims the page. */
  takeOver() {
    this.controller = {}
    for (const listener of this.changes) listener()
  }
}

describe('createUpdater', () => {
  it('registers /sw.js', async () => {
    const container = new FakeContainer()
    await createUpdater(container, vi.fn()).start()
    expect(container.registered).toEqual(['/sw.js'])
  })

  it('does not reload when the first worker claims the page', () => {
    const container = new FakeContainer()
    const reload = vi.fn()
    createUpdater(container, reload)
    container.takeOver()
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads by itself, once, when a new build takes over a controlled page', () => {
    const container = new FakeContainer({})
    const reload = vi.fn()
    createUpdater(container, reload)
    container.takeOver()
    container.takeOver()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('check asks the browser for a new sw.js, only once registered', async () => {
    const container = new FakeContainer()
    const updater = createUpdater(container, vi.fn())
    updater.check()
    expect(container.registration.updates).toBe(0)
    await updater.start()
    updater.check()
    expect(container.registration.updates).toBe(1)
  })

  it('stays quiet when registration is refused', async () => {
    const container = new FakeContainer()
    container.fail = true
    const updater = createUpdater(container, vi.fn())
    await expect(updater.start()).resolves.toBeUndefined()
    updater.check()
    expect(container.registration.updates).toBe(0)
  })
})
