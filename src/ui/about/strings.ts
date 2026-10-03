import type { Locale } from '../../locale/index.ts'

interface AboutStrings {
  title: string
  tagline: string
  back: string
  how: { title: string; lines: string[] }
  credit: { title: string; inspired: string; original: string }
  privacy: { title: string; text: string }
  /** What the optional daily reminder stores on the server, and how to stop it (SLAY-14.11). */
  reminder: { title: string; text: string; off: string }
  openSource: { title: string; text: string }
  /** Quiet GitHub Sponsors section, near the open-source one (SLAY-9.22). */
  support: { title: string; text: string; link: string }
}

/** Everything the About page says, in English. The one file to edit to change its wording. */
export const ABOUT_EN: AboutStrings = {
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
    text: 'Your own stats and streaks stay on your device. Slaydoku also counts anonymous daily totals — how many puzzles were started and solved. No accounts, no per-player identifier, no cookie.',
  },
  reminder: {
    title: 'Daily reminder',
    text: 'If you switch on the daily reminder, our reminder service stores two things on a server: your device\u2019s push subscription and the hour you chose. Nothing else: no name, no email, no puzzle progress, no stats. The notification itself carries no puzzle information.',
    off: 'To turn it off, open Options on the puzzle screen (or the reminder row on the start screen), switch the reminder off and save. That deletes the stored subscription. You can also block notifications for Slaydoku in your device settings.',
  },
  openSource: {
    title: 'Open source',
    text: 'Slaydoku is open source, released under the MIT license.',
  },
  support: {
    title: 'Support Slaydoku',
    text: 'Enjoying the puzzle? Slaydoku has no ads and no accounts — if you’d like to support its development, you can do so on',
    link: 'GitHub Sponsors',
  },
}

/** Dutch wording of the About page. 'Slaydoku' is a brand name and stays unchanged. */
export const ABOUT_NL: AboutStrings = {
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
    text: 'Je eigen statistieken en reeksen blijven op je apparaat. Slaydoku telt ook anonieme dagtotalen — hoeveel puzzels er gestart en opgelost werden. Geen accounts, geen identificatie per speler, geen cookie.',
  },
  reminder: {
    title: 'Dagelijkse herinnering',
    text: 'Zet je de dagelijkse herinnering aan, dan bewaart onze herinneringsdienst twee dingen op een server: het pushabonnement van je apparaat en het uur dat je koos. Verder niets: geen naam, geen e-mail, geen puzzelvoortgang, geen statistieken. De melding zelf bevat geen puzzelinformatie.',
    off: 'Uitzetten kan via Opties op het puzzelscherm (of de herinneringsrij op het startscherm): zet de herinnering uit en sla op. Dan wordt het bewaarde abonnement verwijderd. Je kunt meldingen voor Slaydoku ook blokkeren in je apparaatinstellingen.',
  },
  openSource: {
    title: 'Open source',
    text: 'Slaydoku is open source, uitgebracht onder de MIT-licentie.',
  },
  support: {
    title: 'Steun Slaydoku',
    text: 'Vind je de puzzel leuk? Slaydoku heeft geen advertenties en geen accounts — als je de ontwikkeling wilt steunen, kan dat via',
    link: 'GitHub Sponsors',
  },
}

/** The About page's wording per locale. Read through `useLocale()`, never English alone. */
export const ABOUT_STRINGS: Record<Locale, AboutStrings> = { en: ABOUT_EN, nl: ABOUT_NL }
