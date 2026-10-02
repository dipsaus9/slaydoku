import { createContext, useContext, useSyncExternalStore } from 'react'
import { getReminderStore } from '../../pwa/reminder.ts'
import type { ReminderState, ReminderStore } from '../../pwa/reminder.ts'

export const ReminderStoreContext = createContext<ReminderStore | null>(null)

/** The reminder store and its live state. Status 'unavailable' means the UI must not show at all. */
export function useReminder(): { store: ReminderStore; state: ReminderState } {
  const store = useContext(ReminderStoreContext) ?? getReminderStore()
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return { store, state }
}
