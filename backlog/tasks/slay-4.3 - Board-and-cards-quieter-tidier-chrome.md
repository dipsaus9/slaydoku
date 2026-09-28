---
id: SLAY-4.3
title: 'Board and cards: quieter, tidier chrome'
status: Done
assignee: []
created_date: '2026-09-28 13:18'
updated_date: '2026-09-28 13:34'
labels:
  - story
dependencies: []
references:
  - src/render/icons/art/tokens.ts
  - src/render/scene/
  - src/render/cards/cards.css
  - docs/verification/
parent_task_id: SLAY-4
type: feature
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the board's drawn furniture/objects keep their shapes but read calmer (less saturated, less visual noise) instead of busy; room labels and grid lines use the app's existing warm design tokens instead of plain white/black; suspect and victim cards share a consistent height so a row reads as a tidy grid instead of jagged. No icon silhouette, room layout, or card text changes.
Type: deliverable
Branch: SLAY-4.3/board-cards-tidy
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/render/icons/art/tokens.ts's shared colour palette (C) is desaturated/calmed; every icon (house, living, outdoor, edges, shapes) inherits the change automatically — no per-icon file's shape or color literal is edited
- [x] #2 Room-label pills and board grid lines in src/render/scene/ use the shared design tokens (src/brand/tokens.css) instead of literal white/black values
- [x] #3 Suspect and victim cards in src/render/cards/cards.css share a consistent minimum height so a row lines up neatly regardless of clue-text length; long clue text still fits and stays fully readable, nothing is truncated or hidden
- [x] #4 No object/room shape, icon silhouette, room layout, or clue/card text changes; the rendered-screen check (every card's text visible, every drawn object still has a legend row) stays green
- [x] #5 docs/verification's drive/legend/screens suites pass unchanged in behaviour (same DOM structure and text), only visuals differ
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Desaturate/warm the C palette in src/render/icons/art/tokens.ts (values only, same keys) so every icon inherits calmer colours. 2. Replace theme.ts's literal white/black (labelFill, labelInk, grid) with values derived from src/brand/tokens.css (--color-paper, --color-ink) for room-label pills and grid lines only, per AC2 scope. 3. Add a shared min-height to .polaroid in cards.css, sized from analysis of the committed schedule's real clue-text lengths (median/typical wrapped-line count at the narrowest 150px card), so short-clue cards reach a consistent floor while long clues still grow unclipped. 4. Run lint/typecheck/test/build plus the rendered-screen + verify:phone checks; confirm docs/verification suites still pass (same DOM/text, different visuals only).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This is a palette and layout pass only. Do not change any icon's path/shape data, room geometry, or clue/card copy — the noun/legend system depends on the drawn object still matching what a clue names.

Verify: lint/typecheck/test (137 files, 2818 tests) all green. bun run verify:phone SUITES=drive,legend,screens: screens (the rendered-screen check named in AC4) is 636/636 green across all 6 viewports — every card's text visible, every drawn object's legend row intact, confirming AC4/AC5 behaviourally. drive and legend crashed on every viewport in this sandbox because its macOS system locale is nl_NL, which the app's SLAY-3.2 browser-locale auto-detection picks up (rendering Dutch labels); both drivers hardcode English button labels ('Undo', 'Legend') and throw 'missing tool' before reaching any visual assertion. Confirmed pre-existing/environmental, not caused by this story: reproduced identically even with Chrome's --lang=en-US forced (Intl still resolves nl from the OS), and this story's diff touches only colour literals in theme.ts/tokens.ts and a min-height in cards.css — no DOM, text, or locale-detection code changed. No drive.ts/legend.ts source was committed; the diagnostic copy was removed.

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 5 acceptance criteria met, no scope violations, no findings. Reviewer note on AC5: could not execute the browser-driven drive/legend/screens suites itself, but confirmed by diff inspection that no DOM structure or text changed and nothing under docs/verification/ was touched, so their behaviour is unaffected by construction — consistent with this session's own empirical run (screens: 636/636 green; drive/legend blocked only by this sandbox's nl_NL system locale, a pre-existing environment condition unrelated to this diff, see prior note).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Calmed the board's icon palette and grid/label chrome, and gave suspect/victim cards a shared minimum height. src/render/icons/art/tokens.ts's shared C palette is desaturated (~30% less chroma, slightly lighter) with every key name unchanged, so every icon inherits the quieter look with no per-icon edits. src/render/scene/theme.ts's room-label pill fill/ink and grid-line colour now read the shared --color-paper/--color-ink design tokens (src/brand/tokens.css) via var()/color-mix() instead of literal white/#2a2a36/rgba(). src/render/cards/cards.css's .polaroid gets a 260px shared min-height (a floor, never a cap) so short-clue cards no longer read as stubs next to longer ones. No icon shape, room layout, or clue/card text changed. Verify: lint/typecheck/test all green (137 files, 2818 tests); bun run verify:phone's screens suite (the rendered-screen check named in AC4) is 636/636 green across all 6 viewports. The drive/legend suites could not run in this sandbox — its macOS system locale (nl_NL) makes the app auto-select Dutch (SLAY-3.2), and those two drivers hardcode English button labels; confirmed pre-existing/environmental (reproduces even with Chrome's --lang=en-US forced) and unrelated to this diff, which touches only colour literals and one min-height rule. Independent review: PASS, all 5 acceptance criteria met, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
