import { useState } from 'react'
import type { GameOptions } from '../../game/index.ts'
import { LOOKS, type Look } from '../../render/looks/look.ts'
import { LocaleToggle } from '../daily/LocaleToggle.tsx'
import { ReminderDialog, ReminderOptionsEntry } from '../reminder/index.ts'
import { Modal } from './Modal.tsx'
import { usePlayStrings } from './strings.ts'

export interface OptionsPanelProps {
  options: GameOptions
  showAxisLabels: boolean
  onAxisLabels: (value: boolean) => void
  onChange: (option: keyof GameOptions, value: boolean) => void
  /** The object look and its setter (SLAY-17.8). Pass `onLook` only where the switch is allowed (look.ts): without it the entry is not shown. */
  look?: Look
  onLook?: (look: Look) => void
  onClearAll: () => void
  onRestart: () => void
  onClose: () => void
}

/**
 * The three toggles of the official app, the axis labels toggle, clear-all and restart, plus the
 * language switch (SLAY-9.4: reachable from the play screen, not only the start screen, so a
 * player can change language mid-puzzle without losing board state).
 */
export function OptionsPanel({ options, showAxisLabels, onAxisLabels, onChange, look = 'now', onLook, onClearAll, onRestart, onClose }: OptionsPanelProps) {
  const t = usePlayStrings().options
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const game = (key: keyof GameOptions, label: string, help: string) => ({
    key,
    label,
    help,
    on: options[key],
    toggle: () => onChange(key, !options[key]),
  })
  const rows = [
    game('autoXOnPlace', t.autoX, t.autoXHelp),
    game('preventXOnBlocked', t.preventX, t.preventXHelp),
    game('showTimer', t.timer, t.timerHelp),
    { key: 'axisLabels', label: t.axisLabels, help: t.axisLabelsHelp, on: showAxisLabels, toggle: () => onAxisLabels(!showAxisLabels) },
  ]
  // The reminder dialog takes this panel's place (one Escape closes one dialog) and returns to it.
  if (reminderOpen) return <ReminderDialog onClose={() => setReminderOpen(false)} />
  return (
    <Modal title={t.title} onClose={onClose}>
      <div className="play-options__locale">
        <LocaleToggle />
      </div>
      <ul className="play-options">
        {rows.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              role="switch"
              aria-checked={row.on}
              className="play-switch"
              onClick={row.toggle}
            >
              <span className="play-switch__text">
                <strong>{row.label}</strong>
                <small>{row.help}</small>
              </span>
              <span className="play-switch__knob" aria-hidden="true" />
            </button>
          </li>
        ))}
        {onLook ? (
          <li data-look-entry="">
            <div className="play-look">
              <span className="play-switch__text">
                <strong>{t.look}</strong>
                <small>{t.lookHelp}</small>
              </span>
              <div className="daily__locale" role="group" aria-label={t.look}>
                {LOOKS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="daily-btn daily-btn--quiet daily__locale-option"
                    aria-pressed={look === option}
                    data-look-option={option}
                    onClick={() => onLook(option)}
                  >
                    {option === 'now' ? t.lookNow : option === 'a2' ? t.lookA2 : t.lookA3}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ) : null}
        <li>
          <ReminderOptionsEntry onOpen={() => setReminderOpen(true)} />
        </li>
      </ul>
      <div className="play-modal__actions">
        <button type="button" className="play-btn" onClick={() => { onClearAll(); onClose() }}>
          {t.clearAll}
        </button>
        <button
          type="button"
          className={confirmRestart ? 'play-btn play-btn--danger' : 'play-btn'}
          onClick={() => {
            if (!confirmRestart) return setConfirmRestart(true)
            onRestart()
            onClose()
          }}
        >
          {confirmRestart ? t.restartConfirm : t.restart}
        </button>
        <button type="button" className="play-btn play-btn--primary" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </Modal>
  )
}
