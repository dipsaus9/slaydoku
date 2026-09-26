import type { RouterWindow } from './router.ts'

export interface FakeWindow extends RouterWindow {
  /** Every history entry, oldest first, and which one is current. */
  readonly entries: readonly string[]
  readonly index: number
  /** The current URL as `path` plus `#hash`. */
  url: () => string
  back: () => void
  forward: () => void
  /** The user edits the address bar to another hash of this page (fires `hashchange`). */
  typeHash: (hash: string) => void
  /** How many listeners of each event are attached. */
  listenerCount: () => number
}

/** A window with a history stack, for the router tests (no DOM needed). */
export function fakeWindow(start = '/'): FakeWindow {
  let entries = [start]
  let index = 0
  const handlers: Record<string, Set<() => void>> = { popstate: new Set(), hashchange: new Set() }
  const fire = (type: string) => handlers[type]!.forEach((fn) => fn())
  const split = (url: string) => {
    const at = url.indexOf('#')
    return at === -1 ? { pathname: url, hash: '' } : { pathname: url.slice(0, at), hash: url.slice(at) }
  }
  return {
    get entries() {
      return entries
    },
    get index() {
      return index
    },
    location: {
      get pathname() {
        return split(entries[index]!).pathname
      },
      get hash() {
        return split(entries[index]!).hash
      },
    },
    history: {
      pushState: (_data, _unused, url) => {
        entries = [...entries.slice(0, index + 1), String(url)]
        index += 1
      },
      replaceState: (_data, _unused, url) => {
        entries = entries.map((entry, i) => (i === index ? String(url) : entry))
      },
    },
    addEventListener: (type, fn) => void handlers[type]!.add(fn),
    removeEventListener: (type, fn) => void handlers[type]!.delete(fn),
    url: () => entries[index]!,
    back() {
      index -= 1
      fire('popstate')
    },
    forward() {
      index += 1
      fire('popstate')
    },
    typeHash(hash) {
      const { pathname } = split(entries[index]!)
      entries = [...entries.slice(0, index + 1), pathname + hash]
      index += 1
      fire('hashchange')
    },
    listenerCount: () => handlers.popstate!.size + handlers.hashchange!.size,
  }
}
