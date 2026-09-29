---
id: SLAY-9.6
title: 'Legend panel: use Dutch object nouns when the locale is Dutch'
status: To Do
assignee: []
created_date: '2026-09-29 09:57'
labels:
  - story
dependencies: []
references:
  - src/ui/help/legend.ts
  - src/ui/help/Legend.tsx
  - src/engine/clues/en.ts
  - src/engine/clues/nl.ts
parent_task_id: SLAY-9
type: feature
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Legend card's object rows show real Dutch nouns when the player's locale is Dutch, instead of always the English word list.
Type: deliverable
Branch: SLAY-9.6/legend-dutch-nouns

Root cause: src/ui/help/legend.ts's legendOf() hardcodes 'import { OBJECT_WORDS } from ../../engine/clues/en.ts' with no locale parameter at all. The Dutch counterpart, OBJECT_WORDS_NL, already exists and is real Dutch (delivered in SLAY-6.2 for clue sentences) — it is simply never read by the Legend panel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Legend object rows show nouns from OBJECT_WORDS_NL when the player's locale is nl, and from OBJECT_WORDS (unchanged) when it is en
- [ ] #2 legendOf() takes the active locale (or the already-resolved word table) as a parameter rather than importing en.ts directly, so it cannot silently drift back to English-only
- [ ] #3 The Legend re-renders with the correct nouns immediately after a mid-puzzle language switch, once SLAY-9.4 makes that reachable
- [ ] #4 Existing Legend tests (Legend.test.tsx) still pass or are deliberately extended to cover the nl case
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Thread the active locale from useLocale() through Legend.tsx into legendOf(scene, locale), selecting OBJECT_WORDS vs OBJECT_WORDS_NL inside instead of the current hardcoded import.
<!-- SECTION:PLAN:END -->
