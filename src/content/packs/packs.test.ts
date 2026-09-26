import { describe, expect, it } from 'vitest'
import { puzzleFingerprint } from '../../game/fingerprint.ts'
import { sampleFile } from './sample.testing.ts'
import { TIERS } from '../../engine/generator/tiers/index.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import {
  ALL_THEME_ROOM_NAMES, HET_ROOMS, PACK_FORMAT, boardKey, clueRange, dress, indexEntryOf, kindCounts, minKinds, packFile, packId,
  packSetProblems, sortPackFiles, parseIndex, parsePackFile, puzzleKey, seedBase, serializeIndex, serializePack, titleFor, varietyProblem, withArticle,
} from './index.ts'
import type { PackFile } from './index.ts'
import { SCENE_THEMES } from '../themes/index.ts'
import { buildCastForBoard } from '../../render/cards/procedural/index.ts'

/** Two small pack files built on the spot: no pack data is committed. */
const files: PackFile[] = sortPackFiles([sampleFile(6, 'very-easy'), sampleFile(6, 'easy')])
const index = parseIndex(serializeIndex(files.flatMap((f) => f.puzzles)))

const puzzleOf = (clues: { personId: string; type: string }[]): Puzzle =>
  ({ scene: { width: 6, height: 6, rooms: [], cellRooms: [], objects: [], edgeFeatures: [] }, people: [], solution: [], clues }) as unknown as Puzzle

describe('room articles', () => {
  it('gives every theme room name a de/het article', () => {
    for (const name of ALL_THEME_ROOM_NAMES) expect(withArticle(name), name).toMatch(/^(de|het) \S/)
  })
  it('only lists het-words that are theme room names', () => {
    for (const name of HET_ROOMS) expect(ALL_THEME_ROOM_NAMES, name).toContain(name)
  })
  it('reads the well-known rooms right', () => {
    expect(withArticle('Toilet')).toBe('het Toilet')
    expect(withArticle('Keuken')).toBe('de Keuken')
    expect(withArticle('Muzieklokaal')).toBe('het Muzieklokaal')
    expect(withArticle('Speelplaats')).toBe('de Speelplaats')
  })
})

describe('gates', () => {
  it('clue count range runs from one card per person to two', () => {
    expect(clueRange(9)).toEqual({ min: 9, max: 18 })
  })
  it('wants more clue kinds on big boards', () => {
    expect(minKinds(6)).toBe(3)
    expect(minKinds(16)).toBe(4)
  })
  it('refuses a puzzle that repeats one kind, too few kinds or too many line clues', () => {
    const kinds = (list: string[]) => puzzleOf(list.map((type) => ({ personId: 'A', type })))
    expect(varietyProblem(kinds(['aloneWithMurderer', 'inRoom', 'onObject', 'alone', 'besideObject', 'inRoom']), 6)).toBeNull()
    expect(varietyProblem(kinds(['aloneWithMurderer', 'inRoom', 'inRoom', 'alone', 'alone', 'alone']), 6)).toMatch(/kinds/)
    expect(varietyProblem(kinds(['aloneWithMurderer', 'inRoom', 'inRoom', 'inRoom', 'inRoom', 'inRoom', 'alone', 'onObject', 'besideObject', 'inCorner']), 6)).toMatch(/used 5 of 10/)
    expect(varietyProblem(kinds(['aloneWithMurderer', 'inRow', 'inColumn', 'onLine', 'inRoom', 'alone', 'onObject', 'besideObject']), 6)).toMatch(/row\/column\/line/)
  })
  it('does not count the victim card as a kind', () => {
    expect([...kindCounts(puzzleOf([{ personId: 'V', type: 'aloneWithMurderer' }, { personId: 'A', type: 'alone' }])).keys()]).toEqual(['alone'])
  })
  it('tells duplicate boards and puzzles apart', () => {
    const a = puzzleOf([{ personId: 'A', type: 'alone' }])
    const b = puzzleOf([{ personId: 'B', type: 'alone' }])
    expect(boardKey(a)).toBe(boardKey(b))
    expect(puzzleKey(a)).not.toBe(puzzleKey(b))
  })
})

