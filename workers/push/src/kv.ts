/** The slice of Workers KV the handlers need, so tests can pass a fake. */
export interface KvLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  list(options: { prefix: string }): Promise<{ keys: { name: string }[] }>
}
