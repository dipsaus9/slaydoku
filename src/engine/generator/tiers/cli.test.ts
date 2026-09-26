import { describe, expect, it } from 'vitest'
import { parseTierArgs } from './cli.ts'

describe('parseTierArgs', () => {
  it('parses scene, tier, seed, 1-based victim and out', () => {
    expect(parseTierArgs(['--scene', 'demo', '--tier', 'easy-medium', '--seed', '7', '--victim', '2,3', '--out', 'p.json'])).toEqual({
      scene: 'demo', tier: 'easy-medium', seed: 7, victimCell: { row: 1, col: 2 }, out: 'p.json',
    })
  })

  it('defaults the seed and accepts a report count', () => {
    expect(parseTierArgs(['--scene=demo', '--tier=medium', '--report=5'])).toEqual({
      scene: 'demo', tier: 'medium', seed: 1, report: 5,
    })
  })

  it('rejects unknown tiers, missing values and bad numbers', () => {
    expect(() => parseTierArgs(['--scene', 'demo', '--tier', 'nightmare'])).toThrow(/--tier/)
    expect(() => parseTierArgs(['--tier', 'easy'])).toThrow(/--scene/)
    expect(() => parseTierArgs(['--scene', 'x', '--tier', 'easy', '--seed', '-1'])).toThrow(/--seed/)
    expect(() => parseTierArgs(['--scene', 'x', '--tier', 'easy', '--victim', '0,1'])).toThrow(/--victim/)
    expect(() => parseTierArgs(['--scene', 'x', '--tier', 'easy', '--report', '0'])).toThrow(/--report/)
    expect(() => parseTierArgs(['--bogus'])).toThrow(/Unknown/)
  })
})
