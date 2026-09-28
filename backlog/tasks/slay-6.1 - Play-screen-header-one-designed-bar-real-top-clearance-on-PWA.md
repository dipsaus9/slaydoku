---
id: SLAY-6.1
title: 'Play-screen header: one designed bar, real top clearance on PWA'
status: To Do
assignee: []
created_date: '2026-09-28 18:57'
labels:
  - story
dependencies: []
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/play.css
  - docs/verification/
parent_task_id: SLAY-6
type: feature
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the play-screen header (back control, puzzle title, timer, settings icon) reads as one deliberate bar instead of a bordered pill next to plain text next to a bare icon, and keeps comfortable space above it when installed as a mobile PWA even on a device that reports no safe-area inset (no notch).
Type: deliverable
Branch: SLAY-6.1/header-and-top-clearance
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The back control, title, timer and settings icon share one consistent visual treatment (weight, spacing, whether each has a background/border) instead of the current mix of a bordered pill button next to unadorned text next to a bare icon
- [ ] #2 The header's own vertical rhythm (padding around its contents) reads as intentional, matching the spacing scale used elsewhere in the app (src/brand/tokens.css)
- [ ] #3 .play's padding-top floor (currently max(8px, env(safe-area-inset-top)) in play.css) is raised enough that the header has comfortable clearance from the top edge even when env(safe-area-inset-top) resolves to 0 (a device with a plain status bar, no notch) — compare against .daily's own floor (24px) for the equivalent screen
- [ ] #4 verify:phone's drive/zoom/legend suites (English and the Dutch locale driver) pass unchanged in behaviour on all six viewports, including the two portrait phone sizes and the landscape one where header height is tightest
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Look at the current header row (PlayScreen.tsx's header markup, play.css's .play-header* rules) and daily.css's header for the established lighter-weight link/text treatment already used there (e.g. the About/How-it-works links have no button chrome). 2. Redesign play-header so back/title/timer/settings share one language — likely: back becomes a plain icon+text link (no border/background, matching daily.css's link style) rather than a bordered pill, timer stays plain text, settings icon stays a small icon button; or an alternative consistent treatment if a stronger design case emerges during implementation. 3. Raise the padding-top floor on .play to a value that reads generous even with zero safe-area inset (daily.css's 24px is the reference point; play trades off against board height, so pick a value that keeps the board comfortably sized too). 4. Re-run verify:phone on all six viewports plus the Dutch locale driver; update any driver assertion tied to the old header markup.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This only touches the header row's own markup/styling and the .play padding-top rule — the board, toolbar (SLAY-5.1) and cards are out of scope.
<!-- SECTION:NOTES:END -->
