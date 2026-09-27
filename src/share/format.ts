import type { TierId } from '../engine/generator/tiers/index.ts'
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

export const tierLabel = (tier: TierId): string => TIER_LABELS[tier]

/** `9x9`, plain x so it survives every font and every chat app. */
export const sizeLabel = (size: number): string => `${size}x${size}`

/** `04:12` under an hour, `1:04:12` from an hour on. Whole seconds, rounded down, never negative. */
export function formatDuration(ms: number): string {
  const total = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** `no hints`, `1 hint`, `2 hints`. */
export function hintsLabel(hints: number): string {
  const n = Math.max(0, Math.floor(hints))
  return n === 0 ? 'no hints' : n === 1 ? '1 hint' : `${n} hints`
}

/** The first letter as a capital: `No hints`. */
export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/** `Thursday 15 October 2026`, for a `YYYY-MM-DD` date. */
export const dateLabel = (date: string): string => formatLongDate(date)
