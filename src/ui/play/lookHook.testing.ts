import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { StorageLike } from '../../locale/index.ts'
import type { Look } from '../../render/looks/look.ts'
import { useLook } from './look.ts'

/** Runs `useLook` once (server render) and returns what it gave. */
export function renderHook(storage: StorageLike, available: boolean): { look: Look } {
  function Probe() {
    return createElement('i', { 'data-look': useLook(storage, available).look })
  }
  const look = /data-look="([a-z0-9]+)"/.exec(renderToStaticMarkup(createElement(Probe)))?.[1] as Look
  return { look }
}
