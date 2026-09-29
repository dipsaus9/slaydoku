---
id: SLAY-9.4
title: 'Language switch: reachable from the play screen'
status: Done
assignee: []
created_date: '2026-09-29 09:55'
updated_date: '2026-09-29 14:19'
labels:
  - story
dependencies:
  - SLAY-9.2
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/daily/LocaleToggle.tsx
  - src/ui/play/LegendPanel.tsx
  - src/ui/help/Legend.tsx
  - src/ui/play/OptionsPanel.tsx
  - src/ui/play/play.css
parent_task_id: SLAY-9
type: feature
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a player can change language (EN/NL) while mid-puzzle; grid state, notes, timer and undo history are unaffected by the switch.
Type: deliverable
Branch: SLAY-9.4/play-screen-locale-toggle

LocaleToggle currently only renders on StartScreen.tsx. Locale plumbing (useLocale/LocaleProvider) already exists app-wide and is already consumed reactively by some play-screen components (e.g. SuspectPanel.tsx); LocaleToggle.tsx's own comment already anticipates this as SLAY-3.1 follow-up work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 LocaleToggle (or an equivalent control) is reachable from the play screen (e.g. inside the Options modal/header), on both desktop and mobile layouts
- [x] #2 Switching language mid-puzzle re-renders all play-screen text (clues, toolbar, hints, header) in the new locale without resetting board placements, notes, timer or undo/redo history
- [x] #3 Every play-screen-reachable component reads locale reactively via useLocale() rather than only once at mount; any component found doing the latter is fixed as part of this story
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Render LocaleToggle inside the play screen (the Options modal is the natural home, next to the desktop-inline Options button from SLAY-9.2). Audit play-screen-reachable components for useLocale() usage to confirm reactivity.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-9.2 is sequencing only (both touch PlayScreen.tsx) — no functional relationship.

Widening References ahead of the review gate: AC #3 explicitly requires fixing every play-screen-reachable component found reading locale only once (not reactively). Audit found two such bugs outside the original References — LegendPanel.tsx (Modal title/close text via static English-only `help` import) and help/Legend.tsx (all legend row text via the same static import, despite already calling useLocale() for legendOf()). Both are reachable from PlayScreen -> LegendPanel -> Legend. Adding them to References per CLAUDE.md's widen-References-when-scope-blocks guidance, proactively rather than waiting on a review block.

Further widening: the story's own Implementation Plan names the Options modal as LocaleToggle's new home, next to the SLAY-9.2 desktop-inline Options button. Rendering it there means editing OptionsPanel.tsx (adds src/ui/play/OptionsPanel.tsx to References).

Widened once more: src/ui/play/play.css, for the .play-options__locale wrapper spacing around LocaleToggle inside the Options modal (needed for AC #1's both-layouts check against the rendered screen, not just data).

Verify green: bun run lint, bun run typecheck, bun run test --maxWorkers=1 (141 files, 3021 tests) all pass. Visually verified in bun run dev (desktop 1456x840): Options modal shows the EN/NL toggle next to the title; switching to NL re-renders the whole play screen (toolbar, header, Options modal, clue cards, Legend panel) into Dutch while the timer kept counting (0:09 -> 0:16, i.e. the game store was not recreated). Also confirmed the Legend panel bug fix live: title 'Legenda', close 'Sluiten', section headings and Can be occupied/Blocked flags all in Dutch (previously hardcoded English).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
LocaleToggle now renders inside the play screen's Options modal (OptionsPanel.tsx), reusing the same shared component the start screen already used, reachable on both desktop (direct header Options button, SLAY-9.2) and mobile (More sheet -> Options) layouts. Switching language mid-puzzle only re-renders chrome text (strings/help, already/now read reactively via useLocale()); the game store's useMemo is not keyed on locale (guarded by a regression test), so board placements, notes, timer and undo/redo history are untouched. Also fixed two real reactivity bugs surfaced by the AC #3 audit: LegendPanel.tsx and help/Legend.tsx were reading a static English-only help import for their chrome text (title, close button, section headings, occupied/blocked flag, the rule) despite Legend.tsx already reading locale reactively for object nouns -- both now read HELP_CONTENT[locale]. Verify green: lint, typecheck, full test suite (141 files / 3021 tests). Visually verified live in bun run dev: Options modal toggle, full-screen Dutch re-render with timer uninterrupted, and the Legend panel's fixed Dutch chrome text. Independent review: pass, no findings.
<!-- SECTION:FINAL_SUMMARY:END -->
