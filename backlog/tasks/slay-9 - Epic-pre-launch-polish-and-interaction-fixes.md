---
id: SLAY-9
title: 'Epic: pre-launch polish and interaction fixes'
status: To Do
assignee: []
created_date: '2026-09-29 09:55'
updated_date: '2026-09-30 09:58'
labels:
  - epic
dependencies: []
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: fix eight owner-reported UI/interaction bugs found in final pre-launch testing (header alignment, mid-puzzle language switching, desktop header density, toolbar button clipping, victim placement/hints, Dutch translation gaps in the Legend and Help panels, a redundant Zoom button) so the public launch ships without them.

Alternative considered: defer the riskier hint-sequencing rework (tracked separately as SLAY-8.3, which touches the core solvability guarantee) to a post-launch fast-follow, since it is the slowest/riskiest item and nothing else here depends on it. The owner decided (2026-09-29) it must still gate launch, so it stays tracked in SLAY-8.3, not duplicated here — this epic covers only the eight bugs that can ship independently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Play-screen header shows Terug and Puzzel #N (or its replacement label) sharing consistent vertical alignment with the rest of the header row, on phone, iPad and desktop
- [x] #2 Player can switch language (EN/NL) from the play screen without losing board state, notes, timer or undo history
- [x] #3 On desktop-width viewports, Options and Help are reachable as direct actions, not hidden behind the ... menu
- [x] #4 Toolbar button labels (e.g. Ongedaan) never clip or wrap awkwardly at any viewport width tested
- [x] #5 The victim is never a manually-placeable card and never the subject of a hint; it auto-fills the one remaining square once all suspects are placed
- [x] #6 Legend object rows show real Dutch nouns (already-translated OBJECT_WORDS_NL) when the player's locale is Dutch
- [x] #7 The How it works guide and keyword glossary have real Dutch content, not English-only
- [x] #8 The Zoom toolbar button is removed; pinch and ctrl+wheel zoom keep working
- [x] #9 The start screen is restyled as a centered Wordle-style card (icon mark, title, tagline, one action button, byline) with no accounts/login/paywall added
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pre-launch polish and interaction fixes, delivered as SLAY-9.1 to SLAY-9.22: play-screen header alignment (9.1), inline desktop Options/Help (9.2), toolbar sizing and style (9.3, 9.14), a language switch on the play screen (9.4), an auto-placed victim (9.5), Dutch legend nouns and a Dutch help/glossary (9.6, 9.7), removing the Zoom button (9.8) and fixing its drivers (9.10, 9.11), fixing the clipped board in wide landscape (9.12), keeping the board visible after solving with share as a popover (9.13), start-screen i18n and byline fixes (9.15), a way back to the board once solved (9.16), stats popover fixes (9.17), the Wordle-style start screen (9.9, redone in 9.18), fixing the manual browser-verification drivers left stale by 9.13/9.15 (9.19), a header/timer overlap fix on narrow phones (9.20), fixing docs/verification/share.ts for post-9.13 behavior (9.21), and a quiet GitHub Sponsors support link on the start screen and About page (9.22). All nine epic acceptance criteria (header alignment, mid-puzzle language switch, desktop header density, toolbar clipping, victim auto-placement, Dutch legend/help content, Zoom removal, the Wordle-style start screen) were satisfied by 9.1-9.19; 9.20-9.22 are pre-launch follow-ups delivered afterward, none of which reopen or contradict any of the nine criteria.
<!-- SECTION:FINAL_SUMMARY:END -->
