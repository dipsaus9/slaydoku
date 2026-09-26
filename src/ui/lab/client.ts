import type { GenerateRequest, LabPhase, SearchOutcome, WorkerMessage } from './protocol.ts'

/** The part of `Worker` the client uses; tests hand in a fake. */
export interface WorkerLike {
  postMessage(request: GenerateRequest): void
  terminate(): void
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
}

export interface GenerationHandlers {
  onPhase: (phase: LabPhase) => void
  onDone: (outcome: SearchOutcome) => void
  /** The worker itself broke (not a failed generation). */
  onError: (reason: string) => void
}

export interface GenerationHandle {
  /** Stops the search at once (terminates the worker); no handler is called afterwards. */
  cancel: () => void
}

/** A real module worker. The literal `new Worker(new URL(...))` form is what Vite bundles. */
export function createGeneratorWorker(): WorkerLike {
  return new Worker(new URL('./generate.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike
}

/** Runs one generation in its own worker, so the page stays responsive. */
export function startGeneration(
  request: GenerateRequest,
  handlers: GenerationHandlers,
  create: () => WorkerLike = createGeneratorWorker,
): GenerationHandle {
  let live = true
  let worker: WorkerLike
  const stop = () => {
    live = false
    worker.terminate()
  }
  try {
    worker = create()
  } catch (error) {
    live = false
    handlers.onError(error instanceof Error ? error.message : String(error))
    return { cancel: () => {} }
  }
  worker.onmessage = (event) => {
    if (!live) return
    const data = event.data
    if (data.type === 'phase') handlers.onPhase(data.phase)
    else {
      stop()
      handlers.onDone(data.outcome)
    }
  }
  worker.onerror = (event) => {
    if (!live) return
    stop()
    handlers.onError(event.message || 'onbekende fout')
  }
  worker.postMessage(request)
  return { cancel: () => live && stop() }
}
