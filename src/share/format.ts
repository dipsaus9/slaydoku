import type { TierId } from '../engine/generator/tiers/index.ts'
import type { Locale } from '../locale/index.ts'
import { weekdayOf } from '../schedule/dates.ts'
import { formatLongDate } from '../schedule/display.ts'

/** English difficulty labels (the same words as the start screen; a test keeps them equal). */
export const TIER_LABELS: Record<TierId, string> = {
  'very-easy': 'Very easy',
  easy: 'Easy',
  'easy-medium': 'Easy-medium',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
}

/** Dutch difficulty labels: the same words the stats card uses (src/ui/stats/strings.ts). */
const TIER_LABELS_NL: Record<TierId, string> = {
  'very-easy': 'Heel makkelijk',
  easy: 'Makkelijk',
  'easy-medium': 'Makkelijk-gemiddeld',
  medium: 'Gemiddeld',
  hard: 'Moeilijk',
  expert: 'Expert',
}

export const tierLabel = (tier: TierId, locale: Locale = 'en'): string => (locale === 'nl' ? TIER_LABELS_NL : TIER_LABELS)[tier]

/** `9x9`, plain x so it survives every font and every chat app. Digits and the letter x read the same in both languages. */
export const sizeLabel = (size: number): string => `${size}x${size}`

/** `04:12` under an hour, `1:04:12` from an hour on. Whole seconds, rounded down, never negative. Digits and colons only, so both languages share it. */
export function formatDuration(ms: number): string {
  const total = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** `no hints`, `1 hint`, `2 hints` (`geen hints`, `1 hint`, `2 hints` in Dutch). */
export function hintsLabel(hints: number, locale: Locale = 'en'): string {
  const n = Math.max(0, Math.floor(hints))
  if (locale === 'nl') return n === 0 ? 'geen hints' : n === 1 ? '1 hint' : `${n} hints`
  return n === 0 ? 'no hints' : n === 1 ? '1 hint' : `${n} hints`
}

/** The first letter as a capital: `No hints`. */
export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

const WEEKDAYS_NL = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'] as const
const MONTHS_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] as const

/** `donderdag 15 oktober 2026`, for a `YYYY-MM-DD` date: the Dutch weekday and month names, lowercase as Dutch dates are conventionally written. */
function dutchLongDate(date: string): string {
  return `${WEEKDAYS_NL[weekdayOf(date)]} ${Number(date.slice(8, 10))} ${MONTHS_NL[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`
}

/** `Thursday 15 October 2026` (`donderdag 15 oktober 2026` in Dutch), for a `YYYY-MM-DD` date. */
export const dateLabel = (date: string, locale: Locale = 'en'): string => (locale === 'nl' ? dutchLongDate(date) : formatLongDate(date))
