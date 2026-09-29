---
id: SLAY-9.15
title: 'Start screen: ''How it works'' still English, byline date duplicated'
status: Done
assignee: []
created_date: '2026-09-29 17:06'
updated_date: '2026-09-29 17:38'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/StartScreen.tsx
  - src/content/help/help.ts
  - src/schedule/display.ts
  - src/ui/daily/daily.test.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the start screen's 'How it works' link shows the correct locale (not always English), and the byline under the puzzle card shows the date once, not twice.
Type: deliverable
Branch: SLAY-9.15/start-screen-locale-and-byline-fixes

Bug 1 — confirmed live in a real Dutch-locale browser session: StartScreen.tsx:138 renders {help.link}, importing the raw English-only help alias from content/help/help.ts directly (import { help } from '../../content/help/help.ts', line 4) instead of the locale-aware HELP_CONTENT[locale] selection that HowItWorks.tsx/Glossary.tsx/HelpPanel.tsx/PlayScreen.tsx already use since SLAY-9.7. This is the one remaining consumer SLAY-9.7's own report flagged as 'out of scope' at the time.

Bug 2 — confirmed live: StartScreen.tsx's byline (~line 88-97, added by SLAY-9.9/10.2) renders t.puzzleLabel(day.date) ('Puzzel van 15 oktober', correctly localized) immediately followed by formatLongDate(day.date) ('Thursday 15 October 2026', src/schedule/display.ts — explicitly English-only by design per its own doc comment, never locale-aware) — the same date shown twice, once localized and once always in English, reading as a confusing duplicate to a Dutch player.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The 'How it works' link on the start screen reads in the player's actual locale (Dutch when locale is nl), matching every other help-content consumer
- [x] #2 The puzzle date appears once in the byline, not twice in two different formats/languages — remove the redundant formatLongDate segment (simplest fix) or make it properly locale-aware if both a short and long date are genuinely wanted; either way, no visible duplication
- [x] #3 Verified against the actual rendered screen in both locales (not just code), per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner (Dutch, paraphrased): 'How it works still needs translating' and 'Tuesday 29 September 2026 appears twice.' Both confirmed live on localhost with locale=nl.

Readiness gate: collision check flagged SLAY-9.16 (StartScreen.tsx) and SLAY-9.18 (StartScreen.tsx, daily.css) as References overlaps. Verified both are still To Do, both list SLAY-9.15 in Dependencies (sequencing only, no functional relationship per their own notes), and neither has a branch or worktree in flight (git branch --list, git ls-remote, git worktree list all empty for both ids). Per owner pre-clearance, proceeding past the collision gate on this basis. Delivering in an isolated worktree (.worktrees/SLAY-9.15) since SLAY-9.17 is being delivered concurrently by another worker.

Verified live on the dev server (?date=2026-10-15, per docs/daily-flow.md) in both locales: EN shows 'How it works' / byline 'Puzzle of 15 October · Slaydoku' (single date); NL shows 'Hoe het werkt' (link and opened panel content both Dutch) / byline 'Puzzel van 15 oktober · Slaydoku' (single date, no duplicate long-date). Screenshots taken via claude-in-chrome, dev server and tab cleaned up afterwards.

Review round 1: verdict block, all 3 AC met, but flagged scopeViolations on src/ui/daily/daily.test.tsx (changed to add coverage for both fixes, but not previously in References). Widened References to include src/ui/daily/daily.test.tsx (its own test file, in-scope companion of the StartScreen.tsx fix) and re-requesting review.

Review round 2: verdict pass, all 3 AC met, no scope violations, no findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The start screen's help link now reads HELP_CONTENT[locale] via useLocale() instead of the raw English-only help export, so 'How it works' / 'Hoe het werkt' matches the reader's locale like every other help-content consumer. The byline's duplicate always-English formatLongDate segment was removed, leaving only the already-localized puzzleLabel (e.g. 'Puzzel van 15 oktober · Slaydoku', once, not twice). Covered by two new tests in daily.test.tsx and verified live on the dev server in both locales via claude-in-chrome.
<!-- SECTION:FINAL_SUMMARY:END -->
