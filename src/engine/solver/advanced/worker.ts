import type { CatalogClue } from '../../clues/index.ts'
import type { Person, Scene } from '../../model/index.ts'
import type { HumanResult } from '../human/types.ts'
import { solveAdvanced } from './solve.ts'

/**
 * Web worker entry for the advanced solver, so a 16x16 rating never blocks the
 * page: `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`
 * (or use `solveAdvancedInWorker` from `./client.ts`). Post an
 * `AdvancedRequest`, get an `AdvancedResponse` with the same `id` back.
 * `handleAdvancedRequest` is the pure part and works anywhere.
 */
export interface AdvancedRequest {
  /** Echoed back so a caller can match answers to questions. */
  id: number
  scene: Scene
  people: Person[]
  clues: CatalogClue[]
  /** See `AdvancedOptions.maxLevel`. */
  maxLevel?: number
}

export type AdvancedResponse = { id: number; result: HumanResult } | { id: number; error: string }

export function handleAdvancedRequest(request: AdvancedRequest): AdvancedResponse {
  try {
    const options = request.maxLevel === undefined ? {} : { maxLevel: request.maxLevel }
    return { id: request.id, result: solveAdvanced(request.scene, request.people, request.clues, options) }
  } catch (error) {
    return { id: request.id, error: error instanceof Error ? error.message : String(error) }
  }
}

/** The dedicated worker global scope, when this module runs inside one. */
interface WorkerScope {
  importScripts: unknown
  onmessage: ((event: { data: AdvancedRequest }) => void) | null
  postMessage(message: AdvancedResponse): void
}

const scope = globalThis as unknown as Partial<WorkerScope>
if (typeof scope.importScripts === 'function' && typeof document === 'undefined') {
  scope.onmessage = (event) => scope.postMessage?.(handleAdvancedRequest(event.data))
}
