---
id: SLAY-14.2
title: >-
  Start screen: drop the 'Ends at 00:00 UTC (02:00 Amsterdam time)' line, keep
  the countdown
status: To Do
assignee: []
created_date: '2026-10-02 09:54'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/Countdown.tsx
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/strings.ts
  - src/ui/daily/daily.test.tsx
parent_task_id: SLAY-14
type: chore
ordinal: 90000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the start screen shows the countdown (Ends in / Eindigt over) without the 'Ends at ...' / 'Eindigt om ... (Amsterdam time)' text. Only endsAt is removed; nextAt and startsAt lines stay.
Type: deliverable
Branch: SLAY-14.2/drop-ends-at-line
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The unsolved start screen renders the countdown and no 'Ends at' / 'Eindigt om' text in en and nl
- [ ] #2 endsAt is removed from the daily strings type and both locales; the Next/Starts lines are unchanged
- [ ] #3 Code made dead by the removal (e.g. unused imports/props) is removed; bun run lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->
