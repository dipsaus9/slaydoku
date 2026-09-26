import { SKIP_WAITING_MESSAGE } from './cache.ts'

/*
 * Update flow of the page side (CAD-10.6). The browser checks sw.js on every visit; a changed sw.js installs
 * as a new worker that then waits. This turns "a worker is waiting while an older one controls the page"
 * into a flag the notice shows, and turns the player's choice into: tell the waiting worker to take over,
 * then reload once when it has. It only knows the small slice of the service worker API below, so the
 * tests drive it with plain objects.
 */

export interface WorkerLike {
  readonly state: string
  postMessage(message: unknown): void
  addEventListener(type: 'statechange', listener: () => void): void
}

export interface RegistrationLike {
  readonly waiting: WorkerLike | null
  readonly installing: WorkerLike | null
  addEventListener(type: 'updatefound', listener: () => void): void
  update(): Promise<unknown>
}

export interface ContainerLike {
  readonly controller: unknown
  register(url: string): Promise<RegistrationLike>
  addEventListener(type: 'controllerchange', listener: () => void): void
}

/**
 * The notice is offered when a new worker is waiting and an older one controls this page. With no controller
 * this is the very first install: the page is already the newest build, there is nothing to reload into.
 */
export function shouldOfferUpdate(hasController: boolean, waiting: WorkerLike | null): boolean {
  return hasController && waiting !== null
}

export interface Updater {
  /** Registers the worker and starts watching for a new version. Resolves once registered; never rejects. */
  start(): Promise<void>
  /** Asks the browser to look for a new sw.js now (a home-screen app can stay open for days). */
  check(): void
  /** The player chose to reload: the waiting worker takes over, and the page reloads when it has. */
  apply(): void
  /** `useSyncExternalStore` pair: is a new version waiting? */
  subscribe(listener: () => void): () => void
  getSnapshot(): boolean
}

export function createUpdater(container: ContainerLike, reload: () => void, scriptUrl = '/sw.js'): Updater {
  let registration: RegistrationLike | null = null
  let waiting: WorkerLike | null = null
  let offered = false
  let applying = false
  const listeners = new Set<() => void>()

  const offer = (worker: WorkerLike | null) => {
    if (!shouldOfferUpdate(container.controller != null, worker)) return
    waiting = worker
    if (offered) return
    offered = true
    for (const listener of listeners) listener()
  }

  container.addEventListener('controllerchange', () => {
    // The first install also changes the controller (clients.claim): only reload for a switch the player asked for.
    if (applying) reload()
  })

  return {
    async start() {
      try {
        registration = await container.register(scriptUrl)
      } catch {
        return // no service worker (private mode, blocked): the game runs online as before
      }
      const reg = registration
      offer(reg.waiting)
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') offer(reg.waiting ?? worker)
        })
      })
    },
    check() {
      registration?.update().catch(() => {})
    },
    apply() {
      if (!waiting || applying) return
      applying = true
      waiting.postMessage({ type: SKIP_WAITING_MESSAGE })
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    getSnapshot: () => offered,
  }
}
