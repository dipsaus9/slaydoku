import { useState } from 'react'
import { useLocale } from '../../locale/index.ts'
import type { ReminderState } from '../../pwa/reminder.ts'
import { Modal } from '../play/Modal.tsx'
import { DEFAULT_HOUR, HOURS, saveReminder } from './save.ts'
import { useReminder } from './context.ts'
import { REMINDER_STRINGS } from './strings.ts'
import './reminder.css'

export interface ReminderDialogViewProps {
  state: ReminderState
  enabled: boolean
  hour: number
  onEnabled: (value: boolean) => void
  onHour: (value: number) => void
  onSave: () => void
  onClose: () => void
}

/** The dialog's markup, driven entirely by props so each state can be rendered and tested without a store. */
export function ReminderDialogView({ state, enabled, hour, onEnabled, onHour, onSave, onClose }: ReminderDialogViewProps) {
  const { locale } = useLocale()
  const t = REMINDER_STRINGS[locale]
  const busy = state.status === 'busy'
  return (
    <Modal title={t.title} onClose={onClose} className="reminder-dialog">
      <button type="button" role="switch" aria-checked={enabled} className="play-switch" disabled={busy} data-reminder-toggle onClick={() => onEnabled(!enabled)}>
        <span className="play-switch__text">
          <strong>{t.toggle}</strong>
          <small>{t.toggleHelp}</small>
        </span>
        <span className="play-switch__knob" aria-hidden="true" />
      </button>
      <label className="reminder-dialog__field">
        <span className="reminder-dialog__label">{t.hourLabel}</span>
        <select className="reminder-dialog__select" value={hour} disabled={busy || !enabled} data-reminder-hour onChange={(e) => onHour(Number(e.target.value))}>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {t.hourOption(h)}
            </option>
          ))}
        </select>
      </label>
      {state.status === 'blocked' ? (
        <p className="reminder-dialog__message" role="alert" data-reminder-message="blocked">
          {t.blocked}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p className="reminder-dialog__message" role="alert" data-reminder-message="error">
          {t.error}
        </p>
      ) : null}
      <div className="play-modal__actions">
        <button type="button" className="play-btn" onClick={onClose}>
          {t.close}
        </button>
        <button type="button" className="play-btn play-btn--primary" disabled={busy} data-reminder-save onClick={onSave}>
          {busy ? t.saving : t.save}
        </button>
      </div>
    </Modal>
  )
}

/** The reminder dialog (SLAY-14.10): toggle, hour in Amsterdam time, Save. Renders nothing while the store is unavailable. */
export function ReminderDialog({ onClose }: { onClose: () => void }) {
  const { store, state } = useReminder()
  const [enabled, setEnabled] = useState(state.status === 'on')
  const [hour, setHour] = useState(state.hour ?? DEFAULT_HOUR)
  if (state.status === 'unavailable') return null
  const save = () => {
    void saveReminder(store, state, enabled, hour).then((done) => {
      if (done) onClose()
    })
  }
  return <ReminderDialogView state={state} enabled={enabled} hour={hour} onEnabled={setEnabled} onHour={setHour} onSave={save} onClose={onClose} />
}
