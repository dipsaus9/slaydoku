---
id: SLAY-14
title: 'Epic: daily puzzle reminders (push), square-only share and play-screen polish'
status: To Do
assignee: []
created_date: '2026-10-02 09:54'
labels:
  - epic
dependencies: []
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: installed-app players can pick an hour (Amsterdam time) and get a push notification when the new puzzle of the day is out; sharing is square-only; the countdown, Legend button, Zoom remnants and play header are tidied.

Chosen approach: real Web Push through a small Cloudflare Worker with KV (free tier, owner already has a Cloudflare account). It stores only the push subscription endpoint/keys and the chosen hour (fixed Amsterdam time, no timezone, no accounts), sends payload-less VAPID pushes from an hourly cron in batches, and the service worker shows the localized text and opens /play. Offered only in the installed (standalone) app; iOS needs that anyway (16.4+).
Why it beat the alternatives: an .ics calendar reminder is not a push and is not tied to the installed app; Vercel functions + GitHub Actions cron has best-effort timing and needs the KV/Upstash store the owner already rejected (Vercel Hobby cron is once a day); local-only notifications do not fire when the app is closed.
Known limits: free Workers plan caps outgoing requests per run (~50), so the sender must batch; payload-less push means the notification language follows the browser language, not the app toggle; the server cannot know whether a player already solved today.
Other owner requests folded in: Zoom was already removed in SLAY-9.8 (verify and remove remnants), drop the 'Ends at 00:00 UTC (02:00 Amsterdam)' line only (Next/Starts lines stay), labelled Legend button on desktop, two-row phone header.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All stories SLAY-14.1 to SLAY-14.11 are Done
- [ ] #2 CLAUDE.md decisions record that push is the one server-side exception to device-only data
- [ ] #3 A pushed notification arrives on the owner's installed app at the chosen Amsterdam hour (manual live check after the Worker is deployed)
<!-- AC:END -->
