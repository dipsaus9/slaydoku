import { useEffect, useState } from 'react'
import { utcDateOf } from '../../schedule/index.ts'

/**
 * The UTC date on the clock, re-read every second and when the tab comes back to the front (a background tab may have had its timers
 * throttled or suspended). The state is the date text, so the screen only re-renders when the day changes.
 */
export function useToday(clock: () => number): string {
  const [today, setToday] = useState(() => utcDateOf(clock()))
  useEffect(() => {
    const check = () => setToday(utcDateOf(clock()))
    check()
    const id = setInterval(check, 1000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [clock])
  return today
}

/** The clock reading in ms, refreshed every second (for a countdown; keep it inside a small component). */
export function useNow(clock: () => number): number {
  const [now, setNow] = useState(() => clock())
  useEffect(() => {
    const tick = () => setNow(clock())
    tick()
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [clock])
  return now
}
