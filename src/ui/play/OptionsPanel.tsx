import { useState } from 'react'
import type { GameOptions } from '../../game/index.ts'
import { LocaleToggle } from '../daily/LocaleToggle.tsx'
import { Modal } from './Modal.tsx'
import { usePlayStrings } from './strings.ts'

export interface OptionsPanelProps {
  options: GameOptions
  showAxisLabels: boolean
  onAxisLabels: (value: boolean) => void
  onChange: (option: keyof GameOptions, value: boolean) => void
  onClearAll: () => void
  onRestart: () => void
  onClose: () => void
}

/**
 * The three toggles of the official app, the axis labels toggle, clear-all and restart, plus the
 * language switch (SLAY-9.4: reachable from the play screen, not only the start screen, so a
 * player can change language mid-puzzle without losing board state).
 */
export function OptionsPanel({ options, showAxisLabels, onAxisLabels, onChange, onClearAll, onRestart, onClose }: OptionsPanelProps) {
  const t = usePlayStrings().options
  const [confirmRestart, setConfirmRestart] = useState(false)
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
