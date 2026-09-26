import { createUpdater } from './updater.ts'
import type { ContainerLike, Updater } from './updater.ts'

export interface OfflineEnv {
  /** `import.meta.env.PROD`: the worker exists in the production build only. */
  production: boolean
  container: ContainerLike | undefined
  reload: () => void
  /** Called on every return to the page (a tab or home-screen app that stayed open) to look for a new build. */
  onVisible: (listener: () => void) => void
}

/** A stand-in for when there is no service worker: never offers an update. */
const NO_UPDATER: Updater = {
  start: () => Promise.resolve(),
  check: () => {},
  apply: () => {},
  subscribe: () => () => {},
  getSnapshot: () => false,
}

/**
 * Builds the updater and, in production with service worker support, registers the worker. In `bun run dev`
 * (and so in the lab, which only exists there) nothing is registered: a cached shell would hide every edit.
 */
export function startOfflineSupport(env: OfflineEnv): Updater {
  if (!env.production || !env.container) return NO_UPDATER
  const updater = createUpdater(env.container, env.reload)
  void updater.start()
  env.onVisible(updater.check)
  return updater
}

/** The updater of this page. `main.tsx` starts it once; the notice reads it. */
export const updater: Updater = startOfflineSupport({
  production: import.meta.env.PROD,
  container: typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? (navigator.serviceWorker as unknown as ContainerLike) : undefined,
  reload: () => location.reload(),
  onVisible: (listener) =>
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') listener()
    }),
})
