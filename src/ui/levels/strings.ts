/** Dutch wording of the level list and the solved screen. */
export const LEVELS_NL = {
  title: 'Slaydoku',
  subtitle: 'Los de zaak op',
  listLabel: 'Levels',
  empty: 'Er zijn nog geen levels.',
  levelNumber: (n: number) => `Level ${n}`,
  status: {
    locked: 'Op slot',
    new: 'Nog niet begonnen',
    inProgress: 'Bezig',
    solved: 'Opgelost',
  },
  lockedHint: (previousTitle: string) => `Los eerst ${previousTitle} op.`,
  solvedIn: (formatted: string) => `Tijd: ${formatted}`,
  refused: {
    locked: 'Dit level is nog op slot. Los eerst het vorige level op.',
    unknown: 'Dat level bestaat niet.',
    unsolved: 'Dat level is nog niet opgelost.',
  },
  dismissNotice: 'Sluiten',
  back: 'Levels',
  backLabel: 'Terug naar alle levels',
  solved: {
    title: 'Opgelost!',
    alone: (name: string) => `${name} was alleen met het cadeau.`,
    time: (formatted: string) => `Tijd: ${formatted}`,
    next: (title: string) => `Volgend level: ${title}`,
    toList: 'Alle levels',
    viewBoard: 'Bekijk het bord',
    allDone: 'Alle levels zijn opgelost.',
  },
} as const
