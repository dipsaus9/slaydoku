/*
 * Install prompting for the home screen (SLAY-9.23): two platform paths that share nothing, so this file
 * treats them as two states rather than one generic "installable" flag.
 *  - Android/Chromium: fires `beforeinstallprompt`. Capture it and offer a one-tap install using the
 *    captured event's own `.prompt()` — the only platform with a real programmatic install.
 *  - iOS Safari: no programmatic install API exists at all, so the only route is the player tapping
 *    Share -> Add to Home Screen themselves; the banner here is purely instructional.
 * Neither banner shows once the app already runs standalone, or on a browser/platform that supports
 * neither path (desktop, Firefox, ...). A dismissal is remembered but resurfaces after a while rather
 * than being permanent, same key-naming and guarded-access pattern as `slaydoku:help-seen`.
 */

export type InstallPlatform = 'android' | 'ios'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** The captured `beforeinstallprompt` event: the only object that can actually trigger the native install UI. */
export interface DeferredInstallPrompt {
  preventDefault(): void
  prompt(): void
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallEventTarget {
  addEventListener(type: 'beforeinstallprompt', listener: (event: DeferredInstallPrompt) => void): void
  addEventListener(type: 'appinstalled', listener: () => void): void
}

export const DISMISS_KEY = 'slaydoku:install-dismissed'

/** How long a dismissal is honoured before the banner may resurface. Not "never again": a player who waves
 *  it off once may still want to install later, but offering it on every single visit would be noise. */
export const RESURFACE_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

/** Reads the stored dismissal time back. Null for no storage, nothing stored, or an unusable value. */
export function readDismissedAt(storage: StorageLike | null): number | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(DISMISS_KEY)
    if (raw === null) return null
    const data: unknown = JSON.parse(raw)
    const at = typeof data === 'object' && data !== null ? (data as { at?: unknown }).at : undefined
    return typeof at === 'number' ? at : null
  } catch {
    return null
  }
}

/** Writes the dismissal time. Silently does nothing when storage refuses (private mode, a full disk). */
export function writeDismissedAt(storage: StorageLike | null, at: number): void {
  if (!storage) return
  try {
    storage.setItem(DISMISS_KEY, JSON.stringify({ at }))
  } catch {
    // The banner just offers again next time; nothing to recover here.
  }
}

/** True while a past dismissal is still within its resurface window. */
export function isDismissed(dismissedAt: number | null, now: number, resurfaceMs = RESURFACE_MS): boolean {
  return dismissedAt !== null && now - dismissedAt < resurfaceMs
}

const IOS_UA = /iPad|iPhone|iPod/
// Other iOS browsers (Chrome, Firefox, Edge, ...) all embed WebKit and so still match /Safari/ in their UA
// string, but each adds its own token before it; only plain Safari's Share sheet has "Add to Home Screen"
// wired the way the instructional banner describes, so only plain Safari gets it.
const OTHER_IOS_BROWSER_TOKEN = /CriOS|FxiOS|OPiOS|EdgiOS|mercury/

/** True on iOS Safari specifically — not Chrome/Firefox/etc. running on iOS, and not iOS in desktop-site mode. */
export function isIOSSafari(userAgent: string): boolean {
  return IOS_UA.test(userAgent) && /Safari/.test(userAgent) && !OTHER_IOS_BROWSER_TOKEN.test(userAgent)
}

/** True once the app is already running from the home screen: Android/Chromium report it through the
 *  `display-mode` media query, iOS Safari through the non-standard `navigator.standalone`. */
export function isStandaloneDisplay(matchesStandaloneMedia: boolean, navigatorStandalone: boolean | undefined): boolean {
  return matchesStandaloneMedia || navigatorStandalone === true
}

export interface InstallStore {
  subscribe(listener: () => void): () => void
  /** `null` when nothing should show: standalone, dismissed within the resurface window, or neither
   *  platform path applies (desktop, Firefox, ...). */
  getSnapshot(): InstallPlatform | null
  /** Android only: replays the captured `beforeinstallprompt` event's own `.prompt()`. No-op otherwise
   *  (there is nothing to call on iOS — the instructional banner has no button that triggers this). */
  install(): void
  dismiss(): void
}

export interface InstallStoreEnv {
  target: InstallEventTarget | undefined
  standalone: boolean
  isIOSSafari: boolean
  storage: StorageLike | null
  now?: () => number
}

export function createInstallStore(env: InstallStoreEnv): InstallStore {
  const now = env.now ?? Date.now
  const listeners = new Set<() => void>()
  let deferred: DeferredInstallPrompt | null = null
  let installed = false
  let dismissed = isDismissed(readDismissedAt(env.storage), now())

  const notify = () => {
    for (const listener of listeners) listener()
  }

  const compute = (): InstallPlatform | null => {
    if (env.standalone || installed || dismissed) return null
    if (env.isIOSSafari) return 'ios'
    return deferred ? 'android' : null
  }

  env.target?.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // Chrome would otherwise show its own mini-infobar; the custom banner replaces it.
    deferred = event
    notify()
  })
  env.target?.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    getSnapshot: compute,
    install() {
      if (!deferred) return
      const event = deferred
      deferred = null
      event.prompt()
      void event.userChoice.finally(notify)
      notify()
    },
    dismiss() {
      dismissed = true
      writeDismissedAt(env.storage, now())
      notify()
    },
  }
}
