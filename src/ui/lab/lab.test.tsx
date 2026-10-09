import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { labLevels as demoLevels } from './levels.ts'
import { startGeneration } from './client.ts'
import type { WorkerLike } from './client.ts'
import { GenerateForm } from './GenerateForm.tsx'
import { runGeneration } from './generate.ts'
import { LabPlay } from './LabPlay.tsx'
import type { PlayView } from './LabPlay.tsx'
import {
  DEFAULT_BUDGET_S,
  defaultFormValues,
  labPath,
  parseForm,
  parseLabRoute,
  verifySummary,
} from './model.ts'
import { LevelTable } from './LevelTable.tsx'
import { packView } from './packView.ts'
import type { GenerateRequest, WorkerMessage } from './protocol.ts'
import { LAB_EN } from './strings.ts'

describe('lab routes', () => {
  it('parses and builds the lab paths', () => {
    expect(parseLabRoute('/lab')).toEqual({ kind: 'home' })
    expect(parseLabRoute('/lab/generated')).toEqual({ kind: 'generated' })
    expect(parseLabRoute('/lab/level/demo')).toEqual({ kind: 'level', id: 'demo' })
    expect(parseLabRoute('/lab/wat')).toEqual({ kind: 'home' })
    expect(parseLabRoute('/level/demo')).toEqual({ kind: 'none' })
    expect(parseLabRoute('/labyrint')).toEqual({ kind: 'none' })
    for (const route of [{ kind: 'home' }, { kind: 'generated' }, { kind: 'level', id: 'a b' }, { kind: 'level', id: 'demo' }] as const) {
      expect(parseLabRoute(labPath(route))).toEqual(route)
    }
  })
})

describe('generate form', () => {
  const values = defaultFormValues(7)

  it('turns valid values into a request', () => {
    expect(parseForm({ ...values, size: 9, tier: 'hard', theme: 'park' })).toEqual({
      ok: true,
      request: { size: 9, tier: 'hard', theme: 'park', seed: 7, victim: undefined, budgetMs: DEFAULT_BUDGET_S * 1000 },
    })
  })

  it('reads the victim cell 1-based into a 0-based cell', () => {
    const parsed = parseForm({ ...values, victimRow: '2', victimCol: '6' })
    expect(parsed.ok && parsed.request.victim).toEqual({ row: 1, col: 5 })
  })

  it('names every problem', () => {
    const t = LAB_EN.generate.errors
    expect(parseForm({ ...values, seed: '-1' })).toEqual({ ok: false, errors: [t.seed] })
    expect(parseForm({ ...values, seed: '1.5' })).toEqual({ ok: false, errors: [t.seed] })
    expect(parseForm({ ...values, seed: '' })).toEqual({ ok: false, errors: [t.seed] })
    expect(parseForm({ ...values, budgetSeconds: '1' })).toEqual({ ok: false, errors: [t.budget] })
    expect(parseForm({ ...values, victimRow: '2' })).toEqual({ ok: false, errors: [t.victimBoth] })
    expect(parseForm({ ...values, victimRow: '0', victimCol: '1' })).toEqual({ ok: false, errors: [t.victimRange(6)] })
    expect(parseForm({ ...values, victimRow: '7', victimCol: '1' })).toEqual({ ok: false, errors: [t.victimRange(6)] })
    const all = parseForm({ ...values, seed: 'x', budgetSeconds: 'x', victimCol: '1' })
    expect(all.ok).toBe(false)
    expect(!all.ok && all.errors).toHaveLength(3)
  })

  it('shows the form, and progress with a cancel button while a job runs', () => {
    const idle = renderToStaticMarkup(
      <GenerateForm values={values} onValues={() => {}} job={{ status: 'idle' }} onStart={() => {}} onCancel={() => {}} onPlay={() => {}} />,
    )
    expect(idle).toContain(LAB_EN.generate.submit)
    expect(idle).not.toContain(LAB_EN.generate.cancel)
    const request = { size: 6, tier: 'easy', theme: 'home', seed: 7, budgetMs: 60_000 } satisfies GenerateRequest
    const running = renderToStaticMarkup(
      <GenerateForm values={values} onValues={() => {}} job={{ status: 'running', request, phase: 'search' }} onStart={() => {}} onCancel={() => {}} onPlay={() => {}} />,
    )
    expect(running).toContain(LAB_EN.generate.cancel)
    expect(running).toContain(LAB_EN.generate.phase.search)
    expect(running).toContain('<progress')
  })

  it('shows the reason of a failed generation', () => {
    const failure = { reason: 'No puzzle found', timedOut: true, attempts: 3, elapsedMs: 5000, rejections: { 'not-unique': 2, trivial: 0 } }
    const html = renderToStaticMarkup(
      <GenerateForm values={values} onValues={() => {}} job={{ status: 'done', outcome: { ok: false, failure } }} onStart={() => {}} onCancel={() => {}} onPlay={() => {}} />,
    )
    expect(html).toContain('No puzzle found')
    expect(html).toContain(LAB_EN.generate.failTimedOut)
    expect(html).toContain('not-unique 2x')
    expect(html).not.toContain('trivial')
  })
})

