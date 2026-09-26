import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import { missingCardText } from '../../render/cards/cardText.ts'
import { buildEntry } from './build.ts'
import { SWEEP_SEED_START, sweepCell } from './sweep.ts'
import type { SweepReport } from './sweep.ts'

/**
 * Smoke sweep (CAD-5.7), in `bun run test:slow`: sizes 6 and 7, 2 fresh seeds, the five tiers that are quick (expert takes minutes on a
 * 6x6 board and is covered by the per-tier sweeps in `generator/scale`). Every accepted puzzle must build twice to the same bytes, pass every
 * gate of `entryProblems` and show all of its cards in the rendered card grid; the success rate is not asserted (two seeds say nothing).
 */
const TIERS: TierId[] = ['very-easy', 'easy', 'easy-medium', 'medium', 'hard']

describe('smoke sweep of sizes 6 and 7', () => {
  for (const size of [6, 7]) {
    it(`${size}x${size}: 2 fresh seeds per tier, no gate failure`, { timeout: 5 * 60_000 }, () => {
      let accepted = 0
      for (const tier of TIERS) {
        const result = sweepCell(size, tier, 'home', { start: SWEEP_SEED_START, seeds: 2 })
        expect(result.failures, `${size}-${tier}`).toEqual([])
        accepted += result.accepted
      }
      expect(accepted).toBeGreaterThan(0)
    })
  }

  it('renders every card of an accepted puzzle', () => {
    for (let seed = SWEEP_SEED_START; seed < SWEEP_SEED_START + 5; seed++) {
      const built = buildEntry(7, 'easy', 'office', seed)
      if (built.ok) expect(missingCardText(built.entry.puzzle), built.entry.id).toEqual([])
    }
  })
})

describe('bun run validate:generation', () => {
  it('sweeps a tiny window, writes the JSON and markdown report and exits 0', { timeout: 5 * 60_000 }, () => {
    const out = mkdtempSync(join(tmpdir(), 'slaydoku-sweep-'))
    const run = spawnSync('bun', ['tools/validate.ts', '--sizes', '6', '--tiers', 'very-easy,easy', '--themes', 'home', '--seeds', '2', '--jobs', '2', '--out', out], {
      cwd: new URL('../../../', import.meta.url).pathname,
      encoding: 'utf8',
    })
    expect(run.status, run.stderr).toBe(0)
    const report = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8')) as SweepReport
    expect(report.cells).toHaveLength(2)
    expect(report.summary.failures).toBe(0)
    expect(readFileSync(join(out, 'report.md'), 'utf8')).toContain('## Per cell')
  })

  it('refuses seeds the committed pack uses', () => {
    const run = spawnSync('bun', ['tools/validate.ts', '--start', '100'], { cwd: new URL('../../../', import.meta.url).pathname, encoding: 'utf8' })
    expect(run.status).toBe(2)
  })
})
