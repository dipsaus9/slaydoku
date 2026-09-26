import { beforeEach, describe, expect, it } from 'vitest'
import { at, puzzle } from '../../game/fixture.ts'
import { createGameStore, puzzleFingerprint, saveKey } from '../../game/index.ts'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { LevelList } from './LevelList.tsx'
import { SolvedScreen } from './SolvedScreen.tsx'
import {
  PROGRESS_KEY,
  createMemoryStorage,
  isUnlocked,
  levelEntries,
  observeSolve,
  readProgress,
  recordSolve,
  saveProgress,
} from './progress.ts'
import { getLevels, registerLevels, resetLevels } from './registry.ts'
import type { Level } from './registry.ts'
import { parseRoute, resolveRoute, routePath } from './route.ts'

const mk = (id: string): Level => ({ id, title: `Level ${id}`, puzzle })
const three = [mk('een'), mk('twee'), mk('drie')]
const fp = puzzleFingerprint(puzzle)
const solvedRecord = { murdererId: 'A', elapsedMs: 65_000 }

/** Plays the tutorial to the solution through a real game store. */
function solve(storage: ReturnType<typeof createMemoryStorage>, levelId: string, clock: { t: number }) {
  const store = createGameStore({ levelId, puzzle, storage, now: () => clock.t })
  for (const id of ['V', 'A', 'C', 'B'] as const) store.dispatch({ type: 'place', personId: id, cell: at[id] })
  return store
}

describe('registry', () => {
  beforeEach(resetLevels)

  it('keeps registration order and replaces a duplicate id in place', () => {
    registerLevels([mk('a'), mk('b')])
    registerLevels([mk('c'), { ...mk('a'), title: 'Nieuw' }])
    expect(getLevels().map((l) => l.id)).toEqual(['a', 'b', 'c'])
    expect(getLevels()[0]!.title).toBe('Nieuw')
  })

  it('rejects ids that do not survive a URL and empty titles', () => {
    expect(() => registerLevels([mk('a/b')])).toThrow()
    expect(() => registerLevels([mk('')])).toThrow()
    expect(() => registerLevels([{ ...mk('ok'), title: ' ' }])).toThrow()
    expect(getLevels()).toEqual([])
  })
})

describe('unlock order', () => {
  it('opens only the first level on a fresh start', () => {
    const p = readProgress(three, createMemoryStorage())
    expect(three.map((_, i) => isUnlocked(three, p, i))).toEqual([true, false, false])
    expect(levelEntries(three, p).map((e) => e.status)).toEqual(['new', 'locked', 'locked'])
  })

  it('opens level N + 1 when level N is solved, and no further', () => {
    const p = recordSolve(readProgress(three, createMemoryStorage()), 'een', solvedRecord)
    expect(levelEntries(three, p).map((e) => e.status)).toEqual(['solved', 'new', 'locked'])
  })

  it('does not open level 3 by solving level 1 alone', () => {
    const p = recordSolve(readProgress(three, createMemoryStorage()), 'een', solvedRecord)
    expect(isUnlocked(three, p, 2)).toBe(false)
    expect(isUnlocked(three, p, 5)).toBe(false)
  })
})

describe('progress persistence', () => {
  it('survives a reload: solved record with time', () => {
    const storage = createMemoryStorage()
    saveProgress(storage, recordSolve(readProgress(three, storage), 'een', solvedRecord), three)
    const after = readProgress(three, storage)
    expect(after.solved.een).toEqual(solvedRecord)
    expect(levelEntries(three, after)[0]!.result?.elapsedMs).toBe(65_000)
  })

  it('reads in progress from a saved game', () => {
    const storage = createMemoryStorage()
    const store = createGameStore({ levelId: 'een', puzzle, storage, now: () => 0 })
    store.dispatch({ type: 'place', personId: 'V', cell: at.V })
    expect(storage.getItem(saveKey('een'))).not.toBeNull()
    const entries = levelEntries(three, readProgress(three, storage))
    expect(entries.map((e) => e.status)).toEqual(['inProgress', 'locked', 'locked'])
  })

  it('a solved save counts as solved even without a progress record', () => {
    const storage = createMemoryStorage()
    solve(storage, 'een', { t: 0 })
    const p = readProgress(three, storage)
    expect(p.solved.een?.murdererId).toBe('A')
    expect(levelEntries(three, p)[1]!.status).toBe('new')
  })

  it('a replayed (restarted) solved level stays solved', () => {
    const storage = createMemoryStorage()
    const store = solve(storage, 'een', { t: 0 })
    saveProgress(storage, readProgress(three, storage), three)
    store.dispatch({ type: 'restart' })
    expect(readProgress(three, storage).solved.een).toBeDefined()
  })

  it('ignores corrupt or wrong-version data', () => {
    for (const raw of ['{nope', JSON.stringify({ version: 9, solved: { een: solvedRecord } }), '[]', 'null']) {
      const storage = createMemoryStorage()
      storage.setItem(PROGRESS_KEY, raw)
      expect(readProgress(three, storage).solved).toEqual({})
    }
    const storage = createMemoryStorage()
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 2, solved: { een: { murdererId: 3, fp }, twee: { ...solvedRecord, fp } } }))
    expect(Object.keys(readProgress(three, storage).solved)).toEqual(['twee'])
  })

  it('works without storage', () => {
    expect(readProgress(three, null).solved).toEqual({})
    expect(saveProgress(null, readProgress(three, null), three)).toBe(false)
  })
})

