import { VICTIM_TEXT } from '../../engine/clues/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import { useLocale } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { formatDayMonth } from '../../schedule/index.ts'

/** Dutch month names for `dayMonthNl` below (SLAY-10.2): a local day+month, no-year label, the same small-table pattern `src/share/format.ts`'s `dutchLongDate` already uses rather than a shared export (`src/schedule/display.ts` is deliberately English-only). */
const MONTHS_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] as const

/** `29 september`, for a `YYYY-MM-DD` date: the Dutch counterpart of `formatDayMonth` (day + month, no year, lowercase per Dutch convention). */
const dayMonthNl = (date: string): string => `${Number(date.slice(8, 10))} ${MONTHS_NL[Number(date.slice(5, 7)) - 1]}`

/** Shape shared by every language of the start screen and the daily flow. */
export interface DailyStrings {
  title: string
  subtitle: string
  /** `Puzzle of 29 September` (`Puzzel van 29 september`): the puzzle's date-based label (SLAY-10.2). The puzzle number itself stays internal only (storage keys, stats dedup — never shown). */
  puzzleLabel: (date: string) => string
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
    /** SLAY-9.16: reopens the board from a fresh app/tab landing on '/' after the day is already solved (PWA reopen dead end). */
    viewBoard: string
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
  /** Quiet footer link to GitHub Sponsors, next to the About link (SLAY-9.22). */
  support: string
  back: string
  backLabel: string
  slots: { share: string; stats: string }
  /** SLAY-9.18: what the game is, for a first-time visitor, next to a short recording of real play. */
  intro: {
    title: string
    text: string
    /** Under the recording: the moves it shows. */
    caption: string
    /** Alt text of the recording. */
    alt: string
  }
}

/** English wording of the start screen and the daily flow. */
export const DAILY_EN: DailyStrings = {
  title: 'Slaydoku',
  subtitle: 'A new murder mystery every day',
  puzzleLabel: (date) => `Puzzle of ${formatDayMonth(date)}`,
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
    viewBoard: 'View board',
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
  support: 'Support Slaydoku',
  back: 'Back',
  backLabel: 'Back to the start screen',
  slots: { share: 'Share', stats: 'Statistics' },
  intro: {
    title: 'What is Slaydoku?',
    text: 'A logic puzzle about a murder. Every day brings a new floor plan and a handful of suspects. Every row and every column holds exactly one person, and each card tells you where someone stood. Place everybody: whoever was alone in a room with the victim is the murderer.',
    caption: 'Read a card, jot notes, hold a square to place someone. Stuck? Ask for a hint.',
    alt: 'A short recording of a game: a suspect’s card is read, two notes go on the board, two suspects are placed, then a hint opens.',
  },
}

/**
 * Dutch wording of the start screen and the daily flow (SLAY-3.4). `VICTIM_TEXT.noun` ("the
 * victim") is engine content (`src/engine/clues/`), out of this story's References, so the solved
 * sentence spells "het slachtoffer" directly instead of reusing it.
 */
export const DAILY_NL: DailyStrings = {
  title: 'Slaydoku',
  subtitle: 'Elke dag een nieuw moordmysterie',
  puzzleLabel: (date) => `Puzzel van ${dayMonthNl(date)}`,
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
    viewBoard: 'Bekijk bord',
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
  support: 'Steun Slaydoku',
  back: 'Terug',
  backLabel: 'Terug naar het startscherm',
  slots: { share: 'Delen', stats: 'Statistieken' },
  intro: {
    title: 'Wat is Slaydoku?',
    text: 'Een logische puzzel over een moord. Elke dag een nieuwe plattegrond en een handvol verdachten. In elke rij en elke kolom staat precies één persoon, en elk kaartje vertelt waar iemand stond. Zet iedereen op zijn plek: wie alleen met het slachtoffer in een kamer was, is de moordenaar.',
    caption: 'Lees een kaartje, maak notities, houd een vakje vast om iemand te plaatsen. Vast? Vraag een hint.',
    alt: 'Een korte opname van een spel: het kaartje van een verdachte wordt gelezen, er komen twee notities op het bord, twee verdachten worden geplaatst en er opent een hint.',
  },
}

/** Both languages of the start screen and daily flow, keyed by `Locale`. */
export const DAILY_STRINGS: Record<Locale, DailyStrings> = { en: DAILY_EN, nl: DAILY_NL }

/** The start screen / daily flow strings in the reader's current locale. */
export function useDailyStrings(): DailyStrings {
  const { locale } = useLocale()
  return DAILY_STRINGS[locale]
}
