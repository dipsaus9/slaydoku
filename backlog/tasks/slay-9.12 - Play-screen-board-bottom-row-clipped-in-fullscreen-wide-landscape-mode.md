---
id: SLAY-9.12
title: 'Play screen: board bottom row clipped in fullscreen/wide landscape mode'
status: Done
assignee: []
created_date: '2026-09-29 14:11'
updated_date: '2026-09-29 15:54'
labels:
  - story
dependencies:
  - SLAY-9.3
references:
  - src/ui/play/play.css
parent_task_id: SLAY-9
type: feature
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: in fullscreen/wide-landscape mode the whole board, including the last row, is visible without being cut off at the bottom.
Type: deliverable
Branch: SLAY-9.12/fix-fullscreen-board-clipping

Owner report (screenshot, fullscreen mode): the level's bottom row is cut off. Likely area: play.css's landscape rule (@media (min-aspect-ratio: 1/1)) sets --board: min(calc(100dvh - 76px), 64vw) — a fixed 76px offset for the header. If the actual rendered header height (the play-header row plus, on the daily play route, the overlaid daily-play__nav bar) exceeds 76px in this mode, the board is sized taller than the space actually left below the header, pushing the last row off-screen with no scroll available. Needs live reproduction in an actual fullscreen/wide-landscape context (not just a code read) to confirm the exact mismatch before fixing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The full board, including its last row, is visible without clipping or requiring scroll in fullscreen/wide-landscape mode, verified on a real puzzle (not just a small demo grid)
- [x] #2 Fix holds across board sizes (6x6 through 12x12) and both the daily play route and the puzzle lab, if the lab shares this layout
- [x] #3 No regression to the portrait/mobile layout or the existing --play-top-clearance reconciliation (SLAY-6.1)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduce first (real browser, fullscreen/wide-landscape, a real scheduled puzzle) to confirm whether the fixed 76px header offset in the @media (min-aspect-ratio: 1/1) rule is the actual mismatch, or something else (safe-area insets, the daily-play__nav overlay height). Fix at the root — derive the offset from the actual header height rather than a hardcoded number, if that's the cause.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner note (Dutch): 'Full screen modus is het level net afgekapt onderin.' Screenshot attached in conversation, not in repo — confirm the exact viewport/board size from the screenshot's proportions if needed (looked like a 9x9 board, landscape desktop width).

Dependency on SLAY-9.3 is sequencing only (both touch play.css) — no functional relationship.

Readiness gate: collision check flags SLAY-9.14 (To Do, References overlap on src/ui/play/play.css). Verified SLAY-9.14's Dependencies field lists SLAY-9.12 (sequencing only, no functional relationship per its own notes), and it has no branch/worktree in flight (git branch --list and git worktree list confirmed clean). Proceeding past the collision gate per owner pre-clearance.

Live reproduction (CDP headless Chrome + claude-in-chrome) on the real 2026-10-15 daily puzzle (9x9) at 1280x800: confirmed the board's last row (R9) was clipped. Measured root cause: play.css's min-aspect-ratio:1/1 rule sized --board via min(calc(100dvh - 76px), 64vw), but the actual non-board vertical space is 24px top clearance + 62px header (44px min-height children + 16px padding + 2px border) + 10px row-gap + 12px bottom padding = 108px, not 76px -- the fixed number undercounted by 32px. The daily-play__nav overlay (48px, position:absolute) does NOT add extra height, as speculated in the story notes -- it sits inside the header's own footprint (nav bottom 72px < header bottom 86px), so it wasn't the cause.

Fix: added a root-scoped --play-header-height var derived from the header's own box-model (calc(44px + 2 * var(--space-2) + 2px)), used it as .play-header's min-height (previously a stale 48px that never matched the actual 62px rendered height), and rewrote the landscape --board calc to subtract var(--play-top-clearance) + var(--play-header-height) + 10px row-gap + max(12px, env(safe-area-inset-bottom)) instead of the flat 76px.

Verified via CDP across landscape viewports (1280x800, 1920x1080, 900x700 -- no clipping in any) and portrait/mobile viewports (390x844, 768x1024 -- no regression, untouched rules). Sizes: 9x9 real daily puzzle plus 6x6 and 12x12 generated in the puzzle lab (LabPlay.tsx, shares PlayScreen/play.css) -- fix holds size-independently since it only changes the pixel budget, not per-cell math. Full verify green: lint, typecheck, test --maxWorkers=1 (141 files, 3017 tests).

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 3 acceptance criteria met, no scope violations. One advisory finding: diff itself carries no automated/visual-regression artifact for the fix (CSS-only change) -- noted as already covered in practice by the live CDP + claude-in-chrome verification recorded above, not blocking.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the wide/landscape board-clipping bug: play.css's min-aspect-ratio:1/1 rule sized --board via a hardcoded 100dvh-76px, which undercounted the actual header+padding+gap footprint (108px, not 76px) and clipped the board's last row under overflow:hidden. Confirmed via live reproduction (CDP headless Chrome and claude-in-chrome on the real 2026-10-15 daily puzzle) before fixing. Replaced the guess with a derived calc: a new root-scoped --play-header-height var (matching the header's own deterministic box model) plus the existing --play-top-clearance, row-gap and bottom-padding literals. Verified across landscape viewports (1280x800, 1920x1080, 900x700), portrait/mobile viewports (390x844, 768x1024, no regression), and board sizes 6x6/9x9/12x12 on both the daily route and the puzzle lab. Full verify green (lint, typecheck, 3017 tests). Independent review: pass, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
