import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { Locale } from '../../locale/index.ts'

interface StatsStrings {
  open: string
  summary: (current: number, best: number) => string
  title: string
  numbers: {
    played: string
    solved: string
    solveRate: string
    currentStreak: string
    bestStreak: string
    totalHints: string
    averageHints: string
  }
  none: string
  percent: (rate: number) => string
  average: (value: number) => string
  streakNote: string
  times: {
    title: string
    empty: string
    best: string
    median: string
    puzzles: (n: number) => string
    row: (label: string, best: string, median: string) => string
  }
  tier: Record<TierId, string>
  close: string
  reset: {
    button: string
    title: string
    text: string
    confirm: string
    cancel: string
    done: string
    failed: string
  }
}

/** English wording of the statistics card and its entry on the start screen. */
export const STATS_EN: StatsStrings = {
  open: 'Stats',
  summary: (current, best) => `Streak ${current} · Best ${best}`,
  title: 'Your statistics',
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
  percent: (rate) => `${Math.round(rate * 100)}%`,
  average: (value) => (Math.round(value * 10) / 10).toString(),
  streakNote: 'A streak counts consecutive UTC days you solved. A missed day starts it again.',
  times: {
    title: 'Times by difficulty',
    empty: 'Solve a puzzle to see your times.',
    best: 'Best',
    median: 'Median',
    puzzles: (n) => (n === 1 ? '1 puzzle' : `${n} puzzles`),
    row: (label, best, median) => `${label}: best ${best}, median ${median}`,
  },
  tier: {
    'very-easy': 'Very easy',
    easy: 'Easy',
    'easy-medium': 'Easy-medium',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  },
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
}

/** Dutch wording of the statistics card and its entry on the start screen. */
export const STATS_NL: StatsStrings = {
  open: 'Statistieken',
  summary: (current, best) => `Reeks ${current} · Beste ${best}`,
  title: 'Jouw statistieken',
  numbers: {
    played: 'Gespeeld',
    solved: 'Opgelost',
    solveRate: 'Oplospercentage',
    currentStreak: 'Huidige reeks',
    bestStreak: 'Beste reeks',
    totalHints: 'Hints gebruikt',
    averageHints: 'Hints per puzzel',
  },
  none: '–',
  percent: (rate) => `${Math.round(rate * 100)}%`,
  average: (value) => (Math.round(value * 10) / 10).toString(),
  streakNote: 'Een reeks telt opeenvolgende UTC-dagen die je hebt opgelost. Een gemiste dag begint hem opnieuw.',
  times: {
    title: 'Tijden per moeilijkheidsgraad',
    empty: 'Los een puzzel op om je tijden te zien.',
    best: 'Beste',
    median: 'Mediaan',
    puzzles: (n) => (n === 1 ? '1 puzzel' : `${n} puzzels`),
    row: (label, best, median) => `${label}: beste ${best}, mediaan ${median}`,
  },
  tier: {
    'very-easy': 'Heel makkelijk',
    easy: 'Makkelijk',
    'easy-medium': 'Makkelijk-gemiddeld',
    medium: 'Gemiddeld',
    hard: 'Moeilijk',
    expert: 'Expert',
  },
  close: 'Sluiten',
  reset: {
    button: 'Statistieken wissen',
    title: 'Statistieken wissen?',
    text: 'Dit verwijdert je opgeloste puzzels, tijden en reeksen van dit apparaat, en de opgeslagen borden van de puzzels die je speelde. Die dagen worden weer als nieuw getoond. Dit kan niet ongedaan worden gemaakt.',
    confirm: 'Verwijder mijn statistieken',
    cancel: 'Bewaar mijn statistieken',
    done: 'Je statistieken zijn gewist.',
    failed: 'Je statistieken konden niet worden gewist. De browser stond dit niet toe.',
  },
}

/** The statistics card's wording per locale. Read through `useLocale()`, never English alone. */
export const STATS_STRINGS: Record<Locale, StatsStrings> = { en: STATS_EN, nl: STATS_NL }
