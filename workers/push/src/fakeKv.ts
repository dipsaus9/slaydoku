import type { KvLike } from './kv.ts'

export function fakeKv(): KvLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    get: async (k) => data.get(k) ?? null,
    put: async (k, v) => void data.set(k, v),
    delete: async (k) => void data.delete(k),
    list: async ({ prefix }) => ({ keys: [...data.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }),
  }
}
