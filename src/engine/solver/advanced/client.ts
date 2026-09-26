import type { CatalogClue } from '../../clues/index.ts'
import type { Person, Scene } from '../../model/index.ts'
import type { HumanResult } from '../human/types.ts'
import type { AdvancedOptions } from './solve.ts'
import type { AdvancedResponse } from './worker.ts'

/**
 * Rates a puzzle with the advanced solver in a web worker and resolves with the
 * result. Where workers do not exist (tests, server) it throws; call
 * `solveAdvanced` directly there.
 */
export function solveAdvancedInWorker(
  scene: Scene,
  people: Person[],
  clues: CatalogClue[],
  options: AdvancedOptions = {},
): Promise<HumanResult> {
  if (typeof Worker === 'undefined') return Promise.reject(new Error('Web workers are not available here.'))
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  return new Promise<HumanResult>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<AdvancedResponse>) => {
      worker.terminate()
      if ('error' in event.data) reject(new Error(event.data.error))
      else resolve(event.data.result)
    }
    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message))
    }
    worker.postMessage({ id: 1, scene, people, clues, ...options })
  })
}
