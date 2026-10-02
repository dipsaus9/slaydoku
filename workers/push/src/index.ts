import { handleRequest, type Env } from './handler.ts'
import { runScheduled, type SenderEnv } from './sender.ts'

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
  scheduled: (event: { scheduledTime: number }, env: SenderEnv, ctx: { waitUntil(p: Promise<unknown>): void }) => {
    ctx.waitUntil(runScheduled(env, event.scheduledTime))
  },
}
