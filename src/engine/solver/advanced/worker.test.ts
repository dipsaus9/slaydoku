import { describe, expect, it } from 'vitest'
import { tutorialPuzzle } from '../../model/tutorial.fixture.ts'
import { solveAdvancedInWorker } from './client.ts'
import { handleAdvancedRequest } from './worker.ts'

const clues = [
  { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'V', type: 'aloneWithMurderer', args: {} },
] as const

describe('worker entry', () => {
  it('answers a request with the same id and the solver result', () => {
    const { scene, people } = tutorialPuzzle
    const response = handleAdvancedRequest({ id: 7, scene, people, clues: [...clues] })
    expect(response.id).toBe(7)
    if (!('result' in response)) throw new Error('expected a result')
    expect(response.result.solved).toBe(true)
    expect(response.result.murderer).toBe('A')
  })

  it('reports an error instead of throwing', () => {
    const { scene } = tutorialPuzzle
    const response = handleAdvancedRequest({ id: 1, scene, people: null as never, clues: [] })
    expect(response.id).toBe(1)
    expect('error' in response).toBe(true)
  })

  it('the client refuses politely where there are no workers', async () => {
    const { scene, people } = tutorialPuzzle
    await expect(solveAdvancedInWorker(scene, people, [...clues])).rejects.toThrow(/workers are not available/)
  })
})
