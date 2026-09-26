// Generates a puzzle solve-path first and prints it: `bun tools/ladder.ts --scene demo --tier very-easy --seed 1 [--victim r,c]`.
// Prints the board, the ladder (the order people are placed and the cards each placement uses) and the clue lines.
// `--report <count>` measures success rate and time per puzzle instead. Run with no arguments for the usage.
// Exit code: 0 generated (or measured), 1 no puzzle found, 2 usage or unreadable scene.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { demoScene } from '../src/content/demo/scene.ts'
import {
  LADDER_USAGE, formatLadderReport, formatMeasurement, castGenders, generateLadder, measureLadder, parseLadderArgs, sceneForSpec, withCastLabels,
} from '../src/engine/generator/ladder/index.ts'
import { serializePuzzle } from '../src/engine/model/index.ts'
import type { Scene } from '../src/engine/model/index.ts'

const builtins: Record<string, Scene> = {
  demo: demoScene,
}
const readFile = (path: string) => readFileSync(resolve(path), 'utf8')

let args: ReturnType<typeof parseLadderArgs>
try {
  args = parseLadderArgs(process.argv.slice(2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  console.error(LADDER_USAGE)
  process.exit(2)
}

// With --cast the people also get the genders of the cast (`castFor`), so the gender cards can be drawn (medium up).
const optionsFor = (scene: Scene) => ({ victimCell: args.victimCell, exact: !args.loose, budgetMs: args.budgetMs, genders: args.cast ? castGenders(scene.width) : undefined })

try {
  if (args.report !== undefined) {
    const seeds = Array.from({ length: args.report }, (_, i) => args.seed + i)
    for (const spec of args.scenes) {
      for (const tier of args.tiers) {
        const measurement = measureLadder((seed) => sceneForSpec(spec, seed, builtins, readFile), tier, seeds, optionsFor(sceneForSpec(spec, args.seed, builtins, readFile)))
        console.log(formatMeasurement(spec, measurement))
      }
    }
    process.exit(0)
  }

  const spec = args.scenes[0] as string
  const tier = args.tiers[0]!
  const scene = sceneForSpec(spec, args.seed, builtins, readFile)
  const outcome = generateLadder(scene, tier, args.seed, optionsFor(scene))
  if (!outcome.ok) {
    console.error(`${outcome.message} (${outcome.reason})`)
    process.exit(1)
  }
  console.log(formatLadderReport(outcome, spec))
  const written = serializePuzzle(args.cast ? withCastLabels(outcome.puzzle) : outcome.puzzle)
  if (args.json) console.log(`\n${written}`)
  if (args.out) writeFileSync(resolve(args.out), `${written}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(2)
}
