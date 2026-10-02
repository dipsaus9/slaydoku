import { corsHeaders } from './cors.ts'
import type { KvLike } from './kv.ts'
import { removeSubscription, saveSubscription } from './store.ts'
import { parseSubscribeBody, parseUnsubscribeBody } from './validate.ts'

export interface Env {
  SUBSCRIPTIONS: KvLike
  /** "true" only in local dev; lets http://localhost origins through CORS. */
  DEV?: string
}

const json = (status: number, body: unknown, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const cors = corsHeaders(request.headers.get('origin'), env.DEV === 'true')
  const url = new URL(request.url)
  if (url.pathname !== '/subscribe') return json(404, { error: 'not found' }, cors)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return json(405, { error: 'method not allowed' }, cors)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid json' }, cors)
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
