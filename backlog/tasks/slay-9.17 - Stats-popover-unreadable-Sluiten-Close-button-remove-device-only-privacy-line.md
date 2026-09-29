---
id: SLAY-9.17
title: >-
  Stats popover: unreadable Sluiten/Close button, remove device-only privacy
  line
status: Done
assignee: []
created_date: '2026-09-29 17:09'
updated_date: '2026-09-29 17:51'
labels:
  - story
dependencies: []
references:
  - src/ui/stats/StatsPanel.tsx
  - src/ui/stats/strings.ts
  - src/ui/play/play.css
  - src/ui/stats/stats.css
  - src/ui/stats/stats.test.tsx
  - docs/verification/stats.ts
parent_task_id: SLAY-9
type: feature
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the stats popover's Close button is readable, and the 'stays only on this device' line is removed.
Type: deliverable
Branch: SLAY-9.17/stats-popover-contrast-and-copy

Bug 1, confirmed live (screenshot): the Close/'Sluiten' button in the stats popover (src/ui/stats/StatsPanel.tsx) renders dark navy text on a red background — nearly unreadable. Root cause: play.css's white-text rule for .play-btn--primary is scoped '.play .play-btn--primary { color: #fff }' (play.css ~line 482), so it only applies when the button is nested inside the .play screen container. The stats popover is reachable from the start screen, outside .play, so this button falls back to the default dark text color instead of white — while the same class used inside the play screen (e.g. the ResultOverlay's buttons) renders correctly.

Bug 2: owner wants the line 'Blijft alleen op dit apparaat. Er wordt niets verstuurd.' (src/ui/stats/strings.ts, device: '...', en: 'Kept on this device only. Nothing is sent anywhere.') removed from the stats popover.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The stats popover's primary/Close button has readable contrast (white or otherwise sufficiently contrasting text) regardless of where the popover is opened from, not just when nested inside .play
- [x] #2 Check whether any other .play-btn--primary or .play-btn--danger usage outside the .play screen has the same contrast bug (e.g. other modals opened from the start screen) and fix the same way — don't special-case only the stats popover
- [x] #3 The device-only privacy line is removed from the stats popover
- [x] #4 Verified against the actual rendered screen, not just the CSS diff
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Root cause for the stats popover (bug 1) is stats.css: .stats-btn--primary/.stats-btn--danger set color only via a single-class rule, which loses to daily.css's higher-specificity '.daily button { color: inherit }' once the popover (opened from the start screen) sits inside <main class="daily">. Root cause for HelpPanel (AC #2's search) is the analogous case in play.css: '.play .play-btn--primary/--danger' only fixes buttons nested under .play, not under .daily -- so HelpPanel's primary buttons render unreadable when opened from the start screen (.daily__help), even though they render correctly when opened from inside PlayScreen. Fix: scope the white/paper-text override to the shared Modal wrapper class (.play-modal__panel) in addition to the screen container (.play), so it holds regardless of which screen mounts the modal -- add '.play-modal__panel .stats-btn--primary/--danger' in stats.css, and add '.play-modal__panel .play-btn--primary/--danger' alongside the existing .play scope in play.css. Also remove the 'device-only' privacy line (bug 2) from StatsPanel.tsx and strings.ts (STATS_EN/STATS_NL), since the About page's Privacy section already covers it. Verified against the rendered screen with headless Chrome (computed style + screenshots before/after), not just the CSS diff.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner (Dutch): 'Zwarte tekst op rode button is niet leesbaar' + 'Blijft alleen op dit apparaat, staat er dubbel in' (the phrasing suggests it also reads as redundant with disclosure elsewhere, e.g. the About page's privacy section).

AC #2 search: grepped every *-btn--primary/*-btn--danger definition (play-btn, stats-btn, daily-btn, share-btn, lab-btn) and every place each is rendered, to find which non-.play instances could actually lose the ancestor-scoped color:inherit reset. Found and fixed two real instances: StatsPanel's Close/Reset buttons (stats-btn, always opened from the start screen) and HelpPanel's primary buttons (play-btn, opened both from PlayScreen's dialog and from the start screen's 'How it works' button -- only the latter was broken). daily-btn--primary/--danger and share-btn--primary already had their own working two-class overrides ('.daily button.daily-btn--primary', '.share .share-btn--primary'). lab-btn--primary/--danger have no ancestor color:inherit reset above them, so no bug there (dev-only tool anyway).

AC #4 (round 2, after reviewer block): added two computed-style checks to docs/verification/stats.ts (WCAG contrast ratio between getComputedStyle(...).color and .backgroundColor, read from the live cascade in headless Chrome, not the CSS source) -- one for the stats popover's Close button, one for HelpPanel's primary button opened from the start screen (AC #2's named case). Verified as a real regression test with a negative control: temporarily restored the pre-fix stats.css/play.css (git show 9e7d640:...), rebuilt, reran -- both new checks correctly FAIL (color rgb(42,42,54) dark ink on rgb(179,65,62) red); restored the fix and reran -- both PASS (color rgb(253,248,236)/rgb(255,255,255) on the same red). The driver's later solve-through-the-UI steps fail in this sandbox both before and after this story's changes (confirmed against unmodified origin/main too) -- pre-existing, unrelated to this fix.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the stats popover's unreadable Close/Reset button contrast and the analogous bug in HelpPanel's primary buttons (both lose their white text when opened from the start screen, outside .play, to daily.css's higher-specificity '.daily button { color: inherit }' reset). Scoped the white/paper-text override to the shared Modal wrapper class (.play-modal__panel) in stats.css and play.css, so it holds regardless of which screen mounts the popover -- fixing the stats popover and HelpPanel's start-screen entry point without special-casing either one. Also removed the redundant 'stays only on this device' line from the stats popover (StatsPanel.tsx, strings.ts), since the About page's Privacy section already covers it. Verified against the live rendered cascade, not just the CSS diff: new computed-style WCAG contrast checks in docs/verification/stats.ts, confirmed as real regression tests via a negative control (fail against the pre-fix CSS, pass against the fix). Reviewed and passed in 2 rounds; round 1 blocked only on AC #4 evidence, resolved by adding the rendered-screen checks.
<!-- SECTION:FINAL_SUMMARY:END -->
