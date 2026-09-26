import { VICTIM_TEXT } from '../../engine/clues/index.ts'

/** English wording of the level list and the solved screen. */
export const LEVELS_EN = {
  title: 'Slaydoku',
  subtitle: 'Solve the case',
  listLabel: 'Levels',
  empty: 'There are no levels yet.',
  levelNumber: (n: number) => `Level ${n}`,
  status: {
    locked: 'Locked',
    new: 'Not started',
    inProgress: 'In progress',
    solved: 'Solved',
  },
  lockedHint: (previousTitle: string) => `Solve ${previousTitle} first.`,
  solvedIn: (formatted: string) => `Time: ${formatted}`,
  refused: {
    locked: 'This level is still locked. Solve the previous level first.',
    unknown: 'That level does not exist.',
    unsolved: 'That level has not been solved yet.',
  },
  about: 'About Slaydoku',
  dismissNotice: 'Close',
  back: 'Levels',
  backLabel: 'Back to all levels',
  solved: {
    title: 'Solved!',
    alone: (name: string) => `You found the murderer! ${name} was alone with ${VICTIM_TEXT.noun}.`,
    time: (formatted: string) => `Time: ${formatted}`,
    next: (title: string) => `Next level: ${title}`,
    toList: 'All levels',
    viewBoard: 'View the board',
    allDone: 'All levels are solved.',
  },
} as const
