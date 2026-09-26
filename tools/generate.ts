// Generates a puzzle: `bun run generate --scene <file | demo> --seed N [--victim r,c] [--out puzzle.json]`.
// The puzzle JSON goes to --out (or stdout); a summary goes to stderr. Check it with `bun run verify <puzzle.json>`.
// Exit code: 0 generated, 1 no puzzle possible on this scene, 2 usage or unreadable scene.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { demoScene } from '../src/content/demo/scene.ts'
import { GENERATE_USAGE, GeneratorError, generateWithReport, parseGenerateArgs, resolveScene } from '../src/engine/generator/index.ts'
import { serializePuzzle } from '../src/engine/model/index.ts'
import type { Scene } from '../src/engine/model/index.ts'

const builtins: Record<string, Scene> = {
  demo: demoScene,
}

let args: ReturnType<typeof parseGenerateArgs>
let scene: Scene
try {
  args = parseGenerateArgs(process.argv.slice(2))
  scene = resolveScene(args.scene, builtins, (path) => readFileSync(resolve(path), 'utf8'))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  console.error(GENERATE_USAGE)
  process.exit(2)
}

try {
  const started = performance.now()
  const { puzzle, attempts, human } = generateWithReport(scene, { seed: args.seed, victimCell: args.victimCell })
  const json = serializePuzzle(puzzle)
  if (args.out) writeFileSync(resolve(args.out), `${json}\n`)
  else console.log(json)
  const murderer = human.murderer ?? 'unknown'
  console.error(
    `Generated ${scene.width}x${scene.height} puzzle, seed ${args.seed}: ${puzzle.clues.length} clues, ` +
      `murderer ${murderer}, human rating ${human.rating?.label ?? 'none'} (score ${human.score}), ` +
      `${attempts} placement${attempts === 1 ? '' : 's'}, ${(performance.now() - started).toFixed(0)} ms.`,
  )
} catch (error) {
  console.error(error instanceof GeneratorError ? error.message : String(error))
  process.exit(1)
}
