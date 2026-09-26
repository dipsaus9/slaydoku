import { checkScene } from '../model/index.ts'
import type { Cell, Scene } from '../model/index.ts'

export interface GenerateArgs {
  scene: string
  seed: number
  /** 0-based cell (the CLI takes it 1-based, like the official r1c1 notation). */
  victimCell?: Cell
  out?: string
}

export const GENERATE_USAGE =
  'Usage: bun run generate --scene <scene.json | demo> ' +
  '--seed <n> [--victim <row,col>] [--out <puzzle.json>]\n' +
  '  --victim is 1-based (row,col as in r1c1); without --out the puzzle JSON goes to stdout.'

/** Parses the CLI arguments. Throws Error with a readable message on bad input. */
export function parseGenerateArgs(argv: readonly string[]): GenerateArgs {
  const values = new Map<string, string>()
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i] as string
    const match = /^--(scene|seed|victim|out)(?:=(.*))?$/.exec(flag)
    if (!match) throw new Error(`Unknown argument "${flag}".`)
    const name = match[1] as string
    const value = match[2] ?? argv[++i]
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for --${name}.`)
    values.set(name, value)
  }
  const scene = values.get('scene')
  if (!scene) throw new Error('Missing --scene.')
  const seedText = values.get('seed')
  if (seedText === undefined) throw new Error('Missing --seed.')
  if (!/^\d+$/.test(seedText) || !Number.isSafeInteger(Number(seedText))) {
    throw new Error('--seed must be a non-negative integer.')
  }
  const args: GenerateArgs = { scene, seed: Number(seedText) }
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
  return args
}

/**
 * Resolves `--scene`: a built-in name, else the path of a JSON file holding a
 * scene (or a puzzle, whose scene is used). `readFile` returns the file text
 * and throws when it cannot be read.
 */
export function resolveScene(
  name: string,
  builtins: Readonly<Record<string, Scene>>,
  readFile: (path: string) => string,
): Scene {
  const builtin = Object.hasOwn(builtins, name) ? builtins[name] : undefined
  if (builtin) return builtin
  let value: unknown
  try {
    value = JSON.parse(readFile(name))
  } catch (error) {
    const known = Object.keys(builtins).join(', ')
    throw new Error(
      `Cannot load scene "${name}" (${error instanceof Error ? error.message : String(error)}). Built-in scenes: ${known}.`,
    )
  }
  const candidate =
    typeof value === 'object' && value !== null && 'scene' in value ? (value as { scene: unknown }).scene : value
  const issues = checkScene(candidate)
  if (issues.length > 0) {
    throw new Error(`Invalid scene in ${name}:\n${issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n')}`)
  }
  return candidate as Scene
}
