// Measures the scale generator: `bun src/engine/generator/scale/main.ts --size 12,16 --tier hard,expert --seeds 10 [--start 1] [--budget 60000]`.
// Prints per size and tier the rating, clue count and time distribution, and every failed seed. Exit 1 when any seed failed.
import { TIERS } from '../tiers/index.ts'
import type { TierId } from '../tiers/index.ts'
import { formatScaleDistribution, measureScale } from './measure.ts'

const values = new Map<string, string>()
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const flag = argv[i] as string
  const match = /^--(size|tier|seeds|start|budget)(?:=(.*))?$/.exec(flag)
  const value = match ? (match[2] ?? argv[++i]) : undefined
  if (!match || value === undefined) {
    console.error(`Bad argument "${flag}". Usage: --size 6,7,9,12,16 --tier ${TIERS.map((t) => t.id).join(',')} --seeds 10 [--start 1] [--budget ms]`)
    process.exit(2)
  }
  values.set(match[1] as string, value)
}
const sizes = (values.get('size') ?? '9').split(',').map(Number)
const tiers = (values.get('tier') ?? TIERS.map((t) => t.id).join(',')).split(',') as TierId[]
const count = Number(values.get('seeds') ?? 10)
const start = Number(values.get('start') ?? 1)
const budget = values.has('budget') ? Number(values.get('budget')) : undefined
const seeds = Array.from({ length: count }, (_, i) => start + i)

let failed = 0
for (const size of sizes) {
  for (const tier of tiers) {
    const distribution = measureScale(size, tier, seeds, budget)
    failed += distribution.failures.length
    console.log(formatScaleDistribution(distribution))
  }
}
process.exit(failed > 0 ? 1 : 0)
