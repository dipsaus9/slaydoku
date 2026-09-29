---
id: SLAY-9.15
title: 'Start screen: ''How it works'' still English, byline date duplicated'
status: To Do
assignee: []
created_date: '2026-09-29 17:06'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/StartScreen.tsx
  - src/content/help/help.ts
  - src/schedule/display.ts
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
- [ ] #1 The 'How it works' link on the start screen reads in the player's actual locale (Dutch when locale is nl), matching every other help-content consumer
- [ ] #2 The puzzle date appears once in the byline, not twice in two different formats/languages — remove the redundant formatLongDate segment (simplest fix) or make it properly locale-aware if both a short and long date are genuinely wanted; either way, no visible duplication
- [ ] #3 Verified against the actual rendered screen in both locales (not just code), per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner (Dutch, paraphrased): 'How it works still needs translating' and 'Tuesday 29 September 2026 appears twice.' Both confirmed live on localhost with locale=nl.
<!-- SECTION:NOTES:END -->