describe('puzzle fingerprint', () => {
  const other: Level = { ...mk('een'), puzzle: { ...puzzle, clues: puzzle.clues.slice(1) } }
  const stored = (solved: Record<string, unknown>, version = 2) => {
    const storage = createMemoryStorage()
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version, solved }))
    return storage
  }

  it('stores the fingerprint with every solved record', () => {
    const storage = createMemoryStorage()
    saveProgress(storage, recordSolve(readProgress(three, storage), 'een', solvedRecord), three)
    expect(JSON.parse(storage.getItem(PROGRESS_KEY)!).solved.een).toEqual({ ...solvedRecord, fp })
  })

  it('a solved record stays solved while the puzzle is unchanged', () => {
    expect(readProgress(three, stored({ een: { ...solvedRecord, fp } })).solved.een).toEqual(solvedRecord)
  })

  it('a solved record of a changed puzzle is ignored and no longer unlocks the next level', () => {
    const storage = stored({ een: { ...solvedRecord, fp } })
    const changed = [other, three[1]!, three[2]!]
    const progress = readProgress(changed, storage)
    expect(progress.solved).toEqual({})
    expect(levelEntries(changed, progress).map((e) => e.status)).toEqual(['new', 'locked', 'locked'])
  })

  it('a record without a fingerprint, or from version 1, is discarded', () => {
    expect(readProgress(three, stored({ een: solvedRecord })).solved).toEqual({})
    expect(readProgress(three, stored({ een: { ...solvedRecord, fp } }, 1)).solved).toEqual({})
    expect(readProgress(three, stored({ een: { ...solvedRecord, fp: 'deadbeef' } })).solved).toEqual({})
  })

  it('a saved board of a changed puzzle is neither in progress nor solved', () => {
    const storage = createMemoryStorage()
    solve(storage, 'een', { t: 0 })
    const changed = [other, three[1]!, three[2]!]
    expect(readProgress(changed, storage)).toEqual({ solved: {}, started: [] })
    expect(readProgress(three, storage).solved.een).toBeDefined()
  })

  it('keeps records of unchanged levels when another level changed', () => {
    const storage = stored({ een: { ...solvedRecord, fp }, twee: { ...solvedRecord, fp } })
    const changed = [three[0]!, { ...mk('twee'), puzzle: other.puzzle }, three[2]!]
    expect(Object.keys(readProgress(changed, storage).solved)).toEqual(['een'])
  })
})

describe('observeSolve', () => {
  it('reports the solve with murderer and time, once', () => {
    const inner = createMemoryStorage()
    const seen: unknown[] = []
    const watched = observeSolve(inner, three[0]!, (r) => seen.push(r))
    const clock = { t: 1000 }
    const store = createGameStore({ levelId: 'een', puzzle, storage: watched, now: () => clock.t })
    clock.t = 61_000
    for (const id of ['V', 'A', 'C']) store.dispatch({ type: 'place', personId: id, cell: at[id as 'V'] })
    expect(seen).toEqual([])
    store.dispatch({ type: 'place', personId: 'B', cell: at.B })
    expect(seen).toEqual([{ murdererId: 'A', elapsedMs: 60_000 }])
    store.dispatch({ type: 'setOption', option: 'showTimer', value: false })
    expect(seen).toHaveLength(1)
  })

  it('does not fire for a level that is already solved when watching starts', () => {
    const inner = createMemoryStorage()
    const store = solve(inner, 'een', { t: 0 })
    const seen: unknown[] = []
    const watched = observeSolve(inner, three[0]!, (r) => seen.push(r))
    const again = createGameStore({ levelId: 'een', puzzle, storage: watched, now: () => 0 })
    again.dispatch({ type: 'setOption', option: 'showTimer', value: false })
    expect(seen).toEqual([])
    // restart, then solve again: that is a new solve
    again.dispatch({ type: 'restart' })
    for (const id of ['V', 'A', 'C', 'B'] as const) again.dispatch({ type: 'place', personId: id, cell: at[id] })
    expect(seen).toHaveLength(1)
    expect(store).toBeDefined()
  })

  it('passes other keys through untouched', () => {
    const inner = createMemoryStorage()
    const seen: unknown[] = []
    const watched = observeSolve(inner, three[0]!, (r) => seen.push(r))
    watched.setItem('other', 'x')
    expect(inner.getItem('other')).toBe('x')
    expect(watched.getItem('other')).toBe('x')
    expect(seen).toEqual([])
  })
})

