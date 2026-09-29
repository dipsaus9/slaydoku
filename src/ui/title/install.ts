import { pageClock } from '../../game/index.ts'
import { SCHEDULE_INDEX } from '../../game/daily/source.ts'
import { phaseOf, utcDateOf } from '../../schedule/index.ts'
import type { ScheduleIndex } from '../../schedule/index.ts'
import { getRouter } from '../router/index.ts'
import type { Router } from '../router/index.ts'
import { screenTitle } from './model.ts'

export interface ScreenTitleOptions {
  /** The clock in ms. Default: the clock of the page (device clock, or the dev-only date override). */
  clock?: () => number
  /** The schedule index. Default: the committed one. */
  index?: ScheduleIndex
  /** The router to follow. Default: the router of the page. */
  router?: Pick<Router, 'path' | 'subscribe'>
  /** The document whose title is set. Default: the global one. */
  doc?: { title: string }
}

/**
 * Keeps `document.title` in step with the path: once now, and on every navigation.
 * No React: it reads the same route parser the screens use. Returns a stop function.
 */
export function installScreenTitles(options: ScreenTitleOptions = {}): () => void {
  const router = options.router ?? getRouter()
  const doc = options.doc ?? document
  const index = options.index ?? SCHEDULE_INDEX

  const update = (): void => {
    const date = utcDateOf((options.clock ?? pageClock())())
    const puzzleDate = phaseOf(date, index) === 'scheduled' ? date : null
    doc.title = screenTitle(router.path(), { puzzleDate })
  }

  const unsubscribe = router.subscribe(update)
  update()
  return unsubscribe
}
