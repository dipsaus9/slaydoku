import { describe, expect, it, vi } from 'vitest'
import {
  DISMISS_KEY,
  RESURFACE_MS,
  createInstallStore,
  isDismissed,
  isIOSSafari,
  isStandaloneDisplay,
  readDismissedAt,
  writeDismissedAt,
} from './install.ts'
import type { DeferredInstallPrompt, InstallEventTarget, StorageLike } from './install.ts'

class FakeStorage implements StorageLike {
  private data = new Map<string, string>()
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string {
    throw new Error('blocked')
  }
  setItem(): void {
    throw new Error('blocked')
  }
}

class FakeTarget implements InstallEventTarget {
  private beforeInstall: ((event: DeferredInstallPrompt) => void)[] = []
  private installed: (() => void)[] = []
  addEventListener(type: 'beforeinstallprompt' | 'appinstalled', listener: (event: never) => void) {
    if (type === 'beforeinstallprompt') this.beforeInstall.push(listener as (event: DeferredInstallPrompt) => void)
    else this.installed.push(listener as () => void)
  }
  fireBeforeInstallPrompt(event: DeferredInstallPrompt) {
    for (const listener of this.beforeInstall) listener(event)
  }
  fireAppInstalled() {
    for (const listener of this.installed) listener()
  }
}

const fakePrompt = (outcome: 'accepted' | 'dismissed' = 'accepted'): DeferredInstallPrompt & { prompted: boolean } => {
  const event = {
    prompted: false,
    preventDefault: vi.fn(),
    prompt(this: { prompted: boolean }) {
      this.prompted = true
    },
    userChoice: Promise.resolve({ outcome }),
  }
  return event as unknown as DeferredInstallPrompt & { prompted: boolean }
}

describe('isIOSSafari', () => {
  it('is true for Safari on iPhone/iPad/iPod', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    expect(isIOSSafari(ua)).toBe(true)
  })

  it('is false for Chrome on iOS (CriOS), even though it also matches /Safari/', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0 Mobile/15E148 Safari/604.1'
    expect(isIOSSafari(ua)).toBe(false)
  })

  it('is false for Firefox on iOS (FxiOS)', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/119.0 Mobile/15E148 Safari/605.1.15'
    expect(isIOSSafari(ua)).toBe(false)
  })

  it('is false for Android Chrome', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
    expect(isIOSSafari(ua)).toBe(false)
  })

  it('is false for desktop Safari (no iOS device token)', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    expect(isIOSSafari(ua)).toBe(false)
  })
})

describe('isStandaloneDisplay', () => {
  it('is true from the display-mode media query (Android/Chromium)', () => {
    expect(isStandaloneDisplay(true, undefined)).toBe(true)
  })

  it('is true from navigator.standalone (iOS Safari)', () => {
    expect(isStandaloneDisplay(false, true)).toBe(true)
  })

  it('is false when neither signal is set', () => {
    expect(isStandaloneDisplay(false, false)).toBe(false)
    expect(isStandaloneDisplay(false, undefined)).toBe(false)
  })
})

describe('dismissal persistence', () => {
  it('round-trips through storage', () => {
    const storage = new FakeStorage()
    expect(readDismissedAt(storage)).toBeNull()
    writeDismissedAt(storage, 1000)
    expect(readDismissedAt(storage)).toBe(1000)
    expect(storage.getItem(DISMISS_KEY)).toContain('1000')
  })

  it('reads null for no storage, garbage, or a throwing storage', () => {
    expect(readDismissedAt(null)).toBeNull()
    const garbage = new FakeStorage()
    garbage.setItem(DISMISS_KEY, 'not json')
    expect(readDismissedAt(garbage)).toBeNull()
    expect(readDismissedAt(new ThrowingStorage())).toBeNull()
  })

  it('write silently does nothing for no storage or a throwing storage', () => {
    expect(() => writeDismissedAt(null, 1)).not.toThrow()
    expect(() => writeDismissedAt(new ThrowingStorage(), 1)).not.toThrow()
  })
})

describe('isDismissed', () => {
  it('is false with nothing dismissed', () => {
    expect(isDismissed(null, 1_000_000)).toBe(false)
  })

  it('is true just inside the resurface window, false once past it', () => {
    const dismissedAt = 1_000_000
    expect(isDismissed(dismissedAt, dismissedAt + RESURFACE_MS - 1)).toBe(true)
    expect(isDismissed(dismissedAt, dismissedAt + RESURFACE_MS)).toBe(false)
  })
})

