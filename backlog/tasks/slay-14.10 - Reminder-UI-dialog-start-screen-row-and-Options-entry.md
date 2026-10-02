---
id: SLAY-14.10
title: 'Reminder UI: dialog, start-screen row and Options entry'
status: Done
assignee: []
created_date: '2026-10-02 09:55'
updated_date: '2026-10-02 14:15'
labels:
  - story
dependencies:
  - SLAY-14.9
  - SLAY-14.2
  - SLAY-14.4
references:
  - src/ui/reminder/
  - src/ui/play/OptionsPanel.tsx
  - src/ui/play/PlayScreen.tsx
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/daily.css
  - src/ui/daily/DailyFlow.tsx
  - src/validation/dutch.test.ts
parent_task_id: SLAY-14
type: feature
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: players in the installed app can turn on a daily reminder and pick an hour (06:00-23:00 Amsterdam time, default 08:00) from a quiet 'Daily reminder' row on the start screen (shown after the first solve) and from the Options panel; both open one small dialog (toggle, hour dropdown, Save). English and Dutch. Hidden entirely when the store says unavailable.
Type: deliverable
Branch: SLAY-14.10/reminder-ui
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The row and the Options entry are rendered only when the reminder store is available (installed app); in a normal tab neither appears
- [x] #2 The dialog has an on/off toggle, an hour dropdown 06:00-23:00 labelled as Amsterdam time defaulting to 08:00, and Save; the blocked and error states show a clear localized message
- [x] #3 The start-screen row appears only after the player has solved at least once and respects the quiet visual weight of InstallNotice
- [x] #4 All strings exist in en and nl in their own strings file; the dialog uses the existing Modal and meets the touch-target rules
- [x] #5 Verified on the rendered screen at 360px and 1280px in both locales; component tests cover each state; lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rendered check (headless Chrome, harness with fake store, since removed): 360 and 1280 px, en and nl, start row off/on, Options entry, dialog off/blocked/error. No horizontal overflow, targets >=44px (row button 44, Save/select 48). Production stays hidden until REMINDER_CONFIG has real values.

Review: pass, all 5 AC met, no scope violations. Advisory: no DailyFlow-level test for first-solve gating; dialog draft does not re-sync if store state changes while open.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added src/ui/reminder (strings en+nl, store context for injection, dialog, start-screen row, Options entry); the row shows after the first solve, both hide while the store is unavailable. Tests cover each state with a fake store; rendered check done at 360/1280 in en/nl.
<!-- SECTION:FINAL_SUMMARY:END -->
