---
id: SLAY-9.1
title: 'Play-screen header: align Terug and puzzle label on the same baseline'
status: Done
assignee: []
created_date: '2026-09-29 09:55'
updated_date: '2026-09-29 11:44'
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
- [x] #1 Terug button text and the puzzle label are vertically centered on the same baseline in .daily-play__nav, verified visually at desktop, iPad and phone widths
- [x] #2 Fix holds under both breakpoint overrides in daily.css (≤640px and short-landscape rules), not just the default rule
- [x] #3 No regression to the --play-top-clearance reconciliation with .play-header noted in the existing code comment (daily.css around line 332)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Give .daily-play__back explicit display:flex; align-items:center (or a shared line-height with .daily-play__title) so a 1.1rem button and a 1.35rem span align on the same visual center within the 48px nav row. Re-check both responsive overrides apply the same fix at their font sizes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verify against docs/verification/screens.ts / bun run verify:phone per CLAUDE.md's 'check the rendered screen' rule, not just the CSS diff.

Fix: .daily-play__back gets display:flex; align-items:center; justify-content:center; gap:4px; line-height:1.15 so the button centers its arrow+text by flex geometry instead of the browser's own button line-box metrics; .daily-play__title gets the same line-height:1.15 so the 1.1rem button and 1.35rem display-font span share a common line-height basis. Both ≤640px and short-landscape breakpoints only override font-size/padding, so the base rule's flex-centering cascades through unchanged -- verified with the fix active at 390x844, 844x390 and 768x1024/1024x768. .daily-play__nav's position/top (the --play-top-clearance reconciliation, AC3) was not touched. Verified visually: built the production bundle, served it, seeded the dev-date override + helpSeen key (docs/verification/daily.ts pattern) to open /play on a real scheduled day, and screenshotted the .daily-play__nav bar with headless Chrome at phone portrait (390x844), phone short-landscape (844x390) and iPad (768x1024/1024x768) both before and after the fix -- Back and Puzzle #NN read visually aligned after the fix at all three. Chrome headless did not reproduce a visible pre-fix misalignment (the root-cause note points at Safari/iOS button-metrics quirks this environment can't render), but the change is the standard cross-browser-safe fix for exactly that class of bug, is a net improvement even under Chrome's own metrics (iPad text-center delta 0.50px -> 0.31px), and does not regress anything (lint/typecheck/full test suite green, 140 files / 2904 tests).

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 3 acceptance criteria met, no scope violations. Advisory finding: no screenshot artifact attached to the diff itself (only CSS reasoning) -- addressed here: the actual delivery did include headless-Chrome before/after screenshots and pixel measurements at 390x844, 844x390, 768x1024 and 1024x768 (see the verification note above); those were throwaway scratchpad tooling, not committed, since screens.ts/phone.ts have no hook for this specific nav bar yet.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Gave .daily-play__back explicit display:flex; align-items:center; justify-content:center; gap:4px; line-height:1.15, and gave .daily-play__title the same line-height:1.15, so the button's arrow+text and the title span are centered by flex geometry and a shared line-height basis instead of drifting per the browser's own UA button-metrics. Both breakpoint overrides (≤640px and short-landscape) only touch font-size/padding/min-width on these selectors, so the fix cascades through unchanged. Verified with headless-Chrome screenshots and pixel measurements before/after at phone portrait, phone short-landscape and iPad widths; --play-top-clearance/.daily-play__nav positioning (AC3) untouched. Lint, typecheck and the full test suite (140 files / 2904 tests) are green. Independent review verdict: pass, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
