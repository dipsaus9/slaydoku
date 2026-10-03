import { isAboutPath } from '../ui/about/index.ts'
import { pathSegments } from '../ui/router/index.ts'

/** The install notice belongs on the start screen (`/`) and About only; on `/play` it would cover the header (SLAY-15.4). */
export function showsInstallNotice(path: string): boolean {
  return pathSegments(path)?.length === 0 || isAboutPath(path)
}