describe('building blocks', () => {
  it('gives every tier its own seed window', () => {
    const bases = TIERS.map((t) => seedBase(t.id))
    expect(new Set(bases).size).toBe(TIERS.length)
  })
  it('builds stable ids and file names', () => {
    expect(packId(9, 'easy-medium', 'home', 301)).toBe('9-easy-medium-home-301')
    expect(packFile(9, 'easy-medium')).toBe('9-easy-medium.json')
  })
  it('dresses a puzzle: cast names, het cadeau, articles', () => {
    const puzzle = {
      scene: { width: 2, height: 2, rooms: [{ id: 'r1', name: 'Keuken' }, { id: 'r2', name: 'Toilet' }], cellRooms: [['r1', 'r2'], ['r1', 'r2']], objects: [], edgeFeatures: [] },
      people: [{ id: 'V', kind: 'victim', label: 'V' }, { id: 'A', kind: 'suspect', label: 'A' }, { id: 'B', kind: 'suspect', label: 'B' }],
      solution: [], clues: [],
    } as unknown as Puzzle
    const dressed = dress(puzzle, ['Ben', 'Alice'])
    expect(dressed.people.map((p) => p.label)).toEqual(['het cadeau', 'Ben', 'Alice'])
    expect(dressed.scene.rooms.map((r) => r.name)).toEqual(['de Keuken', 'het Toilet'])
    expect(dressed.scene.rooms.map((r) => r.id)).toEqual(['r1', 'r2'])
  })
  it('titles a puzzle in Dutch by theme and the room of the gift', () => {
    const scene = { width: 1, height: 1, rooms: [{ id: 'r1', name: 'de Keuken' }], cellRooms: [['r1']], objects: [], edgeFeatures: [] }
    expect(titleFor(scene, 'home', 0, 0, 0)).toBe('Woonhuis: Het cadeau in de Keuken')
    expect(titleFor(scene, 'home', 0, 0, 1)).toBe('Woonhuis: Onraad in de Keuken')
  })
  it('serializes a pack as a header plus one puzzle per line, and an index the same way', () => {
    const file = files[0]!
    const text = serializePack(file)
    expect(text.split('\n')).toHaveLength(file.puzzles.length + 3)
    expect(JSON.parse(text)).toEqual(file)
    const idx = serializeIndex(file.puzzles)
    expect(parseIndex(idx).puzzles).toEqual(file.puzzles.map(indexEntryOf))
  })
})

describe('pack files and index', () => {
  it('has one puzzle per theme in each file', () => {
    for (const file of files) {
      for (const theme of SCENE_THEMES) {
        expect(file.puzzles.some((p) => p.theme === theme.id), `${file.size}-${file.tier} ${theme.id}`).toBe(true)
      }
    }
  })
  it('is written byte for byte the way the pipeline writes it', () => {
    for (const file of files) {
      const text = serializePack(file)
      expect(text, packFile(file.size, file.tier)).toBe(serializePack(parsePackFile(text, packFile(file.size, file.tier))))
    }
    expect(index.puzzles).toEqual(files.flatMap((f) => f.puzzles).map(indexEntryOf))
  })
  it('has unique ids, no duplicate boards or puzzles, and an index that matches the files', () => {
    expect(index.format).toBe(PACK_FORMAT)
    expect(packSetProblems(files, index)).toEqual([])
  })
  it('lists size, tier, theme, title, clue count and rating for each puzzle', () => {
    for (const entry of index.puzzles) {
      expect(entry.title).toMatch(/\S/)
      expect(entry.clues).toBeGreaterThan(0)
      expect(entry.rating.score).toBeGreaterThanOrEqual(0)
      expect(entry.rating.score).toBeLessThanOrEqual(100)
      expect(entry.id).toBe(packId(entry.size, entry.tier, entry.theme, Number(entry.id.split('-').pop())))
      expect(files.some((f) => f.puzzles.some((p) => p.id === entry.id) && packFile(f.size, f.tier) === entry.file)).toBe(true)
    }
  })
  it('gives every index entry the fingerprint of its stored puzzle', () => {
    const stored = new Map(files.flatMap((f) => f.puzzles).map((p) => [p.id, p.puzzle]))
    for (const entry of index.puzzles) {
      expect(entry.fp, entry.id).toMatch(/^[0-9a-f]{8}$/)
      expect(entry.fp, entry.id).toBe(puzzleFingerprint(stored.get(entry.id)!))
    }
  })
  it('reports an index fingerprint that does not match the stored puzzle', () => {
    const wrong = { ...index, puzzles: index.puzzles.map((p, i) => (i === 0 ? { ...p, fp: '00000000' } : p)) }
    expect(packSetProblems(files, wrong).some((p) => p.startsWith(index.puzzles[0]!.id) && /fingerprint/.test(p))).toBe(true)
    const missing = { ...index, puzzles: index.puzzles.map(({ fp: _fp, ...rest }) => rest as (typeof index.puzzles)[number]) }
    expect(packSetProblems(files, missing).length).toBeGreaterThan(0)
  })
  it('gives the people of a ladder puzzle the genders of the cast builder, and the gift none', () => {
    for (const entry of files.flatMap((f) => f.puzzles)) {
      const built = buildCastForBoard(entry.size, entry.id)
      const suspects = entry.puzzle.people.filter((p) => p.kind === 'suspect')
      expect(suspects.map((p) => p.gender), entry.id).toEqual([...built.genders])
      expect(entry.puzzle.people.find((p) => p.kind === 'victim')?.gender, entry.id).toBeUndefined()
    }
  })
})
