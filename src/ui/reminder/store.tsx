import type { ReactNode } from 'react'
import type { ReminderStore } from '../../pwa/reminder.ts'
import { ReminderStoreContext } from './context.ts'

/** Lets a test or a verification page hand the UI a fake store; the app itself uses the real one. */
export function ReminderStoreProvider({ store, children }: { store: ReminderStore; children: ReactNode }) {
  return <ReminderStoreContext.Provider value={store}>{children}</ReminderStoreContext.Provider>
}
