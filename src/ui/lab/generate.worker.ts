import type { GenerateRequest, WorkerMessage } from './protocol.ts'
import { searchPuzzle } from './search.ts'

interface WorkerScope {
  onmessage: ((event: MessageEvent<GenerateRequest>) => void) | null
  postMessage(message: WorkerMessage): void
}

/** Web Worker entry: one request in, phase messages and one outcome out. Cancel = the page terminates it. */
const scope = self as unknown as WorkerScope

scope.onmessage = (event) => {
  const outcome = searchPuzzle(event.data, (phase) => scope.postMessage({ type: 'phase', phase }))
  scope.postMessage({ type: 'done', outcome })
}
