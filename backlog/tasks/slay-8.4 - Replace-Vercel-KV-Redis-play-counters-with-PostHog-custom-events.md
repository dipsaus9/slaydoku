---
id: SLAY-8.4
title: Replace Vercel KV/Redis play counters with PostHog custom events
status: Done
assignee: []
created_date: '2026-09-29 08:58'
updated_date: '2026-09-29 09:05'
labels: []
dependencies: []
references:
  - src/analytics/
  - src/game/playCounters.ts
  - src/game/index.ts
  - src/ui/daily/DailyFlow.tsx
  - api/
  - tools/stats.ts
  - docs/launch.md
  - docs/verification/stats.ts
  - docs/verification/share.ts
  - package.json
modified_files:
  - src/analytics/posthog.ts
  - src/game/playCounters.ts
  - src/game/index.ts
  - src/ui/daily/DailyFlow.tsx
  - docs/launch.md
  - docs/verification/stats.ts
  - docs/verification/share.ts
  - package.json
parent_task_id: SLAY-8
type: feature
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the anonymous daily play-counter design (SLAY-7) is rebuilt on PostHog instead of a self-hosted /api/stats endpoint backed by Vercel KV — the owner does not want to provision a database-shaped Marketplace product (even a genuinely free one) just for two small daily numbers. PostHog's free tier (1M events/month, no card) covers this at this project's scale with no server code and no database at all.
Type: deliverable
Branch: SLAY-8.4/posthog-play-counters

Supersedes: SLAY-7.1 (serverless endpoint + Vercel KV), SLAY-7.2 (client fire-and-forget counting, never built against the old design), SLAY-7.3 (CLI stats viewer) — api/, tools/stats.ts and @upstash/redis are removed entirely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One anonymous 'puzzle_start' event fires the first time a device opens a day's puzzle, one 'puzzle_solve' event (with elapsedMs) the first time it solves it, both de-duplicated per day via a new localStorage marker (a reload/revisit never double-counts)
- [ ] #2 PostHog is configured for anonymous counts only: no autocapture, no automatic page views, no session recording, no person profiles, memory-only persistence (nothing written to a cookie or localStorage by PostHog itself)
- [ ] #3 A failed or blocked request never throws, never blocks rendering, and never affects play
- [ ] #4 PostHog's client code is lazy-loaded (dynamic import) so it never ships in the main bundle for a visitor who never opens today's puzzle
- [ ] #5 The old Vercel KV/Redis stats infrastructure (api/, tools/stats.ts, @upstash/redis) is removed; docs/launch.md's 'reading the numbers' section reflects PostHog
<!-- AC:END -->
