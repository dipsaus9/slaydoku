import { useMemo, useRef, useState } from 'react'
import type { StorageLike } from '../../game/index.ts'
import { useLocale } from '../../locale/index.ts'
import { readStats, resetStats } from '../../game/stats/index.ts'
import { StatsPanel } from './StatsPanel.tsx'
import { STATS_STRINGS } from './strings.ts'
import './stats.css'

export interface StatsEntryProps {
  storage: StorageLike
  /** The UTC date now (`YYYY-MM-DD`): a streak is alive while its last solved day is today or yesterday. */
  today: string
  /** Bump to read the statistics again (a puzzle was solved). */
  version?: number
  /** The statistics were deleted: the caller reads the status of the day on screen again. */
  onReset?: () => void
}

/**
 * What goes in the start screen's `stats` slot: a compact line (`Streak 5 · Best 12`) and a Stats button that opens the card. The numbers
 * are read from this device when the screen shows and again after a reset; nothing is fetched or sent.
 */
export function StatsEntry({ storage, today, version = 0, onReset }: StatsEntryProps) {
  const { locale } = useLocale()
  const t = STATS_STRINGS[locale]
  const [open, setOpen] = useState(false)
  const [resets, setResets] = useState(0)
  const opener = useRef<HTMLButtonElement>(null)
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => readStats(storage, today), [storage, today, version, resets, open])

  const close = () => {
    setOpen(false)
    // Give the focus back to the button that opened the card (after it re-rendered), so a keyboard user does not start over at the top.
    queueMicrotask(() => opener.current?.focus())
  }
  const reset = (): boolean => {
    const ok = resetStats(storage)
    setResets((n) => n + 1)
    onReset?.()
    return ok
  }

  return (
    <section className="stats-entry" aria-label={t.title}>
      <p className="stats-entry__summary" data-stats-summary>
        {t.summary(stats.currentStreak, stats.bestStreak)}
      </p>
      <button ref={opener} type="button" className="stats-btn stats-entry__open" data-stats-open onClick={() => setOpen(true)}>
        {t.open}
      </button>
      {open ? <StatsPanel stats={stats} onClose={close} onReset={reset} /> : null}
    </section>
  )
}
