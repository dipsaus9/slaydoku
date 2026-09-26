/** The save slot id of a daily puzzle: `daily-<n>` (board save `slaydoku:game:daily-<n>`, telemetry puzzle id). */
export const dailyId = (n: number): string => `daily-${n}`
