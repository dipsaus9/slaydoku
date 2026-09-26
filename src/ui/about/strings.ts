/** Everything the About page says, in English. The one file to edit to change its wording. */
export const ABOUT_EN = {
  title: 'About Slaydoku',
  tagline: 'A new murder mystery puzzle every day',
  back: 'Back to the puzzles',
  how: {
    title: 'How it works',
    lines: [
      'Read the clue cards: every suspect says where they stood.',
      'Place each suspect on the floor plan, one per row and column.',
      'Stuck? Make notes, or ask for a hint in small steps.',
      'The murderer is the one suspect who was alone with the victim in a room.',
    ],
  },
  credit: {
    title: 'Credit',
    inspired: 'Inspired by Murdoku by Manuel Garand.',
    original: 'Slaydoku is an independent project. No official assets are used: every puzzle, name and drawing here is original.',
  },
  privacy: {
    title: 'Privacy',
    text: 'Everything stays on your device: no accounts, no tracking.',
  },
  openSource: {
    title: 'Open source',
    text: 'Slaydoku is open source, released under the MIT license.',
  },
  contact: {
    title: 'Contact',
    placeholder: 'Contact details will be added here.',
  },
} as const
