import { puzzleFingerprint } from '../game/fingerprint.ts'
import { boardKey, puzzleKey } from '../content/packs/gates.ts'
import { addDays, dayNumberOf, monthOf } from './dates.ts'
import { indexMonthsOf, monthFileName } from './format.ts'
import { pairProblems } from './gates.ts'
import { FALLBACK_SIZE, acceptedPlans, canFallBack } from './pick.ts'
import type { DayPlan } from './types.ts'
import type { MonthFile, ScheduleDay, ScheduleIndex } from './types.ts'

/**
 * Cheap checks of a whole schedule (no solver runs; `dayProblems` does those per day): the picker's plan is followed, the numbers and
 * dates run without a gap from the launch date, consecutive days differ, no board repeats, and the index lists exactly the month files
 * (no expert-per-week check since SLAY-24: expert is drawn like every tier, and each day's tier already has to match its plan). A day awaiting
 * regeneration may follow the launch rules instead of the current ones (`acceptedPlans`, SLAY-22). Returns the problems.
 */
export function scheduleProblems(index: ScheduleIndex, files: readonly MonthFile[]): string[] {
  const problems: string[] = []
  const days: ScheduleDay[] = []
  for (const file of [...files].sort((a, b) => a.month.localeCompare(b.month))) {
    for (const day of file.days) {
      if (monthOf(day.date) !== file.month) problems.push(`${day.date}: sits in the ${monthFileName(file.month)} file`)
      days.push(day)
    }
  }
  const expected = indexMonthsOf(files)
  if (JSON.stringify(index.months) !== JSON.stringify(expected)) problems.push('index.json does not list the month files as they are')
  if (index.count !== days.length) problems.push(`index.json counts ${index.count} days, the files hold ${days.length}`)
  if (days.length === 0) return [...problems, 'no days']
  if (index.first !== days[0]!.date || index.last !== days[days.length - 1]!.date) problems.push('index.json first/last do not match the files')
  if (days[0]!.date !== index.launch) problems.push(`the schedule starts on ${days[0]!.date}, not on the launch date ${index.launch}`)

  const boards = new Map<string, string>()
  const puzzles = new Map<string, string>()
  days.forEach((day, i) => {
    const at = (msg: string) => problems.push(`${day.date}: ${msg}`)
    if (i > 0 && day.date !== addDays(days[i - 1]!.date, 1)) at(`does not follow ${days[i - 1]!.date}`)
    if (day.n !== dayNumberOf(day.date) - dayNumberOf(index.launch) + 1) at(`puzzle number ${day.n} does not count from the launch date ${index.launch}`)
    if (day.fp !== puzzleFingerprint(day.puzzle)) at('fp does not match the puzzle')
    const plans = acceptedPlans(day.date, index.launch)
    const fits = (plan: DayPlan): boolean =>
      day.tier === plan.tier && day.theme === plan.theme &&
      (day.fallbackFrom === undefined ? day.size === plan.size : canFallBack(plan) && day.fallbackFrom === plan.size && day.size === FALLBACK_SIZE)
    const plan = plans.find(fits) ?? plans[0]!
    if (day.tier !== plan.tier || day.theme !== plan.theme) at(`is ${day.tier}/${day.theme}, the picker plans ${plan.tier}/${plan.theme}`)
    else if (day.fallbackFrom === undefined) {
      if (day.size !== plan.size) at(`is ${day.size}x${day.size}, the picker plans ${plan.size}x${plan.size}`)
    } else if (!fits(plan)) {
      at(`falls back from ${day.fallbackFrom} to ${day.size}, not allowed for the plan ${plan.size}x${plan.size} ${plan.tier}`)
    }
    if (i > 0) problems.push(...pairProblems(days[i - 1]!, day))
    const board = boardKey(day.puzzle)
    const key = puzzleKey(day.puzzle)
    if (boards.has(board)) at(`same board as ${boards.get(board)}`)
    else if (puzzles.has(key)) at(`same puzzle as ${puzzles.get(key)}`)
    boards.set(board, day.date)
    puzzles.set(key, day.date)
  })

  return problems
}
