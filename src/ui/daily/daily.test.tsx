import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_CONTENT } from '../../content/help/help.ts'
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
    expect(text).toContain(t.tier[day.tier])
    expect(text).toContain(t.size(day.size))
    expect(html).toContain('data-action="play"')
    expect(html).toContain(`>${t.play}<`)
    expect(html).not.toContain(t.continue)
  })

  it('shows the puzzle date once, not twice in a second always-English long-date format (SLAY-9.15)', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    // The byline used to also render `formatLongDate` (schedule/display.ts, deliberately English-only)
    // right next to the already-localized puzzleLabel, duplicating the date. Only the label remains.
    expect(html).not.toContain('Wednesday 30 September 2026')
    expect(html).not.toContain('daily-card__byline-date')
  })

  it("shows the 'How it works' link in the reader's own locale, not always English (SLAY-9.15)", () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    expect(strip(html)).toContain(HELP_CONTENT[locale].link)
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
    expect(html).not.toContain('data-until')
    expect(strip(html)).not.toMatch(/Ends at|Eindigt om/)
  })

  it('shows the result of a solved day instead of Play: time, hints and the murderer', () => {
    const html = render({ kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 754_000, hints: 2, wrongChecks: 1, murdererId: day.puzzle.people.find((p) => p.kind === 'suspect')!.id } }, ended: false })
    const text = strip(html)
    expect(html).toContain('data-result="solved"')
    expect(html).not.toContain('data-action="play"')
    expect(html).not.toContain('data-action="continue"')
    expect(text).toContain(t.solved.title)
    expect(text).toContain(t.solved.time('12:34'))
    expect(text).toContain(t.solved.hints(2))
    expect(text).toMatch(/\w+ was alone with the victim\.|\w+ was alleen met het slachtoffer\./)
    expect(text).toContain(t.nextIn)
  })

  it('offers a View board button on a solved day, wired to the same onPlay as Play/Continue (SLAY-9.16)', () => {
    const html = render({ kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 754_000, hints: 2, wrongChecks: 1, murdererId: day.puzzle.people.find((p) => p.kind === 'suspect')!.id } }, ended: false })
    expect(html).toContain('data-action="view-board"')
    expect(html).toContain(`>${t.solved.viewBoard}<`)
  })

  it('has the stats and share slots, empty when nothing is passed in', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    expect(html).toContain('data-slot="stats"')
    expect(html).toContain('data-slot="share"')
    expect(render({ kind: 'day', day, status: { kind: 'new' }, ended: false }, { share: <button>Share it</button> })).not.toContain('Share it')
    const solved = render(
      { kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 1000, hints: 0, wrongChecks: 0, murdererId: 'x' } }, ended: false },
      { stats: <p>Streak 3</p> },
    )
    expect(solved).toContain('Streak 3')
  })

  it('replaces the inline share panel with a compact Share button that opens a popover (SLAY-9.13, AC #4)', () => {
    const solved = render(
      { kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 1000, hints: 0, wrongChecks: 0, murdererId: 'x' } }, ended: false },
      { share: <button>Share it</button> },
    )
    // A compact button, not the full panel: the panel's own content is not on screen until opened.
    expect(solved).toContain('data-action="share"')
    expect(solved).toContain(`>${t.slots.share}<`)
    expect(solved).not.toContain('Share it')
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

  // SLAY-9.18: Wordle's landing order -- mark, title, tagline, then straight to the button; the metadata under it; the
  // language switch and Help out of that flow (a top bar before the hero); the streak line and the intro after the hero.
  it('puts the Play button straight under the tagline, the details under it, the controls outside the hero', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false }, { stats: <p className="stats-entry">Streak 3</p> })
    const at = (needle: string) => {
      const i = html.indexOf(needle)
      expect(i, needle).toBeGreaterThanOrEqual(0)
      return i
    }
    const hero = at('class="daily__hero"')
    const subtitle = html.lastIndexOf('<p', at('class="daily__subtitle"'))
    const play = html.lastIndexOf('<button', at('data-action="play"'))
    // Nothing but the day's own wrapper (and the action row) between the tagline and the button.
    expect(strip(html.slice(subtitle, play))).toBe(t.subtitle)
    expect(at('class="daily-card__meta"')).toBeGreaterThan(play)
    expect(at('class="daily-card__byline"')).toBeGreaterThan(play)
    expect(at('data-countdown="ends"')).toBeGreaterThan(play)
    // The language switch and Help come before the hero, in the top bar.
    expect(at('class="daily__bar"')).toBeLessThan(hero)
    expect(at('data-locale-option="en"')).toBeLessThan(hero)
    expect(at('daily__help')).toBeLessThan(hero)
    // The streak line and the intro come after the whole hero (after the day's countdown).
    expect(at('data-slot="stats"')).toBeGreaterThan(at('data-countdown="ends"'))
    expect(at('class="daily-intro"')).toBeGreaterThan(at('data-slot="stats"'))
  })

  it('puts View board and Share side by side under the result on a solved day', () => {
    const html = render(
      { kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 1000, hints: 0, wrongChecks: 0, murdererId: 'x' } }, ended: false },
      { share: <button>Share it</button> },
    )
    const actions = html.slice(html.indexOf('class="daily-card__actions"'))
    expect(actions.indexOf('data-action="view-board"')).toBeGreaterThan(0)
    expect(actions.indexOf('data-action="share"')).toBeGreaterThan(actions.indexOf('data-action="view-board"'))
    expect(html.indexOf('data-result="solved"')).toBeLessThan(html.indexOf('class="daily-card__actions"'))
  })

  it('says what the game is, with a recording of real play that pauses on a still frame for reduced motion', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    const text = strip(html)
    expect(text).toContain(t.intro.title)
    expect(text).toContain(t.intro.text)
    expect(text).toContain(t.intro.caption)
    expect(html).toMatch(new RegExp(`<img[^>]*src="[^"]*gameplay-${locale}\\.webp"`))
    expect(html).toContain(`alt="${t.intro.alt}"`)
    expect(html).toMatch(new RegExp(`<source srcset="[^"]*gameplay-${locale}-still\\.webp" media="\\(prefers-reduced-motion: reduce\\)"`, 'i'))
    // Lazy: it never holds up the hero or the Play button.
    expect(html).toMatch(/<img[^>]*class="daily-intro__media"[^>]*loading="lazy"/)
  })
})

