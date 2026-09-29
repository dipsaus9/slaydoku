---
id: SLAY-9.9
title: 'Start screen: Wordle-style centered layout'
status: To Do
assignee: []
created_date: '2026-09-29 10:05'
updated_date: '2026-09-29 10:06'
labels:
  - story
dependencies:
  - SLAY-9.1
  - SLAY-9.4
  - SLAY-10.2
references:
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/daily.css
  - src/ui/daily/LocaleToggle.tsx
  - src/brand/icon.svg
parent_task_id: SLAY-9
type: feature
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the start screen becomes a centered card matching Wordle's landing-screen pattern — a small icon mark, the wordmark/title, a one-line tagline, a single primary action button, and a small byline line beneath (puzzle date, site name) — while every existing behavior (countdown, rollover banner, solved-result card, stats/share slots, About link, Help, locale toggle) still works, just restyled.
Type: deliverable
Branch: SLAY-9.9/wordle-style-start-screen

Reference is Wordle's layout/vibe only, not feature parity: no Login button, no subscription/paywall button (75% off) — Slaydoku has no accounts or leaderboard at launch (CLAUDE.md decision), so there is exactly one action button (Play/Continue).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Start screen shows, top to bottom and centered: an icon mark (reusing src/brand/icon.svg), the title, a one-line tagline, a single primary action button (Play or Continue, existing PuzzleCard behavior), and a small byline line with the puzzle's date-based label (from SLAY-10.2) and the site name
- [ ] #2 No Login or paywall-style button is added — confirmed consistent with CLAUDE.md's no-accounts-at-launch decision
- [ ] #3 Every existing state (loading, error, before-launch, after-schedule, solved result, ended) still renders correctly within the new layout
- [ ] #4 Countdown, rollover banner, Help link, locale toggle, About link, stats and share slots are all still present and reachable, repositioned to fit the new centered composition
- [ ] #5 Layout holds at phone, iPad and desktop widths, checked against the rendered screen (docs/verification/screens.ts / bun run verify:phone), not just the component data
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Restructure StartScreen.tsx's JSX into a centered hero composition (icon mark, title, tagline, action button, byline row), reusing existing sub-components (Countdown, PuzzleCard internals) rather than duplicating logic; add/adjust daily.css for the centered card layout, max-width and spacing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
If src/brand/icon.svg does not read well at small standalone-mark size, a dedicated small brand mark may be needed — flag to the owner rather than guessing. Dependencies on SLAY-9.4 and SLAY-10.2 are both file-collision sequencing (LocaleToggle.tsx, StartScreen.tsx) as well as genuinely wanting the date label finalized before laying out the byline row.
<!-- SECTION:NOTES:END -->
