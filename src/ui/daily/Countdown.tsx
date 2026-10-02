import { countdownLabel, formatCountdown } from '../../schedule/index.ts'
import { useDailyStrings } from './strings.ts'
import { useNow } from './useToday.ts'

export interface CountdownProps {
  clock: () => number
  /** The instant the countdown runs to (ms since the epoch). */
  target: number
  /** Text before the time: "Ends in". */
  label: string
  /** Optional line under it: "Next puzzle at 00:00 UTC (02:00 ...)". */
  until?: string
  /** Which block this is, for tests and drivers. */
  kind: 'ends' | 'next' | 'starts'
}

/**
 * A live countdown (updates every second) with the UTC instant and its local equivalent under it. The number itself is a `timer`
 * with a spoken label; it does not announce every second.
 */
export function Countdown({ clock, target, label, until, kind }: CountdownProps) {
  const t = useDailyStrings()
  const now = useNow(clock)
  const left = Math.max(0, target - now)
  return (
    <div className="daily-countdown" data-countdown={kind}>
      <p className="daily-countdown__line">
        <span className="daily-countdown__label">{label}</span>{' '}
        <time className="daily-countdown__time" role="timer" aria-live="off" aria-label={t.countdownLabel(countdownLabel(left))} dateTime={`PT${Math.ceil(left / 1000)}S`}>
          {formatCountdown(left)}
        </time>
      </p>
      {until ? <p className="daily-countdown__until" data-until>{until}</p> : null}
    </div>
  )
}
