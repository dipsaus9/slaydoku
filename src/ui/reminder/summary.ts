import type { ReminderState } from '../../pwa/reminder.ts'
import type { ReminderStrings } from './strings.ts'

/** One short line for the current state, e.g. `On, every day at 08:00 Amsterdam time`. */
export function summaryOf(state: ReminderState, t: ReminderStrings): string {
  if (state.status === 'blocked') return t.summary.blocked
  if (state.status === 'on' && state.hour !== null) return t.summary.on(t.hourOption(state.hour))
  return t.summary.off
}
