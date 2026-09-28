import { Redis } from '@upstash/redis'
import type { CounterStore } from './kv.ts'

/**
 * The real Vercel KV (Upstash Redis) backed store, built from the REST env vars Vercel's KV/Redis
 * integration injects into the project (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).
 *
 * OWNER PREREQUISITE (SLAY-7.1 task notes): a KV store must be provisioned and linked to this
 * Vercel project in the dashboard before those env vars exist — that step is account/dashboard
 * gated and cannot be done by the delivering agent. This throws only when actually called (at
 * request time), never at import time, so unit tests exercise api/_lib/kv.ts against a fake
 * CounterStore and never need real credentials.
 */
export function redisStore(): CounterStore {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    throw new Error(
      'KV_REST_API_URL / KV_REST_API_TOKEN are not set. Provision a Vercel KV (Upstash Redis) store for this ' +
        'project and link it in the Vercel dashboard, then redeploy — see SLAY-7.1 task notes.',
    )
  }
  const redis = new Redis({ url, token })
  return {
    incr: (key) => redis.incr(key),
    incrby: (key, amount) => redis.incrby(key, amount),
    mget: (keys) => redis.mget(...keys),
  }
}
