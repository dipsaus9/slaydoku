import { useEffect, useState } from 'react'
import { lookupDay, phaseOf } from '../../schedule/index.ts'
import type { DayLookup, MonthFile, ScheduleIndex } from '../../schedule/index.ts'

export type DayState = { kind: 'loading' } | { kind: 'error' } | DayLookup

interface Loaded {
  date: string
  attempt: number
  state: DayLookup | { kind: 'error' }
}

/**
 * The puzzle of a UTC date. A date outside the schedule is answered from the index at once (no file is opened); a scheduled date
 * loads its month file. `retry` tries again after an error (a chunk that could not be fetched).
 */
export function useDayLookup(
  date: string,
  index: ScheduleIndex,
  loadMonth: (month: string) => Promise<MonthFile>,
): { state: DayState; retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const phase = phaseOf(date, index)

  useEffect(() => {
    if (phase !== 'scheduled') return
    let cancelled = false
    lookupDay(date, index, loadMonth).then(
      (state) => {
        if (!cancelled) setLoaded({ date, attempt, state })
      },
      () => {
        if (!cancelled) setLoaded({ date, attempt, state: { kind: 'error' } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [date, attempt, phase, index, loadMonth])

  const retry = () => {
    setLoaded(null)
    setAttempt((n) => n + 1)
  }
  if (phase === 'before-launch') return { state: { kind: 'before-launch', first: index.first }, retry }
  if (phase === 'after-schedule') return { state: { kind: 'after-schedule', last: index.last }, retry }
  const current = loaded && loaded.date === date && loaded.attempt === attempt ? loaded.state : null
  return { state: current ?? { kind: 'loading' }, retry }
}
