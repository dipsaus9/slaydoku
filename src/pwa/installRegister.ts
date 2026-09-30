import { createInstallStore, isIOSSafari, isStandaloneDisplay } from './install.ts'
import type { InstallEventTarget, InstallStore } from './install.ts'

/** localStorage when the browser hands it out (it can throw or be missing), else null. Same guard as `locale/storage.ts`. */
function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** The install store of this page. `main.tsx` mounts `<InstallNotice store={installStore} />` alongside the updater. */
export const installStore: InstallStore = createInstallStore({
  target: typeof window !== 'undefined' ? (window as unknown as InstallEventTarget) : undefined,
  standalone: isStandaloneDisplay(
    typeof matchMedia !== 'undefined' ? matchMedia('(display-mode: standalone)').matches : false,
    typeof navigator !== 'undefined' ? (navigator as Navigator & { standalone?: boolean }).standalone : undefined,
  ),
  isIOSSafari: typeof navigator !== 'undefined' ? isIOSSafari(navigator.userAgent) : false,
  storage: defaultStorage(),
})
