export * from './check.ts'
export * from './evaluate.ts'
export * from './geometry.ts'
// `en.ts` minus the locale-aware entry points, which `render.ts` re-exports instead (SLAY-3.2).
export {
  OBJECT_WORDS,
  VICTIM_TEXT,
  capitalizeLabel,
  countWord,
  objectNouns,
  objectOn,
  possessive,
  upperFirst,
  withArticle,
} from './en.ts'
export type { RenderContext } from './en.ts'
export { OBJECT_WORDS_NL, VICTIM_TEXT_NL, countWordNl, objectNounsNl, objectOnNl } from './nl.ts'
export * from './render.ts'
export * from './relational/index.ts'
export * from './types.ts'
export * from './direct.ts'
