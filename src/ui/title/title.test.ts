import { describe, expect, it } from 'vitest'
import { fakeWindow } from '../router/fakeWindow.ts'
import { createRouter } from '../router/index.ts'
import { installScreenTitles } from './install.ts'
import { SITE_TITLE, TITLE_EN, screenTitle } from './model.ts'
import type { ScheduleIndex } from '../../schedule/index.ts'

const index: ScheduleIndex = { format: 1, launch: '2026-10-12', first: '2026-10-12', last: '2026-10-31', count: 20, months: [] }
const at = (iso: string) => () => Date.parse(iso)

describe('screenTitle', () => {
  it('is the site name on the start screen', () => {
    for (const path of ['', '/', '/play/x', '/play/0']) expect(screenTitle(path, { puzzleDate: '2026-10-15' })).toBe(SITE_TITLE)
  })

  it('names the puzzle while playing, from the context date — an explicit /play/<n> in the URL is not resolved to a date (no archive)', () => {
    expect(screenTitle('/play', { puzzleDate: '2026-10-15' })).toBe('Puzzle of 15 October – Slaydoku')
    expect(screenTitle('/play/3', { puzzleDate: '2026-10-15' })).toBe(`${TITLE_EN.puzzle('2026-10-15')} – Slaydoku`)
  })

  it('is the site name on the puzzle route when nothing is scheduled', () => {
    expect(screenTitle('/play', { puzzleDate: null })).toBe(SITE_TITLE)
  })

  it('names the About page', () => {
    expect(screenTitle('/about', { puzzleDate: '2026-10-15' })).toBe('About – Slaydoku')
    expect(screenTitle('/about/', { puzzleDate: null })).toBe(`${TITLE_EN.about} – Slaydoku`)
  })

  it('falls back to the site name for unknown routes, the old level paths and /lab included', () => {
    for (const path of ['/lab', '/lab/puzzle', '/nonsense', 'random', '/level/demo', '/level/demo/solved']) {
      expect(screenTitle(path, { puzzleDate: '2026-10-15' })).toBe(SITE_TITLE)
    }
  })
})

describe('installScreenTitles', () => {
  const setup = (start: string) => {
    const win = fakeWindow(start)
    return { win, router: createRouter(win) }
  }

  it('sets the title on load and on every navigation, from the clock', () => {
    const { router } = setup('/')
    const doc = { title: '' }
    installScreenTitles({ router, doc, index, clock: at('2026-10-15T10:00:00Z') })
    expect(doc.title).toBe('Slaydoku')
    router.navigate('/play')
    expect(doc.title).toBe('Puzzle of 15 October – Slaydoku')
    router.navigate('/about')
    expect(doc.title).toBe('About – Slaydoku')
    router.navigate('/lab')
    expect(doc.title).toBe('Slaydoku')
  })

  it('is the site name on the puzzle route before the launch and after the last day', () => {
    for (const day of ['2026-10-01', '2026-11-05']) {
      const { router } = setup('/play')
      const doc = { title: '' }
      installScreenTitles({ router, doc, index, clock: at(`${day}T10:00:00Z`) })
      expect(doc.title, day).toBe('Slaydoku')
    }
  })

  it('stops listening when stopped', () => {
    const { win, router } = setup('/')
    const doc = { title: '' }
    const stop = installScreenTitles({ router, doc, index, clock: at('2026-10-15T10:00:00Z') })
    stop()
    expect(win.listenerCount()).toBe(0)
    router.navigate('/play')
    expect(doc.title).toBe('Slaydoku')
  })
})
