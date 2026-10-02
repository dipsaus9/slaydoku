/*
 * Pure decisions for the daily-reminder push (SLAY-14.8). The service worker (`sw.ts`) does the browser
 * calls; what to say and where a tap goes is decided here so it can be tested without a worker.
 * The push carries no payload: the text is fixed and never mentions the puzzle, so nothing can spoil.
 */

export const NOTIFICATION_TITLE = 'Slaydoku'
export const NOTIFICATION_ICON = '/icon-192.png'
export const NOTIFICATION_BADGE = '/favicon-32.png'
export const NOTIFICATION_TAG = 'slaydoku-daily'
export const PLAY_PATH = '/play'

export const NOTIFY_NL = { body: 'Er staat een nieuwe puzzel klaar.' } as const
export const NOTIFY_EN = { body: 'A new puzzle is ready.' } as const

/** Dutch for any `nl`, `nl-NL`, `nl-BE`...; English for everything else, including a missing language. */
export function notificationBody(language: string | undefined | null): string {
  return /^nl(?:$|[-_])/i.test(language ?? '') ? NOTIFY_NL.body : NOTIFY_EN.body
}

export interface PushNotification {
  readonly title: string
  readonly options: { body: string; icon: string; badge: string; tag: string }
}

export function pushNotification(language: string | undefined | null): PushNotification {
  return {
    title: NOTIFICATION_TITLE,
    options: { body: notificationBody(language), icon: NOTIFICATION_ICON, badge: NOTIFICATION_BADGE, tag: NOTIFICATION_TAG },
  }
}

export interface ClickClient {
  readonly url: string
}

export type ClickAction = { kind: 'focus'; index: number } | { kind: 'open' }

/** Focus (and navigate to /play) a client of this origin when one is open, else open /play. */
export function routeNotificationClick(clients: readonly ClickClient[], origin: string): ClickAction {
  const index = clients.findIndex((client) => {
    try {
      return new URL(client.url).origin === origin
    } catch {
      return false
    }
  })
  return index >= 0 ? { kind: 'focus', index } : { kind: 'open' }
}
