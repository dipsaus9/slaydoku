/**
 * Everything the "How it works" card and the Help panel say, in English. This is the one file to edit
 * to change the wording; see README.md. `bun run test` guards the lengths.
 */

/** Which drawing a step gets (portraits from src/render/cards, with a toolbar icon where a button is meant). */
export type HelpIcon = 'pick' | 'note' | 'place' | 'hint'

export interface HelpStep {
  icon: HelpIcon
  title: string
  text: string
}

export interface HelpContent {
  /**
   * Raise this number after a real change of the rules or the wording: everyone gets the card
   * once more on the first visit of level 1 (what was seen is remembered per version).
   */
  version: number
  /** Heading of the card and the panel. */
  title: string
  /** The goal: at most 5 short sentences, shown in order. */
  goal: readonly string[]
  stepsTitle: string
  /** Three or four how-to steps. */
  steps: readonly HelpStep[]
  /** Small extra list behind a collapsed "more" line: [what, how]. */
  more: { title: string; items: readonly (readonly [string, string])[] }
  keywords: {
    /** The button that opens the glossary; the glossary is never shown by default. */
    button: string
    title: string
    otherTitle: string
    example: string
    back: string
  }
  /**
   * The Legend card: what is drawn on THIS board. The rows about objects, doors and windows are built
   * from the level (src/ui/help/legend.ts); only the words around them live here.
   */
  legend: {
    /** The toolbar button and the button on the how-it-works card. */
    button: string
    title: string
    intro: string
    objectsTitle: string
    /** A person can stand on it / cannot (the flag of every object row). */
    canOccupy: string
    blocked: string
    /** Shown behind the noun of an object row that covers several kinds that look alike: "also: ...". */
    also: string
    /** Tapping a row shows where it is on the board. */
    tapHint: string
    /** Text on the screen that shows the squares. */
    peek: string
    edgesTitle: string
    door: { noun: string; text: string }
    window: { noun: string; text: string }
    roomsTitle: string
    roomLabel: { noun: string; text: string }
    marksTitle: string
    note: { noun: string; text: string }
    cross: { noun: string; text: string }
    person: { noun: string; text: string }
    gift: { noun: string; text: string }
    ruleTitle: string
    rule: string
    /** Closes the card. */
    close: string
  }
  /** Closes the card. */
  close: string
  /** Small link on the level list that reopens the card. */
  link: string
}

export const help: HelpContent = {
  version: 2,
  title: 'How it works',
  goal: [
    'Everybody stands somewhere on the board.',
    'Every row and every column holds exactly one person.',
    'The cards tell you where everybody stood.',
    'The victim was alone in a room with exactly one person.',
    'That person is the murderer.',
  ],
  stepsTitle: 'How to play',
  steps: [
    { icon: 'pick', title: 'Pick a person', text: 'Tap a photo next to the board.' },
    { icon: 'note', title: 'Tap to make a note', text: 'Tap a square: this person could stand here.' },
    { icon: 'place', title: 'Hold to place', text: 'Hold a square: the person really stands there.' },
    { icon: 'hint', title: 'Stuck? Ask for a hint', text: 'Tap Hint for help in small steps.' },
  ],
  more: {
    title: 'More about the buttons',
    items: [
      ['Drag', 'Drag over squares to fill or clear several at once.'],
      ['X', 'Rule out squares for the selected person.'],
      ['Erase', 'Tap a square to clear it. Hold the button to clear everything.'],
      ['Undo and Redo', 'Take back your last move, or do it again.'],
    ],
  },
  keywords: {
    button: 'Keywords',
    title: 'Keywords on the cards',
    otherTitle: 'Good to know',
    example: 'Example',
    back: 'Back to the guide',
  },
  legend: {
    button: 'Legend',
    title: 'Legend',
    intro: 'This is what is on this board.',
    objectsTitle: 'Objects',
    canOccupy: 'Can be occupied',
    blocked: 'Blocked',
    also: 'also',
    tapHint: 'Tap a row to see where it is.',
    peek: 'Tap to go back to the legend',
    edgesTitle: 'Doors and windows',
    door: { noun: 'Door', text: 'An opening in the wall.' },
    window: { noun: 'Window', text: 'A window in the wall. Cards can say: next to a window.' },
    roomsTitle: 'Rooms',
    roomLabel: { noun: 'Room name', text: 'Every room has a name. Cards use that name.' },
    marksTitle: 'On the board',
    note: { noun: 'Note', text: 'A letter in a square: this person could stand here.' },
    cross: { noun: 'Cross', text: 'This person cannot stand here.' },
    person: { noun: 'Person', text: 'A portrait: this person really stands here.' },
    gift: { noun: 'The victim', text: 'Stands somewhere on the board too.' },
    ruleTitle: 'The rule',
    rule: 'The victim is alone in a room with exactly one person.',
    close: 'Close',
  },
  close: 'Start playing',
  link: 'How it works',
}
