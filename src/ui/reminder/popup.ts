import type { ReminderStatus } from '../../pwa/reminder.ts'
import type { StorageLike } from '../../pwa/install.ts'

/** The ms timestamp of the last time the player closed the solve popup (Not now, Escape or after saving). */
export const POPUP_DISMISS_KEY = 'slaydoku:reminder-popup-dismissed'
export const POPUP_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000
/** Pause after the solved result appears, so the popup never fights the result for the first look. */
export const POPUP_DELAY_MS = 1500

export function defaultPopupStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function readPopupDismissed(storage: StorageLike | null): number | null {
  try {
    const raw = storage?.getItem(POPUP_DISMISS_KEY)
    if (raw === null || raw === undefined) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function writePopupDismissed(storage: StorageLike | null, now: number): void {
  try {
    storage?.setItem(POPUP_DISMISS_KEY, String(now))
  } catch {
    // Not remembered: the popup may come back on the next solve, which is the harmless failure.
  }
}

/** True while the 14 days after a dismissal have not passed (a timestamp in the future counts as recent too). */
export function isSnoozed(dismissedAt: number | null, now: number): boolean {
  return dismissedAt !== null && now - dismissedAt < POPUP_SNOOZE_MS
}

/** Only an 'off' store is offered the reminder: not unavailable, on, blocked, busy (or mid-error). */
export function shouldOfferPopup(status: ReminderStatus, storage: StorageLike | null, now: number): boolean {
  return status === 'off' && !isSnoozed(readPopupDismissed(storage), now)
}
