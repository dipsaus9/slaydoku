import { useCallback, useEffect, useRef, useState } from 'react'
import { startGeneration } from './client.ts'
import { finishPuzzle, withCastGenders } from './generate.ts'
import type { WorkerLike } from './client.ts'
import type { GenerateRequest, GenerationOutcome, LabPhase, LabPuzzle } from './protocol.ts'

export type Job =
  | { status: 'idle' }
  | { status: 'running'; request: GenerateRequest; phase: LabPhase }
  | { status: 'done'; outcome: GenerationOutcome }
  | { status: 'cancelled' }
  | { status: 'error'; reason: string }

export interface Generation {
  job: Job
  /** The last puzzle that was generated successfully; it stays until the next success. */
  latest: LabPuzzle | null
  start: (request: GenerateRequest) => void
  cancel: () => void
}

/**
 * The generate job of the lab page: one worker at a time, cancel = terminate. A new start
 * cancels a running one. The worker is stopped when the lab goes away.
 */
export function useGeneration(createWorker?: () => WorkerLike): Generation {
  const [job, setJob] = useState<Job>({ status: 'idle' })
  const [latest, setLatest] = useState<LabPuzzle | null>(null)
  const running = useRef<{ cancel: () => void } | null>(null)
  /** The page-side finish step that is waiting to run; clearing it cancels it. */
  const finishing = useRef<object | null>(null)

  const cancel = useCallback(() => {
    if (!running.current && !finishing.current) return
    running.current?.cancel()
    running.current = null
    finishing.current = null
    setJob({ status: 'cancelled' })
  }, [])

  const start = useCallback(
    (request: GenerateRequest) => {
      running.current?.cancel()
      finishing.current = null
      setJob({ status: 'running', request, phase: 'scene' })
      running.current = startGeneration(
        withCastGenders(request),
        {
          onPhase: (phase) => setJob((current) => (current.status === 'running' ? { ...current, phase } : current)),
          onDone: (searched) => {
            running.current = null
            if (!searched.ok) return setJob({ status: 'done', outcome: searched })
            // The dressing and the pack checks take a moment on the page: show the phase first.
            setJob({ status: 'running', request, phase: 'check' })
            const token = {}
            finishing.current = token
            setTimeout(() => {
              if (finishing.current !== token) return
              finishing.current = null
              const outcome = finishPuzzle(request, searched.found)
              if (outcome.ok) setLatest(outcome.puzzle)
              setJob({ status: 'done', outcome })
            }, 30)
          },
          onError: (reason) => {
            running.current = null
            setJob({ status: 'error', reason })
          },
        },
        createWorker,
      )
    },
    [createWorker],
  )

  useEffect(
    () => () => {
      running.current?.cancel()
      running.current = null
      finishing.current = null
    },
    [],
  )

  return { job, latest, start, cancel }
}
