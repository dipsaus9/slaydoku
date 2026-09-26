/**
 * How long after a dialog opens a click inside it is ignored. A long press (the eraser opens the
 * clear-all dialog) opens the dialog under the finger; on a phone the dialog is centred over the
 * toolbar, so lifting the finger can land the click on its confirm button. Nobody taps a button
 * within a third of a second of it appearing.
 */
export const GHOST_CLICK_MS = 350

/** True while a click inside a dialog that opened at `openedAt` (ms, same clock as `now`) is still too early to be a real tap. */
export function isGhostClick(openedAt: number, now: number): boolean {
  return now - openedAt < GHOST_CLICK_MS
}
