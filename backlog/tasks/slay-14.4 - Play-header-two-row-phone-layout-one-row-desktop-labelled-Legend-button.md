---
id: SLAY-14.4
title: 'Play header: two-row phone layout, one-row desktop, labelled Legend button'
status: To Do
assignee: []
created_date: '2026-10-02 09:55'
labels:
  - story
dependencies:
  - SLAY-14.1
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/play/play.css
  - src/ui/play/strings.ts
  - src/ui/daily/DailyFlow.tsx
  - src/ui/daily/daily.css
  - docs/verification/phone.ts
parent_task_id: SLAY-14
type: feature
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a redesigned play-screen header (second pass after SLAY-9.25). Phone: row 1 = back + icon group (Legend, Share when solved, More); row 2 = puzzle title (date label) with the timer as a prominent pill, so nothing competes for width. Desktop: one row, Legend button shows a visible 'Legend'/'Legenda' label.
Type: deliverable
Branch: SLAY-14.4/header-two-row-mobile
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No overlap or wrapped/cut-off text between back, title, timer, Legend, Share and More at 360px and 390px, in en and nl, in unsolved and solved states (measured in headless Chrome at true widths)
- [ ] #2 Phone layout is two rows as described; desktop (>=641px) is a single row
- [ ] #3 On desktop the Legend button has a visible text label that matches its aria-label
- [ ] #4 Title and timer remain legible with long Dutch labels; truncation only as a deliberate fallback
- [ ] #5 Existing PlayScreen tests updated; docs/verification/phone.ts passes; lint, typecheck, test --maxWorkers=1 green
- [ ] #6 The Zoom-free toolbar from SLAY-14.1 is unaffected
<!-- AC:END -->
