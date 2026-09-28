---
id: SLAY-3.1
title: Locale plumbing and a language switch
status: To Do
assignee: []
created_date: '2026-09-28 10:20'
labels:
  - story
dependencies: []
references:
  - src/locale/
  - src/App.tsx
  - src/ui/daily/
parent_task_id: SLAY-3
type: feature
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a Locale type ('en' | 'nl'), a useLocale() hook/context (default from the browser's language, persisted to localStorage), and a visible toggle wired into the app so a player can switch language. No game content is translated yet — every string still comes from the existing English constants regardless of locale; this story is pure infrastructure the following stories build on.
Type: deliverable
Branch: SLAY-3.1/locale-plumbing
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/locale/ defines Locale ('en' | 'nl'), a LocaleProvider and a useLocale() hook; the default locale is 'nl' when navigator.language starts with 'nl', else 'en'
- [ ] #2 The choice is persisted under localStorage key slaydoku:locale and read back on load, the same pattern already used by slaydoku:help-seen and slaydoku:daily-results
- [ ] #3 App.tsx wraps the game in LocaleProvider; a visible, reachable toggle (44px touch target) on the start screen lets a player switch locale immediately, and the choice persists across reload
- [ ] #4 No player-facing text changes yet; bun run lint, typecheck, test --maxWorkers=1 and build stay green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add src/locale/ with the Locale type, a React context, LocaleProvider and useLocale(). 2. Read/write localStorage the same way src/pwa or src/game/daily already do (check their pattern first). 3. Wrap App.tsx's Game/DevApp in LocaleProvider. 4. Add a small toggle control to the start screen (near How it works/About), wired to useLocale(). 5. Confirm no existing string import changes — everything still renders in English regardless of the toggle's state, since no consuming component reads the locale yet.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The toggle can and should be visibly present and functional (it does switch a stored value and could show e.g. EN/NL as pressed state) even though nothing downstream reacts to it yet — later stories make components consume useLocale().
<!-- SECTION:NOTES:END -->
