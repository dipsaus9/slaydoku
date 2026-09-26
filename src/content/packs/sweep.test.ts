import { describe, expect, it } from 'vitest'
import { SEED_WINDOW, buildEntry } from './build.ts'
import { boardKey, entryProblems, puzzleKey } from './gates.ts'
import { sampleEntry } from './sample.testing.ts'
import { TIERS } from '../../engine/generator/tiers/index.ts'
import type { PackEntry } from './types.ts'
import { GATES, MIN_SEEDS_FOR_RATE, SWEEP_SEED_START, buildReport, cellProblems, gateOf, renderMarkdown, rowOf, sweepCell } from './sweep.ts'
import type { CellResult } from './sweep.ts'

const sample = sampleEntry(6, 'very-easy', 'home')
const entry = (): PackEntry => structuredClone(sample)

const cell = (over: Partial<CellResult> = {}): CellResult => ({
  size: 6, tier: 'easy', theme: 'home', start: SWEEP_SEED_START, seeds: 20, budgetMs: 1000, accepted: 10, usable: 8, rejected: { 'score-band': 10 },
  duplicateBoards: 2, duplicatePuzzles: 0, packBoardClashes: 0, packPuzzleClashes: 0, failures: [], generationMs: 20_000, maxMs: 3000, verifyMs: 500, ...over,
})

describe('the sweep seed window', () => {
  it('starts above every seed a pack build searches', () => {
    expect(SWEEP_SEED_START).toBeGreaterThanOrEqual((TIERS.length + 1) * SEED_WINDOW)
  })
})

describe('gateOf', () => {
  it('names the gate of every problem entryProblems words', () => {
    const cases: [(e: PackEntry) => void, string][] = [
      [(e) => (e.puzzle.people.find((p) => p.kind === 'suspect')!.label += '_1'), 'hint-audit'],
      [(e) => (e.clueCount += 1), 'clue-count'],
      [(e) => e.puzzle.clues.splice(3), 'unique-solution'],
    ]
    for (const [tamper, gate] of cases) {
      const bad = entry()
      tamper(bad)
      bad.cast = bad.puzzle.people.filter((p) => p.kind === 'suspect').map((p) => p.label)
      expect(entryProblems(bad).map(gateOf), gate).toContain(gate)
    }
  })

  it('reads the wording of each gate', () => {
    expect(gateOf('x: score v2 30 outside the easy band 8-15 (it lies in medium)')).toBe('score-band')
    expect(gateOf('x: only 2 clue kinds, need 3')).toBe('variety')
    expect(gateOf('x: clue kind inRow used 4 of 6 times')).toBe('variety')
    expect(gateOf('x: 13 clues, expected 6-12')).toBe('clue-count')
    expect(gateOf('x: clues: 0% direct clues, expert needs at least 15%')).toBe('clue-audit')
    expect(gateOf('x: clue noun: "the table" names two kinds')).toBe('noun-audit')
    expect(gateOf('x: ladderCheck: not solvable on the easy ladder')).toBe('tier')
    expect(gateOf('x: tierFor gives medium, not easy')).toBe('tier')
    expect(gateOf('x: the human solver does not place everybody as stored')).toBe('human-solve')
    expect(gateOf('x: verify failed: solutions 2')).toBe('unique-solution')
    expect(gateOf('x: empty title')).toBe('shape')
  })

  it('treats the guarantees of the generator as defects and the pack filters as rejections', () => {
    for (const gate of ['unique-solution', 'human-solve', 'tier', 'shape'] as const) expect(GATES[gate]).toBe('defect')
    for (const gate of ['score-band', 'clue-count', 'variety', 'clue-audit', 'hint-audit', 'noun-audit', 'generation'] as const) expect(GATES[gate]).toBe('filter')
  })
})

