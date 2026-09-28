import { VICTIM_TEXT } from '../../engine/clues/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import { useLocale } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'

/** Shape shared by every language of the start screen and the daily flow. */
export interface DailyStrings {
  title: string
  subtitle: string
  puzzleNumber: (n: number) => string
  tier: Record<TierId, string>
  difficulty: string
  size: (n: number) => string
  play: string
  continue: string
  endsIn: string
  endsAt: (when: string) => string
  nextIn: string
  nextAt: (when: string) => string
  ended: string
  countdownLabel: (span: string) => string
  solved: {
    title: string
    alone: (name: string) => string
    time: (formatted: string) => string
    hints: (n: number) => string
  }
  before: {
    title: (date: string) => string
    text: string
    startsIn: string
    startsAt: (when: string) => string
  }
  after: { title: string; text: string }
  rollover: { banner: string; show: (n: number) => string; dismiss: string }
  loading: string
  error: { title: string; text: string; retry: string }
  about: string
  back: string
  backLabel: string
  slots: { share: string; stats: string }
}

/** English wording of the start screen and the daily flow. */
export const DAILY_EN: DailyStrings = {
  title: 'Slaydoku',
  subtitle: 'A new murder mystery every day',
  puzzleNumber: (n) => `Puzzle #${n}`,
  tier: {
    'very-easy': 'Very easy',
    easy: 'Easy',
    'easy-medium': 'Easy-medium',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  },
  difficulty: 'Difficulty',
  size: (n) => `${n} × ${n} grid`,
  play: 'Play',
  continue: 'Continue',
  endsIn: 'Ends in',
  endsAt: (when) => `Ends at ${when}`,
  nextIn: 'Next puzzle in',
  nextAt: (when) => `New puzzle at ${when}`,
  ended: 'This puzzle has ended.',
  countdownLabel: (span) => `${span} left`,
  solved: {
    title: 'Solved!',
    alone: (name) => `You found the murderer! ${name} was alone with ${VICTIM_TEXT.noun}.`,
    time: (formatted) => `Time: ${formatted}`,
    hints: (n) => (n === 0 ? 'No hints' : n === 1 ? '1 hint' : `${n} hints`),
  },
  before: {
    title: (date) => `Slaydoku starts on ${date}`,
    text: 'The first puzzle is waiting.',
    startsIn: 'Starts in',
    startsAt: (when) => `Starts at ${when}`,
  },
  after: {
    title: 'New puzzles are coming soon',
    text: 'Check back later.',
  },
  rollover: {
    banner: 'New puzzle available',
    show: (n) => `Show puzzle #${n}`,
    dismiss: 'Hide this notice',
  },
  loading: 'Loading the puzzle…',
  error: {
    title: 'The puzzle could not be loaded',
    text: 'Check your connection and try again.',
    retry: 'Try again',
  },
  about: 'About Slaydoku',
  back: 'Back',
  backLabel: 'Back to the start screen',
  slots: { share: 'Share', stats: 'Statistics' },
}

/**
 * Dutch wording of the start screen and the daily flow (SLAY-3.4). `VICTIM_TEXT.noun` ("the
 * victim") is engine content (`src/engine/clues/`), out of this story's References, so the solved
 * sentence spells "het slachtoffer" directly instead of reusing it.
 */
export const DAILY_NL: DailyStrings = {
  title: 'Slaydoku',
  subtitle: 'Elke dag een nieuw moordmysterie',
  puzzleNumber: (n) => `Puzzel #${n}`,
  tier: {
    'very-easy': 'Heel makkelijk',
    easy: 'Makkelijk',
    'easy-medium': 'Makkelijk-gemiddeld',
    medium: 'Gemiddeld',
    hard: 'Moeilijk',
    expert: 'Expert',
  },
  difficulty: 'Moeilijkheid',
  size: (n) => `${n} × ${n} raster`,
  play: 'Spelen',
  continue: 'Verder',
  endsIn: 'Eindigt over',
  endsAt: (when) => `Eindigt om ${when}`,
  nextIn: 'Volgende puzzel over',
  nextAt: (when) => `Nieuwe puzzel om ${when}`,
  ended: 'Deze puzzel is afgelopen.',
  countdownLabel: (span) => `${span} resterend`,
  solved: {
    title: 'Opgelost!',
    alone: (name) => `Je hebt de moordenaar gevonden! ${name} was alleen met het slachtoffer.`,
    time: (formatted) => `Tijd: ${formatted}`,
    hints: (n) => (n === 0 ? 'Geen hints' : n === 1 ? '1 hint' : `${n} hints`),
  },
  before: {
    title: (date) => `Slaydoku start op ${date}`,
    text: 'De eerste puzzel staat klaar.',
    startsIn: 'Start over',
    startsAt: (when) => `Start om ${when}`,
  },
  after: {
    title: 'Nieuwe puzzels komen er binnenkort aan',
    text: 'Kom later nog eens terug.',
  },
  rollover: {
    banner: 'Nieuwe puzzel beschikbaar',
    show: (n) => `Toon puzzel #${n}`,
    dismiss: 'Verberg deze melding',
  },
  loading: 'De puzzel wordt geladen…',
  error: {
    title: 'De puzzel kon niet worden geladen',
    text: 'Controleer je verbinding en probeer het opnieuw.',
    retry: 'Opnieuw proberen',
  },
  about: 'Over Slaydoku',
  back: 'Terug',
  backLabel: 'Terug naar het startscherm',
  slots: { share: 'Delen', stats: 'Statistieken' },
}

/** Both languages of the start screen and daily flow, keyed by `Locale`. */
export const DAILY_STRINGS: Record<Locale, DailyStrings> = { en: DAILY_EN, nl: DAILY_NL }

/** The start screen / daily flow strings in the reader's current locale. */
export function useDailyStrings(): DailyStrings {
  const { locale } = useLocale()
  return DAILY_STRINGS[locale]
}
