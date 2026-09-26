import type { TierId } from '../engine/generator/tiers/index.ts'
import type { Puzzle } from '../engine/model/index.ts'
import type { PortraitLook } from '../content/cast/index.ts'
import type { ThemeId } from '../content/themes/index.ts'

/** Bumped when the JSON layout of a month file or the index changes. */
export const SCHEDULE_FORMAT = 1

/** What the picker decides for one UTC date: everything that does not need a generated puzzle. */
export interface DayPlan {
  /** Puzzle number: 1 on the launch date. */
  n: number
  /** UTC date, `YYYY-MM-DD`. */
  date: string
  size: number
  tier: TierId
  theme: ThemeId
  /** First seed of the day's attempt window (`ATTEMPT_WINDOW` seeds, see pick.ts). */
  seed: number
}

/** One committed day: the plan as it came out, plus the gated puzzle. Names and genders are baked into `puzzle.people`; everyone sees the same. */
export interface ScheduleDay {
  n: number
  date: string
  size: number
  tier: TierId
  theme: ThemeId
  /** The seed of the attempt that passed every gate (a seed of the day's window; the puzzle id is `<size>-<tier>-<theme>-<seed>`). */
  seed: number
  /** Seeds tried until one passed every gate, this one included (1 = the first seed of the window). */
  attempts: number
  /** Only present when the planned board was too slow to produce and the fallback rule made a smaller one: the planned size. */
  fallbackFrom?: number
  title: string
  /** Portraits of the suspects in seat order (same order as the suspects of `puzzle.people`), baked with the names. */
  portraits: PortraitLook[]
  puzzle: Puzzle
  /** `puzzleFingerprint` of `puzzle`. */
  fp: string
}

/** A committed month file, e.g. `2026-11.json`: every scheduled day of one UTC month, in date order. */
export interface MonthFile {
  format: typeof SCHEDULE_FORMAT
  month: string
  days: ScheduleDay[]
}

/** One line of the index: a month file and what it holds. */
export interface IndexMonth {
  month: string
  file: string
  first: string
  last: string
  count: number
}

/** `index.json`: enough to find today's month file and to know how far the schedule reaches, without loading a puzzle. */
export interface ScheduleIndex {
  format: typeof SCHEDULE_FORMAT
  launch: string
  first: string
  last: string
  count: number
  months: IndexMonth[]
}
