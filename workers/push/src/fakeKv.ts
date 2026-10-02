import type { KvLike } from './kv.ts'

/** In-memory KV with real-KV paging: `limit` (default 1000) and an opaque cursor. */
export function fakeKv(): KvLike & { data: Map<string, string>; calls: { n: number } } {
  const data = new Map<string, string>()
  const calls = { n: 0 }
  return {
    data,
    calls,
    get: async (k) => (calls.n++, data.get(k) ?? null),
    put: async (k, v) => void (calls.n++, data.set(k, v)),
    delete: async (k) => void (calls.n++, data.delete(k)),
    list: async ({ prefix, cursor, limit = 1000 }) => {
      calls.n++
      const names = [...data.keys()].filter((k) => k.startsWith(prefix)).sort()
      const start = cursor === undefined ? 0 : names.findIndex((n) => n > cursor)
      const page = start < 0 ? [] : names.slice(start, start + limit)
      const complete = start < 0 || start + limit >= names.length
      return {
        keys: page.map((name) => ({ name })),
        list_complete: complete,
        ...(complete ? {} : { cursor: page[page.length - 1] }),
      }
    },
  }
}
