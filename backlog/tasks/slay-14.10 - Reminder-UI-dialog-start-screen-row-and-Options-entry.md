---
id: SLAY-14.10
title: 'Reminder UI: dialog, start-screen row and Options entry'
status: To Do
assignee: []
created_date: '2026-10-02 09:55'
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
- [ ] #1 The row and the Options entry are rendered only when the reminder store is available (installed app); in a normal tab neither appears
- [ ] #2 The dialog has an on/off toggle, an hour dropdown 06:00-23:00 labelled as Amsterdam time defaulting to 08:00, and Save; the blocked and error states show a clear localized message
- [ ] #3 The start-screen row appears only after the player has solved at least once and respects the quiet visual weight of InstallNotice
- [ ] #4 All strings exist in en and nl in their own strings file; the dialog uses the existing Modal and meets the touch-target rules
- [ ] #5 Verified on the rendered screen at 360px and 1280px in both locales; component tests cover each state; lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->
