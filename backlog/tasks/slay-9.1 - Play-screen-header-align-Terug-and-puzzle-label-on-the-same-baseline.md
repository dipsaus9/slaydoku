---
id: SLAY-9.1
title: 'Play-screen header: align Terug and puzzle label on the same baseline'
status: To Do
assignee: []
created_date: '2026-09-29 09:55'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/daily.css
  - src/ui/daily/DailyFlow.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Terug back button and the puzzle label sit visually aligned (same vertical center/baseline) in the daily-play nav bar, consistent across breakpoints.
Type: deliverable
Branch: SLAY-9.1/header-label-alignment

Root cause per research: .daily-play__back is a native <button> (1.1rem, no explicit line-height/flex-centering rule) sitting next to .daily-play__title, a plain <span> (1.35rem, default line-height) — different font sizes and different UA-default vertical-centering mechanisms between the two flex children.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Terug button text and the puzzle label are vertically centered on the same baseline in .daily-play__nav, verified visually at desktop, iPad and phone widths
- [ ] #2 Fix holds under both breakpoint overrides in daily.css (≤640px and short-landscape rules), not just the default rule
- [ ] #3 No regression to the --play-top-clearance reconciliation with .play-header noted in the existing code comment (daily.css around line 332)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Give .daily-play__back explicit display:flex; align-items:center (or a shared line-height with .daily-play__title) so a 1.1rem button and a 1.35rem span align on the same visual center within the 48px nav row. Re-check both responsive overrides apply the same fix at their font sizes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verify against docs/verification/screens.ts / bun run verify:phone per CLAUDE.md's 'check the rendered screen' rule, not just the CSS diff.
<!-- SECTION:NOTES:END -->