describe('level table', () => {
  it('lists the registered levels', () => {
    const table = renderToStaticMarkup(<LevelTable levels={demoLevels} onOpen={() => {}} />)
    expect(demoLevels.length).toBeGreaterThan(0)
    for (const level of demoLevels) expect(table).toContain(`data-level="${level.id}"`)
  })
})

describe('verify summary', () => {
  it('passes a demo level', () => {
    const summary = verifySummary(demoLevels[0]!.puzzle)
    expect(summary.pass).toBe(true)
    expect(summary.solutionCount).toBe(1)
    expect(summary.problems).toEqual([])
  })

  it('fails a puzzle that lost its clues and says why', () => {
    const summary = verifySummary({ ...demoLevels[0]!.puzzle, clues: demoLevels[0]!.puzzle.clues.slice(0, 2) })
    expect(summary.pass).toBe(false)
    expect(summary.solutionCount).toBeGreaterThan(1)
    expect(summary.problems.length).toBeGreaterThan(0)
  })

  it('shows pass or fail in the play view', () => {
    const level = demoLevels[0]!
    const view: PlayView = { source: 'level', id: level.id, title: level.title, puzzle: level.puzzle, facts: [] }
    const pass = renderToStaticMarkup(<LabPlay view={view} onBack={() => {}} />)
    expect(pass).toContain('data-verify="pass"')
    expect(pass).toContain(LAB_EN.play.pass)
    const broken = renderToStaticMarkup(<LabPlay view={{ ...view, puzzle: { ...level.puzzle, clues: level.puzzle.clues.slice(0, 2) } }} onBack={() => {}} />)
    expect(broken).toContain('data-verify="fail"')
    expect(broken).toContain(LAB_EN.play.fail)
  })
})

