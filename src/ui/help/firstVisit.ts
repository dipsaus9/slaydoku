import type { StorageLike } from '../../game/index.ts'
import { help } from '../../content/help/help.ts'

/** Remembers which version of the "Zo werkt het" card this browser has already been shown. */
export const HELP_SEEN_KEY = 'slaydoku:help-seen'

/**
 * True when the card should open by itself: storage works and this version was not shown yet.
 * No storage, or storage that throws, means "skip": the card stays reachable from the Uitleg
 * button, it just never pops up on its own (better than showing it on every visit).
 */
export function shouldShowHelp(storage: StorageLike | null, version: number = help.version): boolean {
  if (!storage) return false
  try {
    const raw = storage.getItem(HELP_SEEN_KEY)
    if (raw === null) return true
    const data: unknown = JSON.parse(raw)
    const seen = typeof data === 'object' && data !== null ? (data as { version?: unknown }).version : undefined
    return typeof seen !== 'number' || seen < version
  } catch {
    return false
  }
}

/** Writes that this version was shown. Silently does nothing when storage refuses. */
export function markHelpSeen(storage: StorageLike | null, version: number = help.version): void {
  if (!storage) return
  try {
    storage.setItem(HELP_SEEN_KEY, JSON.stringify({ version }))
  } catch {
    // Private mode or a full disk: the card just shows again next time.
  }
}
