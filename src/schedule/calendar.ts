import type { ThemeId } from '../content/themes/index.ts'

/*
 * Seasonal theme rules (SLAY-18.1). Pure data plus one pure lookup: a date inside a rule's window gets the rule's theme instead of the
 * normal five-theme rotation (see `themeOf` in pick.ts). Windows are yearly month/day ranges compared on the `MM-DD` text of the date, so
 * they repeat every year and the leap day (02-29) never shifts them. Simpshouse is the exception: a list of full dates.
 */

/** A yearly window, inclusive, as `MM-DD` text (`from` <= `to`; a window never wraps over New Year). */
export interface YearlyWindow {
  from: string
  to: string
}

export interface SeasonalRule {
  theme: ThemeId
  /** Yearly windows that trigger the rule. */
  windows?: readonly YearlyWindow[]
  /** Full `YYYY-MM-DD` dates that trigger the rule (one-off days). */
  dates?: readonly string[]
}

/** Dates of the Simpshouse theme. Adding one is a one-line change. */
export const SIMPSHOUSE_DATES: readonly string[] = ['2026-10-14']

/** Seasonal rules, highest priority first: the first rule whose window holds the date wins. */
export const SEASONAL_RULES: readonly SeasonalRule[] = [
  { theme: 'simpshouse', dates: SIMPSHOUSE_DATES },
  { theme: 'carnaval', windows: [{ from: '11-11', to: '11-11' }] },
  { theme: 'christmas', windows: [{ from: '12-01', to: '12-31' }] },
  { theme: 'halloween', windows: [{ from: '10-17', to: '10-31' }] },
  // Fall: 1-16 October and November except the 11th (Carnaval's day, left out here too so Fall never claims it).
  { theme: 'fall', windows: [{ from: '10-01', to: '10-16' }, { from: '11-01', to: '11-10' }, { from: '11-12', to: '11-30' }] },
]

/** Whether a date falls in a rule (windows by `MM-DD`, dates by the full text). */
export function ruleHolds(rule: SeasonalRule, date: string): boolean {
  const monthDay = date.slice(5)
  if (rule.dates?.includes(date)) return true
  return (rule.windows ?? []).some((w) => monthDay >= w.from && monthDay <= w.to)
}

/**
 * The seasonal theme of a date, or undefined for a plain day. A rule only applies when its theme is registered (`isRegistered`), so a
 * rule whose theme does not exist yet is skipped and the next rule (or the normal rotation) takes the day.
 */
export function seasonalThemeOf(
  date: string,
  isRegistered: (id: ThemeId) => boolean,
  rules: readonly SeasonalRule[] = SEASONAL_RULES,
): ThemeId | undefined {
  return rules.find((rule) => isRegistered(rule.theme) && ruleHolds(rule, date))?.theme
}
