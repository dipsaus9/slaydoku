import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../levels/progress.ts'
import {
  clearJudgement,
  exportJudgements,
  importJudgements,
  JUDGEMENTS_KEY,
  judgementFor,
  loadJudgements,
  saveJudgement,
} from './judgements.ts'

describe('lab judgements', () => {
  it('stores a judgement under slaydoku:lab-judgements', () => {
    const storage = createMemoryStorage()
    expect(JUDGEMENTS_KEY).toBe('slaydoku:lab-judgements')
    expect(saveJudgement(storage, '6-easy-home-1', 'good', 100)).toBe(true)
    expect(JSON.parse(storage.getItem(JUDGEMENTS_KEY)!)).toEqual({
      version: 1,
      judgements: [{ puzzleId: '6-easy-home-1', verdict: 'good', judgedAt: 100 }],
    })
  })

  it('keeps one judgement per puzzle and lets it be removed', () => {
    const storage = createMemoryStorage()
    saveJudgement(storage, 'a', 'good', 1)
    saveJudgement(storage, 'b', 'too-easy', 2)
    saveJudgement(storage, 'a', 'too-hard', 3)
    const all = loadJudgements(storage)
    expect(all).toHaveLength(2)
    expect(judgementFor(all, 'a')).toEqual({ puzzleId: 'a', verdict: 'too-hard', judgedAt: 3 })
    expect(clearJudgement(storage, 'a')).toBe(true)
    expect(loadJudgements(storage).map((j) => j.puzzleId)).toEqual(['b'])
  })

  it('reads anything unusable as empty', () => {
    const storage = createMemoryStorage()
    expect(loadJudgements(storage)).toEqual([])
    storage.setItem(JUDGEMENTS_KEY, '{nope')
    expect(loadJudgements(storage)).toEqual([])
    storage.setItem(JUDGEMENTS_KEY, JSON.stringify({ version: 99, judgements: [{ puzzleId: 'a', verdict: 'good', judgedAt: 1 }] }))
    expect(loadJudgements(storage)).toEqual([])
    expect(loadJudgements(null)).toEqual([])
    const broken = { getItem: () => { throw new Error('no') }, setItem: () => { throw new Error('no') }, removeItem: () => {} }
    expect(loadJudgements(broken)).toEqual([])
    expect(saveJudgement(broken, 'a', 'good', 1)).toBe(false)
    expect(saveJudgement(null, 'a', 'good', 1)).toBe(false)
  })

  it('exports what is stored and imports it on another device', () => {
    const from = createMemoryStorage()
    saveJudgement(from, 'a', 'good', 1)
    saveJudgement(from, 'b', 'too-hard', 2)
    const text = exportJudgements(from)
    expect(JSON.parse(text)).toEqual({ version: 1, judgements: loadJudgements(from) })

    const to = createMemoryStorage()
    expect(importJudgements(to, text)).toEqual({ ok: true, imported: 2, skipped: 0 })
    expect(loadJudgements(to)).toEqual(loadJudgements(from))
  })

  it('merges an import: the later judgement of a puzzle wins', () => {
    const storage = createMemoryStorage()
    saveJudgement(storage, 'a', 'good', 10)
    saveJudgement(storage, 'b', 'good', 10)
    const incoming = JSON.stringify({
      version: 1,
      judgements: [
        { puzzleId: 'a', verdict: 'too-easy', judgedAt: 5 },
        { puzzleId: 'b', verdict: 'too-hard', judgedAt: 20 },
        { puzzleId: 'c', verdict: 'good', judgedAt: 1 },
        { puzzleId: 'd', verdict: 'fantastic', judgedAt: 1 },
      ],
    })
    expect(importJudgements(storage, incoming)).toEqual({ ok: true, imported: 3, skipped: 1 })
    const all = loadJudgements(storage)
    expect(judgementFor(all, 'a')?.verdict).toBe('good')
    expect(judgementFor(all, 'b')?.verdict).toBe('too-hard')
    expect(judgementFor(all, 'c')?.verdict).toBe('good')
    expect(judgementFor(all, 'd')).toBeUndefined()
  })

  it('changes nothing for a file that is not an export', () => {
    const storage = createMemoryStorage()
    saveJudgement(storage, 'a', 'good', 1)
    for (const text of ['', 'hello', '[]', '{"version":2,"judgements":[]}', '{"version":1}']) {
      expect(importJudgements(storage, text)).toEqual({ ok: false })
    }
    expect(loadJudgements(storage)).toHaveLength(1)
  })
})
