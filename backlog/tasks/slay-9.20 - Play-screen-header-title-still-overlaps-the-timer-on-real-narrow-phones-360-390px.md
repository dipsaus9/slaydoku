---
id: SLAY-9.20
title: >-
  Play-screen header: title still overlaps the timer on real narrow phones
  (360-390px)
status: Done
assignee: []
created_date: '2026-09-29 21:01'
updated_date: '2026-09-30 06:07'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/daily.css
parent_task_id: SLAY-9
type: feature
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the play-screen header's puzzle title never visually overlaps the timer on real phone widths.
Type: deliverable
Branch: SLAY-9.20/fix-header-title-timer-overlap

Flagged (not fixed) while delivering SLAY-9.13: a CDP measurement against a clean main build showed .daily-play__nav's title overlapping .play-header's timer at real 360-390px widths, with the then-current 112px icon-row reserve and the original 3-icon set — a pre-existing bug, unrelated to SLAY-9.13's own change, never turned into a story until now (owner reported the same symptom directly, 2026-09-29).

Confirmed still present in the current code: daily.css's ≤640px breakpoint (~line 665, ~line 738) still reserves a flat 112px (or 245px once the share button exists, SLAY-9.16/9.13) for the icon row, and .daily-play__title (~line 694) only got an ellipsis-truncation fallback ('belt-and-suspenders') added on top — not a fix for the underlying space shortage that causes the overlap at real narrow widths in the first place.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The puzzle title and the timer never visually overlap at real phone widths (measure the actual DOM boxes in a real or headless browser at 360px and 390px, not just a resized desktop window)
- [x] #2 Fix holds with and without the Share button present (3-icon and 4-icon states, SLAY-9.13/9.16)
- [x] #3 The existing ellipsis truncation on the title can stay as a fallback for very long titles, but is not relied on to hide this specific overlap
- [x] #4 Verified against the actual rendered screen at true narrow phone widths, per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduced live first (headless Chrome CDP, real puzzle #4, 360x640/390x844, prod build): .daily-play__nav's title box (bounded by daily.css's right: reserve) extended well past where play.css's real icon row starts -- 3-icon reserve was 112px vs ~187-197px actually needed (74-90px short); 4-icon reserve (245px) was only ~2.8-3.6px short of correct, fragile but not currently overlapping. Fix (daily.css only, per References): replaced both guessed round numbers with calc()-derived --daily-play-reserve / --daily-play-reserve-with-share custom properties built from play.css's own known box-model constants (44px icon min-width, var(--space-2) gap, var(--space-4) header padding) plus a measured, generous timer-text budget (104px, covers a fresh timer through a 1h59m59s session with margin) -- same 'derive, don't guess' approach SLAY-9.12 used for --play-header-height. Applied to both the phone (<=640px) and short-landscape media queries. Verified by rebuilding, re-running the same CDP measurement at all 4 combinations (360/390 x 3-icon/4-icon): overlapsActions/overlapsFirstIcon both false everywhere, vs. true (74-90px overlap) before the fix in the 3-icon case.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verify: bun run lint / typecheck / test --maxWorkers=1 (142 files, 3052 tests) all green; bun run build clean. Live reproduction + fix confirmed via a scratch CDP measurement script (getBoundingClientRect on .daily-play__title / .play-header__actions), headless Chrome, real puzzle #4 (2026-11-21, hard 9x9), 360x640 and 390x844, both the 3-icon (unsolved) and 4-icon (solved+dismissed, Share button present) states: before the fix, overlapsActions=true with a 74-90px overlap in the 3-icon case at both widths; after, overlapsActions=false / overlapsFirstIcon=false in all 4 combinations. Not a committed driver -- ad hoc, deleted after use.

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 4 acceptance criteria met, no scope violations. One advisory finding: the fix is a derived-constant CSS budget validated by comment-documented manual measurement, not an automated regression test/snapshot -- a future play.css change (icon min-width, timer padding) could silently reintroduce the overlap. Left as a follow-up opportunity, not blocking; no committed verification driver exists yet for this specific layout check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the play-screen header's title/timer overlap on real narrow phones (360-390px). Root cause: .daily-play__nav's overlaid title bar reserved a flat, guessed right-hand pixel width for play.css's icon row (112px for the 3-icon state, 245px for the 4-icon/Share state); at real 360/390px widths, measured via headless-Chrome getBoundingClientRect against a real scheduled puzzle, the 3-icon reserve was 74-90px short of where the real icon row starts, so the title's box (even after its existing ellipsis truncation) routinely extended into the icon row. Fix (src/ui/daily/daily.css only): replaced both guessed numbers with calc()-derived custom properties (--daily-play-reserve / --daily-play-reserve-with-share) built from play.css's own known box-model constants -- icon min-width (44px), actions gap (var(--space-2)), header padding (var(--space-4)) -- plus a measured, generous timer-text budget (104px, covers a fresh timer through a 1h59m59s session), the same derive-don't-guess approach SLAY-9.12 used for --play-header-height. Applied to both the phone (<=640px) and short-landscape media queries, in both the 3-icon and 4-icon (Share-present) states. Verified: reproduced live first (headless Chrome CDP, real puzzle #4, prod build, 360x640/390x844) before any CSS change, confirmed the fix afterward with the same measurement (overlap true->false in all 4 width x icon-state combinations); bun run lint/typecheck/test --maxWorkers=1 (142 files, 3052 tests) and build all green. Independent review: PASS, all 4 ACs met, no scope violations; one advisory follow-up noted (no automated regression test for this specific layout check yet).
<!-- SECTION:FINAL_SUMMARY:END -->
