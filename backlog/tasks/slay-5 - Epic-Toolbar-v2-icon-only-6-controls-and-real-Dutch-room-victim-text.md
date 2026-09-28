---
id: SLAY-5
title: 'Epic: Toolbar v2 (icon-only, 6 controls) and real Dutch room/victim text'
status: Done
assignee: []
created_date: '2026-09-28 17:16'
updated_date: '2026-09-28 18:17'
labels:
  - epic
dependencies: []
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the play-screen toolbar drops to 6 icon-only controls used every session (Note, X, Erase, Undo, Hint, Zoom); Place is removed (long-press already places universally, confirmed in code) and Redo becomes a long-press on Undo (mirroring the Erase button's existing tap/long-press pattern); Options/Help/Legend move out of the toolbar into one small header icon, on every viewport alike. Separately, two real Dutch localisation gaps the owner found by testing are fixed: room/theme names on the board and inside clue sentences were never actually translated (SLAY-3.2 kept the English name with a Dutch article glued on, by explicit scope choice at the time), and the victim's stored label leaks raw English ('the victim') into any clue that names the victim by reference rather than through the one dedicated sentence that was translated; the victim card's Dutch name also wraps awkwardly. Chosen approach (over incremental tweaks to SLAY-4.2's toolbar): a real rebuild, because the owner tested SLAY-4.2's 12-to-9 reduction and found it did not read as simpler — cutting genuinely redundant controls (not just hiding them behind a menu) and going icon-only is what actually reduces visual weight.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The toolbar shows exactly 6 icon-only controls in play (Note, X, Erase, Undo, Hint, Zoom); Place and the More menu are gone; Redo is reached by a long-press on Undo; Options/Help/Legend are reachable from one small header icon on every viewport
- [x] #2 Room and theme names have real Dutch text (board labels and clue sentences alike), and every clue that names the victim by reference (not only the one dedicated victim-card sentence) says 'het slachtoffer' in Dutch
- [x] #3 The victim card's name no longer wraps awkwardly in Dutch
- [x] #4 No puzzle content, clue logic, or English text changes; the full verify:phone suite (English and the Dutch locale driver) stays green
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both stories delivered and merged. SLAY-5.1: the play-screen toolbar is 6 icon-only controls (Note, X, Erase, Undo, Hint, Zoom), Place and the More menu gone, Redo reached by a long-press on Undo, Options/Help/Legend moved to one header settings icon on every viewport. SLAY-5.2: room and theme names carry real Dutch text (a name-keyed lookup, roomNameNlOf, shared by the clue text and the board's room labels, so they never disagree, and Scene.rooms itself stays untouched to keep the committed schedule data byte-identical); any clue naming the victim by reference now says 'het slachtoffer' instead of leaking the stored English label; the victim card's Dutch name fits without wrapping awkwardly. Verified together on the merged tree: full verify:phone suite (all 7 suites, all 6 viewports) — 2826 checks, 0 failures; the SLAY-3.6 Dutch locale driver (extended with a board-room-label assertion) — 22 checks, 0 failures.
<!-- SECTION:FINAL_SUMMARY:END -->
