import type { Locale } from '../../locale/index.ts'

interface AboutStrings {
  title: string
  tagline: string
  back: string
  how: { title: string; lines: string[] }
  credit: { title: string; inspired: string; original: string }
  privacy: { title: string; text: string }
  openSource: { title: string; text: string }
  contact: { title: string; placeholder: string }
}

/** Everything the About page says, in English. The one file to edit to change its wording. */
const EN: AboutStrings = {
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
}

/** Dutch wording of the About page. 'Slaydoku' is a brand name and stays unchanged. */
const NL: AboutStrings = {
  title: 'Over Slaydoku',
  tagline: 'Elke dag een nieuwe moordmysteriepuzzel',
  back: 'Terug naar de puzzels',
  how: {
    title: 'Hoe het werkt',
    lines: [
      'Lees de aanwijzingkaarten: elke verdachte zegt waar hij of zij stond.',
      'Plaats elke verdachte op de plattegrond, één per rij en kolom.',
      'Vastgelopen? Maak aantekeningen, of vraag in kleine stapjes om een hint.',
      'De moordenaar is de ene verdachte die alleen met het slachtoffer in een kamer was.',
    ],
  },
  credit: {
    title: 'Met dank aan',
    inspired: 'Geïnspireerd door Murdoku van Manuel Garand.',
    original: 'Slaydoku is een onafhankelijk project. Er wordt geen officieel materiaal gebruikt: elke puzzel, naam en tekening hier is origineel.',
  },
  privacy: {
    title: 'Privacy',
    text: 'Alles blijft op je apparaat: geen accounts, geen tracking.',
  },
  openSource: {
    title: 'Open source',
    text: 'Slaydoku is open source, uitgebracht onder de MIT-licentie.',
  },
  contact: {
    title: 'Contact',
    placeholder: 'Contactgegevens volgen hier nog.',
  },
}

/** The About page's wording per locale. Read through `useLocale()`, never English alone. */
export const ABOUT_STRINGS: Record<Locale, AboutStrings> = { en: EN, nl: NL }
