import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { StartScreen } from './StartScreen.tsx'
import type { StartState } from './StartScreen.tsx'
import { DAILY_STRINGS } from './strings.ts'

const { days } = readSchedule()
const day = days[3]! // 2026-09-30
const at = (iso: string) => () => Date.parse(iso)
const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()

/** The browser language `LocaleProvider` defaults from, per `Locale` (SLAY-3.4). */
const BROWSER_LANGUAGE: Record<Locale, string> = { en: 'en-US', nl: 'nl-NL' }

// StartScreen renders the locale toggle, which reads useLocale(): every render needs a LocaleProvider ancestor, same as App.tsx.
const renderFor =
  (locale: Locale) =>
  (state: StartState, over: Partial<Parameters<typeof StartScreen>[0]> = {}) =>
    renderToStaticMarkup(
      <LocaleProvider storage={null} browserLanguage={BROWSER_LANGUAGE[locale]}>
        <StartScreen state={state} clock={at('2026-09-30T22:00:00Z')} onPlay={() => {}} {...over} />
      </LocaleProvider>,
    )

describe.each(['en', 'nl'] as const)('<StartScreen/> (%s)', (locale) => {
  const t = DAILY_STRINGS[locale]
  const render = renderFor(locale)

  it('shows the number, the date, the difficulty, the size and a Play button for a new day', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    const text = strip(html)
    expect(text).toContain(t.puzzleLabel(day.date))
    // The date itself is formatted by src/schedule (out of this story's References) and stays English in every locale.
    expect(text).toContain('Wednesday 30 September 2026')
    expect(text).toContain(t.tier[day.tier])
    expect(text).toContain(t.size(day.size))
    expect(html).toContain('data-action="play"')
    expect(html).toContain(`>${t.play}<`)
    expect(html).not.toContain(t.continue)
  })

  it('offers Continue when a board is saved', () => {
    const html = render({ kind: 'day', day, status: { kind: 'inProgress' }, ended: false })
    expect(html).toContain('data-action="continue"')
    expect(html).toContain(`>${t.continue}<`)
  })

  it('shows the countdown to 00:00 UTC with an accessible label, and the end time in UTC', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    expect(html).toContain('role="timer"')
    expect(html).toContain(`aria-label="${t.countdownLabel('2 hours')}"`)
    expect(html).toContain('>02:00:00<')
    expect(strip(html)).toMatch(new RegExp(`${t.endsIn} 02:00:00`))
    expect(strip(html)).toContain(t.endsAt('00:00 UTC'))
  })

  it('shows the result of a solved day instead of Play: time, hints and the murderer', () => {
    const html = render({ kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 754_000, hints: 2, wrongChecks: 1, murdererId: day.puzzle.people.find((p) => p.kind === 'suspect')!.id } }, ended: false })
    const text = strip(html)
    expect(html).toContain('data-result="solved"')
    expect(html).not.toContain('data-action=')
    expect(text).toContain(t.solved.title)
    expect(text).toContain(t.solved.time('12:34'))
    expect(text).toContain(t.solved.hints(2))
    expect(text).toMatch(/\w+ was alone with the victim\.|\w+ was alleen met het slachtoffer\./)
    expect(text).toContain(t.nextIn)
  })

  it('has the stats and share slots, empty when nothing is passed in', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    expect(html).toContain('data-slot="stats"')
    expect(html).toContain('data-slot="share"')
    const solved = render(
      { kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 1000, hints: 0, wrongChecks: 0, murdererId: 'x' } }, ended: false },
      { share: <button>Share it</button>, stats: <p>Streak 3</p> },
    )
    expect(solved).toContain('Share it')
    expect(solved).toContain('Streak 3')
    expect(render({ kind: 'day', day, status: { kind: 'new' }, ended: false }, { share: <button>Share it</button> })).not.toContain('Share it')
  })

  it('says the puzzle starts on the launch date, with a countdown to launch, before the first day', () => {
    const html = render({ kind: 'before-launch', first: '2026-10-12' }, { clock: at('2026-10-01T10:00:00Z') })
    const text = strip(html)
    expect(text).toContain(t.before.title('12 October'))
    expect(html).toContain('data-countdown="starts"')
    expect(text).toContain(`${t.before.startsIn} 10d 14:00:00`)
    expect(text).toContain(t.before.startsAt('00:00 UTC'))
    expect(html).not.toContain('data-action=')
  })

  it('says new puzzles are coming soon after the last day', () => {
    const html = render({ kind: 'after-schedule' })
    expect(strip(html)).toContain(t.after.title)
    expect(html).not.toContain('data-action=')
    expect(html).not.toContain('role="timer"')
  })

  it('shows the "New puzzle available" notice, and an ended day without Play or a countdown', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: true }, { rollover: { n: day.n + 1, onShow: () => {} } })
    const text = strip(html)
    expect(html).toContain('data-banner="new-puzzle"')
    expect(text).toContain(t.rollover.banner)
    expect(text).toContain(t.rollover.show(day.n + 1))
    expect(text).toContain(t.ended)
    expect(html).not.toContain('data-action=')
    expect(html).not.toContain('role="timer"')
  })

  it('shows loading and error states, and keeps the About link in the footer', () => {
    expect(strip(render({ kind: 'loading' }))).toContain(t.loading.trim())
    const error = render({ kind: 'error', onRetry: () => {} })
    expect(error).toContain('role="alert"')
    expect(strip(error)).toContain(t.error.retry)
    for (const state of [{ kind: 'loading' }, { kind: 'after-schedule' }] as const) {
      expect(render(state)).toContain('href="/about"')
    }
  })

  it('offers a language toggle with the browser language pressed, no player-facing text changed', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    expect(html).toContain('data-locale-option="en"')
    expect(html).toContain('data-locale-option="nl"')
    expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*data-locale-option="${locale}"`))
    const other = locale === 'en' ? 'nl' : 'en'
    expect(html).toMatch(new RegExp(`aria-pressed="false"[^>]*data-locale-option="${other}"`))
    expect(strip(html)).toContain(t.puzzleLabel(day.date).split(' ')[0])
  })
})