describe('runGeneration', () => {
  // Seed 102: since the SLAY-19.1 decor kinds, seed 101 scores 8, just outside the very-easy band (a warning, not a failure).
  const request: GenerateRequest = { size: 6, tier: 'very-easy', theme: 'home', seed: 102, budgetMs: 30_000 }

  it('generates a playable, verified puzzle and reports its phases', () => {
    const phases: string[] = []
    const outcome = runGeneration(request, (phase) => phases.push(phase))
    expect(phases).toEqual(['scene', 'search', 'check'])
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.puzzle.id).toBe('6-very-easy-home-102')
    expect(outcome.puzzle.warnings).toEqual([])
    expect(verifySummary(outcome.puzzle.puzzle).pass).toBe(true)
    expect(packView(outcome.puzzle, 'generated').castSeed).toBe(outcome.puzzle.id)
  }, 60_000)

  it('is the same puzzle for the same request', () => {
    const a = runGeneration(request)
    const b = runGeneration(request)
    expect(a.ok && b.ok && a.puzzle.puzzle).toEqual(b.ok && a.ok && b.puzzle.puzzle)
  }, 60_000)

  it('pins the gift to the asked cell', () => {
    const outcome = runGeneration({ ...request, victim: { row: 0, col: 0 } })
    if (outcome.ok) {
      const { puzzle } = outcome.puzzle
      const victim = puzzle.people.find((p) => p.kind === 'victim')!
      expect(puzzle.solution.find((p) => p.personId === victim.id)!.cell).toEqual({ row: 0, col: 0 })
    } else {
      expect(outcome.failure.reason).not.toBe('')
    }
  }, 60_000)

  it('returns a reason instead of throwing on a bad request', () => {
    const outcome = runGeneration({ ...request, size: 2 })
    expect(outcome.ok).toBe(false)
    expect(!outcome.ok && outcome.failure.reason).not.toBe('')
  })

  it('reports a budget that runs out as a failure', () => {
    const outcome = runGeneration({ ...request, size: 16, tier: 'expert', budgetMs: 1 })
    expect(outcome.ok).toBe(false)
    expect(!outcome.ok && outcome.failure.timedOut).toBe(true)
  }, 60_000)
})

describe('worker client', () => {
  function fakeWorker() {
    const worker: WorkerLike & { posted: GenerateRequest[]; terminated: boolean } = {
      posted: [],
      terminated: false,
      onmessage: null,
      onerror: null,
      postMessage(request) {
        worker.posted.push(request)
      },
      terminate() {
        worker.terminated = true
      },
    }
    const send = (data: WorkerMessage) => worker.onmessage?.({ data } as MessageEvent<WorkerMessage>)
    return { worker, send }
  }
  const request: GenerateRequest = { size: 6, tier: 'easy', theme: 'home', seed: 1, budgetMs: 5000 }
  const failed = { ok: false, failure: { reason: 'nee', timedOut: false, attempts: 1, elapsedMs: 1, rejections: {} } } as const

  it('sends the request, forwards phases and the outcome, then stops the worker', () => {
    const { worker, send } = fakeWorker()
    const handlers = { onPhase: vi.fn(), onDone: vi.fn(), onError: vi.fn() }
    startGeneration(request, handlers, () => worker)
    expect(worker.posted).toEqual([request])
    send({ type: 'phase', phase: 'search' })
    expect(handlers.onPhase).toHaveBeenCalledWith('search')
    send({ type: 'done', outcome: failed })
    expect(handlers.onDone).toHaveBeenCalledWith(failed)
    expect(worker.terminated).toBe(true)
  })

  it('cancel terminates the worker and silences it', () => {
    const { worker, send } = fakeWorker()
    const handlers = { onPhase: vi.fn(), onDone: vi.fn(), onError: vi.fn() }
    const handle = startGeneration(request, handlers, () => worker)
    handle.cancel()
    expect(worker.terminated).toBe(true)
    send({ type: 'done', outcome: failed })
    expect(handlers.onDone).not.toHaveBeenCalled()
  })

  it('reports a broken worker', () => {
    const { worker } = fakeWorker()
    const handlers = { onPhase: vi.fn(), onDone: vi.fn(), onError: vi.fn() }
    startGeneration(request, handlers, () => worker)
    worker.onerror?.({ message: 'boem' } as ErrorEvent)
    expect(handlers.onError).toHaveBeenCalledWith('boem')
    expect(worker.terminated).toBe(true)
  })

  it('reports a worker that cannot be created', () => {
    const handlers = { onPhase: vi.fn(), onDone: vi.fn(), onError: vi.fn() }
    startGeneration(request, handlers, () => {
      throw new Error('no worker')
    })
    expect(handlers.onError).toHaveBeenCalledWith('no worker')
  })
})
