import type { Cell, Scene } from '../../model/index.ts'
import { generateScene, MAX_SIZE, MIN_SIZE } from '../../scenegen/index.ts'
import { SCENE_THEMES } from '../../../content/themes/index.ts'
import type { ThemeId } from '../../../content/themes/index.ts'
import { resolveScene } from '../cli.ts'
import { LADDER_TIER_IDS } from './generate.ts'
import type { LadderTierId } from './generate.ts'

export interface LadderCliArgs {
  /** A built-in name, a scene or puzzle file, or `generated:<size>` / `<size>` (a random scene of that size per seed). */
  scenes: string[]
  tiers: LadderTierId[]
  seed: number
  /** 0-based (the CLI takes it 1-based, like the official r1c1 notation). */
  victimCell?: Cell
  out?: string
  /** Measure this many seeds (starting at `seed`) instead of printing one puzzle. */
  report?: number
  budgetMs?: number
  /** Accept a puzzle that also fits an easier tier. */
  loose: boolean
  /** Also print the puzzle JSON. */
  json: boolean
  /** Write (and print) the puzzle with the cast names and "the victim" as labels, the way the committed levels carry them. */
  cast: boolean
}

export const LADDER_USAGE =
  'Usage: bun tools/ladder.ts --scene <demo | scene.json | <size> | generated:<size>> ' +
  `--tier <${LADDER_TIER_IDS.join(' | ')}> --seed <n> [--victim <row,col>] [--out <puzzle.json>] [--budget <ms>] [--loose] [--json] [--cast]\n` +
  '  Prints the puzzle, its ladder (the order the people are placed and the cards each placement uses) and the clue lines.\n' +
  '  --report <count>  instead measure <count> seeds (from --seed): success rate and time per puzzle. --scene and --tier take a comma list (--tier all).\n' +
  '  --victim is 1-based (row,col as in r1c1). <size> is a random themed scene of that size per seed (6 to 16).\n' +
  '  --cast writes the puzzle with the cast names (Alice, Ben ...) and "the victim" as labels, the way the demo level carries them,\n' +
  '    and gives the people the cast genders (Alice woman, Ben man ...), so the gender cards can be used (medium up).\n' +
  '  --loose accepts a puzzle that also meets an easier tier; by default the tier is exact (tierFor gives the requested tier).'

/** Parses the ladder CLI arguments. Throws Error with a readable message on bad input. */
export function parseLadderArgs(argv: readonly string[]): LadderCliArgs {
  const values = new Map<string, string>()
  const flags = new Set<string>()
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i] as string
    const bool = /^--(loose|json|cast)$/.exec(flag)
    if (bool) {
      flags.add(bool[1] as string)
      continue
    }
    const match = /^--(scene|tier|seed|victim|out|report|budget)(?:=(.*))?$/.exec(flag)
    if (!match) throw new Error(`Unknown argument "${flag}".`)
    const name = match[1] as string
    const value = match[2] ?? argv[++i]
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for --${name}.`)
    values.set(name, value)
  }
  const sceneText = values.get('scene')
  if (!sceneText) throw new Error('Missing --scene.')
  const tierText = values.get('tier')
  if (!tierText) throw new Error('Missing --tier.')
  const tiers = tierText === 'all' ? [...LADDER_TIER_IDS] : tierText.split(',').map((t) => t.trim())
  for (const tier of tiers) {
    if (!LADDER_TIER_IDS.includes(tier as LadderTierId)) throw new Error(`--tier must be one of ${LADDER_TIER_IDS.join(', ')} (or all).`)
  }
  const seedText = values.get('seed') ?? '1'
  if (!/^\d+$/.test(seedText) || !Number.isSafeInteger(Number(seedText))) throw new Error('--seed must be a non-negative integer.')
  const args: LadderCliArgs = {
    scenes: sceneText.split(',').map((s) => s.trim()),
    tiers: tiers as LadderTierId[],
    seed: Number(seedText),
    loose: flags.has('loose'),
    json: flags.has('json'),
    cast: flags.has('cast'),
  }
  const victim = values.get('victim')
  if (victim !== undefined) {
    const parsed = /^(\d+),(\d+)$/.exec(victim)
    if (!parsed || Number(parsed[1]) < 1 || Number(parsed[2]) < 1) throw new Error('--victim must be "row,col", both 1-based (for example 8,9).')
    args.victimCell = { row: Number(parsed[1]) - 1, col: Number(parsed[2]) - 1 }
  }
  const out = values.get('out')
  if (out !== undefined) args.out = out
  const report = values.get('report')
  if (report !== undefined) {
    if (!/^[1-9]\d*$/.test(report)) throw new Error('--report must be a positive integer.')
    args.report = Number(report)
  }
  const budget = values.get('budget')
  if (budget !== undefined) {
    if (!/^[1-9]\d*$/.test(budget)) throw new Error('--budget must be a positive number of milliseconds.')
    args.budgetMs = Number(budget)
  }
  if (args.scenes.length > 1 || args.tiers.length > 1) {
    if (args.report === undefined) throw new Error('A comma list of scenes or tiers needs --report <count>.')
  }
  return args
}

/** `generated:<size>` or a bare size, else null. */
export function generatedSize(spec: string): number | null {
  const match = /^(?:generated:)?(\d+)$/.exec(spec)
  return match ? Number(match[1]) : null
}

/**
 * The scene of a `--scene` value for one seed: a random themed scene of that size (the theme cycles with the
 * seed), else a built-in name or a scene/puzzle file (`resolveScene`).
 */
export function sceneForSpec(
  spec: string,
  seed: number,
  builtins: Readonly<Record<string, Scene>>,
  readFile: (path: string) => string,
): Scene {
  const size = generatedSize(spec)
  if (size === null) return resolveScene(spec, builtins, readFile)
  if (size < MIN_SIZE || size > MAX_SIZE) throw new Error(`A generated scene has a size from ${MIN_SIZE} to ${MAX_SIZE}, got ${size}.`)
  const theme = (SCENE_THEMES[seed % SCENE_THEMES.length] as { id: ThemeId }).id
  return generateScene({ width: size, height: size, theme, seed })
}
