---
id: SLAY-9.2
title: 'Desktop header: show Options and Help inline instead of behind the ... menu'
status: Done
assignee: []
created_date: '2026-09-29 09:55'
updated_date: '2026-09-29 12:36'
labels:
  - story
dependencies: []
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/play/play.css
  - docs/verification/drive.ts
  - docs/verification/legend.ts
  - docs/verification/zoom.ts
  - docs/verification/screens.ts
  - docs/verification/locale.ts
  - src/ui/daily/daily.css
parent_task_id: SLAY-9
type: feature
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: on wide/desktop viewports, Options and Help render as direct header actions; the ... (More) collapse is reserved for viewports too narrow to fit them.
Type: deliverable
Branch: SLAY-9.2/desktop-header-options-inline

The More menu today (PlayScreen.tsx, play-header__more) opens a Modal containing only Options and Help MenuButtons — the toolbar itself already shows all 7 controls inline on every viewport (no toolbar buttons are behind this menu).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 At desktop widths, Options and Help appear as their own buttons in .play-header__actions, not inside the More modal
- [x] #2 Below that breakpoint, behavior is unchanged: Options/Help stay behind the ... (More) button
- [x] #3 Legend icon's existing direct-icon behavior (already not behind More) is unaffected
- [x] #4 Any existing test asserting the More modal always contains exactly Options+Help is updated deliberately, not left failing or silently changed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a desktop-width media query in play.css that shows the two MenuButtons (currently only rendered inside the More Modal, PlayScreen.tsx around lines 251-269) as inline header buttons, and hides/removes the ... trigger at that width; keep the Modal + trigger for narrower widths.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Readiness gate: collisions tool flagged SLAY-9.3/9.4/9.8 (References prefix overlap on play.css/PlayScreen.tsx) but all are still To Do with no branch/worktree, i.e. not actually in flight. Verified via git branch --list '*/*' and git worktree list before starting. Proceeding with this single sequential delivery; not a real concurrent conflict.

Widened References to include docs/verification/{drive,legend,zoom,screens,locale}.ts: their shared tool()/toolRect() helper picks the FIRST DOM match for a label, not the visible one. SLAY-9.2's inline header copy of Options/Help (always mounted, CSS-hidden below 641px) is now a duplicate match that sits before the More-sheet copy in DOM order, so at phone widths 'More' then 'Help' hit the hidden inline button instead of the sheet's. Confirmed via bun run verify:phone (SUITES=drive): 390x844 crashed (missing modal button Keywords after a no-op Help tap); 1024x768/768x1024 passed only by coincidence. Fixing the helper to prefer a visible match (offsetParent !== null) in all five files, in scope because it is a direct, demonstrated regression from this story's own change.

Second real regression found and fixed via bun run verify:phone: at short-landscape widths (844x390, orientation:landscape+max-height:500px), the daily-play__nav overlay bar (src/ui/daily/daily.css, absolutely positioned with both left and right set, hardcoded 'right: ...+112px' budget sized for the old icon-only Legend+More actions) stretched its invisible empty flex space over the header's now-wider Options/Help buttons and silently swallowed taps meant for them (confirmed via elementFromPoint: the nav element, not the Options button, was topmost at the tap coordinate). Fixed at the root instead of tuning the magic number: pointer-events:none on .daily-play__nav, pointer-events:auto on its one real control (.daily-play__back) -- so the bar's footprint no longer needs to be hand-matched to however wide the header's own controls are, which also protects SLAY-9.3/9.4/9.8 (all touching this same header/toolbar area) from hitting the same trap.

Full bun run verify:phone (all suites, all six viewports) is green except the pre-existing 'offline' suite (update-notice check, unrelated to this story), confirmed failing identically on a clean origin/main baseline worktree before any SLAY-9.2 change -- not touched here, out of scope. Everything else (drive, zoom, legend, screens, stats, share) passes 0 failures on every viewport including the short-landscape 844x390 case that surfaced both fixed regressions.

Review round 1: reviewer flagged src/ui/play/PlayScreen.test.tsx as a scope violation -- it was edited (as AC4 itself requires) but never added to References, since 'PlayScreen.tsx' as a Reference doesn't cover its .test.tsx sibling by this project's convention. Fixed by widening References to include it explicitly. All four criteria were already judged met; this was the sole blocking finding.

Review round 2: verdict pass, 0 findings, 0 scope violations. All four acceptance criteria confirmed met from the diff alone.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Options and Help now render as direct header actions (.play-header__quick, reusing the existing MenuButton) at desktop widths (min-width: 641px, the same breakpoint the rest of play.css treats as non-phone); the ... (More) trigger and its Modal stay mounted unchanged and are CSS-shown only below that width. Legend keeps its own icon-only header button, unaffected. Fixed two regressions this surfaced and confirmed via bun run verify:phone: (1) five verification drivers' shared tool()/toolRect() helper picked the first DOM match for a label rather than the visible one, now duplicated by the always-mounted inline pair -- fixed to prefer offsetParent!==null; (2) at short-landscape widths, daily.css's .daily-play__nav overlay bar silently intercepted taps meant for the wider header actions row via its hardcoded click-budget -- fixed at the root with pointer-events:none on the bar and pointer-events:auto on its one real button, instead of tuning the magic number (also protects SLAY-9.3/9.4/9.8, which touch the same header/toolbar area). Updated PlayScreen.test.tsx and docs/verification/legend.ts deliberately where they asserted the old always-behind-More assumption. Full verify:phone is green across all suites/viewports except the pre-existing 'offline' update-notice suite, confirmed failing identically on a clean origin/main baseline, unrelated and out of scope.
<!-- SECTION:FINAL_SUMMARY:END -->