// The rendered look lives in CSS (SLAY-9.18): the hero and the day inside it carry no box, the tagline is a prominent line,
// and the streak line on this screen drops the bordered panel it has elsewhere.
describe('start screen CSS (SLAY-9.18)', () => {
  const rule = async (selector: string) => {
    const css = (await import('node:fs')).readFileSync(new URL('./daily.css', import.meta.url), 'utf8')
    const start = css.indexOf(`\n${selector} {`)
    expect(start, selector).toBeGreaterThanOrEqual(0)
    return css.slice(start, css.indexOf('}', start))
  }

  it('draws no border or fill around the hero or the day inside it', async () => {
    for (const selector of ['.daily__hero', '.daily-card', '.daily-result', '.daily-card__details', '.daily-card__byline', '.daily-countdown']) {
      const body = await rule(selector)
      expect(body, selector).not.toMatch(/\bborder(-top|-bottom)?\s*:/)
      expect(body, selector).not.toMatch(/\bbackground\s*:/)
    }
  })

  it('sets the tagline as a large serif line in full ink, not a muted caption', async () => {
    const body = await rule('.daily__subtitle')
    expect(body).toContain('font-family: var(--font-display)')
    expect(body).not.toMatch(/opacity/)
    expect(Number(/font-size:\s*([\d.]+)rem/.exec(body)?.[1])).toBeGreaterThanOrEqual(1.5)
  })

  it('takes the border off the streak line on the start screen', async () => {
    const body = await rule('.daily .stats-entry')
    expect(body).toMatch(/border:\s*0/)
    expect(body).toMatch(/background:\s*transparent/)
  })
})
