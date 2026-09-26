// Tier-aware generator entry: `bun src/engine/generator/tiers/main.ts --scene demo --tier easy --seed 3 [--victim r,c] [--out f.json]`
// or `... --report 12` to see what a scene delivers for a tier. Exit: 0 ok, 1 no puzzle within the budget, 2 usage.
// It lives here (not tools/generate.ts) because that file belongs to story CAD-4.7.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { demoScene } from '../../../content/demo/scene.ts'
import { serializePuzzle } from '../../model/index.ts'
import type { Scene } from '../../model/index.ts'
import { GeneratorError } from '../placement.ts'
import { resolveScene } from '../cli.ts'
import { TIER_USAGE, parseTierArgs } from './cli.ts'
import { generateTierWithReport } from './generate.ts'
import { formatDistribution, measureTier } from './report.ts'

const builtins: Record<string, Scene> = {
  demo: demoScene,
}

let args: ReturnType<typeof parseTierArgs>
let scene: Scene
try {
  args = parseTierArgs(process.argv.slice(2))
  scene = resolveScene(args.scene, builtins, (path) => readFileSync(resolve(path), 'utf8'))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  console.error(TIER_USAGE)
  process.exit(2)
}

try {
  if (args.report !== undefined) {
    const seeds = Array.from({ length: args.report }, (_, i) => args.seed + i)
    console.log(formatDistribution(measureTier(scene, args.tier, seeds, args.victimCell ? [args.victimCell] : [])))
  } else {
    const r = generateTierWithReport(scene, { seed: args.seed, tier: args.tier, victimCell: args.victimCell })
    const json = serializePuzzle(r.puzzle)
    if (args.out) writeFileSync(resolve(args.out), `${json}\n`)
    else console.log(json)
    console.error(
      `Generated ${args.tier} ${scene.width}x${scene.height} puzzle, seed ${args.seed}: ${r.puzzle.clues.length} clues, ` +
        `level ${r.human.maxTechnique?.level ?? 0}, score ${r.score}, ${r.attempts} placements, ${Math.round(r.elapsedMs)} ms.`,
    )
  }
} catch (error) {
  console.error(error instanceof GeneratorError ? error.message : String(error))
  process.exit(1)
}
