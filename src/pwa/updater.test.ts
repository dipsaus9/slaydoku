import { describe, expect, it, vi } from 'vitest'
import { SKIP_WAITING_MESSAGE } from './cache.ts'
import { createUpdater, shouldOfferUpdate } from './updater.ts'
import type { ContainerLike, RegistrationLike, WorkerLike } from './updater.ts'

class FakeWorker implements WorkerLike {
  state = 'installing'
  messages: unknown[] = []
  private listeners: (() => void)[] = []
  postMessage(message: unknown) {
    this.messages.push(message)
  }
  addEventListener(_type: 'statechange', listener: () => void) {
    this.listeners.push(listener)
  }
  become(state: string) {
    this.state = state
    for (const listener of this.listeners) listener()
  }
}

class FakeRegistration implements RegistrationLike {
  waiting: WorkerLike | null = null
  installing: WorkerLike | null = null
  updates = 0
  private found: (() => void)[] = []
  addEventListener(_type: 'updatefound', listener: () => void) {
    this.found.push(listener)
  }
  update() {
    this.updates++
    return Promise.resolve()
  }
  /** A new sw.js was found: it installs, then waits. */
  deploy(): FakeWorker {
    const worker = new FakeWorker()
    this.installing = worker
    for (const listener of this.found) listener()
    return worker
  }
  finishInstall(worker: FakeWorker) {
    this.installing = null
    this.waiting = worker
    worker.become('installed')
  }
}

class FakeContainer implements ContainerLike {
  controller: unknown = null
  registration = new FakeRegistration()
  registered: string[] = []
  private changes: (() => void)[] = []
  fail = false
  register(url: string) {
    this.registered.push(url)
    return this.fail ? Promise.reject(new Error('blocked')) : Promise.resolve(this.registration)
  }
  addEventListener(_type: 'controllerchange', listener: () => void) {
    this.changes.push(listener)
  }
  takeOver() {
    this.controller = {}
    for (const listener of this.changes) listener()
  }
}

describe('shouldOfferUpdate', () => {
  it('needs a waiting worker and an older one in control', () => {
    const worker = new FakeWorker()
    expect(shouldOfferUpdate(true, worker)).toBe(true)
    expect(shouldOfferUpdate(false, worker)).toBe(false)
    expect(shouldOfferUpdate(true, null)).toBe(false)
  })
})

describe('createUpdater', () => {
  it('registers /sw.js and offers nothing on a first visit', async () => {
    const container = new FakeContainer()
    const updater = createUpdater(container, vi.fn())
    await updater.start()
    expect(container.registered).toEqual(['/sw.js'])
    expect(updater.getSnapshot()).toBe(false)

    // the first install: no controller yet, so this is the newest build already
    const worker = container.registration.deploy()
    container.registration.finishInstall(worker)
    expect(updater.getSnapshot()).toBe(false)
  })

  it('does not reload when the first worker claims the page', async () => {
    const container = new FakeContainer()
    const reload = vi.fn()
    createUpdater(container, reload)
    container.takeOver()
    expect(reload).not.toHaveBeenCalled()
  })

  it('offers the update when a new version finishes installing under a controlled page', async () => {
    const container = new FakeContainer()
    container.controller = {}
    const updater = createUpdater(container, vi.fn())
    const seen = vi.fn()
    updater.subscribe(seen)
    await updater.start()
    const worker = container.registration.deploy()
    expect(updater.getSnapshot()).toBe(false) // still installing
    container.registration.finishInstall(worker)
    expect(updater.getSnapshot()).toBe(true)
    expect(seen).toHaveBeenCalledTimes(1)
  })

  it('offers an update that was already waiting when the page loaded', async () => {
    const container = new FakeContainer()
    container.controller = {}
    container.registration.waiting = new FakeWorker()
    const updater = createUpdater(container, vi.fn())
    await updater.start()
    expect(updater.getSnapshot()).toBe(true)
  })

  it('notifies once, however many workers follow', async () => {
    const container = new FakeContainer()
    container.controller = {}
    const updater = createUpdater(container, vi.fn())
    const seen = vi.fn()
    updater.subscribe(seen)
    await updater.start()
    container.registration.finishInstall(container.registration.deploy())
    container.registration.finishInstall(container.registration.deploy())
    expect(seen).toHaveBeenCalledTimes(1)
  })

  it('reload: tells the waiting worker to take over, and reloads once it has', async () => {
    const container = new FakeContainer()
    container.controller = {}
    const reload = vi.fn()
    const updater = createUpdater(container, reload)
    await updater.start()
    const worker = container.registration.deploy()
    container.registration.finishInstall(worker)

    updater.apply()
    expect(worker.messages).toEqual([{ type: SKIP_WAITING_MESSAGE }])
    expect(reload).not.toHaveBeenCalled() // not before the new worker controls the page
    container.takeOver()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('a second click does not send a second message', async () => {
    const container = new FakeContainer()
    container.controller = {}
    const updater = createUpdater(container, vi.fn())
    await updater.start()
    const worker = container.registration.deploy()
    container.registration.finishInstall(worker)
    updater.apply()
    updater.apply()
    expect(worker.messages).toHaveLength(1)
  })

  it('apply with nothing waiting does nothing', () => {
    const container = new FakeContainer()
    const reload = vi.fn()
    const updater = createUpdater(container, reload)
    updater.apply()
    container.takeOver()
    expect(reload).not.toHaveBeenCalled()
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
    expect(updater.getSnapshot()).toBe(false)
    updater.check()
  })

  it('unsubscribe stops the callbacks', async () => {
    const container = new FakeContainer()
    container.controller = {}
    const updater = createUpdater(container, vi.fn())
    const seen = vi.fn()
    updater.subscribe(seen)()
    await updater.start()
    container.registration.finishInstall(container.registration.deploy())
    expect(seen).not.toHaveBeenCalled()
  })
})
