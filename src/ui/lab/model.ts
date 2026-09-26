import { TIERS } from '../../engine/generator/tiers/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import { verifyPuzzle } from '../../engine/solver/index.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import { SCENE_THEMES } from '../../content/themes/index.ts'
import type { ThemeId } from '../../content/themes/index.ts'
import { LAB_EN } from './strings.ts'
import type { GenerateRequest } from './protocol.ts'

/** Board sizes the generator handles (scale layer: 6x6 to 16x16). */
export const LAB_SIZES: readonly number[] = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
export const LAB_TIERS: readonly TierId[] = TIERS.map((tier) => tier.id)
export const LAB_THEMES: readonly ThemeId[] = SCENE_THEMES.map((theme) => theme.id)
export const MIN_BUDGET_S = 5
export const MAX_BUDGET_S = 600
export const DEFAULT_BUDGET_S = 60

/** The generate form as typed: text fields stay text until they are checked. */
export interface FormValues {
  size: number
  tier: TierId
  theme: ThemeId
  seed: string
  victimRow: string
  victimCol: string
  budgetSeconds: string
}

export const defaultFormValues = (seed = 1): FormValues => ({
  size: 6,
  tier: 'easy',
  theme: 'home',
  seed: String(seed),
  victimRow: '',
  victimCol: '',
  budgetSeconds: String(DEFAULT_BUDGET_S),
})

export type FormResult = { ok: true; request: GenerateRequest } | { ok: false; errors: string[] }

const isWhole = (text: string): boolean => /^\d+$/.test(text.trim())

/** Checks the form; the request when it is fine, else every problem. */
export function parseForm(values: FormValues): FormResult {
  const t = LAB_EN.generate.errors
  const errors: string[] = []
  const seed = Number(values.seed)
  if (!isWhole(values.seed) || !Number.isSafeInteger(seed)) errors.push(t.seed)
  const budget = Number(values.budgetSeconds)
  if (!isWhole(values.budgetSeconds) || budget < MIN_BUDGET_S || budget > MAX_BUDGET_S) errors.push(t.budget)

  let victim: GenerateRequest['victim']
  const row = values.victimRow.trim()
  const col = values.victimCol.trim()
  if (row !== '' || col !== '') {
    if (row === '' || col === '') errors.push(t.victimBoth)
    else if (!isWhole(row) || !isWhole(col) || Number(row) < 1 || Number(col) < 1 || Number(row) > values.size || Number(col) > values.size) {
      errors.push(t.victimRange(values.size))
    } else victim = { row: Number(row) - 1, col: Number(col) - 1 }
  }
  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, request: { size: values.size, tier: values.tier, theme: values.theme, seed, victim, budgetMs: budget * 1000 } }
}


/** Result of the unique-solution check that the play view shows as pass or fail. */
export interface VerifySummary {
  pass: boolean
  solutionCount: number
  murderer: string | null
  problems: string[]
}

/** Runs the same check as `bun run verify` (schema, rules, clues, exactly one solution equal to the stored one). */
export function verifySummary(puzzle: Puzzle): VerifySummary {
  const report = verifyPuzzle(JSON.stringify(puzzle))
  return { pass: report.ok, solutionCount: report.solutionCount, murderer: report.murderer, problems: report.problems }
}

/** Lab routes: `/lab`, `/lab/level/<id>`, `/lab/generated`. */
export type LabRoute =
  | { kind: 'none' }
  | { kind: 'home' }
  | { kind: 'level'; id: string }
  | { kind: 'generated' }

export function parseLabRoute(path: string): LabRoute {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] !== 'lab') return { kind: 'none' }
  if (parts.length === 1) return { kind: 'home' }
  if (parts.length === 2 && parts[1] === 'generated') return { kind: 'generated' }
  if (parts.length === 3 && parts[1] === 'level') {
    try {
      return { kind: parts[1], id: decodeURIComponent(parts[2]!) }
    } catch {
      return { kind: 'home' }
    }
  }
  return { kind: 'home' }
}

export function labPath(route: Exclude<LabRoute, { kind: 'none' }>): string {
  switch (route.kind) {
    case 'home':
      return '/lab'
    case 'generated':
      return '/lab/generated'
    default:
      return `/lab/${route.kind}/${encodeURIComponent(route.id)}`
  }
}
