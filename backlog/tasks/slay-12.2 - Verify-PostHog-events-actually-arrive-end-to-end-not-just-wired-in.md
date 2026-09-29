---
id: SLAY-12.2
title: 'Verify PostHog events actually arrive end-to-end, not just wired in'
status: Done
assignee: []
created_date: '2026-09-29 10:00'
updated_date: '2026-09-29 13:06'
labels:
  - story
dependencies: []
references:
  - src/analytics/posthog.ts
  - src/game/playCounters.ts
parent_task_id: SLAY-12
type: spike
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: confirmed, with evidence (not assumed), that a real play session sends puzzle_start and puzzle_solve events and they show up in the PostHog project dashboard, per the privacy config (person_profiles: never, memory-only persistence).
Type: spike
Branch: SLAY-12.2/posthog-verification

Spike justification: requires a real browser session hitting the live/preview site and checking network activity plus the PostHog live-events dashboard — not answerable by reading the code alone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Playing a puzzle to completion sends a puzzle_start request and a puzzle_solve request to eu.i.posthog.com with the expected event names and no extra identifying data (confirmed via network inspection)
- [ ] #2 Both events are confirmed to appear in the PostHog project's Activity/Live Events view within a few minutes
- [x] #3 If no events arrive or the payload differs from what src/analytics/posthog.ts / src/game/playCounters.ts intends, the root cause is fixed as part of this story, not just reported
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read src/analytics/posthog.ts and src/game/playCounters.ts: confirms puzzle_start fires on mount (day.date dep), puzzle_solve fires once solved, both de-duped via localStorage key slaydoku:stats-sent:<day>, both routed through captureAnonymousEvent -> posthog-js slim client, api_host eu.i.posthog.com, person_profiles: never, persistence: memory.
2. Run `bun run dev` in the worktree, open the daily flow in a real (non-headless) Chrome tab via Claude-in-Chrome with the dev-only date override (?date=2026-11-21), watch network requests to eu.i.posthog.com.
3. Play the puzzle to completion (place all suspects by their known solution cells; the victim auto-places, SLAY-9.5) to trigger puzzle_solve, capture that network request too.
4. Inspect both requests: host, endpoint, status code, and (from source, since the exact gzip body could not be extracted via monkeypatching) the exact capture() call sites and init config for payload shape and absence of extra identifying fields.
5. Report network evidence. Dashboard (eu.i.posthog.com project UI) is the owner's account: cannot log in; note this and ask the owner to confirm live events there, per the story's own implementation notes.
6. If no request fires or payload deviates from what the code intends, fix root cause in this story, then re-verify via network inspection. (Not needed: both events fired correctly on the first clean attempt.)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PostHog project dashboard access (eu.i.posthog.com) is the owner's account. If delivery cannot reach the dashboard itself, verify via the network request only and ask the owner to confirm the dashboard side.

Findings (real-browser network verification, 2026-09-29):

Setup: bun dev server on the worktree, dev-only date override (?date=2026-11-21, puzzle #56, hard 9x9), played through the real UI in a real (non-headless) Chrome tab via the Claude-in-Chrome extension.

Result: a full play session (Play -> place all 8 suspects -> auto-placed victim -> solved) produced exactly two capture requests, in order, both to eu.i.posthog.com, both HTTP 200:
1. POST https://eu.i.posthog.com/e/ - fired the instant Play was clicked (puzzle_start, before PostHog's remote config had loaded, so it used the SDK's default endpoint).
2. POST https://eu.i.posthog.com/i/v0/e/ - fired the instant the board solved (puzzle_solve, after remote config loaded and pointed the SDK at its configured analytics endpoint).
No other requests to eu.i.posthog.com occurred beyond the SDK's own bootstrap (the posthog-js chunk and the eu-assets.i.posthog.com/.../config.js remote-config fetch, which is not an event capture). This matches playCounters.ts exactly: one recordPuzzleStart on mount, one recordPuzzleSolve on solve, both de-duplicated per day.

A repeat run confirmed the same 2-request pattern; a manual captureAnonymousEvent('slay_12_2_payload_shape_probe', {day, elapsedMs}) probe also produced a successful 200 POST to eu.i.posthog.com/i/v0/e/, confirming the wire path works for arbitrary event/property shapes, not just a fluke of the two real events.

I could not extract the exact gzip-compressed request body text (posthog-js binds its transport function at client-construction time in a way that outran every fetch/XHR/sendBeacon monkey-patch I tried, even patches installed before any PostHog code ran). The payload confirmation therefore combines the network evidence above (right event count, right order, right host, 200 responses) with source: playCounters.ts's only two call sites are `capture('puzzle_start', { day })` and `capture('puzzle_solve', { day, elapsedMs })`, and posthog.ts's init sets autocapture:false, capture_pageview:false, capture_pageleave:false, disable_session_recording:true, persistence:'memory', person_profiles:'never' - so no extra identifying fields are added beyond PostHog's own standard anonymous SDK metadata (a fresh, unlinked, in-memory distinct_id every page load).

Important false-negative to remember for any future headless/CI verification of this: posthog-js's built-in bot filter (`_is_bot()`, default-on unless `opt_out_useragent_filter: true`) matches "headlesschrome" in the user agent and `navigator.webdriver`, so a driver launched with `--headless=new` silently drops every capture() call with no error - a raw fetch to the same endpoint from the same headless page succeeds fine, which is what makes this easy to misdiagnose as an app bug. Real, non-headless browser sessions (used for this verification) are not affected. No code changes were made to posthog.ts or playCounters.ts because none were needed: the wiring already works correctly.

AC #2 (PostHog project's own Activity/Live Events dashboard, eu.i.posthog.com) could not be checked: that dashboard is the owner's account and delivery has no credentials/access to it. Per this story's own Implementation Notes, verification stopped at the network-request evidence above; the owner should confirm the two events (puzzle_start, puzzle_solve, and optionally slay_12_2_payload_shape_probe from this session) show up in Activity / Live Events for the phc_wBXUgEXr7ABJeNmjsjJFsYovAXQJU8uVTSgojkJYiknr project within a few minutes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Confirmed with real-browser network evidence (Claude-in-Chrome, real non-headless Chrome, dev server on the dev-only date override) that playing puzzle #56 (2026-11-21) end to end sends exactly two capture requests to eu.i.posthog.com, in the expected order, both HTTP 200: puzzle_start on Play (POST /e/) and puzzle_solve on solve (POST /i/v0/e/, after PostHog's remote config switched endpoints). A manual captureAnonymousEvent probe with day/elapsedMs properties also reached eu.i.posthog.com successfully, corroborating the payload path. No code changes were needed in src/analytics/posthog.ts or src/game/playCounters.ts - the wiring already works. Along the way, confirmed and documented a false-negative trap for any future headless verification of this: posthog-js's built-in bot filter silently drops capture() in headless Chrome (UA contains "HeadlessChrome", navigator.webdriver), so a headless driver must not be used to test this path. AC #2 (the PostHog project's own Activity/Live Events dashboard) could not be checked - that dashboard is the owner's account; per the story's own implementation notes, verification stopped at network-request evidence and the owner should confirm the events show up in the dashboard.
<!-- SECTION:FINAL_SUMMARY:END -->
