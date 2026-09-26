import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

/** Guards .github/workflows/schedule-top-up.yml, which cannot be run here: parsed with Bun's YAML parser (a child process), its shell steps syntax-checked with bash -n. */
const scratch = mkdtempSync(join(tmpdir(), 'schedule-workflow-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

interface Step {
  name?: string
  id?: string
  if?: string
  uses?: string
  run?: string
  env?: Record<string, string>
}
interface Workflow {
  on: { schedule: { cron: string }[]; workflow_dispatch: { inputs: Record<string, { default: string | boolean; type?: string }> } }
  permissions: Record<string, string>
  jobs: { 'top-up': { 'timeout-minutes': number; steps: Step[] } }
}

const parsed = spawnSync('bun', ['-e', 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(process.argv[1]).text())))', join(import.meta.dirname, '../.github/workflows/schedule-top-up.yml')], { encoding: 'utf8' })
const workflow = JSON.parse(parsed.stdout) as Workflow
const steps = workflow.jobs['top-up'].steps
const scripts = steps.flatMap((s) => (s.run ? [s.run] : []))
const step = (id: string) => steps.find((s) => s.id === id) as Step

describe('schedule-top-up.yml', () => {
  it('parses as YAML', () => {
    expect(parsed.status, parsed.stderr).toBe(0)
    expect(steps.length).toBeGreaterThan(5)
  })
  it('runs monthly and on demand with the days and dry_run inputs', () => {
    expect(workflow.on.schedule).toEqual([{ cron: '0 6 1 * *' }])
    const inputs = workflow.on.workflow_dispatch.inputs
    expect(inputs.days?.default).toBe('90')
    expect(inputs.dry_run).toMatchObject({ type: 'boolean', default: false })
  })
  it('declares the token permissions and a generous timeout', () => {
    expect(workflow.permissions).toEqual({ contents: 'write', 'pull-requests': 'write' })
    expect(workflow.jobs['top-up']['timeout-minutes']).toBe(60)
  })
  it('checks out main, installs bun and dependencies, then checks and plans with the local tools', () => {
    expect(steps[0]).toMatchObject({ uses: 'actions/checkout@v4' })
    expect(steps.some((s) => s.uses?.startsWith('oven-sh/setup-bun'))).toBe(true)
    expect(scripts.some((s) => s.includes('bun install --frozen-lockfile'))).toBe(true)
    const plan = step('plan').run as string
    expect(plan).toContain('bun run schedule:check')
    expect(plan).toContain('bun run schedule:next --days "$DAYS" --github >> "$GITHUB_OUTPUT"')
  })
  it('generates deterministically from the planned start and opens the pull request with gh', () => {
    expect(step('generate').if).toContain("steps.plan.outputs.needed == 'true'")
    expect(step('generate').run).toContain('bun run schedule --start "$START" --days "$COUNT" --jobs 2')
    const pr = steps.find((s) => s.name === 'Open the pull request') as Step
    expect(pr.if).toContain("env.DRY_RUN != 'true'")
    expect(pr.run).toContain('BRANCH="schedule/$START"')
    expect(pr.run).toContain('git add src/content/schedule')
    expect(pr.run).toContain('gh pr create --head "$BRANCH" --base main')
    expect(pr.run).not.toMatch(/git add (-A|\.|--all)/)
  })
  it('fails the run when fewer than 30 days are left at the end', () => {
    const last = steps[steps.length - 1] as Step
    expect(last.run).toContain('bun run schedule:check')
    expect(last.run).toContain('::error')
    expect(last.run).toContain('exit 1')
  })
  it('never splices an input straight into a script', () => {
    for (const script of scripts) expect(script).not.toContain('${{')
  })
  it('has shell steps that pass bash -n', () => {
    scripts.forEach((script, i) => {
      const file = join(scratch, `step-${i}.sh`)
      writeFileSync(file, script)
      const check = spawnSync('bash', ['-n', file], { encoding: 'utf8' })
      expect(check.status, `${script}\n${check.stderr}`).toBe(0)
    })
  })
})
