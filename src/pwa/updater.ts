/*
 * Update flow of the page side (CAD-10.6). The browser checks sw.js on every visit; a changed sw.js installs
 * as a new worker that takes over by itself (`skipWaiting` in sw.ts) and reloads every open window into the
 * new build. This side registers the worker, asks for a new sw.js whenever the page becomes visible again,
 * and reloads once when a new worker takes over a page that an older one controlled: a backup for a browser
 * where the worker's own reload (`WindowClient.navigate`) fails. It only knows the small slice of the service
 * worker API below, so the tests drive it with plain objects.
 */

export interface RegistrationLike {
  update(): Promise<unknown>
}

export interface ContainerLike {
  readonly controller: unknown
  register(url: string): Promise<RegistrationLike>
  addEventListener(type: 'controllerchange', listener: () => void): void
}

export interface Updater {
  /** Registers the worker. Resolves once registered; never rejects. */
  start(): Promise<void>
  /** Asks the browser to look for a new sw.js now (a home-screen app can stay open for days). */
  check(): void
}

export function createUpdater(container: ContainerLike, reload: () => void, scriptUrl = '/sw.js'): Updater {
  let registration: RegistrationLike | null = null
  // No controller at load: this is the very first install, and its claim must not reload the page.
  const updating = container.controller != null
  let reloaded = false

  container.addEventListener('controllerchange', () => {
    if (!updating || reloaded) return
    reloaded = true
    reload()
  })

  return {
    async start() {
      try {
        registration = await container.register(scriptUrl)
      } catch {
        // no service worker (private mode, blocked): the game runs online as before
      }
    },
    check() {
      registration?.update().catch(() => {})
    },
  }
}
