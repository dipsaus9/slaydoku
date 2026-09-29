/**
 * PostHog: anonymous puzzle-play counters (SLAY-7/SLAY-8.4 — replaces the earlier Vercel KV/Redis
 * design, which needed a paid-looking Marketplace database just for a couple of daily numbers).
 *
 * The project API key is meant to be public: it only names which PostHog project events go to,
 * the same way @vercel/analytics needs no config at all because Vercel injects its own project id
 * at build time. PostHog has no such build-time injection for a plain Vite app, so the key sits
 * here as a plain constant instead of an env var — there is nothing to keep secret about it.
 *
 * Configured for anonymous counts only, matching the About page's privacy promise (no accounts,
 * no per-player identifier, no cookie):
 * - no autocapture, no automatic page views (Vercel Web Analytics already covers general traffic)
 * - no session recording
 * - no person profiles (a played puzzle is a fact to count, not a person to build a profile of)
 * - memory-only persistence: PostHog writes nothing to a cookie or localStorage of its own: a
 *   reload gets a fresh, unlinked anonymous id, so nothing here ever identifies a returning device
 *
 * Loaded lazily (dynamic import of the "slim" build, PostHog's own smaller entry point with no
 * session recording, surveys, feature flags or exception autocapture — all switched off below
 * anyway): a visitor who never opens today's puzzle never downloads any of this.
 */
const POSTHOG_KEY = 'phc_wBXUgEXr7ABJeNmjsjJFsYovAXQJU8uVTSgojkJYiknr'
const POSTHOG_HOST = 'https://eu.i.posthog.com'

interface PostHogClient {
  capture(name: string, properties?: Record<string, unknown>): void
}

let client: Promise<PostHogClient> | null = null

function ensureInit(): Promise<PostHogClient> {
  if (!client) {
    client = import('posthog-js/dist/module.slim').then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        persistence: 'memory',
        person_profiles: 'never',
      })
      return posthog
    })
  }
  return client
}

/**
 * Fire-and-forget: never throws, never blocks, and a failure (offline, blocked by an ad blocker,
 * the chunk failing to load, PostHog down) is silently ignored. Analytics is never allowed to
 * affect play.
 */
export function captureAnonymousEvent(name: string, properties?: Record<string, string | number>): void {
  ensureInit()
    .then((posthog) => posthog.capture(name, properties))
    .catch(() => {
      // See the doc comment above: this must never surface to the player.
    })
}
