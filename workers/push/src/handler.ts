import { corsHeaders } from './cors.ts'
import type { KvLike } from './kv.ts'
import { removeSubscription, saveSkip, saveSubscription } from './store.ts'
import { parseSkipBody, parseSubscribeBody, parseUnsubscribeBody } from './validate.ts'

export interface Env {
  SUBSCRIPTIONS: KvLike
  /** "true" only in local dev; lets http://localhost origins through CORS. */
  DEV?: string
}

const json = (status: number, body: unknown, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

export async function handleRequest(request: Request, env: Env, nowMs: number = Date.now()): Promise<Response> {
  const cors = corsHeaders(request.headers.get('origin'), env.DEV === 'true')
  const url = new URL(request.url)
  if (url.pathname !== '/subscribe' && url.pathname !== '/skip') return json(404, { error: 'not found' }, cors)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (request.method !== 'POST' && (request.method !== 'DELETE' || url.pathname === '/skip')) {
    return json(405, { error: 'method not allowed' }, cors)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid json' }, cors)
  }

  if (url.pathname === '/skip') {
    // One answer for a bad body, a bad date and an unknown endpoint, so nothing reveals who is subscribed.
    const parsed = parseSkipBody(body, nowMs)
    if (!parsed || !(await saveSkip(env.SUBSCRIPTIONS, parsed.endpoint, parsed.date))) {
      return json(400, { error: 'invalid skip' }, cors)
    }
    return new Response(null, { status: 204, headers: cors })
  }
  if (request.method === 'POST') {
    const parsed = parseSubscribeBody(body)
    if (!parsed) return json(400, { error: 'invalid subscription' }, cors)
    await saveSubscription(env.SUBSCRIPTIONS, parsed)
    return json(200, { ok: true }, cors)
  }
  const parsed = parseUnsubscribeBody(body)
  if (!parsed) return json(400, { error: 'invalid endpoint' }, cors)
  await removeSubscription(env.SUBSCRIPTIONS, parsed.endpoint)
  return json(200, { ok: true }, cors)
}
