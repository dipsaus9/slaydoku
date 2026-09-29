import { describe, expect, it } from 'vitest'
import { at, puzzle } from './fixture.ts'
import { puzzleFingerprint } from './fingerprint.ts'
import {
  OPTIONS_KEY,
  OPTIONS_VERSION,
  SAVE_VERSION,
  clearGame,
  deserializeGame,
  hasSavedGame,
  loadGame,
  loadOptions,
  saveGame,
  saveKey,
  saveOptions,
  serializeGame,
} from './persistence.ts'
import type { StorageLike } from './persistence.ts'
import { initialState, reduce } from './reducer.ts'
import { DEFAULT_OPTIONS } from './types.ts'
import type { GameAction, GameState } from './types.ts'

const memory = (initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } => {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

const fp = puzzleFingerprint(puzzle)

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce((s, a) => reduce(puzzle, s, a), state)

const played = () =>
  run(
    initialState(),
    { type: 'resume', at: 0 },
    { type: 'toggleNote', personId: 'B', cell: { row: 2, col: 1 } },
    { type: 'toggleMark', personId: 'C', cell: { row: 1, col: 1 } },
    { type: 'place', personId: 'A', cell: at.A },
  )

describe('round trip', () => {
  it('restores board and elapsed time', () => {
    const storage = memory()
    const state = played()
    expect(saveGame(storage, 'lvl-1', fp, state, 4000)).toBe(true)
    const back = loadGame(storage, 'lvl-1', puzzle)
    expect(back?.board).toEqual(state.board)
    expect(back?.timer).toEqual({ elapsedMs: 4000, runningSince: null })
    expect(back?.status).toBe('playing')
    expect(back?.history).toEqual({ past: [], future: [] })
  })

  it('restores a solved level as solved, with the frozen time', () => {
    // played() already placed A; C then B completes every suspect, so the victim fills in on its
    // own (SLAY-9.5) and this is the placement that solves the level.
    const solved = run(played(), { type: 'place', personId: 'C', cell: at.C }, { type: 'place', personId: 'B', cell: at.B, at: 9000 })
    expect(solved.status).toBe('solved')
    const storage = memory()
    saveGame(storage, 'lvl-1', fp, solved, 20000)
    const back = loadGame(storage, 'lvl-1', puzzle)
    expect(back?.status).toBe('solved')
    expect(back?.check).toEqual({ solved: true, murdererId: 'A', elapsedMs: 9000 })
  })

  it('is per level', () => {
    const storage = memory()
    saveGame(storage, 'one', fp, played(), 0)
    expect(loadGame(storage, 'two', puzzle)).toBeNull()
    expect(saveKey('one')).not.toBe(saveKey('two'))
    saveGame(storage, 'two', fp, initialState(), 0)
    expect(loadGame(storage, 'one', puzzle)?.board.placements).toEqual({ A: at.A })
    expect(loadGame(storage, 'two', puzzle)?.board.placements).toEqual({})
  })

  it('a payload for another level id is refused', () => {
    const raw = serializeGame('one', fp, played(), 0)
    expect(deserializeGame(raw, 'two', puzzle)).toBeNull()
  })

  it('applies the given options, which are not part of the level save', () => {
    const storage = memory()
    saveGame(storage, 'lvl', fp, played(), 0)
    const back = loadGame(storage, 'lvl', puzzle, { ...DEFAULT_OPTIONS, showTimer: false })
    expect(back?.options.showTimer).toBe(false)
    expect(storage.data.get(saveKey('lvl'))).not.toContain('showTimer')
  })

  it('folds a running clock into the saved time', () => {
    const raw = serializeGame('x', fp, run(initialState(), { type: 'resume', at: 1000 }), 3500)
    expect(deserializeGame(raw, 'x', puzzle)?.timer.elapsedMs).toBe(2500)
  })

  it('clearGame removes the save', () => {
    const storage = memory()
    saveGame(storage, 'lvl', fp, played(), 0)
    clearGame(storage, 'lvl')
    expect(loadGame(storage, 'lvl', puzzle)).toBeNull()
  })
})

describe('puzzle fingerprint', () => {
  const key = saveKey('lvl')
  const changed = { ...puzzle, clues: puzzle.clues.slice(1) }

  it('a save of an unchanged puzzle resumes', () => {
    const storage = memory()
    saveGame(storage, 'lvl', fp, played(), 0)
    expect(JSON.parse(storage.data.get(key)!).fp).toBe(fp)
    expect(loadGame(storage, 'lvl', puzzle)?.board.placements).toEqual({ A: at.A })
  })

  it('a save of another puzzle under the same id is ignored', () => {
    const storage = memory()
    saveGame(storage, 'lvl', fp, played(), 0)
    expect(puzzleFingerprint(changed)).not.toBe(fp)
    expect(loadGame(storage, 'lvl', changed)).toBeNull()
    expect(deserializeGame(serializeGame('lvl', fp, played(), 0), 'lvl', changed)).toBeNull()
  })

  it('a legacy save without fingerprint (or from version 1) is discarded', () => {
    const good = JSON.parse(serializeGame('lvl', fp, played(), 0))
    const { fp: _fp, ...noFp } = good
    expect(loadGame(memory({ [key]: JSON.stringify(noFp) }), 'lvl', puzzle)).toBeNull()
    expect(loadGame(memory({ [key]: JSON.stringify({ ...noFp, version: 1 }) }), 'lvl', puzzle)).toBeNull()
    expect(loadGame(memory({ [key]: JSON.stringify({ ...good, fp: 42 }) }), 'lvl', puzzle)).toBeNull()
  })

  it('hasSavedGame compares the fingerprint without the puzzle', () => {
    const storage = memory()
    expect(hasSavedGame(storage, 'lvl', fp)).toBe(false)
    saveGame(storage, 'lvl', fp, played(), 0)
    expect(hasSavedGame(storage, 'lvl', fp)).toBe(true)
    expect(hasSavedGame(storage, 'lvl', puzzleFingerprint(changed))).toBe(false)
    expect(hasSavedGame(storage, 'other', fp)).toBe(false)
    expect(hasSavedGame(memory({ [key]: '{' }), 'lvl', fp)).toBe(false)
    expect(hasSavedGame(null, 'lvl', fp)).toBe(false)
  })

  it('a stale save is overwritten by the first move on the changed puzzle', () => {
    const storage = memory()
    saveGame(storage, 'lvl', fp, played(), 0)
    saveGame(storage, 'lvl', puzzleFingerprint(changed), initialState(), 0)
    expect(loadGame(storage, 'lvl', puzzle)).toBeNull()
    expect(loadGame(storage, 'lvl', changed)?.board.placements).toEqual({})
  })
})

describe('tolerates bad data', () => {
  const key = saveKey('lvl')
  const load = (raw: string) => loadGame(memory({ [key]: raw }), 'lvl', puzzle)

  it('returns null for corrupt JSON, wrong types and empty strings', () => {
    for (const raw of ['', '{', 'null', '42', '[]', '"x"', '{"version":1}', 'undefined']) {
      expect(load(raw)).toBeNull()
    }
  })

  it('returns null for an old or newer version', () => {
    const good = JSON.parse(serializeGame('lvl', fp, played(), 0))
    expect(load(JSON.stringify({ ...good, version: SAVE_VERSION - 1 }))).toBeNull()
    expect(load(JSON.stringify({ ...good, version: SAVE_VERSION + 1 }))).toBeNull()
    const { version: _dropped, ...noVersion } = good
    expect(load(JSON.stringify(noVersion))).toBeNull()
  })

  it('drops damaged parts of a good save and keeps the rest', () => {
    const state = load(
      JSON.stringify({
        version: SAVE_VERSION,
        levelId: 'lvl',
        fp,
        elapsedMs: 'lots',
        board: {
          placements: {
            A: at.A,
            ghost: { row: 0, col: 0 }, // unknown person
            B: { row: 40, col: 40 }, // off-grid
            C: { row: 0, col: 2 }, // blocked (table)
            V: at.A, // same cell as A
          },
          notes: { '0,3': ['B', 'B', 'ghost', 7], '9,9': ['B'], banana: ['B'], '1,2': ['C'], '2,2': 'x' },
          marks: { '0,3': ['B'], '3,0': ['C', 'A'] },
        },
      }),
    )
    expect(state?.board.placements).toEqual({ A: at.A })
    expect(state?.board.notes).toEqual({}) // 0,3: B also has an X there, the X wins; 1,2 is A's cell
    expect(state?.board.marks).toEqual({ '0,3': ['B'], '3,0': ['C'] }) // A is placed: no marks
    expect(state?.timer.elapsedMs).toBe(0)
  })

  it('a missing or malformed board loads as an empty one', () => {
    const empty = { notes: {}, marks: {}, placements: {} }
    expect(load(JSON.stringify({ version: SAVE_VERSION, levelId: 'lvl', fp, elapsedMs: 5 }))?.board).toEqual(empty)
    expect(load(JSON.stringify({ version: SAVE_VERSION, levelId: 'lvl', fp, elapsedMs: 5, board: [] }))?.board).toEqual(empty)
    expect(load(JSON.stringify({ version: SAVE_VERSION, levelId: 'lvl', fp, elapsedMs: -5, board: {} }))?.timer.elapsedMs).toBe(0)
  })

  it('survives a storage that throws or is missing', () => {
    const angry: StorageLike = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    }
    expect(loadGame(angry, 'lvl', puzzle)).toBeNull()
    expect(saveGame(angry, 'lvl', fp, played(), 0)).toBe(false)
    expect(() => clearGame(angry, 'lvl')).not.toThrow()
    expect(loadOptions(angry)).toEqual(DEFAULT_OPTIONS)
    expect(saveOptions(angry, DEFAULT_OPTIONS)).toBe(false)
    expect(loadGame(null, 'lvl', puzzle)).toBeNull()
    expect(saveGame(null, 'lvl', fp, played(), 0)).toBe(false)
  })
})

describe('options', () => {
  it('round-trips', () => {
    const storage = memory()
    const options = { autoXOnPlace: false, preventXOnBlocked: false, showTimer: false }
    expect(saveOptions(storage, options)).toBe(true)
    expect(loadOptions(storage)).toEqual(options)
  })

  it('falls back to defaults per field and for corrupt or old data', () => {
    const put = (raw: string) => loadOptions(memory({ [OPTIONS_KEY]: raw }))
    expect(put('{')).toEqual(DEFAULT_OPTIONS)
    expect(put(JSON.stringify({ version: 0, options: { showTimer: false } }))).toEqual(DEFAULT_OPTIONS)
    expect(put(JSON.stringify({ version: OPTIONS_VERSION, options: { showTimer: false, autoXOnPlace: 'yes' } }))).toEqual({
      ...DEFAULT_OPTIONS,
      showTimer: false,
    })
    expect(loadOptions(memory())).toEqual(DEFAULT_OPTIONS)
  })
})
