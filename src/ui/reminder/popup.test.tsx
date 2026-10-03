import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../locale/index.ts'
import type { StorageLike } from '../../pwa/install.ts'
import type { ReminderState, ReminderStatus, ReminderStore } from '../../pwa/reminder.ts'
import { ReminderDialogView } from './ReminderDialog.tsx'
import { POPUP_DISMISS_KEY, POPUP_SNOOZE_MS, isSnoozed, readPopupDismissed, shouldOfferPopup, writePopupDismissed } from './popup.ts'
import { SolveReminderPopup } from './SolveReminderPopup.tsx'
import { ReminderStoreProvider } from './store.tsx'
import { REMINDER_STRINGS } from './strings.ts'

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}
const throwing: StorageLike = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}
const NOW = Date.parse('2026-10-15T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000

describe('shouldOfferPopup', () => {
  const offered = (status: ReminderStatus, storage: StorageLike | null = memory()) => shouldOfferPopup(status, storage, NOW)

  it('offers only while the store is off', () => {
    expect(offered('off')).toBe(true)
    for (const status of ['unavailable', 'on', 'blocked', 'busy', 'error'] as const) expect(offered(status)).toBe(false)
  })

  it('stays quiet for 14 days after a dismissal, then returns', () => {
    const storage = memory()
    writePopupDismissed(storage, NOW)
    expect(storage.data.get(POPUP_DISMISS_KEY)).toBe(String(NOW))
    expect(shouldOfferPopup('off', storage, NOW + 13 * DAY)).toBe(false)
    expect(shouldOfferPopup('off', storage, NOW + 14 * DAY)).toBe(true)
    expect(POPUP_SNOOZE_MS).toBe(14 * DAY)
  })

  it('ignores a garbage value and survives storage that throws or is missing', () => {
    const storage = memory()
    storage.data.set(POPUP_DISMISS_KEY, 'not a number')
    expect(readPopupDismissed(storage)).toBeNull()
    expect(offered('off', storage)).toBe(true)
    expect(offered('off', throwing)).toBe(true)
    expect(offered('off', null)).toBe(true)
    expect(() => writePopupDismissed(throwing, NOW)).not.toThrow()
    expect(() => writePopupDismissed(null, NOW)).not.toThrow()
    expect(isSnoozed(null, NOW)).toBe(false)
  })
})

describe.each(['en', 'nl'] as const)('solve popup (%s)', (locale) => {
  const t = REMINDER_STRINGS[locale]
  const store = (status: ReminderStatus): ReminderStore => {
    const state: ReminderState = { status, hour: null }
    return { subscribe: () => () => {}, getSnapshot: () => state, enable: async () => {}, changeHour: async () => {}, disable: async () => {} }
  }
  const render = (node: React.ReactNode, status: ReminderStatus = 'off') =>
    renderToStaticMarkup(
      <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
        <ReminderStoreProvider store={store(status)}>{node}</ReminderStoreProvider>
      </LocaleProvider>,
    )

  it('renders nothing on mount: the solved result comes first, the dialog opens after the delay', () => {
    expect(render(<SolveReminderPopup storage={memory()} />)).toBe('')
  })

  it('uses the reminder dialog form with a Not now button instead of Close', () => {
    const html = renderToStaticMarkup(
      <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
        <ReminderDialogView state={{ status: 'off', hour: null }} enabled hour={8} onEnabled={() => {}} onHour={() => {}} onSave={() => {}} onClose={() => {}} closeLabelKey="notNow" />
      </LocaleProvider>,
    )
    expect(html).toContain(`>${t.notNow}<`)
    expect(html).not.toContain(`>${t.close}<`)
    expect(html).toContain('data-reminder-hour')
    expect(html).toContain(`>${t.save}<`)
    expect(html).toContain('<option value="23">23:00</option>')
  })

  it('has its own wording per language', () => {
    expect(REMINDER_STRINGS.en.notNow).toBe('Not now')
    expect(REMINDER_STRINGS.nl.notNow).toBe('Nu niet')
  })
})
