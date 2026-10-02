import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import type { ReminderState, ReminderStatus, ReminderStore } from '../../pwa/reminder.ts'
import { OptionsPanel } from '../play/OptionsPanel.tsx'
import { ReminderDialogView } from './ReminderDialog.tsx'
import { ReminderOptionsEntry, ReminderRow } from './ReminderEntries.tsx'
import { DEFAULT_HOUR, HOURS, saveReminder } from './save.ts'
import { ReminderStoreProvider } from './store.tsx'
import { REMINDER_STRINGS } from './strings.ts'

const fakeStore = (status: ReminderStatus, hour: number | null = null): ReminderStore & { state: ReminderState } => {
  const store = {
    state: { status, hour } as ReminderState,
    subscribe: () => () => {},
    getSnapshot: () => store.state,
    enable: vi.fn(async (h: number) => void (store.state = { status: 'on', hour: h })),
    changeHour: vi.fn(async (h: number) => void (store.state = { status: 'on', hour: h })),
    disable: vi.fn(async () => void (store.state = { status: 'off', hour: null })),
  }
  return store
}

const withApp = (locale: Locale, store: ReminderStore, node: React.ReactNode) =>
  renderToStaticMarkup(
    <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
      <ReminderStoreProvider store={store}>{node}</ReminderStoreProvider>
    </LocaleProvider>,
  )

describe.each(['en', 'nl'] as const)('reminder UI (%s)', (locale) => {
  const t = REMINDER_STRINGS[locale]

  it('renders neither the row nor the Options entry while unavailable', () => {
    const store = fakeStore('unavailable')
    expect(withApp(locale, store, <ReminderRow />)).toBe('')
    expect(withApp(locale, store, <ReminderOptionsEntry onOpen={() => {}} />)).toBe('')
  })

  it.each(['off', 'on', 'blocked', 'error', 'busy'] as const)('renders the row and the entry when %s', (status) => {
    const store = fakeStore(status, status === 'on' ? 9 : null)
    const row = withApp(locale, store, <ReminderRow />)
    expect(row).toContain('data-reminder-row')
    expect(row).toContain(t.open)
    expect(withApp(locale, store, <ReminderOptionsEntry onOpen={() => {}} />)).toContain('data-reminder-entry')
  })

  it('summarises the chosen hour', () => {
    const html = withApp(locale, fakeStore('on', 9), <ReminderRow />)
    expect(html).toContain(t.summary.on('09:00'))
  })

  it('shows the Options entry inside the Options panel only when available', () => {
    const props = { options: { autoXOnPlace: true, preventXOnBlocked: true, showTimer: true }, showAxisLabels: true, onAxisLabels() {}, onChange() {}, onClearAll() {}, onRestart() {}, onClose() {} } as const
    expect(withApp(locale, fakeStore('off'), <OptionsPanel {...props} />)).toContain('data-reminder-entry')
    expect(withApp(locale, fakeStore('unavailable'), <OptionsPanel {...props} />)).not.toContain('data-reminder-entry')
  })

  const view = (state: ReminderState, enabled = state.status === 'on', hour = state.hour ?? DEFAULT_HOUR) =>
    withApp(locale, fakeStore('off'), <ReminderDialogView state={state} enabled={enabled} hour={hour} onEnabled={() => {}} onHour={() => {}} onSave={() => {}} onClose={() => {}} />)

  it('has a toggle, an hour dropdown 06:00-23:00 defaulting to 08:00 labelled Amsterdam time, and Save', () => {
    const html = view({ status: 'off', hour: null }, true)
    expect(html).toContain('role="dialog"')
    expect(html).toContain('role="switch"')
    expect(html).toContain(t.hourLabel)
    expect(html).toMatch(/Amsterdam/)
    expect(html).toContain('<option value="6">06:00</option>')
    expect(html).toContain('<option value="23">23:00</option>')
    expect(html).not.toContain('value="5"')
    expect(html).not.toContain('value="24"')
    expect(html).toMatch(/<option value="8" selected="">08:00<\/option>/)
    expect(html).toContain(`>${t.save}<`)
  })

  it('shows a localized message when blocked or failed, none otherwise', () => {
    expect(view({ status: 'blocked', hour: null })).toContain(t.blocked)
    expect(view({ status: 'error', hour: null })).toContain(t.error)
    expect(view({ status: 'off', hour: null })).not.toContain('data-reminder-message')
    expect(view({ status: 'on', hour: 7 })).not.toContain('data-reminder-message')
  })

  it('disables the controls and shows Saving while busy', () => {
    const html = view({ status: 'busy', hour: null }, true)
    expect(html).toContain(t.saving)
    expect(html).toMatch(/disabled="" data-reminder-save/)
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(3)
  })
})

describe('saveReminder', () => {
  it('enables with the chosen hour from off', async () => {
    const store = fakeStore('off')
    expect(await saveReminder(store, store.state, true, 20)).toBe(true)
    expect(store.enable).toHaveBeenCalledWith(20)
  })
  it('changes the hour when on, and skips the call when unchanged', async () => {
    const store = fakeStore('on', 8)
    await saveReminder(store, store.state, true, 8)
    expect(store.changeHour).not.toHaveBeenCalled()
    await saveReminder(store, store.state, true, 10)
    expect(store.changeHour).toHaveBeenCalledWith(10)
  })
  it('disables when switched off while on, and does nothing when already off', async () => {
    const on = fakeStore('on', 8)
    expect(await saveReminder(on, on.state, false, 8)).toBe(true)
    expect(on.disable).toHaveBeenCalled()
    const off = fakeStore('off')
    expect(await saveReminder(off, off.state, false, 8)).toBe(true)
    expect(off.disable).not.toHaveBeenCalled()
  })
  it('keeps the dialog open when the store ends blocked or in error', async () => {
    const blocked = fakeStore('off')
    blocked.enable = vi.fn(async () => void (blocked.state = { status: 'blocked', hour: null }))
    expect(await saveReminder(blocked, blocked.state, true, 8)).toBe(false)
  })
  it('offers exactly 06..23', () => {
    expect(HOURS[0]).toBe(6)
    expect(HOURS.at(-1)).toBe(23)
    expect(HOURS).toHaveLength(18)
  })
})

describe('start screen slot', () => {
  it('renders the reminder slot only when the daily flow passes a row', async () => {
    const { StartScreen } = await import('../daily/StartScreen.tsx')
    const { readSchedule } = await import('../../schedule/schedule.testing.ts')
    const day = readSchedule().days[3]!
    const render = (reminder?: React.ReactNode) =>
      withApp('en', fakeStore('off'), <StartScreen state={{ kind: 'day', day, status: { kind: 'new' }, ended: false }} clock={() => Date.parse('2026-09-30T22:00:00Z')} onPlay={() => {}} reminder={reminder} />)
    expect(render()).not.toContain('data-slot="reminder"')
    const html = render(<ReminderRow />)
    expect(html).toContain('data-slot="reminder"')
    expect(html).toContain('data-reminder-row')
  })
})
