import { defaultStorage } from '../../game/index.ts'
import { getRouter } from '../router/index.ts'
import type { Router } from '../router/index.ts'
import type { StorageLike } from '../../game/index.ts'
import { readProgress } from '../levels/progress.ts'
import { getLevels } from '../levels/registry.ts'
import type { Level } from '../levels/registry.ts'
import { screenTitle } from './model.ts'

export interface ScreenTitleOptions {
  /** Levels in play order. Default: the registry, read on every update. */
  levels?: () => readonly Level[]
  /** Where progress lives. Default localStorage (no storage: nothing is solved yet). */
  storage?: StorageLike | null
  /** The router to follow. Default: the router of the page. */
  router?: Pick<Router, 'path' | 'subscribe'>
  /** The document whose title is set. Default: the global one. */
  doc?: { title: string }
}

/**
 * Keeps `document.title` in step with the path: once now, and on every navigation.
 * No React: it reads the same route parsers and progress the screens use. Returns a stop function.
 */
export function installScreenTitles(options: ScreenTitleOptions = {}): () => void {
  const router = options.router ?? getRouter()
  const doc = options.doc ?? document
  const getLevelList = options.levels ?? getLevels
  const storage = options.storage === undefined ? defaultStorage() : options.storage

  const update = (): void => {
    const levels = getLevelList()
    doc.title = screenTitle(router.path(), { levels, progress: readProgress(levels, storage) })
  }

  const unsubscribe = router.subscribe(update)
  update()
  return unsubscribe
}
