import { VICTIM_TEXT } from '../../engine/clues/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'

/** English wording of the start screen and the daily flow. */
export const DAILY_EN = {
  title: 'Slaydoku',
  subtitle: 'A new murder mystery every day',
  puzzleNumber: (n: number) => `Puzzle #${n}`,
  tier: {
    'very-easy': 'Very easy',
    easy: 'Easy',
    'easy-medium': 'Easy-medium',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  } satisfies Record<TierId, string>,
  difficulty: 'Difficulty',
  size: (n: number) => `${n} × ${n} grid`,
  play: 'Play',
  continue: 'Continue',
  endsIn: 'Ends in',
  endsAt: (when: string) => `Ends at ${when}`,
  nextIn: 'Next puzzle in',
  nextAt: (when: string) => `New puzzle at ${when}`,
  ended: 'This puzzle has ended.',
  countdownLabel: (span: string) => `${span} left`,
  solved: {
    title: 'Solved!',
    alone: (name: string) => `You found the murderer! ${name} was alone with ${VICTIM_TEXT.noun}.`,
    time: (formatted: string) => `Time: ${formatted}`,
    hints: (n: number) => (n === 0 ? 'No hints' : n === 1 ? '1 hint' : `${n} hints`),
  },
  before: {
    title: (date: string) => `Slaydoku starts on ${date}`,
    text: 'The first puzzle is waiting.',
    startsIn: 'Starts in',
    startsAt: (when: string) => `Starts at ${when}`,
  },
  after: {
    title: 'New puzzles are coming soon',
    text: 'Check back later.',
  },
  rollover: {
    banner: 'New puzzle available',
    show: (n: number) => `Show puzzle #${n}`,
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
} as const
