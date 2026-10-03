---
id: SLAY-15.5
title: Offer the reminder in a popup right after the player solves the puzzle
status: To Do
assignee: []
created_date: '2026-10-03 09:39'
labels:
  - story
dependencies:
  - SLAY-15.2
references:
  - src/ui/reminder/
  - src/ui/daily/DailyFlow.tsx
  - src/ui/daily/daily.test.tsx
parent_task_id: SLAY-15
type: feature
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a player in the installed app who solves a puzzle and has no reminder yet sees a dismissible popup offering it (the same toggle, hour dropdown and Save as the start-screen dialog), instead of having to find the row or the Options entry. The owner reported that nothing pops up after finishing a puzzle.
Type: deliverable
Branch: SLAY-15.5/solve-reminder-popup
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After solving in the installed app with the reminder store status 'off' and no recent dismissal, a dialog opens over the solved result with the reminder form (hour dropdown 06:00-23:00 Amsterdam time, default 08:00, Save) and a 'Not now' button, in en and nl
- [ ] #2 It never opens when the store status is unavailable (normal tab, placeholder config), on, blocked or busy; after 'Not now' it does not return for 14 days (dismissal stored in localStorage inside try/catch) and never after the reminder was turned on
- [ ] #3 Save from the popup goes through the same store.enable(hour) path and shows the same blocked and error messages as the existing reminder dialog
- [ ] #4 The popup opens only after the solved result is visible, does not cover or delay the share panel, closes on Escape and 'Not now', and returns focus to the page
- [ ] #5 Verified on the rendered screen at 360px and 1280px in en and nl with an injected fake store; component tests cover each state; lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->
