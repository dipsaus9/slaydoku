import type { Locale } from '../../locale/index.ts'

export interface ReminderStrings {
  /** Row label and dialog title. */
  title: string
  /** Start-screen row: what it does, quiet. */
  rowText: string
  /** The button that opens the dialog. */
  open: string
  /** The one-line state under the Options entry and in the row. */
  summary: { off: string; on: (time: string) => string; blocked: string }
  toggle: string
  toggleHelp: string
  hourLabel: string
  /** `08:00` -> option text. */
  hourOption: (hour: number) => string
  save: string
  saving: string
  close: string
  blocked: string
  error: string
}

/** English wording of the daily reminder UI (SLAY-14.10). */
export const REMINDER_EN: ReminderStrings = {
  title: 'Daily reminder',
  rowText: 'Get a reminder when the new puzzle is ready.',
  open: 'Set reminder',
  summary: {
    off: 'Off',
    on: (time) => `On, every day at ${time} Amsterdam time`,
    blocked: 'Blocked in your device settings',
  },
  toggle: 'Remind me every day',
  toggleHelp: 'A quiet notification with the new puzzle.',
  hourLabel: 'Time (Amsterdam time)',
  hourOption: (hour) => `${String(hour).padStart(2, '0')}:00`,
  save: 'Save',
  saving: 'Saving...',
  close: 'Close',
  blocked: 'Notifications are blocked for Slaydoku. Allow them in your device settings, then try again.',
  error: 'Saving the reminder failed. Check your connection and try again.',
}

/** Dutch wording of the daily reminder UI. */
export const REMINDER_NL: ReminderStrings = {
  title: 'Dagelijkse herinnering',
  rowText: 'Krijg een herinnering als de nieuwe puzzel klaarstaat.',
  open: 'Herinnering instellen',
  summary: {
    off: 'Uit',
    on: (time) => `Aan, elke dag om ${time} Amsterdamse tijd`,
    blocked: 'Geblokkeerd in je apparaatinstellingen',
  },
  toggle: 'Herinner me elke dag',
  toggleHelp: 'Een rustige melding met de nieuwe puzzel.',
  hourLabel: 'Tijd (Amsterdamse tijd)',
  hourOption: (hour) => `${String(hour).padStart(2, '0')}:00`,
  save: 'Opslaan',
  saving: 'Opslaan...',
  close: 'Sluiten',
  blocked: 'Meldingen zijn geblokkeerd voor Slaydoku. Sta ze toe in je apparaatinstellingen en probeer het opnieuw.',
  error: 'Opslaan van de herinnering is mislukt. Controleer je verbinding en probeer het opnieuw.',
}

/** The reminder UI's wording per locale. Read through `useLocale()`, never English alone. */
export const REMINDER_STRINGS: Record<Locale, ReminderStrings> = { en: REMINDER_EN, nl: REMINDER_NL }
