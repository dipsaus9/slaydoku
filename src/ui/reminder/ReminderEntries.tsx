import { useState } from 'react'
import { useLocale } from '../../locale/index.ts'
import { ReminderDialog } from './ReminderDialog.tsx'
import { useReminder } from './context.ts'
import { summaryOf } from './summary.ts'
import { REMINDER_STRINGS } from './strings.ts'
import './reminder.css'

/**
 * The quiet start-screen row (shown by the daily flow after the first solve): small text and one small button,
 * the weight of the install notice. Nothing at all while the store is unavailable (normal browser tab).
 */
export function ReminderRow() {
  const { locale } = useLocale()
  const t = REMINDER_STRINGS[locale]
  const { state } = useReminder()
  const [open, setOpen] = useState(false)
  if (state.status === 'unavailable') return null
  return (
    <>
      <div className="reminder-row" data-reminder-row>
        <p className="reminder-row__text">
          <strong>{t.title}</strong>
          <span data-reminder-summary>{state.status === 'off' ? t.rowText : summaryOf(state, t)}</span>
        </p>
        <button type="button" className="reminder-row__button" data-reminder-open onClick={() => setOpen(true)}>
          {t.open}
        </button>
      </div>
      {open ? <ReminderDialog onClose={() => setOpen(false)} /> : null}
    </>
  )
}

/** The Options panel's entry: the same look as one of its switches, opening the dialog. Nothing while unavailable. */
export function ReminderOptionsEntry({ onOpen }: { onOpen: () => void }) {
  const { locale } = useLocale()
  const t = REMINDER_STRINGS[locale]
  const { state } = useReminder()
  if (state.status === 'unavailable') return null
  return (
    <button type="button" className="play-switch reminder-entry" data-reminder-entry onClick={onOpen}>
      <span className="play-switch__text">
        <strong>{t.title}</strong>
        <small>{summaryOf(state, t)}</small>
      </span>
      <span className="reminder-entry__chevron" aria-hidden="true">
        ›
      </span>
    </button>
  )
}
