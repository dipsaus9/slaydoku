import { handleRequest, type Env } from './handler.ts'

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
}
