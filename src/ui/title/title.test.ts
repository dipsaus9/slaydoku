import { describe, expect, it } from 'vitest'
import { puzzle } from '../../game/fixture.ts'
import { createMemoryStorage, saveProgress } from '../levels/progress.ts'
import type { Progress } from '../levels/progress.ts'
import type { Level } from '../levels/registry.ts'
import { fakeWindow } from '../router/fakeWindow.ts'
import { createRouter } from '../router/index.ts'
import { installScreenTitles } from './install.ts'
import { SITE_TITLE, TITLE_EN, screenTitle } from './model.ts'
import type { TitleContext } from './model.ts'

const levels: Level[] = [
  { id: 'one', title: 'First case', puzzle },
  { id: 'two', title: 'Second case', puzzle },
]
const record = { murdererId: 'A', elapsedMs: 1000 }
const none: Progress = { solved: {}, started: [] }
const firstSolved: Progress = { solved: { one: record }, started: [] }

const context = (progress: Progress): TitleContext => ({ levels, progress })

describe('screenTitle', () => {
  it('is the site name on the level list', () => {
    for (const path of ['', '/', '/level']) expect(screenTitle(path, context(none))).toBe(SITE_TITLE)
  })

  it('names the level while playing, from the level data', () => {
    expect(screenTitle('/level/one', context(none))).toBe('First case – Slaydoku')
    expect(screenTitle('/level/two', context(firstSolved))).toBe('Second case – Slaydoku')
  })

  it('names the level on the solved screen', () => {
    expect(screenTitle('/level/one/solved', context(firstSolved))).toBe(`${TITLE_EN.solved('First case')} – Slaydoku`)
    expect(screenTitle('/level/one/solved', context(firstSolved))).toBe('First case solved – Slaydoku')
  })

  it('shows the list title where the app shows the list instead', () => {
    expect(screenTitle('/level/two', context(none))).toBe(SITE_TITLE) // locked
    expect(screenTitle('/level/nergens', context(none))).toBe(SITE_TITLE) // unknown level
    expect(screenTitle('/level/one/solved', context(none))).toBe(SITE_TITLE) // not solved yet
    expect(screenTitle('/level/one/solved/x', context(firstSolved))).toBe(SITE_TITLE)
    expect(screenTitle('/level/%E0%A4%A', context(firstSolved))).toBe(SITE_TITLE) // bad escape
  })

  it('names the About page', () => {
    expect(screenTitle('/about', context(none))).toBe('About – Slaydoku')
    expect(screenTitle('/about/', context(firstSolved))).toBe(`${TITLE_EN.about} – Slaydoku`)
  })

  it('falls back to the site name for unknown routes, including /lab', () => {
    for (const path of ['/lab', '/lab/puzzle', '/nonsense', 'random']) {
      expect(screenTitle(path, context(firstSolved))).toBe(SITE_TITLE)
    }
  })
})

describe('installScreenTitles', () => {
  const setup = (start: string) => {
    const win = fakeWindow(start)
    return { win, router: createRouter(win) }
  }

  it('sets the title on load and on every navigation, reading progress fresh', () => {
    const { router } = setup('/')
    const doc = { title: '' }
    const storage = createMemoryStorage()
    installScreenTitles({ router, doc, storage, levels: () => levels })
    expect(doc.title).toBe('Slaydoku')
    router.navigate('/level/one')
    expect(doc.title).toBe('First case – Slaydoku')
    saveProgress(storage, firstSolved, levels)
    router.navigate('/level/one/solved')
    expect(doc.title).toBe('First case solved – Slaydoku')
    router.navigate('/lab')
    expect(doc.title).toBe('Slaydoku')
  })

  it('reads the levels at update time, so late registration is picked up', () => {
    const { router } = setup('/level/one')
    const doc = { title: '' }
    let current: readonly Level[] = []
    installScreenTitles({ router, doc, storage: null, levels: () => current })
    expect(doc.title).toBe('Slaydoku')
    current = levels
    router.navigate('/')
    router.navigate('/level/one')
    expect(doc.title).toBe('First case – Slaydoku')
  })

  it('stops listening when stopped', () => {
    const { win, router } = setup('/')
    const doc = { title: '' }
    const stop = installScreenTitles({ router, doc, storage: null, levels: () => levels })
    stop()
    expect(win.listenerCount()).toBe(0)
    router.navigate('/level/one')
    expect(doc.title).toBe('Slaydoku')
  })
})
