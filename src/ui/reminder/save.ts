import type { ReminderState, ReminderStore } from '../../pwa/reminder.ts'

export const DEFAULT_HOUR = 8

/** The hours a player can pick, 06:00 to 23:00. */
export const HOURS: readonly number[] = Array.from({ length: 18 }, (_, i) => i + 6)

/** Applies the dialog's draft to the store with the right call. Returns true when the dialog may close. */
export async function saveReminder(store: ReminderStore, current: ReminderState, enabled: boolean, hour: number): Promise<boolean> {
  if (!enabled) {
    if (current.status === 'on') await store.disable()
  } else if (current.status === 'on') {
    if (current.hour !== hour) await store.changeHour(hour)
  } else {
    await store.enable(hour)
  }
  const after = store.getSnapshot().status
  return after === 'on' || after === 'off'
}
