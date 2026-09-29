---
id: SLAY-9
title: 'Epic: pre-launch polish and interaction fixes'
status: To Do
assignee: []
created_date: '2026-09-29 09:55'
updated_date: '2026-09-29 14:02'
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
- [ ] #1 Play-screen header shows Terug and Puzzel #N (or its replacement label) sharing consistent vertical alignment with the rest of the header row, on phone, iPad and desktop
- [ ] #2 Player can switch language (EN/NL) from the play screen without losing board state, notes, timer or undo history
- [x] #3 On desktop-width viewports, Options and Help are reachable as direct actions, not hidden behind the ... menu
- [ ] #4 Toolbar button labels (e.g. Ongedaan) never clip or wrap awkwardly at any viewport width tested
- [ ] #5 The victim is never a manually-placeable card and never the subject of a hint; it auto-fills the one remaining square once all suspects are placed
- [ ] #6 Legend object rows show real Dutch nouns (already-translated OBJECT_WORDS_NL) when the player's locale is Dutch
- [ ] #7 The How it works guide and keyword glossary have real Dutch content, not English-only
- [x] #8 The Zoom toolbar button is removed; pinch and ctrl+wheel zoom keep working
- [ ] #9 The start screen is restyled as a centered Wordle-style card (icon mark, title, tagline, one action button, byline) with no accounts/login/paywall added
<!-- AC:END -->
