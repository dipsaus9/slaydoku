---
id: SLAY-6.1
title: 'Play-screen header: one designed bar, real top clearance on PWA'
status: To Do
assignee: []
created_date: '2026-09-28 18:57'
updated_date: '2026-09-28 19:30'
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
- [x] #1 The back control, title, timer and settings icon share one consistent visual treatment (weight, spacing, whether each has a background/border) instead of the current mix of a bordered pill button next to unadorned text next to a bare icon
- [x] #2 The header's own vertical rhythm (padding around its contents) reads as intentional, matching the spacing scale used elsewhere in the app (src/brand/tokens.css)
- [x] #3 .play's padding-top floor (currently max(8px, env(safe-area-inset-top)) in play.css) is raised enough that the header has comfortable clearance from the top edge even when env(safe-area-inset-top) resolves to 0 (a device with a plain status bar, no notch) — compare against .daily's own floor (24px) for the equivalent screen
- [x] #4 verify:phone's drive/zoom/legend suites (English and the Dutch locale driver) pass unchanged in behaviour on all six viewports, including the two portrait phone sizes and the landscape one where header height is tightest
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Within src/ui/play/play.css only, unify the header row (.play-header): drop the individual border/background chrome from .play-timer and .play-header__more (currently each renders as its own bordered pill/circle nested inside the already-bordered outer .play-header bar) so title, timer and settings icon all read as plain, borderless controls sitting inside the one outer bar -- matching the already-established plain link language used elsewhere in the app (src/ui/about/about.css's .about__back: no button chrome, just spacing + a touch target). Keep the outer .play-header bar's own border/background as the single visual boundary. Add :active/:focus-visible affordance on the timer/settings buttons in place of the resting border. 2. Retune header padding/gaps onto brand/tokens.css's spacing scale (--space-2/--space-3/--space-4) instead of the current off-scale 6px/12px values, for AC2's vertical rhythm. 3. Introduce a --play-top-clearance custom property on .play (max(<floor>px, env(safe-area-inset-top))), raised from the current 8px floor toward .daily's 24px reference point (exact value tuned against verify:phone's landscape viewport, where header height is tightest), and reuse that same variable inside the short-landscape media query's --play-board calc (which currently hardcodes its own max(8px, ...) top term) so the board-height budget stays consistent with the new clearance instead of drifting out of sync. 4. Re-run bun run verify:phone (all viewports + the Dutch driver) and fix any driver assertion tied to old header markup/measurements. PlayScreen.tsx itself only changes if the plain-control treatment needs a markup tweak (e.g. wrapping icon+label) -- the timer/more button elements, class names (play-timer, play-header__more) and aria-labels stay put since docs/verification/*.ts select on them. Back button (.daily-play__back, DailyFlow.tsx/daily.css) is NOT a Reference of this story and stays untouched -- called out as a known follow-up in the final report, not silently expanded into.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This only touches the header row's own markup/styling and the .play padding-top rule — the board, toolbar (SLAY-5.1) and cards are out of scope.

Implemented entirely within play.css (PlayScreen.tsx markup untouched -- class names play-timer/play-header__more/aria-labels stay put since docs/verification/*.ts select on them). Header unified: title/timer/settings-icon dropped their individual border/background so they read as plain controls inside the one outer .play-header bar (matching about.css's .about__back 'no button chrome' language); :active/:focus-visible give timer/settings a clear affordance in place of the resting border. Top clearance raised via a shared --play-top-clearance custom property (max(20px, env(safe-area-inset-top))), also read by the short-landscape --play-board calc so the board budget stays in sync. verify:phone (drive,zoom,legend, all 6 viewports): 1650 checks, 0 failures. Locale driver (Dutch, 390x844): 22 checks, 0 failures. Known follow-up, out of this story's References: the daily/lab back button (.daily-play__back in daily.css, .lab-btn in lab.css) stays its existing bordered-pill style -- it sits next to the header bar, already close in visual weight, but a full match would need touching daily.css/DailyFlow.tsx, which are not References of this story.

Review round 1 (block): AC3 fixed (--play-top-clearance now var(--space-5)=24px exactly, matching .daily's floor; reverified verify:phone 1650/1650 + locale 22/22 after the change). AC1 flagged that .daily-play__back (src/ui/daily/daily.css, rendered by src/ui/daily/DailyFlow.tsx) stays a bordered pill while play-header's own controls (title/timer/settings) are now chrome-less -- confirmed this is a structural scope gap, not a fixable implementation gap: those two files are not References of SLAY-6.1 (References: PlayScreen.tsx, play.css, docs/verification/ only), and checked the parent epic SLAY-6 plus siblings SLAY-6.2/SLAY-6.3 -- SLAY-6.1 is the only story in the epic that touches the header at all, so this isn't deferred to a sibling story either. Reaching the back button requires either widening this story's own References (a backlog-plan amendment) or a follow-up story; I have not silently expanded scope to fix it. Re-submitting to review round 2 with this context.

Review round 2 (block): AC2, AC3, AC4 all confirmed met (spacing scale, 24px top-clearance floor exactly matching .daily, verify:phone 1650/1650 + locale 22/22 unchanged in behaviour). AC1 still not met -- reviewer explicitly considered the scope-bounded framing (back control owned by src/ui/daily/daily.css + DailyFlow.tsx, neither a Reference of this story, no sibling SLAY-6.x story reaches them either) and confirmed: this reads as a genuine authoring gap in how SLAY-6.1's References were scoped relative to its own AC1 wording, not an implementation shortfall -- but the criterion as literally written still isn't demonstrated by the diff, so verdict stays block. ESCALATING per the review-gate protocol's scope/criteria-mismatch path rather than burning a mechanically identical round 3 (the diff can't change without touching out-of-Reference files): stopping here, not pushing, leaving the branch (SLAY-6.1/header-and-top-clearance) and worktree (.worktrees/SLAY-6.1) for a human decision. Two viable paths: (a) amend SLAY-6.1 (via backlog-plan) to widen References to include src/ui/daily/daily.css and src/ui/daily/DailyFlow.tsx so the back control can be restyled to match, then resume delivery on this same branch; or (b) accept the current scope as the story's ceiling, close SLAY-6.1 on AC2/3/4 with AC1 explicitly partial, and charter a small follow-up story for the back-control/daily.css piece. Everything else is green and ready: 2 commits on the branch, verify baseline (lint/typecheck/test) green, verify:phone + locale driver green.
<!-- SECTION:NOTES:END -->