describe('rowOf and the report', () => {
  it('derives success rate, seconds and yield from the counts', () => {
    const row = rowOf(cell(), 0.25)
    expect(row.successRate).toBe(0.5)
    expect(row.secondsPerSeed).toBe(1)
    expect(row.secondsPerPuzzle).toBe(2.5)
    expect(row.yieldPerHour).toBe(1440)
    expect(row.duplicateBoardRate).toBe(0.2)
    expect(row.lowSuccess).toBe(false)
  })

  it('flags a cell under the minimum and only fails it from enough seeds', () => {
    const low = cell({ accepted: 1, usable: 1 })
    expect(rowOf(low, 0.25).lowSuccess).toBe(true)
    expect(cellProblems(rowOf(low, 0.25), false).join()).toContain('under the minimum')
    const few = cell({ seeds: MIN_SEEDS_FOR_RATE - 1, accepted: 0, usable: 0 })
    expect(rowOf(few, 0.25).lowSuccess).toBe(true)
    expect(cellProblems(rowOf(few, 0.25), false)).toEqual([])
  })

  it('a cell without a puzzle has no seconds per puzzle', () => {
    expect(rowOf(cell({ accepted: 0, usable: 0 }), 0.25).secondsPerPuzzle).toBeNull()
  })

  it('fails on a listed failure, and on a rejection only when strict', () => {
    expect(cellProblems(rowOf(cell(), 0.25), false)).toEqual([])
    expect(cellProblems(rowOf(cell(), 0.25), true).join()).toContain('strict')
    expect(cellProblems(rowOf(cell({ failures: ['6-easy-home-10001: tier: bad'] }), 0.25), false)).toEqual(['6-easy-home-10001: tier: bad'])
  })

  it('renders the report as markdown with every cell, the flags and the failures', () => {
    const args = { sizes: [6], tiers: ['easy' as const], themes: ['home' as const, 'park' as const], seeds: 20, start: SWEEP_SEED_START, budgetMs: 1000, minSuccess: 0.6, strict: false }
    const report = buildReport(args, [cell({ theme: 'park', failures: ['6-easy-park-10003: not deterministic'] }), cell()])
    expect(report.cells.map((c) => c.theme)).toEqual(['home', 'park'])
    expect(report.summary).toMatchObject({ cells: 2, seeds: 40, accepted: 20, usable: 16, failures: 1, lowCells: 2 })
    const md = renderMarkdown(report)
    expect(md).toContain('| 6 | easy | home | 20 | 10 | 50% (low) | 1 | 2.5 | 1440 | 2 (20%) | 0 (0%) | 0/0 | score-band 10 |')
    expect(md).toContain('- 6-easy-park-10003: not deterministic')
    expect(md).toContain('- 6x6 easy home: 50% (10 of 20); rejected: score-band 10')
  })
})

describe('sweepCell', () => {
  it('accounts for every seed: accepted plus rejected, no failures on a healthy cell', () => {
    const lines: string[] = []
    const result = sweepCell(6, 'very-easy', 'home', { start: SWEEP_SEED_START, seeds: 3, progress: (l) => lines.push(l) })
    const rejected = Object.values(result.rejected).reduce((n, v) => n + (v ?? 0), 0)
    expect(result.accepted + rejected).toBe(3)
    expect(result.usable).toBeLessThanOrEqual(result.accepted)
    expect(result.failures).toEqual([])
    expect(lines).toHaveLength(3)
  })

  it('counts a puzzle that is already known (the committed pack) as a clash', () => {
    let known: { boards: Set<string>; puzzles: Set<string> } | undefined
    for (let seed = SWEEP_SEED_START; !known; seed++) {
      const built = buildEntry(6, 'very-easy', 'home', seed)
      if (built.ok) known = { boards: new Set([boardKey(built.entry.puzzle)]), puzzles: new Set([puzzleKey(built.entry.puzzle)]) }
    }
    const result = sweepCell(6, 'very-easy', 'home', { start: SWEEP_SEED_START, seeds: 3, determinism: false, known })
    expect(result.packBoardClashes).toBe(1)
    expect(result.packPuzzleClashes).toBe(1)
  })
})
