import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { StartScreen } from './StartScreen.tsx'
import type { StartState } from './StartScreen.tsx'
import { DAILY_EN } from './strings.ts'

const { days } = readSchedule()
const day = days[3]! // 2026-10-15
const at = (iso: string) => () => Date.parse(iso)
const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()
const render = (state: StartState, over: Partial<Parameters<typeof StartScreen>[0]> = {}) =>
  renderToStaticMarkup(<StartScreen state={state} clock={at('2026-10-15T22:00:00Z')} onPlay={() => {}} {...over} />)

describe('<StartScreen/>', () => {
  it('shows the number, the date, the difficulty, the size and a Play button for a new day', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    const text = strip(html)
    expect(text).toContain(`Puzzle #${day.n}`)
    expect(text).toContain('Thursday 15 October 2026')
    expect(text).toContain(DAILY_EN.tier[day.tier])
    expect(text).toContain(`${day.size} × ${day.size} grid`)
    expect(html).toContain('data-action="play"')
    expect(html).toContain('>Play<')
    expect(html).not.toContain('Continue')
  })

  it('offers Continue when a board is saved', () => {
    const html = render({ kind: 'day', day, status: { kind: 'inProgress' }, ended: false })
    expect(html).toContain('data-action="continue"')
    expect(html).toContain('>Continue<')
  })

  it('shows the countdown to 00:00 UTC with an accessible label, and the end time in UTC', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: false })
    expect(html).toContain('role="timer"')
    expect(html).toContain('aria-label="2 hours left"')
    expect(html).toContain('>02:00:00<')
    expect(strip(html)).toMatch(/Ends in 02:00:00/)
    expect(strip(html)).toMatch(/Ends at 00:00 UTC/)
  })

  it('shows the result of a solved day instead of Play: time, hints and the murderer', () => {
    const html = render({ kind: 'day', day, status: { kind: 'solved', result: { n: day.n, date: day.date, fp: day.fp, elapsedMs: 754_000, hints: 2, wrongChecks: 1, murdererId: day.puzzle.people.find((p) => p.kind === 'suspect')!.id } }, ended: false })
    const text = strip(html)
    expect(html).toContain('data-result="solved"')
    expect(html).not.toContain('data-action=')
    expect(text).toContain('Solved!')
    expect(text).toContain('Time: 12:34')
    expect(text).toContain('2 hints')
    expect(text).toMatch(/You found the murderer! \w+ was alone with the victim/)
    expect(text).toContain('Next puzzle in')
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

  it('says Slaydoku starts on the launch date, with a countdown to launch, before the first day', () => {
    const html = render({ kind: 'before-launch', first: '2026-10-12' }, { clock: at('2026-10-01T10:00:00Z') })
    const text = strip(html)
    expect(text).toContain('Slaydoku starts on 12 October')
    expect(html).toContain('data-countdown="starts"')
    expect(text).toContain('Starts in 10d 14:00:00')
    expect(text).toContain('Starts at 00:00 UTC')
    expect(html).not.toContain('data-action=')
  })

  it('says new puzzles are coming soon after the last day', () => {
    const html = render({ kind: 'after-schedule' })
    expect(strip(html)).toContain('New puzzles are coming soon')
    expect(html).not.toContain('data-action=')
    expect(html).not.toContain('role="timer"')
  })

  it('shows the "New puzzle available" notice, and an ended day without Play or a countdown', () => {
    const html = render({ kind: 'day', day, status: { kind: 'new' }, ended: true }, { rollover: { n: day.n + 1, onShow: () => {} } })
    const text = strip(html)
    expect(html).toContain('data-banner="new-puzzle"')
    expect(text).toContain('New puzzle available')
    expect(text).toContain(`Show puzzle #${day.n + 1}`)
    expect(text).toContain('This puzzle has ended.')
    expect(html).not.toContain('data-action=')
    expect(html).not.toContain('role="timer"')
  })

  it('shows loading and error states, and keeps the About link in the footer', () => {
    expect(strip(render({ kind: 'loading' }))).toContain('Loading the puzzle')
    const error = render({ kind: 'error', onRetry: () => {} })
    expect(error).toContain('role="alert"')
    expect(strip(error)).toContain('Try again')
    for (const state of [{ kind: 'loading' }, { kind: 'after-schedule' }] as const) {
      expect(render(state)).toContain('href="/about"')
    }
  })
})
