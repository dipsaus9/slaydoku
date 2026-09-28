---
id: SLAY-5
title: 'Epic: Toolbar v2 (icon-only, 6 controls) and real Dutch room/victim text'
status: To Do
assignee: []
created_date: '2026-09-28 17:16'
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
- [ ] #1 The toolbar shows exactly 6 icon-only controls in play (Note, X, Erase, Undo, Hint, Zoom); Place and the More menu are gone; Redo is reached by a long-press on Undo; Options/Help/Legend are reachable from one small header icon on every viewport
- [ ] #2 Room and theme names have real Dutch text (board labels and clue sentences alike), and every clue that names the victim by reference (not only the one dedicated victim-card sentence) says 'het slachtoffer' in Dutch
- [ ] #3 The victim card's name no longer wraps awkwardly in Dutch
- [ ] #4 No puzzle content, clue logic, or English text changes; the full verify:phone suite (English and the Dutch locale driver) stays green
<!-- AC:END -->
