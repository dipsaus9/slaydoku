// Shared by the verification drivers: the scheduled days, the dates the drivers run on, and the storage seed. The app runs on the device
// clock; the drivers set the dev-only date override (src/game/daily/clock.ts) through localStorage before loading a page, which works on
// `localhost` (the preview server) and never on another host.
import { addDays } from '../../src/schedule/dates.ts'
import { readSchedule } from '../../src/schedule/schedule.testing.ts'
import type { ScheduleDay } from '../../src/schedule/types.ts'
import { help } from '../../src/content/help/help.ts'
import { LOCALE_KEY } from '../../src/locale/storage.ts'
import type { Locale } from '../../src/locale/types.ts'

const schedule = readSchedule()
export const DAYS: readonly ScheduleDay[] = schedule.days
export const INDEX = schedule.index

/** A date with a puzzle that the drive, zoom and offline runs play (puzzle #19, medium 9x9). */
export const PLAY_DATE = process.env.PLAY_DATE ?? '2026-10-15'
/** A date before the launch date: "Slaydoku starts on 27 September". */
export const PRELAUNCH_DATE = '2026-09-16'
/** The day after the last scheduled day: "New puzzles are coming soon". */
export const AFTER_DATE = addDays(INDEX.last, 1)

export const dayOn = (date: string): ScheduleDay => {
  const day = DAYS.find((d) => d.date === date)
  if (!day) throw new Error(`no scheduled day on ${date}`)
  return day
}

/** localStorage key of the dev-only date override (a date, or a UTC date and time). */
export const DATE_KEY = 'slaydoku:dev-date'
/** Storage key of the results of solved days. */
export const RESULTS_KEY = 'slaydoku:daily-results'
export const HELP_SEEN_KEY = 'slaydoku:help-seen'
/** Storage key of the home-screen install notice's dismissal (src/pwa/install.ts). Headless Chrome with mobile emulation
 * fires `beforeinstallprompt`, and the notice then covers the start screen's top bar (language switch, Help). */
export const INSTALL_DISMISSED_KEY = 'slaydoku:install-dismissed'

/**
 * JavaScript to run in the page: set the date override, mark the how-it-works card as seen (or it covers the
 * puzzle), and — when given — the language (SLAY-3.2's locale toggle, `LOCALE_KEY`), so a driver can open the
 * play screen already switched to Dutch.
 */
export const seedStorage = (date: string, helpSeen = true, locale?: Locale): string =>
  [
    `localStorage.setItem(${JSON.stringify(DATE_KEY)}, ${JSON.stringify(date)})`,
    // Dismissed "far in the future", so the notice stays away whatever clock the date override sets.
    `localStorage.setItem(${JSON.stringify(INSTALL_DISMISSED_KEY)}, '{"at":4102444800000}')`,
    ...(helpSeen ? [`localStorage.setItem(${JSON.stringify(HELP_SEEN_KEY)}, '{"version":${help.version}}')`] : []),
    ...(locale ? [`localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, ${JSON.stringify(locale)})`] : []),
  ].join('; ')

/**
 * `count` scheduled days spread over the schedule that cover every board size and as many tiers as possible: the days are dealt round
 * robin over the sizes (6, 7, 9, 12), and inside a size the pick walks through the days evenly, so different tiers and themes come up.
 */
export function sampleDays(count: number): ScheduleDay[] {
  const bySize = new Map<number, ScheduleDay[]>()
  for (const day of DAYS) bySize.set(day.size, [...(bySize.get(day.size) ?? []), day])
  const sizes = [...bySize.keys()].sort((a, b) => a - b)
  const picked: ScheduleDay[] = []
  const used = new Set<string>()
  for (let round = 0; picked.length < count && round < count; round++) {
    for (const size of sizes) {
      const own = bySize.get(size)!
      if (picked.length >= count) break
      // Evenly spaced through the days of this size; the round shifts the start so the picks differ.
      const step = Math.max(1, Math.floor(own.length / Math.ceil(count / sizes.length)))
      const day = own[(round * step + Math.floor(step / 2) + round) % own.length]!
      if (used.has(day.date)) continue
      used.add(day.date)
      picked.push(day)
    }
  }
  return picked.sort((a, b) => a.n - b.n)
}