describe('createInstallStore', () => {
  it('offers nothing when already standalone, on either platform', () => {
    const android = createInstallStore({ target: new FakeTarget(), standalone: true, isIOSSafari: false, storage: null })
    expect(android.getSnapshot()).toBeNull()
    const ios = createInstallStore({ target: undefined, standalone: true, isIOSSafari: true, storage: null })
    expect(ios.getSnapshot()).toBeNull()
  })

  it('offers nothing on a platform/browser that supports neither path (desktop, Firefox)', () => {
    const store = createInstallStore({ target: new FakeTarget(), standalone: false, isIOSSafari: false, storage: null })
    expect(store.getSnapshot()).toBeNull()
  })

  it('iOS Safari: offers the instructional banner immediately, no event needed', () => {
    const store = createInstallStore({ target: undefined, standalone: false, isIOSSafari: true, storage: null })
    expect(store.getSnapshot()).toBe('ios')
  })

  it('Android: offers nothing until beforeinstallprompt fires, then the android banner', () => {
    const target = new FakeTarget()
    const store = createInstallStore({ target, standalone: false, isIOSSafari: false, storage: null })
    expect(store.getSnapshot()).toBeNull()
    const seen = vi.fn()
    store.subscribe(seen)
    const event = fakePrompt()
    target.fireBeforeInstallPrompt(event)
    expect(store.getSnapshot()).toBe('android')
    expect(seen).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
  })

  it('install() replays the captured event\'s own .prompt(), once', async () => {
    const target = new FakeTarget()
    const store = createInstallStore({ target, standalone: false, isIOSSafari: false, storage: null })
    const event = fakePrompt()
    target.fireBeforeInstallPrompt(event)
    store.install()
    expect(event.prompted).toBe(true)
    expect(store.getSnapshot()).toBeNull() // consumed: a beforeinstallprompt event can only be used once
    await event.userChoice
  })

  it('install() does nothing without a captured event (iOS, or before Android has fired one)', () => {
    const store = createInstallStore({ target: undefined, standalone: false, isIOSSafari: true, storage: null })
    expect(() => store.install()).not.toThrow()
    expect(store.getSnapshot()).toBe('ios')
  })

  it('appinstalled hides the android banner and future beforeinstallprompt events are moot', () => {
    const target = new FakeTarget()
    const store = createInstallStore({ target, standalone: false, isIOSSafari: false, storage: null })
    target.fireBeforeInstallPrompt(fakePrompt())
    expect(store.getSnapshot()).toBe('android')
    target.fireAppInstalled()
    expect(store.getSnapshot()).toBeNull()
  })

  it('dismiss() hides the banner and persists the dismissal', () => {
    const storage = new FakeStorage()
    const store = createInstallStore({ target: undefined, standalone: false, isIOSSafari: true, storage, now: () => 5000 })
    const seen = vi.fn()
    store.subscribe(seen)
    store.dismiss()
    expect(store.getSnapshot()).toBeNull()
    expect(seen).toHaveBeenCalledTimes(1)
    expect(readDismissedAt(storage)).toBe(5000)
  })

  it('a fresh store honours a dismissal from a previous session within the resurface window, but not once past it', () => {
    const storage = new FakeStorage()
    writeDismissedAt(storage, 1000)
    const stillDismissed = createInstallStore({ target: undefined, standalone: false, isIOSSafari: true, storage, now: () => 1000 + RESURFACE_MS - 1 })
    expect(stillDismissed.getSnapshot()).toBeNull()
    const resurfaced = createInstallStore({ target: undefined, standalone: false, isIOSSafari: true, storage, now: () => 1000 + RESURFACE_MS })
    expect(resurfaced.getSnapshot()).toBe('ios')
  })

  it('unsubscribe stops the callbacks', () => {
    const target = new FakeTarget()
    const store = createInstallStore({ target, standalone: false, isIOSSafari: false, storage: null })
    const seen = vi.fn()
    store.subscribe(seen)()
    target.fireBeforeInstallPrompt(fakePrompt())
    expect(seen).not.toHaveBeenCalled()
  })
})
