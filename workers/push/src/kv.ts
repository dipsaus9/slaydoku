/** The slice of Workers KV the handlers need, so tests can pass a fake. */
export interface KvListResult {
  keys: { name: string }[]
  /** Real KV returns at most 1000 keys per page; false means more pages follow via `cursor`. */
  list_complete?: boolean
  cursor?: string
}

export interface KvLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(options: { prefix: string; cursor?: string; limit?: number }): Promise<KvListResult>
}
