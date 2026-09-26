import type { Cell } from '../../model/index.ts'
import { TIERS } from './tiers.ts'
import type { TierId } from './tiers.ts'

export interface TierCliArgs {
  scene: string
  tier: TierId
  seed: number
  /** 0-based (the CLI takes it 1-based, like the official r1c1 notation). */
  victimCell?: Cell
  out?: string
  /** Print the achieved distribution over `count` seeds instead of one puzzle. */
  report?: number
}

export const TIER_USAGE =
  'Usage: bun src/engine/generator/tiers/main.ts --scene <scene.json | demo> ' +
  `--tier <${TIERS.map((t) => t.id).join(' | ')}> --seed <n> [--victim <row,col>] [--out <puzzle.json>]\n` +
  '  --report <count>  instead of one puzzle, measure <count> seeds (starting at --seed) and print rating, clues and time.\n' +
  '  --victim is 1-based (row,col as in r1c1); without --out the puzzle JSON goes to stdout.'

/** Parses the tiers CLI arguments. Throws Error with a readable message on bad input. */
export function parseTierArgs(argv: readonly string[]): TierCliArgs {
  const values = new Map<string, string>()
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i] as string
    const match = /^--(scene|tier|seed|victim|out|report)(?:=(.*))?$/.exec(flag)
    if (!match) throw new Error(`Unknown argument "${flag}".`)
    const name = match[1] as string
    const value = match[2] ?? argv[++i]
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for --${name}.`)
    values.set(name, value)
  }
  const scene = values.get('scene')
  if (!scene) throw new Error('Missing --scene.')
  const tierText = values.get('tier')
  const tier = TIERS.find((t) => t.id === tierText)
  if (!tier) throw new Error(`--tier must be one of ${TIERS.map((t) => t.id).join(', ')}.`)
  const seedText = values.get('seed') ?? '1'
  if (!/^\d+$/.test(seedText) || !Number.isSafeInteger(Number(seedText))) {
    throw new Error('--seed must be a non-negative integer.')
  }
  const args: TierCliArgs = { scene, tier: tier.id, seed: Number(seedText) }
  const victim = values.get('victim')
  if (victim !== undefined) {
    const parsed = /^(\d+),(\d+)$/.exec(victim)
    if (!parsed || Number(parsed[1]) < 1 || Number(parsed[2]) < 1) {
      throw new Error('--victim must be "row,col", both 1-based (for example 8,9).')
    }
    args.victimCell = { row: Number(parsed[1]) - 1, col: Number(parsed[2]) - 1 }
  }
  const out = values.get('out')
  if (out !== undefined) args.out = out
  const report = values.get('report')
  if (report !== undefined) {
    if (!/^[1-9]\d*$/.test(report)) throw new Error('--report must be a positive integer.')
    args.report = Number(report)
  }
  return args
}
