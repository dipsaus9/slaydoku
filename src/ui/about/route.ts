import { pathSegments } from '../router/index.ts'

/** The path of the About page. */
export const ABOUT_PATH = '/about'

/** True for `/about` (a trailing slash is fine); every other path is not the About page. */
export function isAboutPath(path: string): boolean {
  const parts = pathSegments(path)
  return parts?.length === 1 && parts[0] === 'about'
}