describe('routing', () => {
  it('parses and formats paths', () => {
    expect(parseRoute('')).toEqual({ kind: 'list' })
    expect(parseRoute('/')).toEqual({ kind: 'list' })
    expect(parseRoute('/level/twee')).toEqual({ kind: 'play', levelId: 'twee' })
    expect(parseRoute('/level/twee/solved')).toEqual({ kind: 'solved', levelId: 'twee' })
    expect(parseRoute('/level/twee/other')).toEqual({ kind: 'list' })
    expect(parseRoute('/level/%E0%A4%A')).toEqual({ kind: 'list' })
    for (const r of [{ kind: 'list' }, { kind: 'play', levelId: 'a b' }, { kind: 'solved', levelId: 'x' }] as const) {
      expect(parseRoute(routePath(r))).toEqual(r)
    }
  })

  it('refuses direct navigation to a locked level', () => {
    const p = readProgress(three, createMemoryStorage())
    expect(resolveRoute({ kind: 'play', levelId: 'twee' }, three, p)).toEqual({ route: { kind: 'list' }, refused: 'locked' })
    expect(resolveRoute({ kind: 'play', levelId: 'een' }, three, p).refused).toBeUndefined()
  })

  it('lets a level through once the previous one is solved', () => {
    const p = recordSolve(readProgress(three, createMemoryStorage()), 'een', solvedRecord)
    expect(resolveRoute({ kind: 'play', levelId: 'twee' }, three, p).route).toEqual({ kind: 'play', levelId: 'twee' })
    expect(resolveRoute({ kind: 'play', levelId: 'drie' }, three, p).refused).toBe('locked')
  })

  it('refuses unknown levels and the solved screen of an unsolved level', () => {
    const p = recordSolve(readProgress(three, createMemoryStorage()), 'een', solvedRecord)
    expect(resolveRoute({ kind: 'play', levelId: 'nope' }, three, p).refused).toBe('unknown')
    expect(resolveRoute({ kind: 'solved', levelId: 'twee' }, three, p).refused).toBe('unsolved')
    expect(resolveRoute({ kind: 'solved', levelId: 'een' }, three, p).refused).toBeUndefined()
  })
})

describe('screens (static markup)', () => {
  it('list shows Dutch statuses, times and locks', () => {
    const p = recordSolve(readProgress(three, createMemoryStorage()), 'een', solvedRecord)
    const html = renderToStaticMarkup(
      createElement(LevelList, { entries: levelEntries(three, p), onOpen: () => {} }),
    )
    for (const text of ['Opgelost', '1:05', 'Nog niet begonnen', 'Op slot', 'Los eerst Level twee op.']) expect(html).toContain(text)
    expect((html.match(/disabled=""/g) ?? []).length).toBe(1)
    expect(html).toContain('data-status="locked"')
  })

  it('list shows a notice when the player was sent back', () => {
    const html = renderToStaticMarkup(createElement(LevelList, { entries: [], notice: 'Dit level is nog op slot.', onOpen: () => {} }))
    expect(html).toContain('Dit level is nog op slot.')
    expect(html).toContain('Er zijn nog geen levels.')
  })

  it('solved screen names who was alone with het cadeau and the time', () => {
    const html = renderToStaticMarkup(
      createElement(SolvedScreen, {
        level: three[0]!,
        result: solvedRecord,
        next: three[1]!,
        onNext: () => {},
        onList: () => {},
        onViewBoard: () => {},
      }),
    )
    expect(html).toContain('Opgelost!')
    expect(html).toMatch(/[A-Z][a-z]+ was alleen met het cadeau\./)
    expect(html).toContain('Tijd: 1:05')
    expect(html).toContain('Volgend level: Level twee')
  })

  it('solved screen of the last level says all done', () => {
    const html = renderToStaticMarkup(
      createElement(SolvedScreen, { level: three[2]!, result: solvedRecord, next: null, onNext: () => {}, onList: () => {}, onViewBoard: () => {} }),
    )
    expect(html).toContain('Alle levels zijn opgelost.')
  })
})
