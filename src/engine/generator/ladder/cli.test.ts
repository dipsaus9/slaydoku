import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { demoScene } from '../../../content/demo/scene.ts'
import { generatedSize, parseLadderArgs, sceneForSpec } from './cli.ts'
import { formatLadderReport, withCastLabels } from './format.ts'
import { generateLadder } from './generate.ts'
import { formatMeasurement, measureLadder } from './measure.ts'
import { sceneForSeed } from '../scale/measure.ts'

describe('parseLadderArgs', () => {
  it('reads scene, tier, seed, victim (1-based), out and flags', () => {
    expect(parseLadderArgs(['--scene', 'demo', '--tier', 'very-easy', '--seed', '7', '--victim', '6,2', '--out', 'p.json', '--loose', '--json'])).toEqual({
      scenes: ['demo'], tiers: ['very-easy'], seed: 7, victimCell: { row: 5, col: 1 }, out: 'p.json', loose: true, json: true, cast: false,
    })
    expect(parseLadderArgs(['--scene=9', '--tier=easy'])).toMatchObject({ scenes: ['9'], tiers: ['easy'], seed: 1, loose: false, json: false, cast: false })
    expect(parseLadderArgs(['--scene=9', '--tier=easy', '--cast']).cast).toBe(true)
  })

  it('takes lists and all for a measurement', () => {
    const args = parseLadderArgs(['--scene', '6,9,12', '--tier', 'all', '--report', '20', '--seed', '100', '--budget', '5000'])
    expect(args.scenes).toEqual(['6', '9', '12'])
    expect(args.tiers).toEqual(['very-easy', 'easy', 'easy-medium', 'medium'])
    expect(args).toMatchObject({ report: 20, seed: 100, budgetMs: 5000 })
  })

  it('rejects missing, unknown and malformed arguments', () => {
    expect(() => parseLadderArgs(['--tier', 'easy'])).toThrow(/--scene/)
    expect(() => parseLadderArgs(['--scene', 'a'])).toThrow(/--tier/)
    expect(() => parseLadderArgs(['--scene', 'a', '--tier', 'hard'])).toThrow(/--tier must be/)
    expect(() => parseLadderArgs(['--scene', 'a', '--tier', 'easy', '--seed', 'x'])).toThrow(/integer/)
    expect(() => parseLadderArgs(['--scene', 'a', '--tier', 'easy', '--victim', '0,3'])).toThrow(/1-based/)
    expect(() => parseLadderArgs(['--scene', 'a', '--tier', 'easy', '--report', '0'])).toThrow(/positive/)
    expect(() => parseLadderArgs(['--scene', 'a,b', '--tier', 'easy'])).toThrow(/--report/)
    expect(() => parseLadderArgs(['--scene', 'a', '--tier', 'easy', '--wat', '1'])).toThrow(/Unknown/)
    expect(() => parseLadderArgs(['--scene', 'a', '--tier'])).toThrow(/Missing value/)
  })
})

describe('sceneForSpec', () => {
  const noFile = () => {
    throw new Error('ENOENT')
  }
  it('makes a random scene of a size per seed, or resolves a built-in name', () => {
    expect(generatedSize('9')).toBe(9)
    expect(generatedSize('generated:12')).toBe(12)
    expect(generatedSize('demo')).toBeNull()
    expect(sceneForSpec('9', 3, {}, noFile).width).toBe(9)
    expect(sceneForSpec('generated:6', 3, {}, noFile)).toEqual(sceneForSpec('6', 3, {}, noFile))
    expect(sceneForSpec('demo', 1, { demo: demoScene }, noFile)).toBe(demoScene)
    expect(() => sceneForSpec('40', 1, {}, noFile)).toThrow(/size from/)
  })
})

describe('formatLadderReport', () => {
  it('prints board, ladder, cards with the cast and the victim', () => {
    const outcome = generateLadder(demoScene, 'very-easy', 1, { victimCell: { row: 8, col: 6 } })
    if (!outcome.ok) throw new Error(outcome.message)
    const text = formatLadderReport(outcome, 'demo')
    expect(text).toContain('Board')
    expect(text).toContain('Ladder')
    expect(text).toMatch(/Cards \(\d+/)
    expect(text).toContain('The victim was alone with the murderer.')
    expect(text).toContain('The victim on r9c7')
    expect(text).toMatch(/Ben|Alice|Dan|Chloe|Emma|Frank|Grace|Henry/)
    expect(text).toContain('ladderCheck (1 card per placement, person references off): ok')
    expect(text).not.toMatch(/\b[A-H] (stood|was)\b/)
  })

  it('relabels suspects with the cast and the victim as the victim', { timeout: 60_000 }, () => {
    const outcome = generateLadder(sceneForSeed(12, 1), 'easy', 1)
    if (!outcome.ok) throw new Error(outcome.message)
    const labels = withCastLabels(outcome.puzzle).people.map((p) => p.label)
    expect(labels.slice(0, 8)).toEqual(['the victim', 'Alice', 'Ben', 'Chloe', 'Dan', 'Emma', 'Frank', 'Grace'])
    expect(labels[8]).toBe('Henry')
    expect(labels[9]).toBe('Guest 9')
  })
})

describe('measureLadder', () => {
  it('counts successes and times per seed and formats one line', () => {
    const m = measureLadder((seed) => sceneForSeed(6, seed), 'easy', [1, 2, 3])
    expect(m).toMatchObject({ tier: 'easy', seeds: 3, ok: 3 })
    expect(m.ms).toHaveLength(3)
    expect(formatMeasurement('6', m)).toMatch(/^6 easy: 3\/3 ok \(100%\), median \d+ ms/)
    const failing = measureLadder((seed) => sceneForSeed(6, seed), 'medium', [1], { maxAttempts: 0 })
    expect(failing.failures).toEqual([{ seed: 1, reason: 'attempts' }])
    expect(formatMeasurement('6', failing)).toContain('FAILED seed 1')
  })
})

describe('bun tools/ladder.ts', () => {
  const bun = spawnSync('bun', ['--version'])
  const runnable = !bun.error && bun.status === 0

  it.skipIf(!runnable)('prints a ladder, and exits 2 with the usage on bad arguments', () => {
    const run = spawnSync('bun', ['tools/ladder.ts', '--scene', 'demo', '--tier', 'easy', '--seed', '2', '--victim', '9,7'], { encoding: 'utf8' })
    expect(run.status).toBe(0)
    expect(run.stdout).toContain('Ladder')
    const bad = spawnSync('bun', ['tools/ladder.ts', '--scene', 'demo'], { encoding: 'utf8' })
    expect(bad.status).toBe(2)
    expect(bad.stderr).toContain('Usage: bun tools/ladder.ts')
  })
})
