import type { TierId } from '../../engine/generator/tiers/index.ts'

/** English wording of the statistics card and its entry on the start screen. */
export const STATS_EN = {
  open: 'Stats',
  summary: (current: number, best: number) => `Streak ${current} · Best ${best}`,
  title: 'Your statistics',
  device: 'Kept on this device only. Nothing is sent anywhere.',
  numbers: {
    played: 'Played',
    solved: 'Solved',
    solveRate: 'Solve rate',
    currentStreak: 'Current streak',
    bestStreak: 'Best streak',
    totalHints: 'Hints used',
    averageHints: 'Hints per puzzle',
  },
  none: '–',
  percent: (rate: number) => `${Math.round(rate * 100)}%`,
  average: (value: number) => (Math.round(value * 10) / 10).toString(),
  streakNote: 'A streak counts consecutive UTC days you solved. A missed day starts it again.',
  times: {
    title: 'Times by difficulty',
    empty: 'Solve a puzzle to see your times.',
    best: 'Best',
    median: 'Median',
    puzzles: (n: number) => (n === 1 ? '1 puzzle' : `${n} puzzles`),
    row: (label: string, best: string, median: string) => `${label}: best ${best}, median ${median}`,
  },
  tier: {
    'very-easy': 'Very easy',
    easy: 'Easy',
    'easy-medium': 'Easy-medium',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  } satisfies Record<TierId, string>,
  close: 'Close',
  reset: {
    button: 'Reset stats',
    title: 'Reset your stats?',
    text: 'This deletes your solved puzzles, times and streaks from this device, and the saved boards of the puzzles you played. Those days show as new again. It cannot be undone.',
    confirm: 'Delete my stats',
    cancel: 'Keep my stats',
    done: 'Your stats were reset.',
    failed: 'Your stats could not be reset. The browser did not allow it.',
  },
} as const
