import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { SCHEDULE_DIR } from '../src/schedule/schedule.testing.ts'

/** The real tools, run as `bun run` runs them, in scratch folders. */
const scratch = mkdtempSync(join(tmpdir(), 'schedule-tool-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

const run = (script: string, args: string[]) => {
  const result = spawnSync('bun', [join(import.meta.dirname, script), ...args], { encoding: 'utf8' })
  return { code: result.status, out: result.stdout, err: result.stderr }
}
const schedule = (out: string, args: string[]) => run('schedule.ts', [...args, '--out', out, '--report', join(out, '../report')])
const dayLines = (file: string): string[] => readFileSync(file, 'utf8').split('\n').filter((l) => l.startsWith('{"n":'))
/** A day line without the comma that separates it from the next one. */
const bare = (line: string): string => line.replace(/,$/, '')
const committed = dayLines(join(SCHEDULE_DIR, '2026-09.json'))

/**
 * 2026-09-28 (n=2) was generated before SLAY-8.1 (scenegen: hard-exclude vehicles from
 * sleeping-type rooms) and still carries that bug in the committed schedule (a delivery van
 * in the Bedroom Department) — the day already played out, so regenerating its committed
 * content (which would also change its clues, not just the one object) is left for the owner
 * to decide, not done automatically here. Until then, the generator legitimately produces a
 * different day 2 than what is committed; both comparisons below exclude just that one day so
 * the rest of the window still guards real determinism.
 */
const KNOWN_DIVERGED_DAYS = new Set(['2026-09-28'])
const withoutKnownDiverged = (lines: string[]): string[] => lines.filter((l) => !KNOWN_DIVERGED_DAYS.has(JSON.parse(bare(l)).date))

describe('bun run schedule', () => {
  it('writes byte-identical files whatever --jobs is, equal to the committed days', { timeout: 180_000 }, () => {
    const one = join(scratch, 'one')
    const many = join(scratch, 'many')
    expect(schedule(one, ['--start', '2026-09-27', '--days', '4', '--jobs', '1']).code).toBe(0)
    expect(schedule(many, ['--start', '2026-09-27', '--days', '4', '--jobs', '3']).code).toBe(0)
    for (const name of ['2026-09.json', 'index.json']) expect(readFileSync(join(one, name), 'utf8'), name).toBe(readFileSync(join(many, name), 'utf8'))
    expect(withoutKnownDiverged(dayLines(join(one, '2026-09.json')).map(bare))).toEqual(withoutKnownDiverged(committed.slice(0, 4).map(bare)))
    const index = JSON.parse(readFileSync(join(one, 'index.json'), 'utf8'))
    expect(index).toMatchObject({ launch: '2026-09-27', first: '2026-09-27', last: '2026-09-30', count: 4 })
    const report = readFileSync(join(scratch, 'report/report.md'), 'utf8')
    expect(report).toContain('| n | date | planned | made | attempts |')
  })

  it('extends from the day after the last scheduled day, and refuses a gap, an earlier start and a changed published day', { timeout: 180_000 }, () => {
    const dir = join(scratch, 'extend')
    expect(schedule(dir, ['--start', '2026-09-27', '--days', '2', '--jobs', '2']).code).toBe(0)
    expect(schedule(dir, ['--days', '2', '--jobs', '2']).code).toBe(0)
    const days = dayLines(join(dir, '2026-09.json'))
    expect(days.length).toBe(4)
    expect(withoutKnownDiverged(days.map(bare))).toEqual(withoutKnownDiverged(committed.slice(0, 4).map(bare)))

    const gap = schedule(dir, ['--start', '2026-10-05', '--days', '1'])
    expect(gap.code).toBe(2)
    expect(gap.err).toContain('gap')
    expect(schedule(join(scratch, 'empty'), ['--start', '2026-09-28', '--days', '1']).code).toBe(2)
    expect(schedule(dir, ['--start', '2026-09-20', '--days', '1']).code).toBe(2)
    expect(schedule(dir, ['--start', '2026-09-27', '--days', '0']).code).toBe(2)
    expect(schedule(dir, ['--start', '2026-13-12', '--days', '1']).code).toBe(2)

    // A published day must not change: tamper with one, then regenerate it.
    const file = join(dir, '2026-09.json')
    const original = readFileSync(file, 'utf8')
    writeFileSync(file, original.replace('"attempts":1', '"attempts":9'))
    const refused = schedule(dir, ['--start', '2026-09-27', '--days', '1', '--jobs', '1'])
    expect(refused.code).toBe(1)
    expect(refused.err).toContain('must not change')
    expect(readFileSync(file, 'utf8')).not.toBe(original)
    expect(schedule(dir, ['--start', '2026-09-27', '--days', '4', '--jobs', '2', '--overwrite']).code).toBe(0)
    expect(readFileSync(file, 'utf8')).toBe(original)
  })
})

describe('bun run schedule:check', () => {
  it('prints the days left and exits 0 with at least 30, 1 with fewer', () => {
    const before = run('schedule-check.ts', ['--today', '2026-09-27'])
    expect(before.code).toBe(0)
    expect(before.out).toContain('119 days left after 2026-09-27')
    expect(before.out).toContain('last scheduled date 2027-01-24')
    expect(run('schedule-check.ts', ['--today', '2026-12-25']).code).toBe(0)
    const low = run('schedule-check.ts', ['--today', '2026-12-26'])
    expect(low.code).toBe(1)
    expect(low.out).toContain('29 days left')
    expect(low.out).toContain('bun run schedule --start 2027-01-25')
  })
  it('exits 1 when there is no schedule and 2 on bad arguments', () => {
    const none = run('schedule-check.ts', ['--dir', join(scratch, 'nothing-here')])
    expect(none.code).toBe(1)
    expect(none.out).toContain('No schedule found')
    expect(run('schedule-check.ts', ['--today', 'soon']).code).toBe(2)
    expect(run('schedule-check.ts', ['--bogus']).code).toBe(2)
  })
})

describe('bun run schedule:next', () => {
  it('prints whether a top-up is due, where it starts and the exact command', () => {
    const fine = run('schedule-next.ts', ['--today', '2026-09-27'])
    expect(fine.code).toBe(0)
    expect(fine.out).toContain('119 days left after 2026-09-27; a top-up is not due')
    expect(fine.out).toContain('Next start: 2027-01-25 (last day to be added: 2027-04-24)')
    expect(fine.out).toContain('Command: bun run schedule --start 2027-01-25 --days 90 --jobs 2')
    const due = run('schedule-next.ts', ['--today', '2026-12-26', '--days', '30'])
    expect(due.code).toBe(0)
    expect(due.out).toContain('29 days left after 2026-12-26; a top-up is due')
    expect(due.out).toContain('Command: bun run schedule --start 2027-01-25 --days 30 --jobs 2')
  })
  it('prints key=value lines for $GITHUB_OUTPUT with --github', () => {
    const out = run('schedule-next.ts', ['--today', '2026-12-26', '--github']).out
    expect(out.trim().split('\n')).toEqual(['needed=true', 'days_left=29', 'start=2027-01-25', 'days=90', 'end=2027-04-24'])
    expect(run('schedule-next.ts', ['--today', '2026-09-27', '--github']).out).toContain('needed=false')
  })
  it('reports a top-up as due with --force even when the schedule is comfortable', () => {
    const forced = run('schedule-next.ts', ['--today', '2026-09-27', '--force', '--github', '--days', '5'])
    expect(forced.out.trim().split('\n')).toEqual(['needed=true', 'days_left=119', 'start=2027-01-25', 'days=5', 'end=2027-01-29'])
    expect(run('schedule-next.ts', ['--today', '2026-09-27', '--force']).out).toContain('a top-up is forced')
  })
  it('starts on the launch date when nothing is scheduled, and exits 2 on bad arguments', () => {
    const none = run('schedule-next.ts', ['--dir', join(scratch, 'nothing-here'), '--today', '2026-09-27', '--github'])
    expect(none.code).toBe(0)
    expect(none.out).toContain('needed=true')
    expect(none.out).toContain('start=2026-09-27')
    for (const bad of [['--days', '0'], ['--days', '900'], ['--days', 'many'], ['--today', 'soon'], ['--bogus']]) expect(run('schedule-next.ts', bad).code, bad.join(' ')).toBe(2)
  })
})
