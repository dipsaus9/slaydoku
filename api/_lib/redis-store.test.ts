import { afterEach, describe, expect, it } from 'vitest'
import { redisStore } from './redis-store.ts'

const SAVED_URL = process.env.KV_REST_API_URL
const SAVED_TOKEN = process.env.KV_REST_API_TOKEN

afterEach(() => {
  if (SAVED_URL === undefined) delete process.env.KV_REST_API_URL
  else process.env.KV_REST_API_URL = SAVED_URL
  if (SAVED_TOKEN === undefined) delete process.env.KV_REST_API_TOKEN
  else process.env.KV_REST_API_TOKEN = SAVED_TOKEN
})

describe('redisStore', () => {
  it('throws a clear, owner-actionable error when the KV env vars are not set (no store provisioned yet)', () => {
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
    expect(() => redisStore()).toThrow(/KV_REST_API_URL/)
  })

  it('builds a store once both env vars are present, without making a network call', () => {
    process.env.KV_REST_API_URL = 'https://example.upstash.io'
    process.env.KV_REST_API_TOKEN = 'test-token'
    expect(() => redisStore()).not.toThrow()
  })
})
